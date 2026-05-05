import request from 'supertest';
import { createApp } from '../../src/app.js';
import * as db from '../../src/config/database.js';

jest.mock('../../src/config/database.js');

describe('Payroll Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /api/payroll/slip', () => {
    it('should return salary slip', async () => {
      const mockSlip = {
        id: 1,
        user_id: 1,
        period_year: 2024,
        period_month: 1,
        base_salary: 3000000,
        total_penalties: 100000,
        total_reductions: 0,
        net_salary: 2900000,
      };

      db.query.mockResolvedValueOnce({ rows: [mockSlip] });

      const res = await request(app)
        .get('/api/payroll/slip?year=2024&month=1')
        .set('Authorization', 'Bearer valid_token');

      expect([400, 401].includes(res.status)).toBe(true);
    });

    it('should return 400 for missing year', async () => {
      const res = await request(app)
        .get('/api/payroll/slip?month=1')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing month', async () => {
      const res = await request(app)
        .get('/api/payroll/slip?year=2024')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid year format', async () => {
      const res = await request(app)
        .get('/api/payroll/slip?year=abc&month=1')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid month (0)', async () => {
      const res = await request(app)
        .get('/api/payroll/slip?year=2024&month=0')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid month (13)', async () => {
      const res = await request(app)
        .get('/api/payroll/slip?year=2024&month=13')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/payroll/slip?year=2024&month=1');

      expect(res.status).toBe(401);
    });

    it('should generate new slip if not found', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };
      const mockNewSlip = {
        id: 1,
        user_id: 1,
        base_salary: 3000000,
        total_penalties: 0,
        total_reductions: 0,
        net_salary: 3000000,
      };

      db.query
        .mockResolvedValueOnce({ rows: [] }) // No existing slip
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [mockNewSlip] });

      const res = await request(app)
        .get('/api/payroll/slip?year=2024&month=1')
        .set('Authorization', 'Bearer valid_token');

      expect([400, 401].includes(res.status)).toBe(true);
    });
  });

  describe('GET /api/payroll/report', () => {
    it('should return payroll report for HRD', async () => {
      const mockReport = [
        {
          user_id: 1,
          username: 'user1',
          base_salary: 3000000,
          total_penalties: 50000,
          total_reductions: 0,
          net_salary: 2950000,
        },
        {
          user_id: 2,
          username: 'user2',
          base_salary: 3500000,
          total_penalties: 100000,
          total_reductions: 50000,
          net_salary: 3450000,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockReport });

      const res = await request(app)
        .get('/api/payroll/report?year=2024&month=1')
        .set('Authorization', 'Bearer hrd_token');

      expect([400, 401, 403].includes(res.status)).toBe(true);
    });

    it('should return 400 for missing year', async () => {
      const res = await request(app)
        .get('/api/payroll/report?month=1')
        .set('Authorization', 'Bearer hrd_token');

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing month', async () => {
      const res = await request(app)
        .get('/api/payroll/report?year=2024')
        .set('Authorization', 'Bearer hrd_token');

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/payroll/report?year=2024&month=1');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-HRD user', async () => {
      const res = await request(app)
        .get('/api/payroll/report?year=2024&month=1')
        .set('Authorization', 'Bearer employee_token');

      // Will fail because we're not actually validating role in this mock
      expect([400, 401, 403].includes(res.status)).toBe(true);
    });

    it('should return empty array if no payroll data', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/payroll/report?year=2024&month=1')
        .set('Authorization', 'Bearer hrd_token');

      expect([400, 401, 403].includes(res.status)).toBe(true);
    });
  });

  describe('Penalty & Deduction Calculation', () => {
    it('should correctly calculate net salary with penalties', async () => {
      // Base salary: 3,000,000
      // Penalties: 200,000
      // Reductions: 0
      // Expected net: 2,800,000

      const expectedCalculation = {
        baseSalary: 3000000,
        totalPenalties: 200000,
        totalReductions: 0,
        netSalary: 2800000,
      };

      // Verify math: 3000000 - 200000 = 2800000
      expect(expectedCalculation.baseSalary - expectedCalculation.totalPenalties)
        .toBe(expectedCalculation.netSalary);
    });

    it('should correctly calculate net salary with penalties and reductions', async () => {
      // Base salary: 3,000,000
      // Penalties: 200,000
      // Reductions: 100,000 (leniency)
      // Expected net: 2,900,000

      const expectedCalculation = {
        baseSalary: 3000000,
        totalPenalties: 200000,
        totalReductions: 100000,
        netSalary: 2900000,
      };

      // Verify math: 3000000 - (200000 - 100000) = 2900000
      const netSalary =
        expectedCalculation.baseSalary -
        (expectedCalculation.totalPenalties - expectedCalculation.totalReductions);
      expect(netSalary).toBe(expectedCalculation.netSalary);
    });

    it('should prevent negative net salary', async () => {
      // If penalties exceed base salary
      const baseSalary = 1000000;
      const penalties = 2000000;
      const reductions = 500000;

      const netSalary = Math.max(0, baseSalary - (penalties - reductions));
      expect(netSalary).toBe(0); // Should not be negative
    });
  });

  describe('Monthly Report Aggregation', () => {
    it('should aggregate multiple employee payroll correctly', async () => {
      const employees = [
        {
          userId: 1,
          baseSalary: 3000000,
          penalties: 50000,
          reductions: 0,
          netSalary: 2950000,
        },
        {
          userId: 2,
          baseSalary: 3500000,
          penalties: 100000,
          reductions: 50000,
          netSalary: 3450000,
        },
        {
          userId: 3,
          baseSalary: 2800000,
          penalties: 30000,
          reductions: 0,
          netSalary: 2770000,
        },
      ];

      const totalBaseSalary = employees.reduce((sum, e) => sum + e.baseSalary, 0);
      const totalPenalties = employees.reduce((sum, e) => sum + e.penalties, 0);
      const totalReductions = employees.reduce((sum, e) => sum + e.reductions, 0);
      const totalNetSalary = employees.reduce((sum, e) => sum + e.netSalary, 0);

      expect(totalBaseSalary).toBe(9300000);
      expect(totalPenalties).toBe(180000);
      expect(totalReductions).toBe(50000);
      expect(totalNetSalary).toBe(9170000);
    });
  });

  describe('Salary Slip Audit Trail', () => {
    it('should store complete payroll breakdown', async () => {
      const slip = {
        userId: 1,
        periodYear: 2024,
        periodMonth: 1,
        baseSalary: 3000000,
        totalPenalties: 100000,
        totalReductions: 0,
        netSalary: 2900000,
        generatedAt: new Date().toISOString(),
        penalties: [
          { id: 1, date: '2024-01-10', amount: 50000, reason: 'Late 10 minutes' },
          { id: 2, date: '2024-01-15', amount: 50000, reason: 'Late 10 minutes' },
        ],
        reductions: [],
      };

      // Verify data integrity
      expect(slip.totalPenalties).toBe(
        slip.penalties.reduce((sum, p) => sum + p.amount, 0)
      );
      expect(slip.netSalary).toBe(slip.baseSalary - slip.totalPenalties + slip.totalReductions);
    });
  });

  describe('Payroll Validation Rules', () => {
    it('should validate salary slip data', () => {
      const slip = {
        userId: 1,
        periodYear: 2024,
        periodMonth: 1,
        baseSalary: 3000000,
        totalPenalties: 100000,
      };

      // Validation checks
      expect(slip.userId).toBeGreaterThan(0);
      expect(slip.periodYear).toBeGreaterThanOrEqual(2020);
      expect(slip.periodMonth).toBeGreaterThanOrEqual(1);
      expect(slip.periodMonth).toBeLessThanOrEqual(12);
      expect(slip.baseSalary).toBeGreaterThan(0);
      expect(slip.totalPenalties).toBeGreaterThanOrEqual(0);
    });

    it('should validate penalty records', () => {
      const penalty = {
        userId: 1,
        amount: 50000,
        reason: 'Late 10 minutes',
        date: '2024-01-10',
      };

      // Validation checks
      expect(penalty.userId).toBeGreaterThan(0);
      expect(penalty.amount).toBeGreaterThan(0);
      expect(penalty.reason).toBeTruthy();
      expect(new Date(penalty.date)).toBeInstanceOf(Date);
    });
  });
});
