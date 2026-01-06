/**
 * Authentication middleware for Hushh Calendar API
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { logger } from '../utils/logger';

// Extend Request type to include API key info
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        userId: string;
        appName: string;
        rateLimit: number;
      };
      userToken?: {
        id: string;
        googleAccessToken: string;
        googleRefreshToken: string;
      };
    }
  }
}

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key is required',
        },
      });
      return;
    }
    
    // Validate API key against database
    const { data: apiKeys, error } = await supabase
      .from('calendar_api_keys')
      .select('id, key_hash, user_id, app_name, rate_limit, is_active')
      .eq('is_active', true);
    
    if (error) {
      logger.error('Database error validating API key:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to validate API key',
        },
      });
      return;
    }
    
    // Find matching API key
    let matchedKey = null;
    for (const key of apiKeys || []) {
      const isMatch = await bcrypt.compare(apiKey, key.key_hash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }
    
    if (!matchedKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or inactive API key',
        },
      });
      return;
    }
    
    // Attach API key info to request
    req.apiKey = {
      id: matchedKey.id,
      userId: matchedKey.user_id,
      appName: matchedKey.app_name,
      rateLimit: matchedKey.rate_limit,
    };
    
    // Get user token if user_identifier is provided
    const userIdentifier = req.headers['x-user-identifier'] as string;
    if (userIdentifier) {
      const { data: userToken } = await supabase
        .from('calendar_user_tokens')
        .select('id, google_access_token_encrypted, google_refresh_token_encrypted')
        .eq('api_key_id', matchedKey.id)
        .eq('user_identifier', userIdentifier)
        .single();
      
      if (userToken) {
        // Decrypt tokens (in production, use proper encryption)
        req.userToken = {
          id: userToken.id,
          googleAccessToken: userToken.google_access_token_encrypted,
          googleRefreshToken: userToken.google_refresh_token_encrypted,
        };
      }
    }
    
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}
