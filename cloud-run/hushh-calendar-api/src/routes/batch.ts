/**
 * Batch route - Bulk calendar operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { geminiService } from '../services/gemini';
import { logger } from '../utils/logger';

export const batchRouter = Router();

const batchParseSchema = z.object({
  texts: z.array(z.string().min(1).max(5000)).min(1).max(50),
  timezone: z.string().optional().default('UTC'),
});

/**
 * POST /api/v1/batch/parse
 * Parse multiple natural language texts into events
 */
batchRouter.post('/parse', async (req: Request, res: Response) => {
  try {
    const validation = batchParseSchema.safeParse(req.body);
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
    
    const { texts, timezone } = validation.data;
    
    logger.info('Batch parsing', {
      apiKeyId: req.apiKey?.id,
      count: texts.length,
    });
    
    // Parse all texts in parallel
    const results = await Promise.allSettled(
      texts.map(text => geminiService.parseNaturalLanguage(text, timezone))
    );
    
    const parsed = results.map((result, index) => ({
      index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason?.message : null,
    }));
    
    res.json({
      success: true,
      data: {
        total: texts.length,
        successful: parsed.filter(p => p.success).length,
        failed: parsed.filter(p => !p.success).length,
        results: parsed,
      },
    });
  } catch (err) {
    logger.error('Batch parse error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_PARSE_ERROR',
        message: 'Failed to process batch parse request',
      },
    });
  }
});
