// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { Router } from 'express';
import authModule from '../modules/auth/index.js';
import usersModule from '../modules/users/index.js';
import transactionsModule from '../modules/transactions/index.js';
import categoriesModule from '../modules/categories/index.js';
import budgetsModule from '../modules/budgets/index.js';
import goalsModule from '../modules/goals/index.js';
import aiModule from '../modules/ai/index.js';
import suggestionsModule from '../modules/suggestions/index.js';
import insightsModule from '../modules/insights/index.js';
import importsModule from '../modules/imports/index.js';
import chatbotModule from '../modules/chatbot/index.js';

// Aggregates module routers. Each module exposes its own router + handlers.
const router = Router();

router.use('/auth', authModule.router);
router.use('/users', usersModule.router);
router.use('/transactions', transactionsModule.router);
router.use('/categories', categoriesModule.router);
router.use('/budgets', budgetsModule.router);
router.use('/goals', goalsModule.router);
router.use('/ai', aiModule.router);
router.use('/suggestions', suggestionsModule.router);
router.use('/insights', insightsModule.router);
router.use('/imports', importsModule.router);
router.use('/chatbot', chatbotModule.router);

export default router;

// test