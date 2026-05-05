# Phase 3 Frontend-Backend Integration E2E Test Plan

## Overview
This document outlines the end-to-end testing strategy for the D'AJIKS attendance system, verifying that the React PWA frontend is properly integrated with the Node.js/Express backend API.

## Pre-Test Checklist

Before running E2E tests, ensure:
- [ ] Backend server is running on `http://localhost:5000`
- [ ] Frontend is running on `http://localhost:3000`
- [ ] Database is initialized with test data
- [ ] All backend tests pass (118+ tests)
- [ ] CORS is configured correctly
- [ ] WebSocket is configured and working
- [ ] GPS/Geolocation is available (or mocked in tests)

## Test Categories

### 1. Authentication & User Management

#### 1.1 Login Flow
**Test Steps:**
1. Navigate to `/` (should redirect to login)
2. Enter valid credentials: `EMP-014` / (PIN from test data)
3. Click "MASUK SISTEM" button
4. Verify `initializeData()` is called automatically
5. Wait for user data to load
6. Verify redirect to home screen
7. Verify user name appears in header ("Halo, {firstname}")

**Expected Results:**
- Login successful within 2 seconds
- JWT tokens stored in localStorage
- User data cached globally
- Home screen displays without errors

**API Endpoints Tested:**
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `GET /api/users/{id}` - Verify user profile data

#### 1.2 Invalid Login
**Test Steps:**
1. Enter invalid employee ID (non-existent)
2. Click "MASUK SISTEM"
3. Observe error message

**Expected Results:**
- Error message displayed: "User tidak ditemukan" or similar
- Remain on login screen
- No redirect occurs

#### 1.3 Logout
**Test Steps:**
1. Login successfully
2. Navigate to Profile screen
3. Click "KELUAR DARI AKUN" button
4. Confirm logout action
5. Verify redirect to login screen
6. Verify all tokens cleared from localStorage

**Expected Results:**
- User logged out within 1 second
- Session cleared
- Redirect to login screen immediate

### 2. Home Screen Data Loading

#### 2.1 User Data Loading
**Test Steps:**
1. Login to app
2. HomeScreen renders with loading state visible
3. Wait for `useUserData()` hook to fetch data
4. Verify shift information displays correctly

**Expected Results:**
- Loading spinner shows initially
- User data loads within 3 seconds
- Greeting displays: "Halo, {firstName}."
- Shift label displays correctly (e.g., "Shift 1 · 08:00 - 16:00")

**API Endpoints Tested:**
- `GET /api/auth/me` - Current user data

#### 2.2 Monthly Statistics
**Test Steps:**
1. On home screen, observe "BULAN INI" section
2. Wait for monthly stats to load
3. Verify stats match backend data

**Expected Results:**
- Monthly stats load without errors
- On-time days count displays
- Late days count displays
- Total penalty amount displays correctly
- Remaining salary after penalties calculates correctly

**API Endpoints Tested:**
- `GET /api/attendance/monthly-stats?year=2026&month=5`

#### 2.3 Attendance History Display
**Test Steps:**
1. Observe 7-day mini-strip on home screen
2. Each day shows status icon (✓ = on time, +n = late, — = off day)
3. Hover/tap each day to see details
4. Click "Lihat semua →" to view full history

**Expected Results:**
- 7 days display correctly
- Colors match status (green = on time, orange = late, gray = off day)
- All history records load when viewing full history
- Last 30 days of records display

**API Endpoints Tested:**
- `GET /api/attendance/history?days=30`

### 3. Check-In/Out Flow with GPS

#### 3.1 GPS Initialization
**Test Steps:**
1. Open check-in screen (click "Stempel kartu masuk" on home)
2. Observe GPS status indicator
3. Wait for GPS to acquire signal (simulated in dev)

**Expected Results:**
- GPS status shows: "📍 Mencari sinyal..." initially
- After 1-3 seconds, changes to: "✓ Siap stempel"
- GPS accuracy displays (e.g., "±25m")
- Latitude and longitude display with 6 decimal places

**Browser Requirements:**
- HTTPS or localhost (geolocation requires secure context)
- User grants location permission
- Geolocation API available

#### 3.2 Check-In with GPS Coordinates
**Test Steps:**
1. GPS status shows "ready"
2. Hold button for 1.5 seconds (or click and hold on desktop)
3. Button shows progress ring filling
4. After 1.5 seconds, API call is made
5. Loading state shows while processing

**Expected Results:**
- Hold animation completes after 1.5 seconds
- API call to `POST /api/attendance/check-in` is made
- GPS coordinates sent with request
- Response includes: status, lateMinutes, penalty, inZone
- Receipt displays with actual check-in data

**API Endpoints Tested:**
- `POST /api/attendance/check-in`
- Request body includes: `{ shiftId, latitude, longitude }`
- Response includes: `{ status: 'tepat'|'telat'|'sp', lateMinutes, penalty, inZone }`

#### 3.3 GPS Permission Denied
**Test Steps:**
1. Deny GPS permission when prompted
2. Observe GPS status indicator
3. Try to hold button

**Expected Results:**
- GPS status shows: "✗ Akses ditolak"
- Error message: "GPS DITOLAK · AKTIFKAN LOKASI"
- Hold button disabled (grayed out)
- Error persists until permission granted

#### 3.4 GPS Unavailable
**Test Steps:**
1. Test on device/browser without geolocation support
2. Observe GPS status indicator

**Expected Results:**
- GPS status shows: "✗ Tidak tersedia"
- Error message: "GEOLOCATION TIDAK DIDUKUNG BROWSER"
- Hold button disabled

#### 3.5 Check-Out Flow
**Test Steps:**
1. After check-in, return to home screen
2. Observe check-in time displayed: "SUDAH MASUK · 09:38"
3. Click "Stempel kartu pulang" button
4. Repeat GPS flow for check-out
5. Receipt displays with check-out information

**Expected Results:**
- Check-out time recorded
- Receipt shows both check-in and check-out times
- No penalties for check-out

**API Endpoints Tested:**
- `POST /api/attendance/check-out`

#### 3.6 Late Penalty Calculation
**Test Steps:**
1. Check-in after shift start time (e.g., shift starts at 09:30)
2. Verify backend calculates lateness
3. Observe penalty amount in receipt

**Expected Results:**
- Backend correctly calculates late minutes
- Penalty calculated as: `lateMinutes × Rp 5,000`
- SP-2 sanction applied if late > 30 minutes
- Receipt displays actual penalty from backend (not client-side calculation)

**Penalty Rules:**
- 0-5 minutes: Grace period, no penalty
- 5-30 minutes: Standard penalty (Rp 5,000/min)
- 30+ minutes: SP-2 sanction + penalty

### 4. History Screen

#### 4.1 Load Attendance History
**Test Steps:**
1. Navigate to History screen
2. Wait for data to load
3. Observe 30 days of records

**Expected Results:**
- Loading state shows initially
- History loads within 2 seconds
- All 30 records display in reverse chronological order (newest first)
- Each record shows: date, status, check-in time, check-out time, late minutes, penalty

**API Endpoints Tested:**
- `GET /api/attendance/history?days=30`

#### 4.2 View Day Details
**Test Steps:**
1. Click on any history record
2. Day detail screen opens
3. Verify all information displays

**Expected Results:**
- Day detail shows: status, check-in/out times, target time, late minutes, penalty
- Location display shows GPS coordinates used
- Map visualization displays
- Penalty calculation shown

### 5. Profile Screen

#### 5.1 Load User Profile
**Test Steps:**
1. Navigate to Profile screen
2. Wait for user data to load
3. Observe all profile information

**Expected Results:**
- Loading state shows initially
- User name displays
- User ID displays
- Join date displays (e.g., "BERGABUNG JAN 2024")
- Shift information displays correctly
- Base salary displays
- Office location displays
- Geofence radius displays

**API Endpoints Tested:**
- `GET /api/auth/me` - User profile

#### 5.2 Salary Information
**Test Steps:**
1. View salary breakdown
2. Verify base salary matches backend
3. Navigate to Recap screen for detailed salary slip

**Expected Results:**
- Base salary displays correctly
- Monthly deductions calculate properly
- Net salary shows final amount

**API Endpoints Tested:**
- `GET /api/payroll/slip?year=2026&month=5`

### 6. Recap/Payroll Screen

#### 6.1 Load Monthly Salary Slip
**Test Steps:**
1. Navigate to Recap screen
2. Wait for salary slip data to load
3. Observe complete salary breakdown

**Expected Results:**
- Loading state shows initially
- Salary slip loads within 2 seconds
- Employee name and ID display
- Base salary displays
- Total late minutes calculated
- Penalty amount calculated
- Net salary shows final amount
- Month period displays (01 — 30 Mei)

**API Endpoints Tested:**
- `GET /api/payroll/slip?year=2026&month=5`

#### 6.2 Discipline Breakdown
**Test Steps:**
1. View "RINCIAN DISIPLIN" section
2. Observe on-time days, late days, total late minutes, SP sanctions

**Expected Results:**
- On-time days count matches history
- Late days count matches history
- SP sanctions display if applicable
- All calculations consistent with attendance records

### 7. HRD Dashboard

#### 7.1 Load Dashboard
**Test Steps:**
1. Open HRD dashboard (`http://localhost:3000/hrd`)
2. Wait for initial data load
3. Observe overview section

**Expected Results:**
- Dashboard loads within 3 seconds
- KPI cards display with loading states
- "HADIR HARI INI" shows total present employees
- "TELAT" shows count of late employees
- "POTONGAN HARI INI" shows total penalties
- "SP AKTIF" shows active sanctions

**API Endpoints Tested:**
- `GET /api/payroll/report?year=2026&month=5`

#### 7.2 View Charts
**Test Steps:**
1. Observe 7-day penalty chart
2. Verify bars display correctly
3. Check department breakdown

**Expected Results:**
- 7-day trend chart displays correctly
- Each day shows penalty amount
- Today's bar highlighted in orange/red
- Department breakdown shows department-wise penalties
- All numbers aggregated correctly

#### 7.3 Live Feed Updates
**Test Steps:**
1. Keep dashboard open
2. Have employee check-in on mobile
3. Observe live feed updates in real-time

**Expected Results:**
- New check-in appears in live feed within 1 second
- Employee name, time, status display
- Geolocation status shows (in zone / out of zone)
- WebSocket connection active

**WebSocket Events Tested:**
- `attendance:checked-in` - Triggered on check-in
- `attendance:checked-out` - Triggered on check-out
- `warning` - Issued for SPs

#### 7.4 View Employee Roster
**Test Steps:**
1. Click "Roster karyawan" section
2. Wait for employee data to load
3. Observe employee table

**Expected Results:**
- All active employees display
- Each employee shows: ID, name, role, shift, late minutes, penalties, status
- Late minutes and penalties aggregated for month
- SP sanctions display if applicable

**API Endpoints Tested:**
- `GET /api/payroll/report?year=2026&month=5` (for employee data)

### 8. Offline Handling

#### 8.1 Offline Check-In Queue
**Test Steps:**
1. Disable network (DevTools Network tab: Offline)
2. Attempt check-in
3. Observe error handling
4. Re-enable network
5. Verify auto-sync

**Expected Results:**
- Offline error message displays
- Request queued via offlineManager
- User can continue using app
- When network restored, queued requests auto-sync
- Success confirmation appears

**Related Files:**
- `offline-manager.jsx` - Queue and sync logic

#### 8.2 Offline Data Caching
**Test Steps:**
1. Load all screens while online
2. Disconnect network
3. Navigate between screens
4. Observe cached data availability

**Expected Results:**
- User data remains available
- Attendance history available from cache
- App remains functional for read operations

### 9. Error Handling

#### 9.1 API Error Responses
**Test Steps:**
1. Simulate API errors (DevTools mock network)
2. Trigger check-in with mocked 500 error
3. Observe error handling

**Expected Results:**
- Error message displays: "Check-in gagal"
- User remains on check-in screen (not redirected)
- Can retry check-in after fixing issue
- No silent failures

#### 9.2 Token Expiry
**Test Steps:**
1. Wait for access token to expire (simulated)
2. Attempt any API call
3. Observe auto-refresh behavior

**Expected Results:**
- App transparently refreshes token
- No error shown to user
- Request retried automatically
- If refresh fails, redirect to login

#### 9.3 Network Timeout
**Test Steps:**
1. Simulate slow network (DevTools: Slow 3G)
2. Load data-heavy screens
3. Observe timeout handling

**Expected Results:**
- Loading state shows while waiting
- If timeout > 30 seconds, error displays
- User can retry

## Performance Metrics

### Target Load Times
- Login: < 2 seconds
- Home screen: < 3 seconds
- Check-in process: < 1.5 seconds (animation) + < 2 seconds (API)
- History load: < 2 seconds
- HRD dashboard: < 3 seconds

### Network Optimization
- Minimize API calls per screen load
- Implement data caching for repeated requests
- Use WebSocket for live updates (not polling)
- Compress payloads where applicable

## Browser Compatibility

### Tested Browsers
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 121+

### Mobile Testing
- iPhone 14/15 (iOS 17+)
- Samsung Galaxy S23/24 (Android 13+)
- Geolocation testing on actual devices

## Regression Tests

### Before Each Deployment
1. Run all 118 backend unit/integration tests
2. Login with multiple test accounts
3. Complete full check-in → check-out flow
4. View history and recap screens
5. Test HRD dashboard data loading
6. Verify WebSocket real-time updates
7. Test on mobile device (geolocation)
8. Test offline → online sync

## Test Data Requirements

### Test Employee Account
- ID: `EMP-014`
- Name: `Test Employee`
- Shift: `S1` (08:00 - 16:00)
- Base Salary: `3,000,000`
- Role: `Barista`

### Test Accounts for Multiple Users
- At least 5 test employees for HRD dashboard
- Mix of on-time and late attendance records
- Some with SP sanctions applied

## Sign-Off Checklist

- [ ] All E2E tests pass without failures
- [ ] No console errors in browser DevTools
- [ ] All API endpoints respond correctly
- [ ] WebSocket connection established and stable
- [ ] GPS capture working on mobile
- [ ] Offline queue functioning properly
- [ ] Performance metrics within targets
- [ ] Mobile responsiveness verified
- [ ] Error handling tested and working
- [ ] Cross-browser compatibility verified

## Known Issues & Workarounds

### Issue 1: GPS Permission on iOS
**Workaround:** Test in Safari, not Chrome/Firefox (limited geolocation support)

### Issue 2: WebSocket Connection Issues
**Workaround:** Ensure backend WebSocket server running on port 5001

### Issue 3: CORS Errors
**Workaround:** Verify CORS headers in backend:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

## Notes for Deployment

After E2E tests pass:
1. Update environment variables for production URLs
2. Configure CORS for production domain
3. Enable HTTPS (required for geolocation)
4. Test with production backend API
5. Run load testing (simultaneous users)
6. Verify database backups working
7. Set up monitoring/alerting
8. Create runbook for incident response

---

**Test Plan Version:** 1.0  
**Last Updated:** 2026-05-05  
**Next Review:** After Phase 3 deployment
