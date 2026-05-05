-- Seed shift data
INSERT INTO shifts (code, name, department, start_time, end_time) VALUES
('s1_barista', 'Barista S1', 'barista', '09:00', '17:00'),
('s2_barista', 'Barista S2', 'barista', '14:00', '22:00'),
('s1_billiard', 'Billiard S1', 'billiard', '10:00', '18:00'),
('s2_billiard', 'Billiard S2', 'billiard', '15:00', '23:00'),
('s1_kitchen', 'Kitchen S1', 'kitchen', '09:00', '17:00'),
('s2_kitchen', 'Kitchen S2', 'kitchen', '14:00', '22:00');

-- Seed employee data (matching the frontend mock data)
INSERT INTO users (username, email, first_name, last_name, department, role, base_salary, status, hire_date) VALUES
('rangga_pratama', 'rangga@ajiks.com', 'Rangga', 'Pratama', 'barista', 'employee', 3200000, 'active', '2022-01-15'),
('sita_dewi', 'sita@ajiks.com', 'Sita', 'Dewi', 'barista', 'employee', 3200000, 'active', '2022-03-20'),
('budi_santoso', 'budi@ajiks.com', 'Budi', 'Santoso', 'billiard', 'employee', 3200000, 'active', '2022-05-10'),
('yani_kusuma', 'yani@ajiks.com', 'Yani', 'Kusuma', 'kitchen', 'employee', 3200000, 'active', '2022-02-28'),
('hendra_wijaya', 'hendra@ajiks.com', 'Hendra', 'Wijaya', 'barista', 'employee', 3200000, 'active', '2021-12-01'),
('dina_marlina', 'dina@ajiks.com', 'Dina', 'Marlina', 'billiard', 'employee', 3200000, 'active', '2022-04-15'),
('rudi_hermawan', 'rudi@ajiks.com', 'Rudi', 'Hermawan', 'kitchen', 'employee', 3200000, 'active', '2022-06-20'),
('lina_sudarsono', 'lina@ajiks.com', 'Lina', 'Sudarsono', 'barista', 'employee', 3200000, 'active', '2022-07-10'),
('arie_purnomo', 'arie@ajiks.com', 'Arie', 'Purnomo', 'billiard', 'employee', 3200000, 'active', '2022-08-05'),
('gina_marlina', 'gina@ajiks.com', 'Gina', 'Marlina', 'kitchen', 'employee', 3200000, 'active', '2022-09-12'),
('fanny_citra', 'fanny@ajiks.com', 'Fanny', 'Citra', 'barista', 'employee', 3200000, 'active', '2022-10-18'),
('eka_sutrisno', 'eka@ajiks.com', 'Eka', 'Sutrisno', 'billiard', 'employee', 3200000, 'active', '2023-01-08'),
('hadi_prabowo', 'hadi@ajiks.com', 'Hadi', 'Prabowo', 'kitchen', 'employee', 3200000, 'active', '2023-02-14'),
('intan_permata', 'intan@ajiks.com', 'Intan', 'Permata', 'barista', 'employee', 3200000, 'active', '2023-03-22'),
('julia_hartono', 'julia@ajiks.com', 'Julia', 'Hartono', 'billiard', 'employee', 3200000, 'active', '2023-04-30'),
('kevin_lie', 'kevin@ajiks.com', 'Kevin', 'Lie', 'kitchen', 'employee', 3200000, 'active', '2023-05-15'),
('lena_wijaya', 'lena@ajiks.com', 'Lena', 'Wijaya', 'barista', 'employee', 3200000, 'active', '2023-06-20');

-- Seed HRD user
INSERT INTO users (username, email, first_name, last_name, department, role, status, hire_date) VALUES
('hrd_admin', 'hrd@ajiks.com', 'Admin', 'HRD', 'barista', 'hrd', 'active', '2021-01-01');

-- Update password hashes for test users (password: password123)
UPDATE users SET password_hash = '$2b$12$sV.8Jl0u85uONOIL8N7YJuFvzNQHXaGnIAl8yrPh9aQKaD9Y5U.L2' WHERE role IN ('employee', 'hrd');

-- Create shift assignments for all employees
INSERT INTO shift_assignments (user_id, shift_id, start_date, is_active)
SELECT u.id, s.id, '2026-05-01'::DATE, TRUE
FROM users u
CROSS JOIN shifts s
WHERE u.role = 'employee'
AND ((u.department = 'barista' AND s.code IN ('s1_barista', 's2_barista'))
     OR (u.department = 'billiard' AND s.code IN ('s1_billiard', 's2_billiard'))
     OR (u.department = 'kitchen' AND s.code IN ('s1_kitchen', 's2_kitchen')));

-- Set default shift for each employee (S1 shift)
UPDATE shift_assignments
SET is_active = FALSE
WHERE shift_id NOT IN (
  SELECT id FROM shifts WHERE code LIKE '%_s1_%' OR code LIKE '%s1_%'
)
AND user_id IN (SELECT id FROM users WHERE role = 'employee');
