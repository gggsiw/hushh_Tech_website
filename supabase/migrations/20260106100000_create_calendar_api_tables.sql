-- Hushh Calendar API Database Tables
-- Production-ready schema for universal AI-powered calendar service

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Calendar API Keys Table
-- Stores hashed API keys for authentication
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix VARCHAR(12) NOT NULL, -- First 8 chars for identification (hca_xxxx)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name VARCHAR(255) NOT NULL,
    description TEXT,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    allowed_origins TEXT[] DEFAULT ARRAY[]::TEXT[],
    scopes TEXT[] DEFAULT ARRAY['parse', 'events:read', 'events:write', 'chat']::TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookup
CREATE INDEX IF NOT EXISTS idx_calendar_api_keys_prefix ON public.calendar_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_calendar_api_keys_user_id ON public.calendar_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_api_keys_active ON public.calendar_api_keys(is_active) WHERE is_active = true;

-- ============================================
-- Calendar User Tokens Table
-- Stores encrypted Google OAuth tokens per user
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES public.calendar_api_keys(id) ON DELETE CASCADE,
    user_identifier VARCHAR(255) NOT NULL, -- External user ID from the app
    google_access_token_encrypted TEXT NOT NULL,
    google_refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    google_calendar_id VARCHAR(255) DEFAULT 'primary',
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique user per API key
    CONSTRAINT unique_user_per_api_key UNIQUE (api_key_id, user_identifier)
);

-- Indexes for token lookup
CREATE INDEX IF NOT EXISTS idx_calendar_user_tokens_api_key ON public.calendar_user_tokens(api_key_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_tokens_user ON public.calendar_user_tokens(user_identifier);

-- ============================================
-- Calendar Webhook Subscriptions Table
-- Manages webhook endpoints for event notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES public.calendar_api_keys(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT ARRAY['event.created', 'event.updated', 'event.deleted']::TEXT[],
    secret TEXT NOT NULL, -- HMAC secret for signature verification
    headers JSONB DEFAULT '{}'::JSONB, -- Custom headers to send with webhook
    is_active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for webhook lookup
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_api_key ON public.calendar_webhook_subscriptions(api_key_id);
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_active ON public.calendar_webhook_subscriptions(is_active) WHERE is_active = true;

-- ============================================
-- Calendar Usage Logs Table
-- Tracks API usage for analytics and billing
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES public.calendar_api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_identifier VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    error_code VARCHAR(50),
    error_message TEXT,
    gemini_tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning for usage logs (by month)
CREATE INDEX IF NOT EXISTS idx_calendar_usage_created ON public.calendar_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_usage_api_key ON public.calendar_usage_logs(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_usage_endpoint ON public.calendar_usage_logs(endpoint, created_at DESC);

-- ============================================
-- Calendar Parsed Events Cache Table
-- Caches parsed NL results for faster responses
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_parsed_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    input_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 of input text
    input_text TEXT NOT NULL,
    parsed_result JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    hit_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Index for cache lookup
CREATE INDEX IF NOT EXISTS idx_calendar_cache_hash ON public.calendar_parsed_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_calendar_cache_expires ON public.calendar_parsed_cache(expires_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.calendar_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_parsed_cache ENABLE ROW LEVEL SECURITY;

-- API Keys: Users can only see their own keys
CREATE POLICY "Users can view own API keys"
    ON public.calendar_api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
    ON public.calendar_api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
    ON public.calendar_api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
    ON public.calendar_api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- Service role has full access (for API server)
CREATE POLICY "Service role full access to API keys"
    ON public.calendar_api_keys FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to user tokens"
    ON public.calendar_user_tokens FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to webhooks"
    ON public.calendar_webhook_subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to usage logs"
    ON public.calendar_usage_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to cache"
    ON public.calendar_parsed_cache FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calendar_api_keys_updated
    BEFORE UPDATE ON public.calendar_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_calendar_user_tokens_updated
    BEFORE UPDATE ON public.calendar_user_tokens
    FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_calendar_webhooks_updated
    BEFORE UPDATE ON public.calendar_webhook_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_calendar_updated_at();

-- ============================================
-- Cleanup function for expired cache
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_calendar_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.calendar_parsed_cache
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.calendar_api_keys IS 'Stores hashed API keys for Calendar API authentication';
COMMENT ON TABLE public.calendar_user_tokens IS 'Stores encrypted Google OAuth tokens for calendar access';
COMMENT ON TABLE public.calendar_webhook_subscriptions IS 'Manages webhook subscriptions for calendar event notifications';
COMMENT ON TABLE public.calendar_usage_logs IS 'Tracks API usage for analytics, rate limiting, and billing';
COMMENT ON TABLE public.calendar_parsed_cache IS 'Caches NL parsing results for faster responses';
