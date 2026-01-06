/**
 * Webhooks route - Subscribe to calendar event notifications
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../utils/logger';

export const webhooksRouter = Router();

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'event.created',
    'event.updated', 
    'event.deleted',
    'event.reminder',
  ])).min(1),
  secret: z.string().optional(),
});

/**
 * POST /api/v1/webhooks
 * Register a webhook subscription
 */
webhooksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validation = webhookSchema.safeParse(req.body);
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
    
    const { url, events, secret } = validation.data;
    const webhookId = uuidv4();
    const webhookSecret = secret || uuidv4();
    
    // Store webhook in database
    const { error } = await supabase
      .from('calendar_webhook_subscriptions')
      .insert({
        id: webhookId,
        api_key_id: req.apiKey?.id,
        url,
        events,
        secret: webhookSecret,
        is_active: true,
      });
    
    if (error) {
      logger.error('Failed to create webhook:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to register webhook',
        },
      });
      return;
    }
    
    logger.info('Webhook registered', { webhookId, events });
    
    res.status(201).json({
      success: true,
      data: {
        webhookId,
        url,
        events,
        secret: webhookSecret,
      },
    });
  } catch (err) {
    logger.error('Webhook registration error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: 'Failed to register webhook',
      },
    });
  }
});

/**
 * GET /api/v1/webhooks
 * List webhook subscriptions
 */
webhooksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { data: webhooks, error } = await supabase
      .from('calendar_webhook_subscriptions')
      .select('id, url, events, is_active, created_at')
      .eq('api_key_id', req.apiKey?.id);
    
    if (error) {
      logger.error('Failed to list webhooks:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to list webhooks',
        },
      });
      return;
    }
    
    res.json({
      success: true,
      data: webhooks,
    });
  } catch (err) {
    logger.error('List webhooks error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: 'Failed to list webhooks',
      },
    });
  }
});

/**
 * DELETE /api/v1/webhooks/:webhookId
 * Delete a webhook subscription
 */
webhooksRouter.delete('/:webhookId', async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    
    const { error } = await supabase
      .from('calendar_webhook_subscriptions')
      .delete()
      .eq('id', webhookId)
      .eq('api_key_id', req.apiKey?.id);
    
    if (error) {
      logger.error('Failed to delete webhook:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete webhook',
        },
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (err) {
    logger.error('Delete webhook error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: 'Failed to delete webhook',
      },
    });
  }
});
