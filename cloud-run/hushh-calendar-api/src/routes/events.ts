/**
 * Events route - Google Calendar CRUD operations
 */

import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { z } from 'zod';
import { logger } from '../utils/logger';

export const eventsRouter = Router();

// Event creation schema
const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  startDateTime: z.string(),
  endDateTime: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  reminders: z.array(z.object({
    method: z.enum(['email', 'popup']),
    minutes: z.number().min(0).max(40320),
  })).optional(),
  calendarId: z.string().optional().default('primary'),
});

// Get OAuth2 client with user tokens
function getOAuth2Client(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

/**
 * POST /api/v1/events
 * Create a new calendar event
 */
eventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.userToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER_TOKEN',
          message: 'User calendar authorization required. Include X-User-Identifier header.',
        },
      });
      return;
    }
    
    const validation = createEventSchema.safeParse(req.body);
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
    
    const { title, startDateTime, endDateTime, description, location, attendees, reminders, calendarId } = validation.data;
    
    const auth = getOAuth2Client(req.userToken.googleAccessToken, req.userToken.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title,
        description,
        location,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        attendees: attendees?.map(email => ({ email })),
        reminders: reminders ? {
          useDefault: false,
          overrides: reminders.map(r => ({ method: r.method, minutes: r.minutes })),
        } : undefined,
      },
    });
    
    logger.info('Created calendar event', { eventId: event.data.id });
    
    res.status(201).json({
      success: true,
      data: {
        eventId: event.data.id,
        htmlLink: event.data.htmlLink,
        event: event.data,
      },
    });
  } catch (err) {
    logger.error('Create event error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_EVENT_ERROR',
        message: 'Failed to create calendar event',
      },
    });
  }
});

/**
 * GET /api/v1/events
 * List calendar events
 */
eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.userToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER_TOKEN',
          message: 'User calendar authorization required',
        },
      });
      return;
    }
    
    const { timeMin, timeMax, maxResults, calendarId } = req.query;
    
    const auth = getOAuth2Client(req.userToken.googleAccessToken, req.userToken.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const events = await calendar.events.list({
      calendarId: (calendarId as string) || 'primary',
      timeMin: (timeMin as string) || new Date().toISOString(),
      timeMax: timeMax as string,
      maxResults: parseInt(maxResults as string) || 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    res.json({
      success: true,
      data: {
        events: events.data.items,
        nextPageToken: events.data.nextPageToken,
      },
    });
  } catch (err) {
    logger.error('List events error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_EVENTS_ERROR',
        message: 'Failed to list calendar events',
      },
    });
  }
});

/**
 * GET /api/v1/events/:eventId
 * Get a specific event
 */
eventsRouter.get('/:eventId', async (req: Request, res: Response) => {
  try {
    if (!req.userToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER_TOKEN',
          message: 'User calendar authorization required',
        },
      });
      return;
    }
    
    const { eventId } = req.params;
    const { calendarId } = req.query;
    
    const auth = getOAuth2Client(req.userToken.googleAccessToken, req.userToken.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event = await calendar.events.get({
      calendarId: (calendarId as string) || 'primary',
      eventId,
    });
    
    res.json({
      success: true,
      data: event.data,
    });
  } catch (err) {
    logger.error('Get event error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EVENT_ERROR',
        message: 'Failed to get calendar event',
      },
    });
  }
});

/**
 * PATCH /api/v1/events/:eventId
 * Update an event
 */
eventsRouter.patch('/:eventId', async (req: Request, res: Response) => {
  try {
    if (!req.userToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER_TOKEN',
          message: 'User calendar authorization required',
        },
      });
      return;
    }
    
    const { eventId } = req.params;
    const { calendarId, ...updates } = req.body;
    
    const auth = getOAuth2Client(req.userToken.googleAccessToken, req.userToken.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event = await calendar.events.patch({
      calendarId: calendarId || 'primary',
      eventId,
      requestBody: {
        summary: updates.title,
        description: updates.description,
        location: updates.location,
        start: updates.startDateTime ? { dateTime: updates.startDateTime } : undefined,
        end: updates.endDateTime ? { dateTime: updates.endDateTime } : undefined,
      },
    });
    
    res.json({
      success: true,
      data: event.data,
    });
  } catch (err) {
    logger.error('Update event error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_EVENT_ERROR',
        message: 'Failed to update calendar event',
      },
    });
  }
});

/**
 * DELETE /api/v1/events/:eventId
 * Delete an event
 */
eventsRouter.delete('/:eventId', async (req: Request, res: Response) => {
  try {
    if (!req.userToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER_TOKEN',
          message: 'User calendar authorization required',
        },
      });
      return;
    }
    
    const { eventId } = req.params;
    const { calendarId } = req.query;
    
    const auth = getOAuth2Client(req.userToken.googleAccessToken, req.userToken.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    
    await calendar.events.delete({
      calendarId: (calendarId as string) || 'primary',
      eventId,
    });
    
    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err) {
    logger.error('Delete event error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_EVENT_ERROR',
        message: 'Failed to delete calendar event',
      },
    });
  }
});
