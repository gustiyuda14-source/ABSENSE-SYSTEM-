import { authService } from '../services/auth.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, department } = req.body;

      if (!username || !email || !password || !firstName || !department) {
        throw new AppError('Missing required fields', 400);
      }

      const user = await authService.register(username, email, password, firstName, lastName, department);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('Username and password are required', 400);
      }

      const result = await authService.login(username, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.userId;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      await authService.logout(userId, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyToken(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: { user, token: req.user },
      });
    } catch (error) {
      next(error);
    }
  },
};
