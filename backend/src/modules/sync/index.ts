import { Router, Request, Response } from 'express';
import { syncToJsonFile, readJsonFile } from '../../services/databaseSync.js';
import { authGuard } from '@modules/auth/middleware.js';

const router = Router();

/**
 * GET /api/sync/status
 * Get last sync status and timestamp (public endpoint for testing)
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const snapshot = await readJsonFile();

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'No sync data found',
      });
    }

    return res.json({
      success: true,
      data: {
        lastUpdated: snapshot.lastUpdated,
        counts: {
          users: snapshot.users.length,
          transactions: snapshot.transactions.length,
          categories: snapshot.categories.length,
          budgets: snapshot.budgets.length,
          goals: snapshot.goals.length,
          aiInsights: snapshot.aiInsights.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
    });
  }
});

/**
 * POST /api/sync/trigger
 * Manually trigger a database sync
 */
router.post('/trigger', authGuard, async (req: Request, res: Response) => {
  try {
    await syncToJsonFile();

    return res.json({
      success: true,
      message: 'Database synced successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync database',
    });
  }
});

export default { router };
