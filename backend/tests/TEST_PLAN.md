# Backend Testing Plan - D'AJIKS Attendance System

## Overview
Comprehensive testing strategy for validating the backend API implementation before production deployment.

## Test Structure

### Unit Tests
Test individual service methods in isolation using mocked database calls.

#### Auth Service (`auth.service.test.js`)
- ✓ User registration with validation
  - Successful registration with all fields
  - Duplicate username prevention
  - Duplicate email prevention
  - Password hashing verification
  - Initial conduct history creation
- ✓ User login
  - Successful login returns access + refresh tokens
  - Invalid username rejection
  - Invalid password rejection
  - Inactive account rejection
  - Session storage verification
- ✓ Token refresh
  - Successful token refresh
  - Invalid token rejection
  - Expired session rejection
  - User not found during refresh
- ✓ User logout
  - Session deletion
  - Token invalidation
- ✓ Get user by ID
  - Successful user retrieval
  - User not found error

#### Attendance Service (`attendance.service.test.js`)
- ✓ Check-in functionality
  - On-time check-in (status: present, penalty: 0)
  - Late check-in with penalty calculation (15 min late - 5 grace = 10 min × Rp5000)
  - Geofence validation (100m default radius)
  - Outside geofence detection
  - Duplicate check-in prevention
  - GPS coordinate validation (Haversine formula)
- ✓ Check-out functionality
  - Successful check-out
  - Check-out time recording
  - Not checked in error
- ✓ Attendance history
  - Retrieve last 30 days
  - Retrieve custom date range
  - Empty history handling
- ✓ Monthly statistics
  - On-time days count
  - Late days count
  - Absent days count
  - Total late minutes
  - Total penalty amount
  - Zero stats when no data

#### Payroll Service (`payroll.service.test.js`)
- ✓ Monthly payroll generation
  - Base salary calculation
  - Penalty deduction
  - Leniency reduction application
  - Net salary = base - penalties + reductions
  - User not found error
  - Null penalty/reduction handling
- ✓ Salary slip generation
  - Return existing slip
  - Generate new slip if not found
  - Complete breakdown with all fields
- ✓ Monthly payroll report
  - Aggregate report for all employees
  - HRD access validation
  - Empty report handling

### Integration Tests
Test API endpoints with mocked database to validate HTTP flow.

#### Auth Routes (`auth.routes.test.js`)
- ✓ POST /api/auth/register
  - 201 on successful registration
  - 400 for missing required fields
  - 409 for duplicate username/email
  - Response contains user object
- ✓ POST /api/auth/login
  - 200 on successful login
  - Returns accessToken and refreshToken
  - 401 for invalid credentials
  - 400 for missing fields
- ✓ POST /api/auth/refresh
  - 200 on successful refresh
  - Returns new accessToken
  - 401 for invalid refresh token
- ✓ POST /api/auth/logout
  - 200 on successful logout
  - Session is deleted
- ✓ GET /api/auth/me
  - 200 returns current user
  - 401 without valid token

## Running Tests

### Install Dependencies
```bash
cd backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- auth.service.test.js
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

## Test Coverage Goals

| Module | Target | Status |
|--------|--------|--------|
| auth.service.js | 95% | In Progress |
| attendance.service.js | 95% | In Progress |
| payroll.service.js | 95% | In Progress |
| auth.routes.js | 85% | Planned |
| attendance.routes.js | 85% | Planned |
| payroll.routes.js | 85% | Planned |
| middleware | 90% | Planned |
| utils | 95% | Planned |

## Critical Path Tests

High-priority tests that must pass before deployment:

1. **Authentication Flow**
   - Register → Login → Get Token → Refresh Token → Logout
   - Error handling for all failure scenarios

2. **Attendance Check-in/out**
   - Valid geofence check-in
   - Late penalty calculation (grace period applied)
   - Duplicate prevention
   - Database record creation

3. **Payroll Calculation**
   - Base salary retrieval
   - Penalty summation
   - Leniency reduction application
   - Net salary accuracy

4. **Error Handling**
   - 400 Bad Request for invalid input
   - 401 Unauthorized for missing auth
   - 403 Forbidden for insufficient role
   - 404 Not Found for missing resources
   - 409 Conflict for duplicates
   - 500 Internal Server Error with proper logging

## Manual Testing Checklist

### Prerequisites
- PostgreSQL running with test database
- Node.js v18+ installed
- Environment variables configured (see .env.example)

### API Testing with cURL

#### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "department": "barista"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

#### 3. Check-in (On Time)
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

#### 4. Check-in (Late)
```bash
# Set system time to 09:15 AM (15 min after 08:00 shift start)
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "shiftId": 1,
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
# Expected: lateMinutes: 10 (15 - 5 grace), penalty: 50000
```

#### 5. Check-out
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

#### 6. Get Attendance History
```bash
curl -X GET "http://localhost:3000/api/attendance/history?days=30" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### 7. Get Monthly Stats
```bash
curl -X GET "http://localhost:3000/api/attendance/monthly-stats?year=2024&month=1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### 8. Get Salary Slip
```bash
curl -X GET "http://localhost:3000/api/payroll/slip?year=2024&month=1" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### 9. Get Payroll Report (HRD only)
```bash
curl -X GET "http://localhost:3000/api/payroll/report?year=2024&month=1" \
  -H "Authorization: Bearer <HRD_TOKEN>"
```

#### 10. Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

## Expected Results

### Successful Check-in On Time (08:30 AM, Shift starts 08:00)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "punchDate": "2024-01-15",
    "checkInTime": "08:30",
    "status": "present",
    "lateMinutes": 0,
    "penalty": 0,
    "inZone": true
  }
}
```

### Successful Check-in Late (09:15 AM, Shift starts 08:00)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "userId": 1,
    "punchDate": "2024-01-15",
    "checkInTime": "09:15",
    "status": "late",
    "lateMinutes": 10,
    "penalty": 50000,
    "inZone": true
  }
}
```

### Duplicate Check-in Error
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_CHECKIN",
    "message": "Already checked in today",
    "statusCode": 409
  }
}
```

### Geofence Violation
```json
{
  "success": true,
  "data": {
    "id": 3,
    "userId": 1,
    "punchDate": "2024-01-15",
    "checkInTime": "08:45",
    "status": "late",
    "lateMinutes": 10,
    "penalty": 50000,
    "inZone": false
  }
}
```

## Known Issues & Workarounds

### Database Connection in Tests
Tests use mocked database (`jest.mock()`), so they run without actual PostgreSQL.

For integration testing with real database:
1. Start PostgreSQL
2. Create test database: `createdb absense_test`
3. Update .env.test with DATABASE_URL
4. Run: `npm test:integration`

### JWT Token Validation
Mock JWT tokens are used in tests. For real token testing:
1. Start the server: `npm run dev`
2. Obtain token from login endpoint
3. Use token in subsequent requests

## Performance Benchmarks

Target response times (measured from test runs):
- Login: < 100ms
- Check-in: < 150ms
- Attendance History: < 200ms
- Monthly Stats: < 250ms
- Salary Slip: < 300ms
- Payroll Report: < 500ms

## Security Validation Checklist

- ✓ Passwords hashed with bcrypt (12 rounds)
- ✓ JWT tokens with 24h expiry
- ✓ Refresh tokens with 30d expiry
- ✓ Session tokens stored in database
- ✓ Role-based access control enforced
- ✓ SQL injection prevention (parameterized queries)
- ✓ CORS configured properly
- ✓ Sensitive data not logged

## Deployment Sign-off

Tests must pass with:
- [ ] 100% of critical path tests passing
- [ ] No console errors or warnings
- [ ] All error scenarios handled
- [ ] Database migrations verified
- [ ] WebSocket events firing correctly
- [ ] Email notifications working (if configured)
- [ ] Logging properly configured

---

**Last Updated**: 2024-01-15
**Next Review**: Before each production deployment
