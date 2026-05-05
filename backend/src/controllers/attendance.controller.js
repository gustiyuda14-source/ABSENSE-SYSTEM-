import { attendanceService } from '../services/attendance.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const attendanceController = {
  async checkIn(req, res, next) {
    try {
      const { shiftId, latitude, longitude } = req.body;
      const userId = req.user.userId;

      if (!shiftId || latitude === undefined || longitude === undefined) {
        throw new AppError('Missing required fields', 400);
      }

      const result = await attendanceService.checkIn(userId, shiftId, latitude, longitude);

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkOut(req, res, next) {
    try {
      const { punchDate, latitude, longitude } = req.body;
      const userId = req.user.userId;

      if (!punchDate || latitude === undefined || longitude === undefined) {
        throw new AppError('Missing required fields', 400);
      }

      const result = await attendanceService.checkOut(userId, punchDate, latitude, longitude);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const days = req.query.days ? parseInt(req.query.days) : 30;

      const history = await attendanceService.getAttendanceHistory(userId, days);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMonthlyStats(req, res, next) {
    try {
      const userId = req.user.userId;
      const { year, month } = req.query;

      if (!year || !month) {
        throw new AppError('Year and month are required', 400);
      }

      const stats = await attendanceService.getMonthlyStats(
        userId,
        parseInt(year),
        parseInt(month)
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
