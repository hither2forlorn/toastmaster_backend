import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  closeTestApp,
  server,
  registerAndLogin,
  authed,
  API_PREFIX,
} from '../helpers/harness';

describe('Club (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  let clubId: string;
  let clubCode: string;

  async function createClub(user: { email: string; password: string; fullName: string; token?: string }) {
    const res = await authed(app, user.token!)
      .post(`/${API_PREFIX}/club/create`)
      .send({
        name: `Test Club ${Date.now()}`,
        description: 'A club for testing',
      })
      .expect(201);

    return res.body.data as { id: string; clubCode: string };
  }

  it('POST /api/club/create creates a club for an authed user', async () => {
    const user = await registerAndLogin(app);
    const data = await createClub(user);

    expect(data.id).toBeDefined();
    expect(data.clubCode).toBeDefined();

    clubId = data.id;
    clubCode = data.clubCode;
  });

  it('POST /api/club/create rejects a missing required field (name) with 400', async () => {
    const user = await registerAndLogin(app);
    const res = await authed(app, user.token!)
      .post(`/${API_PREFIX}/club/create`)
      .send({ description: 'missing name' })
      .expect(400);

    expect(res.body.status).toBe(400);
  });

  it('GET /api/club/:clubId requires auth (401)', () => {
    return authed(app, 'invalid.token').get(`/${API_PREFIX}/club/${clubId}`).expect(401);
  });

  it('GET /api/club/:clubId returns the created club when authed', async () => {
    const user = await registerAndLogin(app);
    const created = await createClub(user);

    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/club/${created.id}`)
      .expect(200);

    expect(res.body.data.id).toBe(created.id);
    expect(res.body.data.name).toBeDefined();
  });

  it('GET /api/club/getbycode returns the club by its join code', async () => {
    const user = await registerAndLogin(app);
    const created = await createClub(user);

    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/club/getbycode`)
      .query({ code: created.clubCode })
      .expect(200);

    expect(res.body.data.id).toBe(created.id);
  });

  it('GET /api/club/myclubs returns the user\'s clubs', async () => {
    const user = await registerAndLogin(app);
    const created = await createClub(user);

    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/club/myclubs`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((c: { id: string }) => c.id === created.id)).toBe(true);
  });

  it('GET /api/club/code returns the join code for the OWNER', async () => {
    const user = await registerAndLogin(app);
    const created = await createClub(user);

    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/club/code`)
      .query({ clubId: created.id })
      .expect(200);

    expect(res.body.data.code).toBe(created.clubCode);
  });

  it('POST /api/club/join lets a second user join via the club code', async () => {
    const owner = await registerAndLogin(app);
    const created = await createClub(owner);

    const joiner = await registerAndLogin(app);
    const res = await authed(app, joiner.token!)
      .post(`/${API_PREFIX}/club/join`)
      .send({ clubCode: created.clubCode })
      .expect(201);

    expect(res.body.data.clubId).toBe(created.id);
  });

  it('GET /api/club/:clubId/members returns the members list', async () => {
    const user = await registerAndLogin(app);
    const created = await createClub(user);

    const res = await authed(app, user.token!)
      .get(`/${API_PREFIX}/club/${created.id}/members`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
