// FE CONTRACT NOTE: Updated to align with frontend expectations ({ success, data: { user, tokens } }) and E1 specs; avoids FE parsing mismatches.
import { Router } from 'express';
import authModule from '../modules/auth';
import usersModule from '../modules/users';
import transactionsModule from '../modules/transactions';
import categoriesModule from '../modules/categories';
import budgetsModule from '../modules/budgets';
import goalsModule from '../modules/goals';
import aiModule from '../modules/ai';

// Aggregates module routers. Each module exposes its own router + handlers.
const router = Router();

router.use('/auth', authModule.router);
router.use('/users', usersModule.router);
router.use('/transactions', transactionsModule.router);
router.use('/categories', categoriesModule.router);
router.use('/budgets', budgetsModule.router);
router.use('/goals', goalsModule.router);
router.use('/ai', aiModule.router);

export default router;
