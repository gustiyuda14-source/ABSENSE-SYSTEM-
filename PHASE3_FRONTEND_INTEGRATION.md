# Phase 3: Frontend Integration Plan

## Overview
Replace hardcoded frontend data with backend API integration. Connect the React PWA to the Node.js/Express backend.

## Current State
- ✓ Backend API fully implemented & tested (118 tests passing)
- ✗ Frontend using hardcoded data (CURRENT_USER, SHIFTS, generateHistory())
- ✗ No GPS capture (simulated geolocation)
- ✗ No backend API calls

## Phase 3 Tasks

### Task 1: Create Data Initialization Layer
**File:** `data.jsx` (NEW)

Initialize and manage global data state that will be fetched from backend:

```javascript
// Data initialization & caching
let CURRENT_USER = null;
let SHIFTS = {};
let USER_HISTORY = [];
let CURRENT_MONTH_STATS = {};

// Initialize from authService
async function initializeUserData() {
  try {
    CURRENT_USER = await window.authService.getCurrentUser();
    // Load shifts (from shifts endpoint once backend is ready)
    // Load month stats from dataService
    CURRENT_MONTH_STATS = await window.dataService.getMonthlyStats(
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );
    // Load attendance history
    USER_HISTORY = await window.dataService.getAttendanceHistory(30);
  } catch (error) {
    console.error('Failed to initialize user data:', error);
  }
}

// Export for use in components
window.initializeUserData = initializeUserData;
window.getCurrentUser = () => CURRENT_USER;
window.getShifts = () => SHIFTS;
window.getHistory = () => USER_HISTORY;
```

### Task 2: Update Mobile Screens - Home Screen
**File:** `mobile-screens.jsx` - `HomeScreen` component

**Changes:**
1. Load user data on mount using `authService.getCurrentUser()`
2. Load monthly stats using `dataService.getMonthlyStats()`
3. Replace hardcoded CURRENT_USER with state variable
4. Display loading state while fetching data
5. Handle errors gracefully

```javascript
function HomeScreen({ onCheckIn, onCheckOut, onOpen, history, hasCheckedIn }) {
  const [user, setUser] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await window.authService.getCurrentUser();
        setUser(currentUser);
        
        const stats = await window.dataService.getMonthlyStats(
          new Date().getFullYear(),
          new Date().getMonth() + 1
        );
        setMonthStats(stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Not logged in</div>;

  // Rest of component uses `user` instead of `CURRENT_USER`
}
```

### Task 3: Add GPS Capture to Check-in
**File:** `mobile-checkin.jsx` - `CheckInScreen` component

**Changes:**
1. Request device geolocation on mount
2. Capture latitude/longitude from device
3. Display GPS status (acquiring, ready, denied)
4. Pass GPS coordinates to backend check-in API
5. Handle permission denials gracefully

```javascript
function CheckInScreen({ onClose, onComplete, mode = 'in', simulated }) {
  const [gps, setGps] = useState({ lat: null, lng: null, status: 'acquiring' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setGps({ ...gps, status: 'unavailable' });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          status: 'ready'
        });
      },
      (err) => {
        setError(err.message);
        setGps({ ...gps, status: 'denied' });
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleCheckIn = async () => {
    if (!gps.lat || !gps.lng) {
      setError('GPS location not available');
      return;
    }

    try {
      const result = await window.dataService.checkIn(
        user.shift,
        gps.lat,
        gps.lng
      );
      onComplete?.(result);
      onClose?.();
    } catch (err) {
      setError(err.message);
    }
  };
}
```

### Task 4: Integrate Check-in/out API Calls
**File:** `mobile-checkin.jsx` - Complete refactor

**Changes:**
1. Remove local penalty calculation (use backend response)
2. Call `window.dataService.checkIn()` with GPS coordinates
3. Call `window.dataService.checkOut()` for check-out
4. Display actual status from backend (present/late/sp)
5. Show actual penalty amount from server

```javascript
const handleCheckIn = async () => {
  setLoading(true);
  try {
    const result = await window.dataService.checkIn(
      user.shift,
      gps.latitude,
      gps.longitude
    );
    // Result contains: status, lateMinutes, penalty, inZone from backend
    setResult({
      status: result.status, // from server
      late: result.lateMinutes,
      penalty: result.penalty,
      inZone: result.inZone
    });
    setStage('result');
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Task 5: Load Attendance History
**File:** `mobile-screens.jsx` - `HistoryScreen` component

**Changes:**
1. Load attendance history using `window.dataService.getAttendanceHistory(30)`
2. Format and display actual attendance records
3. Replace hardcoded `generateHistory()` calls
4. Add pagination for large datasets

```javascript
function HistoryScreen({ onOpen }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await window.dataService.getAttendanceHistory(30);
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  if (loading) return <LoadingState />;
  
  return (
    <div>
      {history.map(record => (
        <HistoryItem key={record.id} record={record} onOpen={onOpen} />
      ))}
    </div>
  );
}
```

### Task 6: Update Profile Screen
**File:** `mobile-screens.jsx` - `ProfileScreen` component

**Changes:**
1. Display actual user data from `authService`
2. Show real salary information
3. Load and display payroll information
4. Implement logout functionality

```javascript
function ProfileScreen({ onLogout, onOpen }) {
  const [user, setUser] = useState(null);
  const [salarySlip, setSalarySlip] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await window.authService.getCurrentUser();
      setUser(currentUser);
      
      const slip = await window.dataService.getSalarySlip(
        new Date().getFullYear(),
        new Date().getMonth() + 1
      );
      setSalarySlip(slip);
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await window.authService.logout();
    onLogout?.();
  };

  return (
    // Display user and salary information
  );
}
```

### Task 7: Update HRD Dashboard
**File:** `hrd-dashboard.jsx` - Complete refactor

**Changes:**
1. Load all employees using employee API endpoint
2. Load payroll report for current month
3. Display real-time attendance updates via WebSocket
4. Show payroll calculations and deductions
5. Implement filtering and search

```javascript
function HRDDashboard() {
  const [employees, setEmployees] = useState([]);
  const [payrollReport, setPayrollReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load payroll report
        const report = await window.dataService.getPayrollReport(
          new Date().getFullYear(),
          new Date().getMonth() + 1
        );
        setPayrollReport(report);
      } catch (error) {
        console.error('Failed to load payroll report:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const wsClient = window.getWSClient();
    
    wsClient.on('attendance:checked-in', (data) => {
      // Update employee list with new check-in
      console.log('Employee checked in:', data);
    });

    wsClient.on('attendance:checked-out', (data) => {
      console.log('Employee checked out:', data);
    });

    return () => {
      // Cleanup listeners
    };
  }, []);

  return (
    // Dashboard UI with payroll data
  );
}
```

### Task 8: Add WebSocket Integration
**File:** `mobile-screens.jsx` - Real-time notification updates

**Changes:**
1. Connect WebSocket on app load
2. Listen for real-time attendance updates
3. Update UI when employees check in/out
4. Show push notifications for important events

```javascript
useEffect(() => {
  const wsClient = window.getWSClient();
  
  wsClient.on('attendance:checked-in', (data) => {
    console.log('Real-time: Employee checked in', data);
    // Refresh attendance data
    refreshAttendanceData();
  });

  wsClient.on('attendance:checked-out', (data) => {
    console.log('Real-time: Employee checked out', data);
  });

  wsClient.on('warning', (data) => {
    console.log('Warning issued:', data);
    // Show toast notification
  });
}, []);
```

### Task 9: Offline Queue Integration
**File:** `mobile-checkin.jsx` - Add offline fallback

**Changes:**
1. Detect network errors
2. Queue failed requests using `offlineManager`
3. Show offline indicator to user
4. Auto-sync when connection restored

```javascript
const handleCheckIn = async () => {
  try {
    const result = await window.dataService.checkIn(
      user.shift,
      gps.latitude,
      gps.longitude
    );
    // Success
  } catch (error) {
    if (navigator.onLine === false) {
      // Queue for later
      await window.offlineManager.addRequest({
        method: 'POST',
        endpoint: '/api/attendance/check-in',
        data: { shiftId: user.shift, latitude: gps.latitude, longitude: gps.longitude }
      });
      showNotification('Offline - queued for sync');
    } else {
      showError(error.message);
    }
  }
};
```

## Implementation Order

1. ✓ Create `data.jsx` - Initialize data layer
2. → Update `mobile-screens.jsx` - HomeScreen component
3. → Update `mobile-checkin.jsx` - Add GPS & API integration
4. → Update `mobile-screens.jsx` - HistoryScreen, ProfileScreen
5. → Update `hrd-dashboard.jsx` - Real data loading
6. → Add WebSocket real-time updates
7. → Test end-to-end with backend
8. → Deploy to staging & production

## Testing Checklist

- [ ] Login with test credentials
- [ ] Home screen loads user data correctly
- [ ] Check-in captures GPS coordinates
- [ ] Check-in creates record in backend
- [ ] Late penalties calculated correctly
- [ ] Check-out works properly
- [ ] Attendance history displays all records
- [ ] Monthly stats calculated correctly
- [ ] Profile shows correct user information
- [ ] Salary calculations display correctly
- [ ] HRD dashboard shows all employees
- [ ] Payroll report aggregates correctly
- [ ] WebSocket updates in real-time
- [ ] Offline queue syncs when online
- [ ] Error handling works for failed API calls

## Known Issues & Workarounds

1. **GPS Permission**: Browsers require HTTPS for geolocation (localhost works in dev)
2. **CORS**: Ensure backend CORS is configured for frontend domain
3. **Token Expiry**: Auto-refresh tokens when API returns 401

## Next Phase: Deployment
After Phase 3 completes:
1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Configure CORS for production domains
4. Set up environment variables
5. Run end-to-end tests in production

---

**Start Date:** 2024-01-15
**Status:** Ready to begin
**Estimated Duration:** 2-3 days
