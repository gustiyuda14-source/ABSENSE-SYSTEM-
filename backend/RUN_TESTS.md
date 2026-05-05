# Quick Test Reference

## ⚡ Fastest Way to Run Tests

### 1. Install & Run
```bash
cd backend
npm install
npm test
```

### 2. Expected Output
```
PASS  tests/unit/auth.service.test.js
PASS  tests/unit/attendance.service.test.js
PASS  tests/unit/payroll.service.test.js
PASS  tests/unit/utils.test.js
PASS  tests/integration/auth.routes.test.js
PASS  tests/integration/attendance.routes.test.js
PASS  tests/integration/payroll.routes.test.js

Tests:  77 passed, 77 total
```

## 🎯 Common Commands

| What | Command | Time |
|------|---------|------|
| All tests | `npm test` | ~5s |
| With coverage | `npm test -- --coverage` | ~8s |
| Watch mode | `npm run test:watch` | Continuous |
| One file | `npm test -- auth.service.test.js` | ~2s |
| Matching pattern | `npm test -- --testNamePattern="register"` | ~1s |
| Verbose | `npm test -- --verbose` | ~5s |

## ✅ What Gets Tested

### Authentication (20 tests)
- ✓ Register user
- ✓ Login user
- ✓ Refresh token
- ✓ Logout user

### Attendance (22 tests)
- ✓ Check-in (on-time)
- ✓ Check-in (late with penalty)
- ✓ Geofence validation
- ✓ Duplicate prevention
- ✓ Check-out
- ✓ History retrieval
- ✓ Monthly stats

### Payroll (18 tests)
- ✓ Salary generation
- ✓ Penalty deduction
- ✓ Slip creation
- ✓ Report aggregation

### Utilities (17 tests)
- ✓ Password hashing
- ✓ JWT validation
- ✓ Calculations

## 📊 Coverage Report

```bash
npm test -- --coverage
```

Look for:
- **Statements**: Target >85%
- **Branches**: Target >80%
- **Lines**: Target >85%
- **Functions**: Target >85%

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module` | Run `npm install` |
| Test timeout | Increase: `npm test -- --testTimeout=10000` |
| Watch mode stuck | Press `q` to quit |
| Port in use | Change PORT in .env.test |

## 📖 Full Documentation

- **TEST_PLAN.md** - Detailed test strategy
- **TESTING_GUIDE.md** - Step-by-step instructions
- **TESTING_SUMMARY.md** - Coverage overview

## 🚀 Next Steps

1. ✓ Run `npm test`
2. ✓ Verify all 77 tests pass
3. ✓ Check coverage >85%
4. → Start manual API testing (see TESTING_GUIDE.md)
5. → Deploy with confidence

---

**TL;DR**: `npm install && npm test`
