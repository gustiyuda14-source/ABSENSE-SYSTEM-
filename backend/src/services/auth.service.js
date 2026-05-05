import { query } from '../config/database.js';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';

export const authService = {
  async register(username, email, password, firstName, lastName, department) {
    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      throw new AppError('Username or email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, department, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'employee', 'active')
       RETURNING id, username, email, first_name, last_name, role, department`,
      [username, email, passwordHash, firstName, lastName, department]
    );

    const user = result.rows[0];

    // Initialize conduct history
    await query(
      'INSERT INTO conduct_history (user_id, conduct_score) VALUES ($1, 7.0)',
      [user.id]
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      department: user.department,
    };
  },

  async login(username, password) {
    const result = await query(
      'SELECT id, username, email, password_hash, first_name, last_name, role, department, status FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid username or password', 401);
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }

    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      throw new AppError('Invalid username or password', 401);
    }

    const accessToken = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
    });

    const refreshToken = generateRefreshToken(user.id);

    // Store session
    await query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
      [user.id, refreshToken]
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h',
      },
    };
  },

  async refreshToken(refreshToken) {
    try {
      const decoded = verifyToken(refreshToken);
      const userId = decoded.userId;

      // Verify session exists
      const session = await query(
        'SELECT id FROM sessions WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()',
        [userId, refreshToken]
      );

      if (session.rows.length === 0) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Get user info
      const userResult = await query(
        'SELECT id, username, role, department FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];
      const newAccessToken = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
        department: user.department,
      });

      return {
        accessToken: newAccessToken,
        expiresIn: '24h',
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  },

  async logout(userId, refreshToken) {
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND token_hash = $2',
      [userId, refreshToken]
    );

    return true;
  },

  async getUserById(userId) {
    const result = await query(
      `SELECT id, username, email, first_name, last_name, role, department, base_salary, status, hire_date
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      department: user.department,
      baseSalary: user.base_salary,
      status: user.status,
      hireDate: user.hire_date,
    };
  },
};
