// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { Router } from 'express';
import type { Request, Response } from 'express';
import authModule from '../auth';

// Users module manages profiles, preferences, and linked financial accounts metadata.
const router = Router();

// GET /api/users/me - Protected route example
router.get('/me', authModule.authGuard, (req: Request, res: Response) => {
  // req.user is guaranteed to exist due to authGuard middleware
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export default { router };
