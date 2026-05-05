import { payrollService } from '../../src/services/payroll.service.js';
import * as db from '../../src/config/database.js';

jest.mock('../../src/config/database.js');

describe('Payroll Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMonthlyPayroll', () => {
    it('should generate payroll with no penalties', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };
      const mockPenalties = { rows: [{ total: 0 }] };
      const mockReductions = { rows: [{ total: 0 }] };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce(mockPenalties) // Get penalties sum
        .mockResolvedValueOnce(mockReductions); // Get reductions sum

      const result = await payrollService.generateMonthlyPayroll(1, 2024, 1);

      expect(result.baseSalary).toBe(3000000);
      expect(result.totalPenalties).toBe(0);
      expect(result.totalReductions).toBe(0);
      expect(result.netSalary).toBe(3000000);
    });

    it('should deduct penalties from net salary', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [{ total: 200000 }] }) // Penalties
        .mockResolvedValueOnce({ rows: [{ total: 0 }] }); // Reductions

      const result = await payrollService.generateMonthlyPayroll(1, 2024, 1);

      expect(result.baseSalary).toBe(3000000);
      expect(result.totalPenalties).toBe(200000);
      expect(result.netSalary).toBe(2800000); // 3000000 - 200000
    });

    it('should apply leniency reductions to increase net salary', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [{ total: 200000 }] }) // Penalties
        .mockResolvedValueOnce({ rows: [{ total: 100000 }] }); // Reductions

      const result = await payrollService.generateMonthlyPayroll(1, 2024, 1);

      expect(result.baseSalary).toBe(3000000);
      expect(result.totalPenalties).toBe(200000);
      expect(result.totalReductions).toBe(100000);
      expect(result.netSalary).toBe(2900000); // 3000000 - 200000 + 100000
    });

    it('should throw error if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // User not found

      await expect(payrollService.generateMonthlyPayroll(999, 2024, 1)).rejects.toThrow(
        'User not found'
      );
    });

    it('should handle null penalty/reduction sums', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [{ total: null }] }) // Null penalties
        .mockResolvedValueOnce({ rows: [{ total: null }] }); // Null reductions

      const result = await payrollService.generateMonthlyPayroll(1, 2024, 1);

      expect(result.netSalary).toBe(3000000); // Should default to base salary
    });
  });

  describe('getSalarySlip', () => {
    it('should return existing salary slip', async () => {
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

      const result = await payrollService.getSalarySlip(1, 2024, 1);

      expect(result.baseSalary).toBe(3000000);
      expect(result.netSalary).toBe(2900000);
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
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user for generation
        .mockResolvedValueOnce({ rows: [{ total: 0 }] }) // Penalties
        .mockResolvedValueOnce({ rows: [{ total: 0 }] }) // Reductions
        .mockResolvedValueOnce({ rows: [mockNewSlip] }); // Created slip

      const result = await payrollService.getSalarySlip(1, 2024, 1);

      expect(result.baseSalary).toBe(3000000);
    });
  });

  describe('getMonthlyReport', () => {
    it('should return aggregated payroll report for HRD', async () => {
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

      const result = await payrollService.getMonthlyReport(2024, 1);

      expect(result.length).toBe(2);
      expect(result[0].username).toBe('user1');
      expect(result[1].netSalary).toBe(3450000);
    });

    it('should return empty report if no data', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await payrollService.getMonthlyReport(2024, 1);

      expect(result).toEqual([]);
    });
  });
});
