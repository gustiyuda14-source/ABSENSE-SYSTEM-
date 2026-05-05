import express from 'express';
import { attendanceController } from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/check-in', authenticateToken, attendanceController.checkIn);
router.post('/check-out', authenticateToken, attendanceController.checkOut);
router.get('/history', authenticateToken, attendanceController.getHistory);
router.get('/monthly-stats', authenticateToken, attendanceController.getMonthlyStats);

export default router;
