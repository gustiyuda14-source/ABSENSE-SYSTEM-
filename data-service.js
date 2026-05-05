// data-service.js — API data fetching and caching

class DataService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.cache = {
      user: null,
      shifts: null,
      attendanceHistory: {},
      monthlyStats: {},
    };
    this.cacheTimestamps = {};
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  isCacheValid(key) {
    const timestamp = this.cacheTimestamps[key];
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async getUser(userId) {
    try {
      // For current user, always fetch fresh
      const response = await this.apiClient.get('/api/auth/me');
      if (response.success) {
        this.cache.user = response.data;
        this.cacheTimestamps.user = Date.now();
        return { success: true, data: response.data };
      }
      throw new Error('Failed to fetch user');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getShifts() {
    try {
      // Check cache
      if (this.cache.shifts && this.isCacheValid('shifts')) {
        return { success: true, data: this.cache.shifts };
      }

      const response = await this.apiClient.get('/api/shifts');
      if (response.success) {
        this.cache.shifts = response.data;
        this.cacheTimestamps.shifts = Date.now();
        return { success: true, data: response.data };
      }
      throw new Error('Failed to fetch shifts');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAttendanceHistory(days = 30) {
    try {
      const cacheKey = `history_${days}`;

      // Check cache
      if (this.cache.attendanceHistory[cacheKey] && this.isCacheValid(cacheKey)) {
        return { success: true, data: this.cache.attendanceHistory[cacheKey] };
      }

      const response = await this.apiClient.get('/api/attendance/history', {
        days,
      });
      if (response.success) {
        this.cache.attendanceHistory[cacheKey] = response.data;
        this.cacheTimestamps[cacheKey] = Date.now();
        return { success: true, data: response.data };
      }
      throw new Error('Failed to fetch attendance history');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getMonthlyStats(year, month) {
    try {
      const cacheKey = `stats_${year}_${month}`;

      // Check cache
      if (this.cache.monthlyStats[cacheKey] && this.isCacheValid(cacheKey)) {
        return { success: true, data: this.cache.monthlyStats[cacheKey] };
      }

      const response = await this.apiClient.get('/api/attendance/monthly-stats', {
        year,
        month,
      });
      if (response.success) {
        this.cache.monthlyStats[cacheKey] = response.data;
        this.cacheTimestamps[cacheKey] = Date.now();
        return { success: true, data: response.data };
      }
      throw new Error('Failed to fetch monthly stats');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSalarySlip(year, month) {
    try {
      const response = await this.apiClient.get('/api/payroll/slip', {
        year,
        month,
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      throw new Error('Failed to fetch salary slip');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkIn(shiftId, latitude, longitude) {
    try {
      const response = await this.apiClient.post('/api/attendance/check-in', {
        shiftId,
        latitude,
        longitude,
      });
      if (response.success) {
        // Invalidate attendance cache
        this.cache.attendanceHistory = {};
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.error?.message || 'Check-in failed');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkOut(punchDate, latitude, longitude) {
    try {
      const response = await this.apiClient.post('/api/attendance/check-out', {
        punchDate,
        latitude,
        longitude,
      });
      if (response.success) {
        // Invalidate attendance cache
        this.cache.attendanceHistory = {};
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.error?.message || 'Check-out failed');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPayrollReport(year, month) {
    try {
      const response = await this.apiClient.get('/api/payroll/report', {
        year,
        month,
      });
      if (response.success) {
        return { success: true, data: response.data };
      }
      throw new Error('Failed to fetch payroll report');
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  clearCache(key = null) {
    if (key) {
      delete this.cache[key];
      delete this.cacheTimestamps[key];
    } else {
      this.cache = {};
      this.cacheTimestamps = {};
    }
  }
}

// Create singleton instance
const dataService = new DataService(window.apiClient);

// Export for use
if (typeof window !== 'undefined') {
  window.dataService = dataService;
}
