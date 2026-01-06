/**
 * Parse route - Natural language to structured calendar events
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { geminiService } from '../services/gemini';
import { logger } from '../utils/logger';

export const parseRouter = Router();

// Request validation schema
const parseRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  timezone: z.string().optional().default('UTC'),
  locale: z.string().optional().default('en-US'),
});

/**
 * POST /api/v1/parse
 * Parse natural language text into structured calendar events
 */
parseRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validation = parseRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.errors,
        },
      });
      return;
    }
    
    const { text, timezone, locale } = validation.data;
    
    logger.info('Parsing natural language input', {
      apiKeyId: req.apiKey?.id,
      textLength: text.length,
      timezone,
    });
    
    // Parse using Gemini AI
    const result = await geminiService.parseNaturalLanguage(text, timezone);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('Parse error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse natural language input',
      },
    });
  }
});
