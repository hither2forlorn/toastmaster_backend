import { INestApplication } from '@nestjs/common';
import request from "supertest";
import {
  createTestApp,
  closeTestApp,
  server,
  registerAndLogin,
  authed,
  API_PREFIX,
} from '../helpers/harness';

describe('Agenda (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let clubId: string;
  let meetingId: string;
  let agendaId: string;
  let agendaId2: string;

  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  };

  const baseAgenda = (overrides: Record<string, any> = {}) => ({
    title: 'Toastmaster of the Day',
    duration: 30,
    sequence: 1,
    meetingId,
    clubId,
    ...overrides,
  });

  beforeAll(async () => {
    app = await createTestApp();
    const user = await registerAndLogin(app);
    token = user.token!;

    const clubRes = await authed(app, token)
      .post(`/${API_PREFIX}/club/create`)
      .send({
        name: `Agenda Test Club ${Date.now()}`,
        description: 'Club for agenda e2e tests',
      })
      .expect(201);
    clubId = clubRes.body.data.id;

    const meetingRes = await authed(app, token)
      .post(`/${API_PREFIX}/meetings`)
      .send({
        meetingNo: 1,
        theme: 'Agenda Test Meeting',
        date: futureDate(),
        time: '18:30:00',
        venue: 'Online',
        clubId,
      })
      .expect(201);
    meetingId = meetingRes.body.data.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /api/agenda/meeting/:meetingId is public and returns 200 (list)', async () => {
    const res = await request(server(app))
      .get(`/${API_PREFIX}/agenda/meeting/${meetingId}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/agenda/role-counts/club/:clubId is public and returns 200', async () => {
    const res = await request(server(app))
      .get(`/${API_PREFIX}/agenda/role-counts/club/${clubId}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/agenda/:id returns 400 (BadRequest) for a non-existent id', async () => {
    const res = await request(server(app))
      .get(`/${API_PREFIX}/agenda/00000000-0000-0000-0000-000000000000`)
      .expect(400);
    expect(res.body.status).toBe(400);
  });

  it('POST /api/agenda/create without token returns 401', async () => {
    await request(server(app))
      .post(`/${API_PREFIX}/agenda/create?clubId=${clubId}`)
      .send(baseAgenda())
      .expect(401);
  });

  it('POST /api/agenda/create with valid data returns 201 and creates agenda', async () => {
    const res = await authed(app, token)
      .post(`/${API_PREFIX}/agenda/create?clubId=${clubId}`)
      .send(baseAgenda({ sequence: 1 }))
      .expect(201);
    expect(res.body.data.id).toBeDefined();
    agendaId = res.body.data.id;
  });

  it('POST /api/agenda/create with missing required field returns 400', async () => {
    const res = await authed(app, token)
      .post(`/${API_PREFIX}/agenda/create?clubId=${clubId}`)
      .send({
        duration: 30,
        sequence: 2,
        meetingId,
        clubId,
      })
      .expect(400);
    expect(res.body.status).toBe(400);
  });

  it('POST /api/agenda/bulk-create with an array returns 201', async () => {
    const res = await authed(app, token)
      .post(`/${API_PREFIX}/agenda/bulk-create?clubId=${clubId}`)
      .send([
        baseAgenda({ title: 'Speaker 1', sequence: 2 }),
        baseAgenda({ title: 'Speaker 2', sequence: 3 }),
      ])
      .expect(201);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    agendaId2 = res.body.data[0].id;
  });

  it('GET /api/agenda/meeting/:meetingId (authed) returns created items', async () => {
    const res = await authed(app, token)
      .get(`/${API_PREFIX}/agenda/meeting/${meetingId}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/agenda/:id (authed) returns 200 for an existing id', async () => {
    const res = await authed(app, token)
      .get(`/${API_PREFIX}/agenda/${agendaId}`)
      .expect(200);
    expect(res.body.data.id).toBe(agendaId);
  });

  it('PATCH /api/agenda/:id updates the agenda', async () => {
    const res = await authed(app, token)
      .patch(`/${API_PREFIX}/agenda/${agendaId}?clubId=${clubId}`)
      .send({ title: 'Updated Toastmaster' })
      .expect(200);
    expect(res.body.data.title).toBe('Updated Toastmaster');
  });

  it('PATCH /api/agenda/meeting/:meetingId/reorder updates the order', async () => {
    const res = await authed(app, token)
      .patch(`/${API_PREFIX}/agenda/meeting/${meetingId}/reorder`)
      .send({
        agendaOrder: [agendaId2, agendaId],
        clubId,
      })
      .expect(200);
    expect(res.body.data.message).toBeDefined();
  });

  it('DELETE /api/agenda/:id removes the agenda', async () => {
    const res = await authed(app, token)
      .delete(`/${API_PREFIX}/agenda/${agendaId}?clubId=${clubId}`)
      .expect(200);
    expect(res.body.data.message).toBeDefined();
  });
});
