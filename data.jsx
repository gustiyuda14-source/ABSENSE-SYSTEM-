// data.jsx — Frontend data initialization from backend services
// Replaces hardcoded CURRENT_USER, SHIFTS, and generateHistory()

// Global state for user data
let _currentUser = null;
let _shifts = {};
let _userHistory = [];
let _monthlyStats = null;
let _initPromise = null;

// Get current user (cached)
function getCurrentUser() {
  return _currentUser;
}

// Get shifts lookup table
function getShifts() {
  return _shifts;
}

// Get user attendance history
function getUserHistory() {
  return _userHistory;
}

// Get monthly statistics
function getMonthlyStats() {
  return _monthlyStats;
}

// Initialize all data from backend
async function initializeData() {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      console.log('📊 Initializing frontend data from backend...');

      // 1. Get current user
      const userResult = await window.authService.getCurrentUser();
      if (!userResult) {
        throw new Error('User not authenticated');
      }
      _currentUser = userResult;
      console.log('✓ Current user loaded:', _currentUser.username);

      // 2. Load shifts (create dummy shifts for now, will be API endpoint)
      // TODO: Replace with actual API call once shifts endpoint is available
      _shifts = {
        0: { label: 'Shift 1', start: '08:00', end: '16:00', code: 'S1' },
        1: { label: 'Shift 2', start: '14:00', end: '22:00', code: 'S2' },
        2: { label: 'Shift 3', start: '22:00', end: '06:00', code: 'S3' },
      };
      console.log('✓ Shifts loaded');

      // 3. Load monthly statistics
      const now = new Date();
      const statsResult = await window.dataService.getMonthlyStats(
        now.getFullYear(),
        now.getMonth() + 1
      );
      if (statsResult.success) {
        _monthlyStats = statsResult.data;
        console.log('✓ Monthly stats loaded');
      }

      // 4. Load attendance history
      const historyResult = await window.dataService.getAttendanceHistory(30);
      if (historyResult.success) {
        _userHistory = historyResult.data || [];
        console.log('✓ Attendance history loaded:', _userHistory.length, 'records');
      }

      console.log('✓ All data initialized successfully');
      return true;
    } catch (error) {
      console.error('✗ Failed to initialize data:', error);
      throw error;
    }
  })();

  return _initPromise;
}

// Refresh user data
async function refreshUserData() {
  try {
    const user = await window.authService.getCurrentUser();
    if (user) {
      _currentUser = user;
      console.log('✓ User data refreshed');
      return user;
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  }
  return null;
}

// Refresh monthly statistics
async function refreshMonthlyStats() {
  try {
    const now = new Date();
    const result = await window.dataService.getMonthlyStats(
      now.getFullYear(),
      now.getMonth() + 1
    );
    if (result.success) {
      _monthlyStats = result.data;
      console.log('✓ Monthly stats refreshed');
      return result.data;
    }
  } catch (error) {
    console.error('Failed to refresh monthly stats:', error);
  }
  return null;
}

// Refresh attendance history
async function refreshAttendanceHistory() {
  try {
    const result = await window.dataService.getAttendanceHistory(30);
    if (result.success) {
      _userHistory = result.data || [];
      console.log('✓ Attendance history refreshed');
      return _userHistory;
    }
  } catch (error) {
    console.error('Failed to refresh attendance history:', error);
  }
  return null;
}

// Hook for React components to load data with loading states
function useUserData() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await initializeData();
        setUser(getCurrentUser());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { user, loading, error, refresh: refreshUserData };
}

// Hook for monthly statistics
function useMonthlyStats() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await initializeData();
        setStats(getMonthlyStats());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { stats, loading, error, refresh: refreshMonthlyStats };
}

// Hook for attendance history
function useAttendanceHistory() {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await initializeData();
        setHistory(getUserHistory());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { history, loading, error, refresh: refreshAttendanceHistory };
}

// Legacy compatibility - use for immediate access (may be null initially)
// Better: use useUserData() hook in React components
Object.defineProperty(window, 'CURRENT_USER', {
  get: () => _currentUser,
  configurable: true,
});

Object.defineProperty(window, 'SHIFTS', {
  get: () => _shifts,
  configurable: true,
});

// Make initialization available globally
window.initializeData = initializeData;
window.refreshUserData = refreshUserData;
window.refreshMonthlyStats = refreshMonthlyStats;
window.refreshAttendanceHistory = refreshAttendanceHistory;

// Export hooks for use in React components
window.useUserData = useUserData;
window.useMonthlyStats = useMonthlyStats;
window.useAttendanceHistory = useAttendanceHistory;

console.log('📦 Data layer loaded - call initializeData() to load from backend');
