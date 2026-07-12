import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  server,
  registerAndLogin,
  authed,
  API_PREFIX,
} from '../helpers/harness';

describe('User (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /api/user/register creates a user', async () => {
    const email = `reg.${Date.now()}@example.com`;
    const res = await request(server(app))
      .post(`/${API_PREFIX}/user/register`)
      .send({
        fullName: 'Test User',
        email,
        password: 'Password123',
      })
      .expect(201);

    expect(res.body.data.email).toBe(email);
    expect(res.body.data.id).toBeDefined();
  });

  it('POST /api/user/register rejects duplicate email', async () => {
    const email = `dup.${Date.now()}@example.com`;
    await request(server(app))
      .post(`/${API_PREFIX}/user/register`)
      .send({ fullName: 'Test User', email, password: 'Password123' })
      .expect(201);

    const res = await request(server(app))
      .post(`/${API_PREFIX}/user/register`)
      .send({ fullName: 'Test User', email, password: 'Password123' })
      .expect(400);

    expect(res.body.status).toBe(400);
  });

  it('POST /api/user/register rejects invalid data', async () => {
    const res = await request(server(app))
      .post(`/${API_PREFIX}/user/register`)
      .send({ fullName: 'short', email: 'bad', password: '1' })
      .expect(400);

    expect(res.body.status).toBe(400);
  });

  it('GET /api/user/me requires auth', () => {
    return request(server(app))
      .get(`/${API_PREFIX}/user/me`)
      .expect(401);
  });

  it('GET /api/user/me returns the profile', async () => {
    const user = await registerAndLogin(app);
    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/user/me`)
      .expect(200);

    expect(res.body.data.user_email).toBe(user.email);
  });

  it('PATCH /api/user/me updates the profile', async () => {
    const user = await registerAndLogin(app);
    const res = await authed(app, user.token!)
      .patch(`/${API_PREFIX}/user/me`)
      .send({ fullName: 'Updated Name', email: user.email })
      .expect(200);

    expect(res.body.data.fullName).toBe('Updated Name');
  });

  it('PATCH /api/user/me/password changes the password', async () => {
    const user = await registerAndLogin(app, { password: 'Password123' });
    const res = await authed(app, user.token!)
      .patch(`/${API_PREFIX}/user/me/password`)
      .send({
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      })
      .expect(200);

    expect(res.body.statusCode).toBe(200);
  });

  it('GET /api/user/my-clubs returns a list', async () => {
    const user = await registerAndLogin(app);
    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/user/my-clubs`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
