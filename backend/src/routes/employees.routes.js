import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Stub routes - will be implemented in Phase 2
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Employees endpoint - coming soon' });
});

export default router;
