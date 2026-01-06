/**
 * Configuration for Hushh Calendar API
 */

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  
  // Google Cloud configuration
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || 'hushone-app',
    location: process.env.GCP_LOCATION || 'us-central1',
  },
  
  // Redis configuration (Upstash or Cloud Memorystore)
  redis: {
    url: process.env.REDIS_URL || '',
    token: process.env.REDIS_TOKEN || '',
  },
  
  // Rate limiting
  rateLimit: {
    defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT || '1000'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
  
  // Allowed CORS origins
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://hushh.ai,https://www.hushh.ai,http://localhost:3000,http://localhost:5173').split(','),
  
  // Encryption key for tokens
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  
  // JWT secret for API keys
  jwtSecret: process.env.JWT_SECRET || '',
};

// Validate required configuration
export function validateConfig(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'ENCRYPTION_KEY',
    'JWT_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
