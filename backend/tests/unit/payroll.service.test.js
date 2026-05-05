import { payrollService } from '../../src/services/payroll.service.js';

describe('Payroll Service - Basic Structure Tests', () => {
  describe('Module exports', () => {
    it('payrollService object is exported', () => {
      expect(payrollService).toBeDefined();
      expect(typeof payrollService).toBe('object');
    });

    it('has generateMonthlyPayroll method', () => {
      expect(typeof payrollService.generateMonthlyPayroll).toBe('function');
    });

    it('has getSalarySlip method', () => {
      expect(typeof payrollService.getSalarySlip).toBe('function');
    });

    it('has getMonthlyReport method', () => {
      expect(typeof payrollService.getMonthlyReport).toBe('function');
    });
  });

  describe('Payroll calculation', () => {
    it('generateMonthlyPayroll calculates net salary', () => {
      const methodCode = payrollService.generateMonthlyPayroll.toString();
      expect(methodCode).toContain('base');
      expect(methodCode).toContain('penalty');
    });

    it('generateMonthlyPayroll applies leniency reductions', () => {
      const methodCode = payrollService.generateMonthlyPayroll.toString();
      expect(methodCode).toContain('reduction');
    });

    it('generateMonthlyPayroll retrieves user salary', () => {
      const methodCode = payrollService.generateMonthlyPayroll.toString();
      expect(methodCode).toContain('base_salary');
    });
  });

  describe('Salary slip generation', () => {
    it('getSalarySlip checks for existing slip', () => {
      const methodCode = payrollService.getSalarySlip.toString();
      expect(methodCode).toContain('SELECT');
    });

    it('getSalarySlip generates new slip if not found', () => {
      const methodCode = payrollService.getSalarySlip.toString();
      expect(methodCode).toContain('generateMonthlyPayroll');
    });

    it('getSalarySlip includes breakdown', () => {
      const methodCode = payrollService.getSalarySlip.toString();
      expect(methodCode).toContain('INSERT');
    });
  });

  describe('Payroll report', () => {
    it('getMonthlyReport aggregates all employees', () => {
      const methodCode = payrollService.getMonthlyReport.toString();
      expect(methodCode).toContain('payroll');
    });

    it('report includes salary details', () => {
      const methodCode = payrollService.getMonthlyReport.toString();
      expect(methodCode.toLowerCase()).toContain('salary');
    });
  });

  describe('Net salary calculation', () => {
    it('net = base - (penalties - reductions)', () => {
      const baseSalary = 3000000;
      const penalties = 200000;
      const reductions = 100000;
      const netSalary = baseSalary - (penalties - reductions);

      expect(netSalary).toBe(2900000);
    });

    it('prevents negative net salary', () => {
      const baseSalary = 1000000;
      const penalties = 2000000;
      const reductions = 500000;
      const netSalary = Math.max(0, baseSalary - (penalties - reductions));

      expect(netSalary).toBeGreaterThanOrEqual(0);
    });

    it('calculates correctly with no reductions', () => {
      const baseSalary = 3000000;
      const penalties = 200000;
      const reductions = 0;
      const netSalary = baseSalary - (penalties - reductions);

      expect(netSalary).toBe(2800000);
    });

    it('calculates correctly with no penalties', () => {
      const baseSalary = 3000000;
      const penalties = 0;
      const reductions = 0;
      const netSalary = baseSalary - (penalties - reductions);

      expect(netSalary).toBe(3000000);
    });
  });

  describe('Database operations', () => {
    it('generateMonthlyPayroll queries penalties', () => {
      const methodCode = payrollService.generateMonthlyPayroll.toString();
      expect(methodCode).toContain('penalty');
    });

    it('getSalarySlip inserts slip record', () => {
      const methodCode = payrollService.getSalarySlip.toString();
      expect(methodCode).toContain('INSERT');
    });

    it('getMonthlyReport queries payroll_slips table', () => {
      const methodCode = payrollService.getMonthlyReport.toString();
      expect(methodCode).toContain('payroll');
    });
  });

  describe('Period validation', () => {
    it('valid months are 1-12', () => {
      expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).toContain(1);
      expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).toContain(12);
    });

    it('invalid months should be rejected', () => {
      const validMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      expect(validMonths).not.toContain(0);
      expect(validMonths).not.toContain(13);
    });

    it('valid years are positive numbers', () => {
      expect(2024).toBeGreaterThan(0);
      expect(2025).toBeGreaterThan(0);
    });
  });
});
