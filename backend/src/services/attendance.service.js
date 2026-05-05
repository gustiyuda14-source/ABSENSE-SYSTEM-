import { query } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateLateMinutes(checkInTime, shiftStartTime) {
  const [inHours, inMinutes] = checkInTime.split(':').map(Number);
  const [startHours, startMinutes] = shiftStartTime.split(':').map(Number);

  const inTotalMinutes = inHours * 60 + inMinutes;
  const startTotalMinutes = startHours * 60 + startMinutes;

  const lateMinutes = inTotalMinutes - startTotalMinutes;
  return Math.max(0, lateMinutes);
}

export const attendanceService = {
  async checkIn(userId, shiftId, latitude, longitude) {
    // Get user shift info
    const userResult = await query(
      'SELECT id, base_salary FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Get shift info
    const shiftResult = await query(
      'SELECT id, start_time, end_time, grace_period_minutes FROM shifts WHERE id = $1',
      [shiftId]
    );

    if (shiftResult.rows.length === 0) {
      throw new AppError('Shift not found', 404);
    }

    const shift = shiftResult.rows[0];
    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const punchDate = now.toISOString().split('T')[0];

    // Check if already checked in today
    const existingResult = await query(
      'SELECT id FROM attendance WHERE user_id = $1 AND punch_date = $2',
      [userId, punchDate]
    );

    if (existingResult.rows.length > 0) {
      throw new AppError('Already checked in today', 409);
    }

    // Get outlet location for geofence check
    const outletResult = await query(
      'SELECT latitude, longitude, geofence_radius_meters FROM outlets WHERE is_active = TRUE LIMIT 1'
    );

    let inZone = true;
    if (outletResult.rows.length > 0) {
      const outlet = outletResult.rows[0];
      const distance = calculateDistance(
        latitude,
        longitude,
        outlet.latitude,
        outlet.longitude
      );

      inZone = distance <= outlet.geofence_radius_meters;
    }

    // Get config for penalty calculation
    const configResult = await query(
      'SELECT config_value FROM system_config WHERE config_key = $1 OR config_key = $2',
      ['penalty_per_minute', 'grace_period_minutes']
    );

    let penaltyPerMinute = 5000;
    let gracePeriodMinutes = 5;

    configResult.rows.forEach((row) => {
      if (row.config_key === 'penalty_per_minute') penaltyPerMinute = parseInt(row.config_value);
      if (row.config_key === 'grace_period_minutes') gracePeriodMinutes = parseInt(row.config_value);
    });

    // Calculate late minutes
    let lateMinutes = calculateLateMinutes(checkInTime, shift.start_time);
    lateMinutes = Math.max(0, lateMinutes - gracePeriodMinutes);

    const penalty = lateMinutes * penaltyPerMinute;
    const status = lateMinutes > 0 ? 'late' : 'present';

    // Insert attendance record
    const attendanceResult = await query(
      `INSERT INTO attendance (
        user_id, shift_id, punch_date, check_in_time, check_in_timestamp,
        check_in_latitude, check_in_longitude, late_minutes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        shiftId,
        punchDate,
        checkInTime,
        now,
        latitude,
        longitude,
        lateMinutes,
        status,
      ]
    );

    const attendanceId = attendanceResult.rows[0].id;

    // Insert penalty record if late
    if (penalty > 0) {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await query(
        `INSERT INTO penalties (
          user_id, attendance_id, period_month, period_year,
          penalty_amount, reason, penalty_type
        ) VALUES ($1, $2, $3, $4, $5, 'late', 'standard')`,
        [userId, attendanceId, month, year, penalty]
      );
    }

    return {
      attendanceId,
      checkInTime,
      lateMinutes,
      penalty,
      status,
      inZone,
      message: inZone
        ? lateMinutes > 0
          ? `Masuk ${lateMinutes} menit telat. Potongan: Rp ${penalty.toLocaleString('id-ID')}`
          : 'Check-in tepat waktu'
        : 'Lokasi diluar radius kantor',
    };
  },

  async checkOut(userId, punchDate, latitude, longitude) {
    // Get attendance record
    const result = await query(
      'SELECT id, check_in_time FROM attendance WHERE user_id = $1 AND punch_date = $2',
      [userId, punchDate]
    );

    if (result.rows.length === 0) {
      throw new AppError('No check-in found for today', 404);
    }

    const attendance = result.rows[0];
    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update attendance with check-out
    await query(
      `UPDATE attendance SET
       check_out_time = $1, check_out_timestamp = $2,
       check_out_latitude = $3, check_out_longitude = $4
       WHERE id = $5`,
      [checkOutTime, now, latitude, longitude, attendance.id]
    );

    return {
      checkOutTime,
      message: 'Check-out berhasil',
    };
  },

  async getAttendanceHistory(userId, days = 30) {
    const result = await query(
      `SELECT a.id, a.punch_date, a.check_in_time, a.check_out_time, a.status, a.late_minutes,
              s.name as shift_name, s.start_time, s.end_time
       FROM attendance a
       JOIN shifts s ON a.shift_id = s.id
       WHERE a.user_id = $1 AND a.punch_date >= (CURRENT_DATE - INTERVAL '${days} days')
       ORDER BY a.punch_date DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      punchDate: row.punch_date,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      status: row.status,
      lateMinutes: row.late_minutes,
      shift: {
        name: row.shift_name,
        startTime: row.start_time,
        endTime: row.end_time,
      },
    }));
  },

  async getMonthlyStats(userId, year, month) {
    const result = await query(
      `SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as on_time_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        COALESCE(SUM(late_minutes), 0) as total_late_minutes,
        COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_count
       FROM attendance
       WHERE user_id = $1 AND EXTRACT(YEAR FROM punch_date) = $2
             AND EXTRACT(MONTH FROM punch_date) = $3`,
      [userId, year, month]
    );

    const penaltyResult = await query(
      `SELECT COALESCE(SUM(penalty_amount), 0) as total_penalty
       FROM penalties
       WHERE user_id = $1 AND period_year = $2 AND period_month = $3`,
      [userId, year, month]
    );

    const row = result.rows[0];
    const penalty = penaltyResult.rows[0];

    return {
      totalDays: parseInt(row.total_days) || 0,
      onTimeDays: parseInt(row.on_time_days) || 0,
      lateDays: parseInt(row.late_days) || 0,
      absentDays: parseInt(row.absent_days) || 0,
      totalLateMinutes: parseInt(row.total_late_minutes) || 0,
      totalPenalty: penalty.total_penalty || 0,
    };
  },
};
