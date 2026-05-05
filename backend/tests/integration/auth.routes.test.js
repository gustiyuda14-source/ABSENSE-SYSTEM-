import request from 'supertest';
import app from '../../src/app.js';

describe('Auth Routes - Structure Validation', () => {
  describe('Endpoints exist', () => {
    it('POST /api/auth/register exists', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'test@example.com',
          password: 'pass123',
          firstName: 'John',
          lastName: 'Doe',
          department: 'barista',
        });
      // Should get past routing (may fail auth, but route exists)
      expect([400, 401, 409, 500].includes(res.status)).toBe(true);
    });

    it('POST /api/auth/login exists', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'pass' });
      expect([400, 401, 500].includes(res.status)).toBe(true);
    });

    it('POST /api/auth/refresh exists', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'token' });
      expect([400, 401, 500].includes(res.status)).toBe(true);
    });

    it('POST /api/auth/logout exists', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer token')
        .send({ refreshToken: 'token' });
      expect([400, 401, 500].includes(res.status)).toBe(true);
    });

    it('GET /api/auth/me exists', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token');
      expect([400, 401, 500].includes(res.status)).toBe(true);
    });
  });

  describe('Health check', () => {
    it('GET /health returns ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('404 handling', () => {
    it('Non-existent route returns 404', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
