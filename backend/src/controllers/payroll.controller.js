import { payrollService } from '../services/payroll.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const payrollController = {
  async getSalarySlip(req, res, next) {
    try {
      const userId = req.user.userId;
      const { year, month } = req.query;

      if (!year || !month) {
        throw new AppError('Year and month are required', 400);
      }

      const slip = await payrollService.getSalarySlip(
        userId,
        parseInt(year),
        parseInt(month)
      );

      res.status(200).json({
        success: true,
        data: slip,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMonthlyReport(req, res, next) {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        throw new AppError('Year and month are required', 400);
      }

      const report = await payrollService.getMonthlyReport(
        parseInt(year),
        parseInt(month)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
};
