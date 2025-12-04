import { describe, it, expect } from '@jest/globals';
import * as authService from '../service.js';

describe('Auth Service - Unit Tests', () => {

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword('wrongpassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    const userId = 'test-user-id-123';

    it('should generate valid access token', () => {
      const token = authService.generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate valid refresh token', () => {
      const token = authService.generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should verify and decode access token', () => {
      const token = authService.generateAccessToken(userId);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('access');
    });

    it('should verify and decode refresh token', () => {
      const token = authService.generateRefreshToken(userId);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow('Invalid or expired token');
    });
  });

  // Note: Database operations (register, login, refresh) are tested in integration.test.ts
  // These unit tests focus on pure functions that don't require database mocking
});
