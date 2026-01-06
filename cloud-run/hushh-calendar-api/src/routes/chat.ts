/**
 * Chat route - Conversational AI interface for calendar
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { geminiService } from '../services/gemini';
import { logger } from '../utils/logger';

export const chatRouter = Router();

const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

/**
 * POST /api/v1/chat
 * Conversational AI interface for calendar management
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validation = chatRequestSchema.safeParse(req.body);
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
    
    const { message, context, conversationHistory } = validation.data;
    
    logger.info('Processing chat message', {
      apiKeyId: req.apiKey?.id,
      messageLength: message.length,
    });
    
    // Generate response using Gemini
    const response = await geminiService.generateChatResponse(
      message,
      context || 'No calendar context provided',
      conversationHistory
    );
    
    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error('Chat error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHAT_ERROR',
        message: 'Failed to process chat message',
      },
    });
  }
});
