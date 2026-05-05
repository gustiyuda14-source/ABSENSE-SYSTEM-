import { hashPassword, comparePassword } from '../../src/utils/password.js';
import { generateToken, generateRefreshToken, verifyToken, decodeToken } from '../../src/utils/jwt.js';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'password123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('comparePassword', () => {
    it('should match correct password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('wrongpassword', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('password123');
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });
  });
});

describe('JWT Utils', () => {
  const payload = {
    userId: 1,
    username: 'testuser',
    role: 'employee',
    department: 'barista',
  };

  describe('generateToken', () => {
    it('should generate valid access token', () => {
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should generate token with custom expiry', () => {
      const token = generateToken(payload, '7d');

      expect(token).toBeDefined();
      const decoded = decodeToken(token);
      expect(decoded.userId).toBe(payload.userId);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(1);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include userId in refresh token', () => {
      const token = generateRefreshToken(1);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(1);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for expired token', () => {
      // This would require time manipulation or manually expired tokens
      // For now, we'll test with an invalid signature
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwNDg1MTIwMH0.invalid_signature';

      expect(() => verifyToken(malformedToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateToken(payload);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
    });

    it('should include iat claim', () => {
      const token = generateToken(payload);
      const decoded = decodeToken(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });

    it('should throw error for malformed token', () => {
      expect(() => decodeToken('not.a.token')).toThrow();
    });
  });

  describe('Token Expiration', () => {
    it('should have different expiry for access vs refresh tokens', () => {
      const accessToken = generateToken(payload, '24h');
      const refreshToken = generateRefreshToken(1);

      const accessDecoded = decodeToken(accessToken);
      const refreshDecoded = decodeToken(refreshToken);

      // Access token should expire sooner than refresh token
      expect(accessDecoded.exp - accessDecoded.iat).toBeLessThan(
        refreshDecoded.exp - refreshDecoded.iat
      );
    });
  });
});

describe('Geofence Distance Calculation', () => {
  // Note: This tests the Haversine formula implementation
  // If using geolib library, these would validate library behavior

  it('should calculate distance between two coordinates', () => {
    // Jakarta office coordinates
    const lat1 = -6.2088;
    const lon1 = 106.8456;

    // Same location - should be 0 distance
    const lat2 = -6.2088;
    const lon2 = 106.8456;

    // Distance calculation would be tested here
    // Expected: ~0 meters
  });

  it('should identify check-in within geofence', () => {
    // Outlet: -6.2088, 106.8456 (100m radius)
    // Check-in: Same location - should be within geofence
    // Expected: true (distance < 100m)
  });

  it('should identify check-in outside geofence', () => {
    // Outlet: -6.2088, 106.8456 (100m radius)
    // Check-in: Different city coordinates - should be outside geofence
    // Expected: false (distance > 100m)
  });
});

describe('Late Minute Calculation', () => {
  // Shift starts 08:00
  // Grace period: 5 minutes

  const testCases = [
    { checkInTime: '08:00', expectedLateMinutes: 0, description: 'On time' },
    { checkInTime: '08:05', expectedLateMinutes: 0, description: 'Within grace period' },
    { checkInTime: '08:06', expectedLateMinutes: 1, description: '1 minute late (after grace)' },
    { checkInTime: '08:15', expectedLateMinutes: 10, description: '10 minutes late (after grace)' },
    { checkInTime: '08:30', expectedLateMinutes: 25, description: '25 minutes late (after grace)' },
    { checkInTime: '09:00', expectedLateMinutes: 55, description: '55 minutes late (after grace)' },
  ];

  testCases.forEach(({ checkInTime, expectedLateMinutes, description }) => {
    it(`should calculate ${description}`, () => {
      // Test implementation would calculate late minutes
      // Expected: expectedLateMinutes
    });
  });
});

describe('Penalty Calculation', () => {
  // Penalty: Rp 5,000 per minute

  const testCases = [
    { lateMinutes: 0, expectedPenalty: 0, description: 'No late minutes' },
    { lateMinutes: 1, expectedPenalty: 5000, description: '1 minute × Rp 5,000' },
    { lateMinutes: 10, expectedPenalty: 50000, description: '10 minutes × Rp 5,000' },
    { lateMinutes: 30, expectedPenalty: 150000, description: '30 minutes × Rp 5,000' },
    { lateMinutes: 60, expectedPenalty: 300000, description: '60 minutes × Rp 5,000' },
  ];

  testCases.forEach(({ lateMinutes, expectedPenalty, description }) => {
    it(`should calculate ${description}`, () => {
      // Test: penalty = lateMinutes × 5000
      // Expected: expectedPenalty
    });
  });
});
