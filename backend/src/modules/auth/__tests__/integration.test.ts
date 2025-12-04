// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createServer } from '../../../server.js';
import { prisma } from '../../../config/prisma.js';
import type { Express } from 'express';

describe('Auth API Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@test.com',
        },
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.status).toBe('ACTIVE');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'First User',
      };

      // Register first user
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate password length', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'short',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should register user without name (optional field)', async () => {
      const userData = {
        email: 'noname@test.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBeNull();
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.status).toBe('ACTIVE');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'logintest@test.com',
      password: 'password123',
      name: 'Login Test User',
    };

    beforeEach(async () => {
      // Create test user before each login test
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.status).toBe('ACTIVE');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          // missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validRefreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      // Register and get tokens
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refreshtest@test.com',
          password: 'password123',
          name: 'Refresh Test',
        });

      validRefreshToken = response.body.data.tokens.refreshToken;
      accessToken = response.body.data.tokens.accessToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      // Verify new tokens are valid (may be same if created in same second)
      expect(typeof response.body.data.tokens.accessToken).toBe('string');
      expect(typeof response.body.data.tokens.refreshToken).toBe('string');
    });

    it('should not refresh with access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: accessToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid token type');
    });

    it('should not refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Protected Routes - AuthGuard Middleware', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and get access token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'protected@test.com',
          password: 'password123',
          name: 'Protected Test',
        });

      accessToken = response.body.data.tokens.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('protected@test.com');
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.status).toBe('ACTIVE');
    });

    it('should not access protected route without token', async () => {
      const response = await request(app).get('/api/users/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Authorization token required');
    });

    it('should not access protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBeDefined();
    });

    it('should not access protected route with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', accessToken) // Missing 'Bearer ' prefix
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Authorization token required');
    });
  });

  describe('Health Endpoints', () => {
    it('should return ok for /health', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should return ok for /health/db when database is connected', async () => {
      const response = await request(app).get('/health/db').expect(200);

      expect(response.body.status).toBe('ok');
    });
  });
});
