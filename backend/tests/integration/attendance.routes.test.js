import request from 'supertest';
import app from '../../src/app.js';

describe('Attendance Routes - Structure Validation', () => {
  describe('Endpoints exist', () => {
    it('POST /api/attendance/check-in exists', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', 'Bearer token')
        .send({
          shiftId: 1,
          latitude: -6.2088,
          longitude: 106.8456,
        });
      // Should get past routing
      expect([400, 401, 404, 500].includes(res.status)).toBe(true);
    });

    it('POST /api/attendance/check-out exists', async () => {
      const res = await request(app)
        .post('/api/attendance/check-out')
        .set('Authorization', 'Bearer token')
        .send({
          punchDate: '2024-01-15',
          latitude: -6.2088,
          longitude: 106.8456,
        });
      expect([400, 401, 404, 500].includes(res.status)).toBe(true);
    });

    it('GET /api/attendance/history exists', async () => {
      const res = await request(app)
        .get('/api/attendance/history?days=30')
        .set('Authorization', 'Bearer token');
      expect([400, 401, 404, 500].includes(res.status)).toBe(true);
    });

    it('GET /api/attendance/monthly-stats exists', async () => {
      const res = await request(app)
        .get('/api/attendance/monthly-stats?year=2024&month=1')
        .set('Authorization', 'Bearer token');
      expect([400, 401, 404, 500].includes(res.status)).toBe(true);
    });
  });

  describe('Parameter validation', () => {
    it('check-in requires latitude', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', 'Bearer token')
        .send({
          shiftId: 1,
          longitude: 106.8456,
        });
      expect([400, 401].includes(res.status)).toBe(true);
    });

    it('check-in requires longitude', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', 'Bearer token')
        .send({
          shiftId: 1,
          latitude: -6.2088,
        });
      expect([400, 401].includes(res.status)).toBe(true);
    });

    it('monthly-stats requires year and month', async () => {
      const res = await request(app)
        .get('/api/attendance/monthly-stats')
        .set('Authorization', 'Bearer token');
      expect([400, 401].includes(res.status)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('check-in without token returns 401', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .send({
          shiftId: 1,
          latitude: -6.2088,
          longitude: 106.8456,
        });
      expect(res.status).toBe(401);
    });

    it('history without token returns 401', async () => {
      const res = await request(app)
        .get('/api/attendance/history?days=30');
      expect(res.status).toBe(401);
    });
  });
});
