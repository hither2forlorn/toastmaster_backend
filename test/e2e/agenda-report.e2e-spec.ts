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
import { ReportType } from '../../src/modules/agenda-report/entities/agenda-report.entity';

describe('Agenda Report (e2e)', () => {
  let app: INestApplication;
  let user: { email: string; password: string; fullName: string; token?: string };
  let token: string;
  let clubId: string;
  let meetingId: string;
  let memberId: string;
  let userId: string;
  let reportId: string;

  beforeAll(async () => {
    app = await createTestApp();
    user = await registerAndLogin(app, { fullName: 'AgendaTestUsr' });
    token = user.token!;

    const meRes = await authed(app, token)
      .get(`/${API_PREFIX}/user/me`)
      .expect(200);
    userId = meRes.body.data.user_id;

    const clubRes = await authed(app, token)
      .post(`/${API_PREFIX}/club/create`)
      .send({ name: `Test Club ${Date.now()}` })
      .expect(201);
    clubId = clubRes.body.data.id;

    const future = new Date();
    future.setDate(future.getDate() + 10);

    const meetingRes = await authed(app, token)
      .post(`/${API_PREFIX}/meetings`)
      .send({
        meetingNo: 1,
        theme: 'Test Meeting',
        date: future.toISOString(),
        time: '10:00:00',
        venue: 'Hall A',
        clubId,
      })
      .expect(201);
    meetingId = meetingRes.body.data.id;

    const membersRes = await authed(app, token)
      .get(`/${API_PREFIX}/club/${clubId}/members`)
      .expect(200);
    const member = membersRes.body.data.find(
      (m: any) => m.member_member_name === user.fullName,
    );
    memberId = member.user_id;

    await authed(app, token)
      .post(`/${API_PREFIX}/agenda/create?clubId=${clubId}`)
      .send({
        title: 'Grammarian Role',
        duration: 5,
        sequence: 1,
        meetingId,
        memberId,
        roleName: 'Grammarian',
        clubId,
      })
      .expect(201);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /api/agenda-report without token returns 401', () => {
    return request(server(app))
      .get(`/${API_PREFIX}/agenda-report`)
      .expect(401);
  });

  it('POST /api/agenda-report/:meetingId without token returns 401', () => {
    return request(server(app))
      .post(`/${API_PREFIX}/agenda-report/${meetingId}`)
      .send({ reportType: ReportType.GRAMMARIAN })
      .expect(401);
  });

  it('POST /api/agenda-report/:meetingId with missing reportType returns 400', async () => {
    const res = await authed(app, token)
      .post(`/${API_PREFIX}/agenda-report/${meetingId}`)
      .send({ wordOfTheDay: 'serendipity' })
      .expect(400);
    expect(res.body.status).toBe(400);
  });

  it('POST /api/agenda-report/:meetingId creates a report (201)', async () => {
    const res = await authed(app, token)
      .post(`/${API_PREFIX}/agenda-report/${meetingId}`)
      .send({
        reportType: ReportType.GRAMMARIAN,
        wordOfTheDay: 'serendipity',
        memberEvaluations: [
          { memberId: userId, memberName: user.fullName },
        ],
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    reportId = res.body.data.id;
  });

  it('GET /api/agenda-report/:reportId returns the report (200)', async () => {
    const res = await authed(app, token)
      .get(`/${API_PREFIX}/agenda-report/${reportId}`)
      .expect(200);
    expect(res.body.data.id).toBe(reportId);
  });

  it('GET /api/agenda-report/can-edit/:meetingId returns 200', async () => {
    const res = await authed(app, token)
      .get(`/${API_PREFIX}/agenda-report/can-edit/${meetingId}`)
      .expect(200);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/agenda-report returns own reports (200)', async () => {
    const res = await authed(app, token)
      .get(`/${API_PREFIX}/agenda-report`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('PATCH /api/agenda-report/edit/:reportId edits the report (200)', async () => {
    const res = await authed(app, token)
      .patch(`/${API_PREFIX}/agenda-report/edit/${reportId}`)
      .send({
        reportType: ReportType.GRAMMARIAN,
        wordOfTheDay: 'ephemeral',
        grammarNotes: 'Good use of language',
      })
      .expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(reportId);
  });

  it('DELETE /api/agenda-report/:reportId deletes the report (200/204)', async () => {
    const res = await authed(app, token)
      .delete(`/${API_PREFIX}/agenda-report/${reportId}`)
      .expect(200);
    expect([200, 204]).toContain(res.status);
  });
});
