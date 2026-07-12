import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

export const API_PREFIX = 'api';

const TEST_PASSWORD = 'Password123';

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  token?: string;
}

let counter = 0;
function uniqueEmail(prefix = 'test'): string {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@example.com`;
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  const ds = app.get<DataSource>(getDataSourceToken());
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  await ds.synchronize(false);

  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

export function server(app: INestApplication) {
  return app.getHttpServer();
}

export async function registerUser(
  app: INestApplication,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  const user: TestUser = {
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? TEST_PASSWORD,
    fullName: overrides.fullName ?? 'Test User',
  };

  const res = await request(server(app))
    .post(`/${API_PREFIX}/user/register`)
    .send({
      fullName: user.fullName,
      email: user.email,
      password: user.password,
    });

  expect(res.status).toBeLessThan(400);
  return user;
}

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(server(app))
    .post(`/${API_PREFIX}/auth/login`)
    .send({ email, password });

  expect(res.status).toBe(201);
  return res.body.data.token as string;
}

export async function registerAndLogin(
  app: INestApplication,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  const user = await registerUser(app, overrides);
  user.token = await login(app, user.email, user.password);
  return user;
}

export function authed(app: INestApplication, token: string) {
  const agent = request.agent(server(app));
  return agent.set('Authorization', `Bearer ${token}`);
}
