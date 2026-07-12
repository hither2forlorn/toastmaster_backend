import { INestApplication } from '@nestjs/common';
import request from "supertest";
import {
  createTestApp,
  closeTestApp,
  server,
  registerUser,
  login,
  API_PREFIX,
} from '../helpers/harness';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('POST /api/auth/login returns a token for valid credentials', async () => {
    const user = await registerUser(app);
    const res = await request(server(app))
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: user.email, password: user.password })
      .expect(201);

    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
  });

  it('POST /api/auth/login fails with wrong password', async () => {
    const user = await registerUser(app);
    const res = await request(server(app))
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: user.email, password: 'WrongPassword1' })
      .expect(401);

    expect(res.body.status).toBe(401);
  });

  it('POST /api/auth/login fails validation with missing fields', async () => {
    const res = await request(server(app))
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(res.body.status).toBe(400);
  });
});
