import { Router } from 'express';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { chatMessageSchema } from './validation.js';
import * as chatbotService from './service.js';
import { authGuard } from '../auth/middleware.js';
import { isGeminiConfigured } from '../../services/geminiClient.js';

const router = Router();

/**
 * GET /api/chatbot/status - Check if AI chatbot is available
 */
router.get('/status', (_req: Request, res: Response) => {
  const configured = isGeminiConfigured();
  res.status(200).json({
    success: true,
    data: {
      available: configured,
      message: configured 
        ? 'AI chatbot is available' 
        : 'AI chatbot is not configured. Please contact the administrator.',
    },
  });
});

router.post('/message', authGuard, async (req: Request, res: Response) => {
  try {
    // Check if AI is configured
    if (!isGeminiConfigured()) {
      res.status(503).json({
        success: false,
        error: {
          message: 'AI chatbot is not configured. Please contact the administrator to set up the AI service.',
          code: 'AI_NOT_CONFIGURED',
        },
      });
      return;
    }

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
      // Check if it's an AI configuration error
      if (error.message.includes('not configured')) {
        res.status(503).json({
          success: false,
          error: {
            message: error.message,
            code: 'AI_NOT_CONFIGURED',
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: error.message,
          },
        });
      }
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
    // Check if AI is configured
    if (!isGeminiConfigured()) {
      res.status(503).json({
        success: false,
        error: {
          message: 'AI chatbot is not configured. Please contact the administrator to set up the AI service.',
          code: 'AI_NOT_CONFIGURED',
        },
      });
      return;
    }

    const result = await chatbotService.getFinancialAdvice(req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's an AI configuration error
      if (error.message.includes('not configured')) {
        res.status(503).json({
          success: false,
          error: {
            message: error.message,
            code: 'AI_NOT_CONFIGURED',
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: error.message,
          },
        });
      }
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
