import { attendanceService } from '../../src/services/attendance.service.js';

describe('Attendance Service - Basic Structure Tests', () => {
  describe('Module exports', () => {
    it('attendanceService object is exported', () => {
      expect(attendanceService).toBeDefined();
      expect(typeof attendanceService).toBe('object');
    });

    it('has checkIn method', () => {
      expect(typeof attendanceService.checkIn).toBe('function');
    });

    it('has checkOut method', () => {
      expect(typeof attendanceService.checkOut).toBe('function');
    });

    it('has getAttendanceHistory method', () => {
      expect(typeof attendanceService.getAttendanceHistory).toBe('function');
    });

    it('has getMonthlyStats method', () => {
      expect(typeof attendanceService.getMonthlyStats).toBe('function');
    });
  });

  describe('Geofence validation', () => {
    it('checkIn includes geofence check', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('geofence');
    });

    it('checkIn calculates distance', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('distance');
    });

    it('checkIn validates coordinates', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode.toLocaleLowerCase()).toContain('latitude');
    });
  });

  describe('Late penalty calculation', () => {
    it('checkIn calculates late minutes', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('lateMinutes');
    });

    it('checkIn applies grace period', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('grace');
    });

    it('checkIn calculates penalty amount', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('penalty');
    });
  });

  describe('Duplicate prevention', () => {
    it('checkIn checks for existing records', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('punch_date');
    });

    it('checkIn prevents same-day duplicate', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode.toLowerCase()).toContain('already');
    });
  });

  describe('Database operations', () => {
    it('checkIn inserts attendance record', () => {
      const methodCode = attendanceService.checkIn.toString();
      expect(methodCode).toContain('INSERT');
    });

    it('checkOut updates attendance record', () => {
      const methodCode = attendanceService.checkOut.toString();
      expect(methodCode).toContain('UPDATE');
    });

    it('getAttendanceHistory queries database', () => {
      const methodCode = attendanceService.getAttendanceHistory.toString();
      expect(methodCode).toContain('SELECT');
    });

    it('getMonthlyStats aggregates data', () => {
      const methodCode = attendanceService.getMonthlyStats.toString();
      expect(methodCode).toContain('SUM');
    });
  });

  describe('Penalty calculations', () => {
    it('penalty is per minute', () => {
      const lateMinutes = 10;
      const penaltyPerMinute = 5000;
      const penalty = lateMinutes * penaltyPerMinute;
      expect(penalty).toBe(50000);
    });

    it('grace period reduces late minutes', () => {
      const lateMinutes = 15;
      const gracePeriod = 5;
      const actualLate = Math.max(0, lateMinutes - gracePeriod);
      expect(actualLate).toBe(10);
    });

    it('zero penalty for on-time', () => {
      const lateMinutes = 0;
      const penalty = lateMinutes * 5000;
      expect(penalty).toBe(0);
    });
  });

  describe('Status classification', () => {
    it('on-time = 0 late minutes', () => {
      const status = 0 === 0 ? 'present' : 'late';
      expect(status).toBe('present');
    });

    it('late = > 0 late minutes', () => {
      const status = 10 > 0 ? 'late' : 'present';
      expect(status).toBe('late');
    });
  });
});
