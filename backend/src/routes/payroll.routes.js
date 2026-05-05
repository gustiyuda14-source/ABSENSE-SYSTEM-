import express from 'express';
import { payrollController } from '../controllers/payroll.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/slip', authenticateToken, payrollController.getSalarySlip);
router.get('/report', authenticateToken, requireRole('hrd', 'admin'), payrollController.getMonthlyReport);

export default router;
