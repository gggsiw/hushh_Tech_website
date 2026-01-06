/**
 * Gemini 2.0 Flash AI Service for Natural Language Parsing
 */

import { config } from '../config';
import { logger } from '../utils/logger';

// Event structure parsed from natural language
export interface ParsedEvent {
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    until?: string;
    count?: number;
  };
  reminders?: {
    method: 'email' | 'popup';
    minutes: number;
  }[];
  confidence: number;
}

export interface ParseResult {
  events: ParsedEvent[];
  rawInput: string;
  parsedAt: string;
}

const PARSE_PROMPT = `You are an AI assistant that parses natural language into calendar events.
Parse the user's input into structured calendar event(s).

Current date/time context: {{CURRENT_TIME}}
User's timezone: {{TIMEZONE}}

Rules:
1. Extract all events mentioned in the text
2. Infer reasonable times if not specified (e.g., "tomorrow" means the next calendar day)
3. For duration, default to 1 hour if not specified
4. Parse attendee emails if mentioned
5. Identify recurring patterns (daily, weekly, monthly, yearly)
6. Extract location if mentioned
7. Create a descriptive title if not explicitly stated

Respond ONLY with valid JSON in this exact format:
{
  "events": [
    {
      "title": "Event title",
      "startDateTime": "2024-01-15T10:00:00",
      "endDateTime": "2024-01-15T11:00:00",
      "description": "Optional description",
      "location": "Optional location",
      "attendees": ["email@example.com"],
      "recurrence": {
        "frequency": "weekly",
        "interval": 1,
        "until": "2024-06-15T23:59:59"
      },
      "reminders": [
        {"method": "popup", "minutes": 30}
      ],
      "confidence": 0.95
    }
  ]
}

User input: {{INPUT}}`;

export class GeminiService {
  private projectId: string;
  private location: string;
  
  constructor() {
    this.projectId = config.gcp.projectId;
    this.location = config.gcp.location;
  }
  
  async parseNaturalLanguage(
    input: string,
    timezone: string = 'UTC'
  ): Promise<ParseResult> {
    try {
      const currentTime = new Date().toISOString();
      
      const prompt = PARSE_PROMPT
        .replace('{{CURRENT_TIME}}', currentTime)
        .replace('{{TIMEZONE}}', timezone)
        .replace('{{INPUT}}', input);
      
      // Call Vertex AI Gemini 2.0 Flash
      const response = await this.callGemini(prompt);
      
      // Parse the JSON response
      const parsed = JSON.parse(response);
      
      return {
        events: parsed.events,
        rawInput: input,
        parsedAt: currentTime,
      };
    } catch (err) {
      logger.error('Gemini parsing error:', err);
      throw new Error('Failed to parse natural language input');
    }
  }
  
  async generateChatResponse(
    message: string,
    context: string,
    conversationHistory: { role: string; content: string }[]
  ): Promise<string> {
    try {
      const systemPrompt = `You are a helpful calendar assistant. You can help users:
- Schedule events and meetings
- Find free time slots
- Manage their calendar
- Set reminders

Context about user's calendar:
${context}

Respond naturally and helpfully. If the user wants to create an event, confirm the details.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ];
      
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      return await this.callGemini(prompt);
    } catch (err) {
      logger.error('Gemini chat error:', err);
      throw new Error('Failed to generate chat response');
    }
  }
  
  private async callGemini(prompt: string): Promise<string> {
    // Use fetch to call Vertex AI REST API
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.0-flash:generateContent`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAccessToken()}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini');
    }
    
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || 
                      text.match(/```\n?([\s\S]*?)\n?```/);
    
    return jsonMatch ? jsonMatch[1].trim() : text.trim();
  }
  
  private async getAccessToken(): Promise<string> {
    // In Cloud Run, use the metadata server to get an access token
    try {
      const response = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        {
          headers: { 'Metadata-Flavor': 'Google' },
        }
      );
      
      if (response.ok) {
        const data = await response.json() as { access_token: string };
        return data.access_token;
      }
    } catch {
      // Not running in GCP, use default credentials
    }
    
    // Fallback: use gcloud auth (for local development)
    const { execSync } = require('child_process');
    try {
      return execSync('gcloud auth print-access-token').toString().trim();
    } catch {
      throw new Error('Failed to get access token. Ensure you are authenticated with gcloud.');
    }
  }
}

export const geminiService = new GeminiService();
