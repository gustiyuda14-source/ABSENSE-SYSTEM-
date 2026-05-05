import { authService } from '../../src/services/auth.service.js';
import * as db from '../../src/config/database.js';
import * as jwt from '../../src/utils/jwt.js';
import * as password from '../../src/utils/password.js';
import { AppError } from '../../src/middleware/error.middleware.js';

jest.mock('../../src/config/database.js');
jest.mock('../../src/utils/jwt.js');
jest.mock('../../src/utils/password.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'employee',
        department: 'barista',
      };

      db.query.mockResolvedValueOnce({ rows: [] }); // Check existing
      password.hashPassword.mockResolvedValueOnce('hashed_password');
      db.query.mockResolvedValueOnce({ rows: [mockUser] }); // Insert user
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert conduct history

      const result = await authService.register(
        'testuser',
        'test@example.com',
        'password123',
        'John',
        'Doe',
        'barista'
      );

      expect(result).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        department: 'barista',
      });
    });

    it('should throw error if username already exists', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser' }],
      });

      await expect(
        authService.register(
          'testuser',
          'new@example.com',
          'password123',
          'John',
          'Doe',
          'barista'
        )
      ).rejects.toThrow('Username or email already exists');
    });

    it('should throw error if email already exists', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'test@example.com' }],
      });

      await expect(
        authService.register(
          'newuser',
          'test@example.com',
          'password123',
          'John',
          'Doe',
          'barista'
        )
      ).rejects.toThrow('Username or email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: '$2a$12$hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: 'employee',
        department: 'barista',
        status: 'active',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      password.comparePassword.mockResolvedValueOnce(true);
      jwt.generateToken.mockReturnValueOnce('access_token');
      jwt.generateRefreshToken.mockReturnValueOnce('refresh_token');
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Store session

      const result = await authService.login('testuser', 'password123');

      expect(result.user.username).toBe('testuser');
      expect(result.tokens.accessToken).toBe('access_token');
      expect(result.tokens.refreshToken).toBe('refresh_token');
    });

    it('should throw error if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.login('nonexistent', 'password123')).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should throw error if password is invalid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: '$2a$12$hashed',
        status: 'active',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      password.comparePassword.mockResolvedValueOnce(false);

      await expect(authService.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid username or password'
      );
    });

    it('should throw error if account is inactive', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: '$2a$12$hashed',
        status: 'inactive',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      password.comparePassword.mockResolvedValueOnce(true);

      await expect(authService.login('testuser', 'password123')).rejects.toThrow(
        'Account is not active'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const decoded = { userId: 1 };
      jwt.verifyToken.mockReturnValueOnce(decoded);
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check session
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            username: 'testuser',
            role: 'employee',
            department: 'barista',
          },
        ],
      }); // Get user
      jwt.generateToken.mockReturnValueOnce('new_access_token');

      const result = await authService.refreshToken('refresh_token');

      expect(result.accessToken).toBe('new_access_token');
      expect(result.expiresIn).toBe('24h');
    });

    it('should throw error if session not found', async () => {
      const decoded = { userId: 1 };
      jwt.verifyToken.mockReturnValueOnce(decoded);
      db.query.mockResolvedValueOnce({ rows: [] }); // No session

      await expect(authService.refreshToken('invalid_token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error if user not found', async () => {
      const decoded = { userId: 999 };
      jwt.verifyToken.mockReturnValueOnce(decoded);
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Session exists
      db.query.mockResolvedValueOnce({ rows: [] }); // User not found

      await expect(authService.refreshToken('refresh_token')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.logout(1, 'refresh_token');

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE user_id = $1 AND token_hash = $2',
        [1, 'refresh_token']
      );
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'employee',
        department: 'barista',
        base_salary: 3000000,
        status: 'active',
        hire_date: '2023-01-01',
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.getUserById(1);

      expect(result.id).toBe(1);
      expect(result.firstName).toBe('John');
      expect(result.baseSalary).toBe(3000000);
    });

    it('should throw error if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.getUserById(999)).rejects.toThrow('User not found');
    });
  });
});
