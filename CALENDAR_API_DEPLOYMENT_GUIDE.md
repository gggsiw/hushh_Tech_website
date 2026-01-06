# Hushh Calendar API - Deployment Guide

## Overview
Production-ready universal AI-powered calendar service using Gemini 2.0 Flash for natural language parsing.

## Project Details
- **GCP Project:** hushone-app
- **Supabase Project:** ibsisfnjxeowvdtvgzff
- **Region:** us-central1

## Files Created

### API Source Code (`cloud-run/hushh-calendar-api/`)
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `Dockerfile` - Production Docker build
- `src/index.ts` - Main Express app
- `src/config/index.ts` - Configuration
- `src/utils/logger.ts` - Winston logging
- `src/middleware/auth.ts` - API key authentication
- `src/middleware/rateLimiter.ts` - Rate limiting
- `src/services/gemini.ts` - Gemini 2.0 Flash integration
- `src/routes/health.ts` - Health endpoints
- `src/routes/parse.ts` - NL parsing
- `src/routes/events.ts` - Calendar CRUD
- `src/routes/chat.ts` - Conversational AI
- `src/routes/batch.ts` - Bulk operations
- `src/routes/webhooks.ts` - Webhook management

### Database Migration
- `supabase/migrations/20260106100000_create_calendar_api_tables.sql`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/parse` | POST | Parse natural language to events |
| `/api/v1/events` | GET/POST/PATCH/DELETE | Calendar CRUD |
| `/api/v1/chat` | POST | Conversational AI |
| `/api/v1/batch/parse` | POST | Bulk parsing |
| `/api/v1/webhooks` | GET/POST/DELETE | Webhook management |

## Manual Deployment Steps

### 1. Apply Database Migration
```bash
# Run in Supabase SQL Editor:
# Copy content from supabase/migrations/20260106100000_create_calendar_api_tables.sql
```

### 2. Build and Deploy to Cloud Run
```bash
# Navigate to API directory
cd cloud-run/hushh-calendar-api

# Build locally first
npm install
npm run build

# Deploy using Docker
gcloud run deploy hushh-calendar-api \
  --source . \
  --region us-central1 \
  --project hushone-app \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars "NODE_ENV=production,SUPABASE_URL=https://ibsisfnjxeowvdtvgzff.supabase.co,GCP_PROJECT_ID=hushone-app"
```

### 3. Set Environment Variables
After deployment, update secrets in GCP Secret Manager:
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `ENCRYPTION_KEY` - 32-byte key for token encryption

## Testing the API

### Health Check
```bash
curl https://hushh-calendar-api-XXXXX.run.app/health
```

### Parse Natural Language
```bash
curl -X POST https://hushh-calendar-api-XXXXX.run.app/api/v1/parse \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Schedule a meeting with John tomorrow at 3pm"}'
```

## Features
- Gemini 2.0 Flash for NL understanding
- Google Calendar API integration
- Rate limiting (60/min, 10000/day by default)
- Webhook notifications
- Multi-tenant support
- Encrypted token storage
- Usage logging

## Database Tables
- `calendar_api_keys` - API key management
- `calendar_user_tokens` - Encrypted OAuth tokens
- `calendar_webhook_subscriptions` - Webhook config
- `calendar_usage_logs` - API analytics
- `calendar_parsed_cache` - NL parsing cache
