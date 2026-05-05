import { attendanceService } from '../../src/services/attendance.service.js';
import * as db from '../../src/config/database.js';
import { AppError } from '../../src/middleware/error.middleware.js';

jest.mock('../../src/config/database.js');

describe('Attendance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T09:30:00')); // 9:30 AM
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkIn', () => {
    it('should check in user on time successfully', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };
      const mockShift = {
        id: 1,
        start_time: '08:00',
        end_time: '16:00',
        grace_period_minutes: 5,
      };
      const mockOutlet = {
        latitude: -6.2088,
        longitude: 106.8456,
        geofence_radius_meters: 100,
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [mockShift] }) // Get shift
        .mockResolvedValueOnce({ rows: [mockOutlet] }) // Get outlet
        .mockResolvedValueOnce({
          rows: [
            { config_key: 'penalty_per_minute', config_value: '5000' },
            { config_key: 'grace_period_minutes', config_value: '5' },
          ],
        }) // Get config
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert attendance
        .mockResolvedValueOnce({ rows: [] }); // Get users for WebSocket

      const result = await attendanceService.checkIn(1, 1, -6.2088, 106.8456);

      expect(result.status).toBe('present');
      expect(result.lateMinutes).toBe(0);
      expect(result.penalty).toBe(0);
    });

    it('should check in user late with penalty calculation', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };
      const mockShift = {
        id: 1,
        start_time: '08:00',
        end_time: '16:00',
        grace_period_minutes: 5,
      };
      const mockOutlet = {
        latitude: -6.2088,
        longitude: 106.8456,
        geofence_radius_meters: 100,
      };

      // Set time to 09:15 (15 minutes late, minus 5 minute grace = 10 minutes penalty)
      jest.setSystemTime(new Date('2024-01-15T09:15:00'));

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [mockShift] }) // Get shift
        .mockResolvedValueOnce({ rows: [mockOutlet] }) // Get outlet
        .mockResolvedValueOnce({
          rows: [
            { config_key: 'penalty_per_minute', config_value: '5000' },
            { config_key: 'grace_period_minutes', config_value: '5' },
          ],
        }) // Get config
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert attendance
        .mockResolvedValueOnce({ rows: [] }); // Get users for WebSocket

      const result = await attendanceService.checkIn(1, 1, -6.2088, 106.8456);

      expect(result.status).toBe('late');
      expect(result.lateMinutes).toBe(10); // 15 - 5 grace = 10
      expect(result.penalty).toBe(50000); // 10 * 5000
    });

    it('should reject check-in outside geofence', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };
      const mockShift = {
        id: 1,
        start_time: '08:00',
        end_time: '16:00',
        grace_period_minutes: 5,
      };
      const mockOutlet = {
        latitude: -6.2088,
        longitude: 106.8456,
        geofence_radius_meters: 100, // 100 meters
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [mockShift] }) // Get shift
        .mockResolvedValueOnce({ rows: [mockOutlet] }) // Get outlet
        .mockResolvedValueOnce({
          rows: [
            { config_key: 'penalty_per_minute', config_value: '5000' },
            { config_key: 'grace_period_minutes', config_value: '5' },
          ],
        }); // Get config

      // Coordinates far from outlet (different city)
      const result = await attendanceService.checkIn(1, 1, 0.0, 0.0);

      expect(result.inZone).toBe(false);
    });

    it('should prevent duplicate check-in on same day', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };
      const mockShift = {
        id: 1,
        start_time: '08:00',
        end_time: '16:00',
        grace_period_minutes: 5,
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [mockShift] }) // Get shift
        .mockResolvedValueOnce({
          rows: [{ id: 1, check_in_time: '08:30' }], // Already checked in
        }); // Check existing attendance

      await expect(attendanceService.checkIn(1, 1, -6.2088, 106.8456)).rejects.toThrow(
        'Already checked in today'
      );
    });

    it('should throw error if user not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // User not found

      await expect(attendanceService.checkIn(999, 1, -6.2088, 106.8456)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error if shift not found', async () => {
      const mockUser = { id: 1, base_salary: 3000000 };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [] }); // Shift not found

      await expect(attendanceService.checkIn(1, 999, -6.2088, 106.8456)).rejects.toThrow(
        'Shift not found'
      );
    });
  });

  describe('checkOut', () => {
    it('should check out user successfully', async () => {
      const mockUser = { id: 1 };
      const mockAttendance = { id: 1, check_in_time: '08:30' };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [mockAttendance] }) // Get attendance
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Update attendance
        .mockResolvedValueOnce({ rows: [] }); // Get users for WebSocket

      const result = await attendanceService.checkOut(1, '2024-01-15', -6.2088, 106.8456);

      expect(result.checkOutTime).toBeDefined();
    });

    it('should throw error if not checked in', async () => {
      const mockUser = { id: 1 };

      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [] }); // No attendance record

      await expect(
        attendanceService.checkOut(1, '2024-01-15', -6.2088, 106.8456)
      ).rejects.toThrow('Not checked in today');
    });
  });

  describe('getAttendanceHistory', () => {
    it('should return attendance history for user', async () => {
      const mockHistory = [
        {
          id: 1,
          punch_date: '2024-01-10',
          check_in_time: '08:30',
          check_out_time: '16:30',
          status: 'present',
          late_minutes: 0,
        },
        {
          id: 2,
          punch_date: '2024-01-11',
          check_in_time: '08:45',
          check_out_time: '16:30',
          status: 'late',
          late_minutes: 10,
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockHistory });

      const result = await attendanceService.getAttendanceHistory(1, 30);

      expect(result.length).toBe(2);
      expect(result[0].status).toBe('present');
      expect(result[1].lateMinutes).toBe(10);
    });

    it('should return empty history if no records', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await attendanceService.getAttendanceHistory(1, 30);

      expect(result).toEqual([]);
    });
  });

  describe('getMonthlyStats', () => {
    it('should calculate monthly statistics correctly', async () => {
      const mockStats = {
        on_time_days: 18,
        late_days: 2,
        absent_days: 0,
        total_late_minutes: 35,
        total_penalty: 175000,
      };

      db.query.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await attendanceService.getMonthlyStats(1, 2024, 1);

      expect(result.onTimeDays).toBe(18);
      expect(result.lateDays).toBe(2);
      expect(result.absentDays).toBe(0);
      expect(result.totalLateMinutes).toBe(35);
      expect(result.totalPenalty).toBe(175000);
    });

    it('should return zero stats if no data', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await attendanceService.getMonthlyStats(1, 2024, 1);

      expect(result).toEqual({
        onTimeDays: 0,
        lateDays: 0,
        absentDays: 0,
        totalLateMinutes: 0,
        totalPenalty: 0,
      });
    });
  });
});
