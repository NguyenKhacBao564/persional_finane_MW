import { Router } from 'express';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { chatMessageSchema } from './validation.js';
import * as chatbotService from './service.js';
import { authGuard } from '../auth/middleware.js';

const router = Router();

router.post('/message', authGuard, async (req: Request, res: Response) => {
  try {
    const input = chatMessageSchema.parse(req.body);
    const result = await chatbotService.sendMessage(req.user!.id, input);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: error.errors.map(e => e.message).join(', '),
          code: 'VALIDATION_ERROR',
        },
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'An unexpected error occurred',
        },
      });
    }
  }
});

router.get('/advice', authGuard, async (req: Request, res: Response) => {
  try {
    const result = await chatbotService.getFinancialAdvice(req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: 'An unexpected error occurred',
        },
      });
    }
  }
});

export default { router };
