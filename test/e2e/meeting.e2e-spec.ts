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

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

describe('Meeting (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let clubId: string;
  let meetingId: string;
  let createdMeetingId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const owner = await registerAndLogin(app);
    ownerToken = owner.token!;

    const clubRes = await authed(app, ownerToken)
      .post(`/${API_PREFIX}/club/create`)
      .send({ name: `Test Club ${Date.now()}` })
      .expect(201);
    clubId = clubRes.body.data.id;

    const meetingRes = await authed(app, ownerToken)
      .post(`/${API_PREFIX}/meetings`)
      .send({
        meetingNo: 1,
        theme: 'Kickoff Meeting',
        date: FUTURE_DATE,
        time: '18:00:00',
        venue: 'Hall A',
        clubId,
        meetingType: 'PHYSICAL',
      })
      .expect(201);
    meetingId = meetingRes.body.data.id;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /api/meetings/select-agenda (public) returns a list', async () => {
    const res = await authed(app, ownerToken)
      .get(`/${API_PREFIX}/meetings/select-agenda?page=1&limit=10`)
      .expect(200);
    expect(res.body.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /api/meetings/:id (public) returns a created meeting', async () => {
    const res = await authed(app, ownerToken)
      .get(`/${API_PREFIX}/meetings/${meetingId}`)
      .expect(200);
    expect(res.body.data.id).toBe(meetingId);
  });

  it('GET /api/meetings/club/:clubId without token returns 401', async () => {
    const res = await request(server(app))
      .get(`/${API_PREFIX}/meetings/club/${clubId}`)
      .expect(401);
    expect(res.body.status).toBe(401);
  });

  it('POST /api/meetings (authed owner) creates a meeting → 201', async () => {
    const res = await authed(app, ownerToken)
      .post(`/${API_PREFIX}/meetings`)
      .send({
        meetingNo: 2,
        theme: 'Second Meeting',
        date: FUTURE_DATE,
        time: '19:00:00',
        venue: 'Hall B',
        clubId,
        meetingType: 'PHYSICAL',
      })
      .expect(201);
    expect(res.body.data.id).toBeDefined();
    createdMeetingId = res.body.data.id;
  });

  it('POST /api/meetings with missing required field → 400', async () => {
    const res = await authed(app, ownerToken)
      .post(`/${API_PREFIX}/meetings`)
      .send({
        meetingNo: 3,
        theme: 'Incomplete Meeting',
        date: FUTURE_DATE,
        time: '19:00:00',
        // venue intentionally omitted
        clubId,
        meetingType: 'PHYSICAL',
      })
      .expect(400);
    expect(res.body.status).toBe(400);
  });

  it('GET /api/meetings/club/:clubId (authed owner) returns a list → 200', async () => {
    const res = await authed(app, ownerToken)
      .get(`/${API_PREFIX}/meetings/club/${clubId}?page=1&limit=10`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PATCH /api/meetings/:id updates the meeting → 200', async () => {
    const res = await authed(app, ownerToken)
      .patch(`/${API_PREFIX}/meetings/${meetingId}`)
      .send({ theme: 'Updated Theme', venue: 'Hall C', clubId })
      .expect(200);
    expect(res.body.data.id).toBe(meetingId);
    expect(res.body.data.theme).toBe('Updated Theme');
  });

  it('PATCH /api/meetings/:id/status updates status → 200', async () => {
    const res = await authed(app, ownerToken)
      .patch(`/${API_PREFIX}/meetings/${meetingId}/status?clubId=${clubId}`)
      .send({ id: meetingId, status: 'COMPLETED' })
      .expect(200);
    expect(res.body.data.message).toBeDefined();
  });

  it('PATCH /api/meetings/:id/notes updates notes → 200', async () => {
    const res = await authed(app, ownerToken)
      .patch(`/${API_PREFIX}/meetings/${meetingId}/notes`)
      .send({ notes: 'Bring projector', clubId })
      .expect(200);
    expect(res.body.data.message).toBeDefined();
  });

  it('GET /api/meetings/upcoming (authed) returns a list → 200', async () => {
    const res = await authed(app, ownerToken)
      .get(`/${API_PREFIX}/meetings/upcoming?page=1&limit=10`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('DELETE /api/meetings/:id (authed owner) deletes → 200', async () => {
    const res = await authed(app, ownerToken)
      .delete(`/${API_PREFIX}/meetings/${createdMeetingId}?clubId=${clubId}`)
      .expect(200);
    expect(res.body.data.message).toBeDefined();
  });
});
