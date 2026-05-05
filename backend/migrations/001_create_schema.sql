-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leniency_adjustments CASCADE;
DROP TABLE IF EXISTS warnings CASCADE;
DROP TABLE IF EXISTS penalties CASCADE;
DROP TABLE IF EXISTS conduct_history CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS shift_assignments CASCADE;
DROP TABLE IF EXISTS outlets CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('employee', 'manager', 'hrd', 'admin')) DEFAULT 'employee',
  department VARCHAR(20) CHECK (department IN ('barista', 'billiard', 'kitchen')) NOT NULL,
  base_salary INTEGER DEFAULT 3200000,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (username),
  UNIQUE (email),
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_department (department)
);

-- Shifts Table
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(20) CHECK (department IN ('barista', 'billiard', 'kitchen')) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INT DEFAULT 5,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_shift (department, start_time, end_time),
  INDEX idx_code (code),
  INDEX idx_department (department)
);

-- Shift Assignments Table
CREATE TABLE shift_assignments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  shift_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  INDEX idx_user_id (user_id),
  INDEX idx_shift_id (shift_id),
  INDEX idx_active_date (is_active, start_date)
);

-- Attendance Table
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  shift_id INT NOT NULL,
  punch_date DATE NOT NULL,
  check_in_time TIME,
  check_in_timestamp TIMESTAMP,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_in_verified BOOLEAN DEFAULT FALSE,
  check_out_time TIME,
  check_out_timestamp TIMESTAMP,
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  late_minutes INT DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('present', 'late', 'absent', 'leave', 'holiday', 'sick')) DEFAULT 'absent',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  UNIQUE KEY unique_punch (user_id, punch_date),
  INDEX idx_user_date (user_id, punch_date),
  INDEX idx_punch_date (punch_date),
  INDEX idx_status (status)
);

-- Penalties Table
CREATE TABLE penalties (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  attendance_id INT NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  penalty_amount INTEGER NOT NULL,
  reason VARCHAR(20) CHECK (reason IN ('late', 'absent', 'other')) NOT NULL,
  penalty_type VARCHAR(20) CHECK (penalty_type IN ('standard', 'reduced', 'waived')) DEFAULT 'standard',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (attendance_id) REFERENCES attendance(id),
  INDEX idx_user_period (user_id, period_year, period_month),
  INDEX idx_period (period_year, period_month)
);

-- Conduct History Table
CREATE TABLE conduct_history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  conduct_score DECIMAL(3,1) DEFAULT 7.0,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Leniency Adjustments Table
CREATE TABLE leniency_adjustments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  reduction_amount INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  approved_by INT,
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_period (user_id, period_year, period_month),
  INDEX idx_approval_status (approval_date)
);

-- Warnings Table (SP-1, SP-2, SP-3)
CREATE TABLE warnings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  warning_type VARCHAR(5) CHECK (warning_type IN ('SP-1', 'SP-2', 'SP-3')) NOT NULL,
  issued_date DATE NOT NULL,
  reason TEXT NOT NULL,
  validity_days INT DEFAULT 90,
  expired_at DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'expired', 'resolved')) DEFAULT 'active',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_date (user_id, issued_date),
  INDEX idx_status (status)
);

-- Leave Requests Table
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  request_date DATE NOT NULL,
  leave_type VARCHAR(20) CHECK (leave_type IN ('sick', 'personal', 'annual', 'other')) NOT NULL,
  reason TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by INT,
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_user_status (user_id, status),
  INDEX idx_dates (start_date, end_date)
);

-- Outlets/Geofence Table
CREATE TABLE outlets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geofence_radius_meters INT DEFAULT 100,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_active (is_active)
);

-- System Configuration Table
CREATE TABLE system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  data_type VARCHAR(20) CHECK (data_type IN ('integer', 'string', 'decimal', 'boolean')) DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (config_key),
  INDEX idx_key (config_key)
);

-- Sessions Table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_expires (user_id, expires_at),
  INDEX idx_token_hash (token_hash)
);

-- Payroll Slips Table
CREATE TABLE payroll_slips (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  base_salary INTEGER NOT NULL,
  total_penalties INTEGER DEFAULT 0,
  total_reductions INTEGER DEFAULT 0,
  net_salary INTEGER DEFAULT 0,
  total_late_minutes INT DEFAULT 0,
  working_days INT DEFAULT 0,
  on_time_days INT DEFAULT 0,
  late_days INT DEFAULT 0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_slip (user_id, period_month, period_year),
  INDEX idx_user_period (user_id, period_year, period_month)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_timestamp (user_id, timestamp),
  INDEX idx_action (action)
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_status_date ON attendance(status, punch_date);
CREATE INDEX idx_penalties_user_date ON penalties(user_id, period_year, period_month);
CREATE INDEX idx_warnings_user_type ON warnings(user_id, warning_type);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, data_type, description) VALUES
('penalty_per_minute', '5000', 'integer', 'Penalty amount per minute late'),
('grace_period_minutes', '5', 'integer', 'Grace period before marking as late'),
('sp2_threshold_minutes', '30', 'integer', 'Minutes threshold for SP-2'),
('sp3_threshold_violations', '3', 'integer', 'Number of violations for SP-3'),
('geofence_radius_meters', '100', 'integer', 'Default geofence radius in meters'),
('warning_validity_days', '90', 'integer', 'Days until warning expires'),
('company_name', 'D''AJIKS Coffee & Billiard', 'string', 'Company name'),
('timezone', 'Asia/Jakarta', 'string', 'System timezone');

-- Insert default outlet
INSERT INTO outlets (name, latitude, longitude, geofence_radius_meters, is_active) VALUES
('D''AJIKS - Jakarta', -6.2088, 106.8456, 100, TRUE);
