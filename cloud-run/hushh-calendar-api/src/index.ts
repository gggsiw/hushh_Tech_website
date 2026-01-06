/**
 * Hushh Calendar API - Universal AI-powered calendar service
 * Production-ready service with Gemini 2.0 Flash for NL parsing
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { logger } from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { parseRouter } from './routes/parse';
import { eventsRouter } from './routes/events';
import { chatRouter } from './routes/chat';
import { batchRouter } from './routes/batch';
import { webhooksRouter } from './routes/webhooks';
import { healthRouter } from './routes/health';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check (no auth required)
app.use('/health', healthRouter);

// API v1 routes with authentication and rate limiting
const apiV1 = express.Router();
apiV1.use(authMiddleware);
apiV1.use(rateLimiter);

apiV1.use('/parse', parseRouter);
apiV1.use('/events', eventsRouter);
apiV1.use('/chat', chatRouter);
apiV1.use('/batch', batchRouter);
apiV1.use('/webhooks', webhooksRouter);

app.use('/api/v1', apiV1);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logger.info(`Hushh Calendar API running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export { app };
