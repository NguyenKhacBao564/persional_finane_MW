// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './service';
import { prisma } from '../../config/prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        status: string;
      };
    }
  }
}

/**
 * AuthGuard middleware
 * Protects routes by verifying JWT access token from Authorization header
 * Attaches user info to req.user if token is valid
 */
export async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authorization token required',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Verify it's an access token (not refresh token)
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token type',
        },
      });
      return;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
      return;
    }

    // Attach user to request
    req.user = user;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'Authentication failed',
        },
      });
    }
  }
}

/**
 * Optional auth middleware
 * Similar to authGuard but doesn't fail if token is missing
 * Useful for routes that work for both authenticated and unauthenticated users
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded.type === 'access') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silent fail - continue without user
    next();
  }
}
