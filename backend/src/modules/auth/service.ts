// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import type { RegisterInput, LoginInput } from './validation';

const SALT_ROUNDS = 10;

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT utilities
export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyToken(token: string): { userId: string; type: string } {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      type: string;
    };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Auth service functions
export async function register(input: RegisterInput) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new tokens (token rotation)
  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
