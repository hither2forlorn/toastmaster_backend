import { INestApplication } from '@nestjs/common';
import request from "supertest";
import { createTestApp, closeTestApp, server, API_PREFIX } from '../helpers/harness';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /api/health returns ok', () => {
    return request(server(app))
      .get(`/${API_PREFIX}/health`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('ok');
        expect(res.body.statusCode).toBe(200);
      });
  });
});
