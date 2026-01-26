#!/bin/bash
# Test script for hushh-profile-search API
# Exact same functionality as the React app

SUPABASE_URL="https://ibsisfnjxeowvdtvgzff.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic2lzZm5qeGVvd3ZkdHZnemZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTk1NzgsImV4cCI6MjA4MDEzNTU3OH0.xAi4rEhCVSIFtcWvXoF5aPfTPWFtIvbT4ILfKnJRiIg"

echo "🔍 Testing Hushh Profile Search API..."
echo ""

# Test with sample data
curl -X POST "${SUPABASE_URL}/functions/v1/hushh-profile-search" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elon Musk",
    "email": "elon@tesla.com",
    "country": "United States",
    "contact": "+1234567890"
  }' | jq .

echo ""
echo "✅ Test complete!"
echo ""
echo "API Endpoint: ${SUPABASE_URL}/functions/v1/hushh-profile-search"
echo "Method: POST"
echo "Required fields: name, email"
echo "Optional fields: country, contact"
