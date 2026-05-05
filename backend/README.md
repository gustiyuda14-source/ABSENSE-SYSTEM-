# D'AJIKS Attendance System - Backend API

Node.js + Express + PostgreSQL backend for the D'AJIKS attendance and payroll system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and setup**
```bash
cd backend
npm install
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Initialize database**
```bash
# Create tables
npm run migrate

# Seed demo data
npm run seed
```

4. **Start development server**
```bash
npm run dev
# Server runs on http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "karyawan",
  "email": "karyawan@ajiks.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "department": "barista"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "karyawan",
    "email": "karyawan@ajiks.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "barista"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "karyawan",
  "password": "password123"
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "karyawan",
      "email": "karyawan@ajiks.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "department": "barista"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "24h"
    }
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "karyawan",
    "email": "karyawan@ajiks.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "department": "barista",
    "baseSalary": 3200000,
    "status": "active",
    "hireDate": "2022-01-15"
  }
}
```

---

### Attendance Endpoints

#### Check-In
```http
POST /api/attendance/check-in
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "shiftId": 1,
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Check-in berhasil tepat waktu",
  "data": {
    "attendanceId": 1,
    "checkInTime": "09:15:00",
    "lateMinutes": 0,
    "penalty": 0,
    "status": "present",
    "inZone": true
  }
}
```

#### Check-Out
```http
POST /api/attendance/check-out
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "punchDate": "2026-05-05",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

**Response (200)**
```json
{
  "success": true,
  "message": "Check-out berhasil",
  "data": {
    "checkOutTime": "17:30:00"
  }
}
```

#### Get Attendance History
```http
GET /api/attendance/history?days=30
Authorization: Bearer <accessToken>
```

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "punchDate": "2026-05-05",
      "checkInTime": "09:15:00",
      "checkOutTime": "17:30:00",
      "status": "present",
      "lateMinutes": 0,
      "shift": {
        "name": "Barista S1",
        "startTime": "09:00:00",
        "endTime": "17:00:00"
      }
    }
  ]
}
```

#### Get Monthly Statistics
```http
GET /api/attendance/monthly-stats?year=2026&month=5
Authorization: Bearer <accessToken>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "totalDays": 20,
    "onTimeDays": 18,
    "lateDays": 2,
    "absentDays": 0,
    "totalLateMinutes": 15,
    "totalPenalty": 75000
  }
}
```

---

### Payroll Endpoints

#### Get Salary Slip
```http
GET /api/payroll/slip?year=2026&month=5
Authorization: Bearer <accessToken>
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user": {
      "id": 1,
      "name": "Rangga Pratama",
      "employeeId": "EMP-001"
    },
    "period": {
      "month": 5,
      "year": 2026,
      "label": "Mei 2026"
    },
    "salary": {
      "base": 3200000,
      "penalties": 75000,
      "reductions": 0,
      "net": 3125000
    },
    "discipline": {
      "workingDays": 20,
      "onTimeDays": 18,
      "lateDays": 2,
      "totalLateMinutes": 15,
      "conductScore": 7.5
    }
  }
}
```

#### Get Monthly Report (HRD Only)
```http
GET /api/payroll/report?year=2026&month=5
Authorization: Bearer <accessToken>
```

**Requires**: HRD or Admin role

**Response (200)**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEmployees": 17,
      "totalBaseSalary": 54400000,
      "totalPenalties": 1250000,
      "totalReductions": 0,
      "totalNetSalary": 53150000
    },
    "employees": [
      {
        "id": 1,
        "name": "Rangga Pratama",
        "department": "barista",
        "baseSalary": 3200000,
        "penalties": 75000,
        "reductions": 0,
        "netSalary": 3125000,
        "lateDays": 2
      }
    ]
  }
}
```

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires in 24 hours. Use the refresh token to get a new access token:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 User Roles

- **employee**: Can check-in/out, view own history and salary slip
- **manager**: Can view team members' records
- **hrd**: Can view all employees, generate reports, manage system config
- **admin**: Full access to all features

---

## 📦 Database Schema

### Key Tables

**users**
- id, username, email, password_hash
- first_name, last_name, phone
- role, department, base_salary, status
- hire_date, created_at, updated_at

**attendance**
- id, user_id, shift_id
- punch_date, check_in_time, check_out_time
- check_in_latitude, check_in_longitude
- late_minutes, status
- created_at, updated_at

**penalties**
- id, user_id, attendance_id
- period_month, period_year
- penalty_amount, reason, penalty_type

**payroll_slips**
- id, user_id
- period_month, period_year
- base_salary, total_penalties, total_reductions
- net_salary, working_days, on_time_days, late_days

---

## 🔧 Configuration

System configuration is stored in the `system_config` table:

| Key | Default | Type | Description |
|-----|---------|------|-------------|
| penalty_per_minute | 5000 | integer | Rp per minute late |
| grace_period_minutes | 5 | integer | Minutes before marking late |
| sp2_threshold_minutes | 30 | integer | Minutes for SP-2 warning |
| geofence_radius_meters | 100 | integer | GPS radius in meters |
| company_name | D'AJIKS Coffee & Billiard | string | Company name |

---

## 📊 WebSocket Real-Time Events

Connect to WebSocket for real-time updates:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: accessToken
  }
});

// Listen for check-in events
socket.on('attendance:checked-in', (data) => {
  console.log('Someone checked in:', data);
});

// Send check-in event
socket.emit('attendance:check-in', {
  userId: 1,
  checkInTime: '09:15:00',
  penalty: 0
});
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

---

## 🐳 Docker Deployment

```bash
# Build image
docker build -t ajiks-api .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f api
```

---

## 📝 Environment Variables

See `.env.example` for all available options. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `NODE_ENV` - development | production | test
- `PORT` - Server port (default 3000)
- `CORS_ORIGIN` - Allowed CORS origins

---

## 🚀 Deployment

### Railway (Recommended)

```bash
# Connect to Railway
railway link

# Deploy
railway up

# View logs
railway logs
```

### Self-Hosted

```bash
# Setup PostgreSQL
# Configure .env

# Run migrations
npm run migrate

# Start production server
NODE_ENV=production npm start
```

---

## 📞 Support

- Database issues: Check migrations in `/migrations`
- API errors: Check error messages in response
- WebSocket issues: Verify token is valid

---

**Version**: 1.0.0  
**Last Updated**: May 5, 2026  
**Status**: Phase 1 MVP ✅
