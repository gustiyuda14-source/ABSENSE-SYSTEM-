# Backend Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run All Tests
```bash
npm test
```

Expected output:
```
PASS  tests/unit/auth.service.test.js
PASS  tests/unit/attendance.service.test.js
PASS  tests/unit/payroll.service.test.js
PASS  tests/unit/utils.test.js
PASS  tests/integration/auth.routes.test.js
PASS  tests/integration/attendance.routes.test.js
PASS  tests/integration/payroll.routes.test.js

Test Suites: 7 passed, 7 total
Tests:       120+ passed, 120+ total
Coverage:    >80% statements, branches, lines, functions
```

### 3. Run Tests with Coverage Report
```bash
npm test -- --coverage
```

## Test Files Overview

### Unit Tests (tests/unit/)

#### auth.service.test.js
**What it tests:** Authentication service methods
- User registration validation
- Password hashing and verification
- Login with JWT token generation
- Token refresh mechanism
- User retrieval by ID

**Key test cases:**
- ✓ Register new user with duplicate prevention
- ✓ Login with password validation
- ✓ Refresh token with session verification
- ✓ Logout with session cleanup

#### attendance.service.test.js
**What it tests:** Attendance tracking service
- Check-in with geofence validation
- Late minute calculation with grace period
- Penalty calculation (Rp 5,000 per minute)
- Check-out functionality
- Attendance history retrieval
- Monthly statistics calculation

**Key test cases:**
- ✓ On-time check-in (0 penalty)
- ✓ Late check-in (10 min × Rp5,000 = Rp50,000)
- ✓ Outside geofence detection
- ✓ Duplicate check-in prevention
- ✓ Monthly statistics aggregation

#### payroll.service.test.js
**What it tests:** Payroll calculation and reporting
- Monthly payroll generation
- Penalty deduction from salary
- Leniency reduction application
- Salary slip generation and caching
- Monthly payroll report aggregation

**Key test cases:**
- ✓ Net salary = base - penalties + reductions
- ✓ Salary slip generation on first access
- ✓ HRD payroll report aggregation
- ✓ Handling missing data gracefully

#### utils.test.js
**What it tests:** Utility functions
- Password hashing with bcrypt
- JWT token generation and verification
- Geofence distance calculation
- Late minute calculation
- Penalty amount calculation

**Key test cases:**
- ✓ Password hash is one-way function
- ✓ JWT tokens contain correct payload
- ✓ Token expiration times differ
- ✓ Penalty calculations are accurate

### Integration Tests (tests/integration/)

#### auth.routes.test.js
**What it tests:** Authentication API endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

**Test coverage:**
- Valid requests return correct status codes
- Missing fields return 400 Bad Request
- Duplicate data returns 409 Conflict
- Missing auth returns 401 Unauthorized

#### attendance.routes.test.js
**What it tests:** Attendance API endpoints
- POST /api/attendance/check-in
- POST /api/attendance/check-out
- GET /api/attendance/history
- GET /api/attendance/monthly-stats

**Test coverage:**
- Valid requests return attendance data
- Missing coordinates return 400
- Missing auth returns 401
- Duplicate check-in returns 409

#### payroll.routes.test.js
**What it tests:** Payroll API endpoints
- GET /api/payroll/slip
- GET /api/payroll/report

**Test coverage:**
- Valid requests return salary data
- Invalid dates return 400
- Missing auth returns 401
- Non-HRD users return 403 for report

## Running Specific Tests

### Run Single Test File
```bash
npm test -- auth.service.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="register"
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## Expected Test Results

### Successful Test Run Output
```
PASS  tests/unit/auth.service.test.js (1.234 s)
  Auth Service
    register
      ✓ should register new user successfully (5 ms)
      ✓ should throw error if username already exists (2 ms)
      ✓ should throw error if email already exists (2 ms)
    login
      ✓ should login user successfully (3 ms)
      ✓ should throw error if user not found (1 ms)
      ✓ should throw error if password is invalid (2 ms)
      ✓ should throw error if account is inactive (1 ms)
    refreshToken
      ✓ should refresh access token successfully (2 ms)
      ✓ should throw error if session not found (1 ms)
      ✓ should throw error if user not found (1 ms)
    logout
      ✓ should logout user successfully (1 ms)
    getUserById
      ✓ should get user by id successfully (1 ms)
      ✓ should throw error if user not found (1 ms)
```

## Manual API Testing

### Prerequisites
1. Start PostgreSQL database
2. Apply migrations: `npm run migrate`
3. Seed test data: `npm run seed`
4. Start server: `npm run dev`

### Test Authentication Flow

#### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "department": "barista"
  }'
```

Expected response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 20,
    "username": "testuser",
    "email": "testuser@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "employee",
    "department": "barista"
  }
}
```

#### 2. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 20,
      "username": "testuser",
      "email": "testuser@example.com",
      "firstName": "Test",
      "lastName": "User",
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

Save the `accessToken` and `refreshToken` for next requests.

#### 3. Check-in On Time
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "shiftId": 1,
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 20,
    "punchDate": "2024-01-15",
    "checkInTime": "08:30",
    "status": "present",
    "lateMinutes": 0,
    "penalty": 0,
    "inZone": true
  }
}
```

#### 4. Check-out
```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "punchDate": "2024-01-15",
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 20,
    "checkOutTime": "16:30",
    "checkOutTimestamp": "2024-01-15T16:30:00Z"
  }
}
```

#### 5. Get Attendance History
```bash
curl -X GET "http://localhost:3000/api/attendance/history?days=30" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "punchDate": "2024-01-15",
      "checkInTime": "08:30",
      "checkOutTime": "16:30",
      "status": "present",
      "lateMinutes": 0,
      "penalty": 0
    }
  ]
}
```

#### 6. Get Monthly Statistics
```bash
curl -X GET "http://localhost:3000/api/attendance/monthly-stats?year=2024&month=1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "onTimeDays": 1,
    "lateDays": 0,
    "absentDays": 0,
    "totalLateMinutes": 0,
    "totalPenalty": 0
  }
}
```

#### 7. Get Salary Slip
```bash
curl -X GET "http://localhost:3000/api/payroll/slip?year=2024&month=1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": 20,
    "periodYear": 2024,
    "periodMonth": 1,
    "baseSalary": 3000000,
    "totalPenalties": 0,
    "totalReductions": 0,
    "netSalary": 3000000,
    "generatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 8. Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

Expected response (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

## Error Scenarios Testing

### Test 1: Duplicate Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "different@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "department": "barista"
  }'
```

Expected response (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_USER",
    "message": "Username or email already exists",
    "statusCode": 409
  }
}
```

### Test 2: Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrongpassword"
  }'
```

Expected response (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "statusCode": 401
  }
}
```

### Test 3: Missing Authentication
```bash
curl -X GET "http://localhost:3000/api/attendance/history?days=30"
```

Expected response (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "No authentication token provided",
    "statusCode": 401
  }
}
```

### Test 4: Duplicate Check-in
```bash
# First check-in (successful)
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "shiftId": 1,
    "latitude": -6.2088,
    "longitude": 106.8456
  }'

# Second check-in (should fail)
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "shiftId": 1,
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

Expected response (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Already checked in today",
    "statusCode": 409
  }
}
```

## Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| auth.service.js | 95% | ✓ |
| attendance.service.js | 95% | ✓ |
| payroll.service.js | 90% | ✓ |
| auth.routes.js | 85% | ✓ |
| attendance.routes.js | 85% | ✓ |
| payroll.routes.js | 85% | ✓ |
| middleware | 90% | Pending |
| utils | 95% | ✓ |
| **Overall** | **>85%** | ✓ |

## Troubleshooting

### Tests Fail with "Cannot find module"
```bash
# Ensure all dependencies are installed
npm install
```

### Database Connection Error in Integration Tests
```bash
# Tests use mocked database by default
# For real database testing, configure .env.test:
DATABASE_URL=postgres://postgres:password@localhost:5432/absense_test
```

### Port Already in Use
```bash
# Change PORT in .env.test
PORT=3001
```

### Tests Hang or Timeout
```bash
# Increase Jest timeout
npm test -- --testTimeout=10000
```

## Performance Metrics

Target response times for API endpoints:
- Register: < 100ms
- Login: < 100ms
- Check-in: < 150ms
- Check-out: < 150ms
- Attendance History: < 200ms
- Monthly Stats: < 250ms
- Salary Slip: < 300ms
- Payroll Report: < 500ms

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Next Steps

1. ✓ Run `npm test` to verify all tests pass
2. ✓ Check coverage report with `npm test -- --coverage`
3. ✓ Test API endpoints manually with provided cURL commands
4. ✓ Verify error handling for edge cases
5. ✓ Proceed to frontend integration testing
6. ✓ Deploy to staging environment
7. ✓ Production deployment sign-off

---

**Last Updated**: 2024-01-15
**Maintained by**: Development Team
