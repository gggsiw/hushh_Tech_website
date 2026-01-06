/**
 * Google Calendar API Client with Service Account Authentication
 * 
 * Uses Google Service Account with Domain-Wide Delegation to create calendar events
 * as any @hushh.ai user with Google Meet links auto-generated
 */

// Base64URL encoding utilities
function base64urlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Create a signed JWT for Google Service Account authentication
 */
async function createSignedJWT(
  serviceAccountEmail: string,
  privateKey: string,
  userToImpersonate: string,
  scopes: string[]
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  // JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // JWT Payload (Claims)
  const payload = {
    iss: serviceAccountEmail,
    sub: userToImpersonate, // User to impersonate (Domain-Wide Delegation)
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
    scope: scopes.join(" "),
  };

  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Parse private key and sign
  const privateKeyPem = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));

  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Get an access token using the Service Account JWT
 */
async function getCalendarAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  userToImpersonate: string
): Promise<string> {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const signedJwt = await createSignedJWT(
    serviceAccountEmail,
    privateKey,
    userToImpersonate,
    scopes
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get calendar access token:", error);
    throw new Error(`Failed to get calendar access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Parse natural language date/time to ISO format
 */
function parseDateTime(text: string): { startDateTime: string; endDateTime: string } {
  const now = new Date();
  let startDate = new Date();
  let duration = 30; // Default 30 minutes

  // Check for "tomorrow"
  if (text.toLowerCase().includes('tomorrow')) {
    startDate.setDate(startDate.getDate() + 1);
  }
  
  // Check for "next week"
  if (text.toLowerCase().includes('next week')) {
    startDate.setDate(startDate.getDate() + 7);
  }

  // Check for specific day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (text.toLowerCase().includes(days[i])) {
      const currentDay = now.getDay();
      const daysUntil = (i - currentDay + 7) % 7 || 7;
      startDate.setDate(now.getDate() + daysUntil);
      break;
    }
  }

  // Parse time (e.g., "3 PM", "15:00", "3:30 PM")
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    
    startDate.setHours(hours, minutes, 0, 0);
  } else {
    // Default to 10 AM if no time specified
    startDate.setHours(10, 0, 0, 0);
  }

  // Check for duration
  const durationMatch = text.match(/(\d+)\s*(hour|hr|minute|min)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('hour') || unit === 'hr') {
      duration = value * 60;
    } else {
      duration = value;
    }
  }

  const endDate = new Date(startDate.getTime() + duration * 60000);

  return {
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
  };
}

/**
 * Extract email addresses from text
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

/**
 * Create a calendar event with Google Meet
 */
export interface CalendarEventParams {
  message: string;       // Natural language input
  organizerEmail: string; // Who is creating the event (must be @hushh.ai)
  title?: string;        // Optional explicit title
}

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  meetLink?: string;
  summary?: string;
  startTime?: string;
  endTime?: string;
  attendees?: string[];
  error?: string;
}

export async function createCalendarEvent(params: CalendarEventParams): Promise<CalendarEventResult> {
  try {
    // Get environment variables
    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");

    if (!serviceAccountEmail || !privateKey) {
      console.error("Missing Google Service Account credentials");
      return {
        success: false,
        error: "Calendar service not configured. Missing credentials.",
      };
    }

    // Handle newlines in private key
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

    // Parse the message
    const { startDateTime, endDateTime } = parseDateTime(params.message);
    const attendees = extractEmails(params.message);
    
    // Generate title from message or use provided
    let summary = params.title || `Meeting`;
    if (!params.title) {
      // Try to extract a meaningful title
      if (attendees.length > 0) {
        const attendeeNames = attendees.map(e => e.split('@')[0]).join(', ');
        summary = `Meeting with ${attendeeNames}`;
      }
    }

    console.log(`Creating calendar event: ${summary}`);
    console.log(`Start: ${startDateTime}, End: ${endDateTime}`);
    console.log(`Attendees: ${attendees.join(', ')}`);
    console.log(`Organizer: ${params.organizerEmail}`);

    // Get access token (impersonating the organizer)
    const accessToken = await getCalendarAccessToken(
      serviceAccountEmail,
      formattedPrivateKey,
      params.organizerEmail
    );

    // Create the event with Google Meet
    const event = {
      summary,
      description: `Scheduled via Hushh AI\n\nOriginal request: "${params.message}"`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Kolkata',
      },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `hushh-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    // Call Google Calendar API
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Calendar API error:", error);
      return {
        success: false,
        error: `Failed to create calendar event: ${error}`,
      };
    }

    const result = await response.json();
    console.log("Calendar event created:", result.id);

    // Extract Google Meet link
    const meetLink = result.conferenceData?.entryPoints?.find(
      (e: { entryPointType: string }) => e.entryPointType === 'video'
    )?.uri || result.hangoutLink;

    return {
      success: true,
      eventId: result.id,
      htmlLink: result.htmlLink,
      meetLink,
      summary: result.summary,
      startTime: result.start?.dateTime,
      endTime: result.end?.dateTime,
      attendees,
    };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format event result for chat display
 */
export function formatEventResponse(result: CalendarEventResult): string {
  if (!result.success) {
    return `❌ Sorry, I couldn't schedule the meeting. ${result.error}`;
  }

  const startDate = new Date(result.startTime!);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  const formattedDate = startDate.toLocaleDateString('en-US', options);

  let response = `✅ **Meeting Scheduled!**\n\n`;
  response += `📅 **${result.summary}**\n`;
  response += `🕐 ${formattedDate}\n`;
  
  if (result.attendees && result.attendees.length > 0) {
    response += `👥 Attendees: ${result.attendees.join(', ')}\n`;
  }
  
  if (result.meetLink) {
    response += `\n🔗 **Google Meet:** [Join Meeting](${result.meetLink})\n`;
  }
  
  if (result.htmlLink) {
    response += `\n📆 [View in Google Calendar](${result.htmlLink})`;
  }

  response += `\n\n*Calendar invites have been sent to all attendees.*`;

  return response;
}
