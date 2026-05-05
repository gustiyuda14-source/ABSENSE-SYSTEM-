import { query } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

export const payrollService = {
  async generateMonthlyPayroll(userId, year, month) {
    // Get user info
    const userResult = await query(
      'SELECT id, first_name, last_name, base_salary FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userResult.rows[0];
    const baseSalary = user.base_salary;

    // Get all attendance for the month
    const attendanceResult = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN status = 'present' OR status = 'late' THEN 1 ELSE 0 END), 0) as working_days,
        COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) as on_time_days,
        COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_days
       FROM attendance
       WHERE user_id = $1 AND EXTRACT(YEAR FROM punch_date) = $2
             AND EXTRACT(MONTH FROM punch_date) = $3`,
      [userId, year, month]
    );

    const attendance = attendanceResult.rows[0];

    // Get all penalties for the month
    const penaltyResult = await query(
      `SELECT COALESCE(SUM(penalty_amount), 0) as total_penalty,
              COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_days
       FROM penalties p
       LEFT JOIN attendance a ON p.attendance_id = a.id
       WHERE p.user_id = $1 AND p.period_year = $2 AND p.period_month = $3`,
      [userId, year, month]
    );

    const penalties = penaltyResult.rows[0];
    let totalPenalties = penalties.total_penalty || 0;

    // Get leniency reductions
    const leniencyResult = await query(
      `SELECT COALESCE(SUM(reduction_amount), 0) as total_reduction
       FROM leniency_adjustments
       WHERE user_id = $1 AND period_year = $2 AND period_month = $3`,
      [userId, year, month]
    );

    const leniency = leniencyResult.rows[0];
    const totalReductions = leniency.total_reduction || 0;

    // Calculate final salary
    const finalPenalties = Math.max(0, totalPenalties - totalReductions);
    const netSalary = baseSalary - finalPenalties;

    // Get total late minutes
    const lateMinutesResult = await query(
      `SELECT COALESCE(SUM(late_minutes), 0) as total_late_minutes
       FROM attendance
       WHERE user_id = $1 AND EXTRACT(YEAR FROM punch_date) = $2
             AND EXTRACT(MONTH FROM punch_date) = $3`,
      [userId, year, month]
    );

    const totalLateMinutes = lateMinutesResult.rows[0].total_late_minutes || 0;

    return {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
      },
      period: {
        month,
        year,
      },
      salary: {
        base: baseSalary,
        penalties: totalPenalties,
        reductions: totalReductions,
        net: netSalary,
      },
      discipline: {
        workingDays: attendance.working_days,
        onTimeDays: attendance.on_time_days,
        lateDays: attendance.late_days,
        totalLateMinutes,
      },
    };
  },

  async getSalarySlip(userId, year, month) {
    // Check if slip already exists
    const existingResult = await query(
      `SELECT id, base_salary, total_penalties, total_reductions, net_salary,
              total_late_minutes, working_days, on_time_days, late_days
       FROM payroll_slips
       WHERE user_id = $1 AND period_year = $2 AND period_month = $3`,
      [userId, year, month]
    );

    let slip;

    if (existingResult.rows.length > 0) {
      slip = existingResult.rows[0];
    } else {
      // Generate new slip
      const generated = await this.generateMonthlyPayroll(userId, year, month);

      // Store in database
      const insertResult = await query(
        `INSERT INTO payroll_slips (
          user_id, period_month, period_year, base_salary,
          total_penalties, total_reductions, net_salary,
          total_late_minutes, working_days, on_time_days, late_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, base_salary, total_penalties, total_reductions, net_salary,
                   total_late_minutes, working_days, on_time_days, late_days`,
        [
          userId,
          year,
          month,
          generated.salary.base,
          generated.salary.penalties,
          generated.salary.reductions,
          generated.salary.net,
          generated.discipline.totalLateMinutes,
          generated.discipline.workingDays,
          generated.discipline.onTimeDays,
          generated.discipline.lateDays,
        ]
      );

      slip = insertResult.rows[0];
    }

    // Get user info
    const userResult = await query(
      'SELECT id, first_name, last_name, employee_id FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Get conduct score
    const conductResult = await query(
      'SELECT conduct_score FROM conduct_history WHERE user_id = $1',
      [userId]
    );

    const conduct = conductResult.rows[0];

    return {
      id: slip.id,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        employeeId: user.employee_id,
      },
      period: {
        month,
        year,
        label: new Date(year, month - 1).toLocaleString('id-ID', {
          month: 'long',
          year: 'numeric',
        }),
      },
      salary: {
        base: slip.base_salary,
        penalties: slip.total_penalties,
        reductions: slip.total_reductions,
        net: slip.net_salary,
      },
      discipline: {
        workingDays: slip.working_days,
        onTimeDays: slip.on_time_days,
        lateDays: slip.late_days,
        totalLateMinutes: slip.total_late_minutes,
        conductScore: conduct?.conduct_score || 7.0,
      },
    };
  },

  async getMonthlyReport(year, month) {
    // Get all employees with their payroll for the month
    const result = await query(
      `SELECT
        u.id, u.first_name, u.last_name, u.base_salary, u.department,
        COALESCE(ps.total_penalties, 0) as penalties,
        COALESCE(ps.total_reductions, 0) as reductions,
        COALESCE(ps.net_salary, 0) as net_salary,
        COALESCE(ps.late_days, 0) as late_days
       FROM users u
       LEFT JOIN payroll_slips ps ON u.id = ps.user_id
         AND ps.period_year = $1 AND ps.period_month = $2
       WHERE u.role = 'employee'
       ORDER BY u.last_name, u.first_name`,
      [year, month]
    );

    const employees = result.rows.map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name || ''}`.trim(),
      department: row.department,
      baseSalary: row.base_salary,
      penalties: row.penalties,
      reductions: row.reductions,
      netSalary: row.net_salary,
      lateDays: row.late_days,
    }));

    const summary = {
      totalEmployees: employees.length,
      totalBaseSalary: employees.reduce((sum, e) => sum + e.baseSalary, 0),
      totalPenalties: employees.reduce((sum, e) => sum + e.penalties, 0),
      totalReductions: employees.reduce((sum, e) => sum + e.reductions, 0),
      totalNetSalary: employees.reduce((sum, e) => sum + e.netSalary, 0),
    };

    return { summary, employees };
  },
};
