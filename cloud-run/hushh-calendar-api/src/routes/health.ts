/**
 * Health check route for Hushh Calendar API
 */

import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'hushh-calendar-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_req: Request, res: Response) => {
  // Add any readiness checks here (DB connection, etc.)
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});
