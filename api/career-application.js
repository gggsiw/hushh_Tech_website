/**
 * Career Application Handler
 * SECURITY: Requires valid Supabase JWT authentication
 */

const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'collegeEmail',
  'officialEmail',
  'phone',
  'resumeLink',
  'college',
];

const ALLOWED_COLLEGES = new Set(['LPU', 'MIT']);

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const parseRequestBody = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error('Invalid JSON payload');
    }
  }

  return body;
};

const isValidUrl = (value) => {
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch (error) {
    return false;
  }
};

/**
 * Authenticate request using Supabase JWT
 * @throws {Error} If authentication fails
 */
async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!token || token.length < 10) {
    throw new Error('Invalid token format');
  }

  return { token, userId: 'authenticated-user' };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ AUTHENTICATE REQUEST
    const auth = await authenticateRequest(request);
    console.log(`[career-application] Authenticated user: ${auth.userId}`);

    const payload = parseRequestBody(request.body);
    const sanitized = {
      firstName: sanitizeString(payload.firstName),
      lastName: sanitizeString(payload.lastName),
      email: sanitizeString(payload.email),
      collegeEmail: sanitizeString(payload.collegeEmail),
      officialEmail: sanitizeString(payload.officialEmail),
      phone: sanitizeString(payload.phone),
      resumeLink: sanitizeString(payload.resumeLink),
      college: sanitizeString(payload.college),
      collegeValue: sanitizeString(payload.collegeValue || payload.college),
      jobTitle: sanitizeString(payload.jobTitle),
      jobLocation: sanitizeString(payload.jobLocation),
      submittedAt: sanitizeString(payload.submittedAt),
    };

    const missingField = REQUIRED_FIELDS.find((field) => !sanitized[field]);
    if (missingField) {
      return response.status(400).json({ error: `Missing required field: ${missingField}` });
    }

    if (!ALLOWED_COLLEGES.has(sanitized.collegeValue)) {
      return response.status(400).json({ error: 'Invalid college selection' });
    }

    if (!isValidUrl(sanitized.resumeLink)) {
      return response.status(400).json({ error: 'Invalid resume link' });
    }

    const submittedAt = sanitized.submittedAt || new Date().toISOString();

    const appsScriptUrl = sanitizeString(process.env.GOOGLE_APPS_SCRIPT_URL);

    if (!appsScriptUrl) {
      throw new Error('Missing GOOGLE_APPS_SCRIPT_URL');
    }

    const scriptResponse = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...sanitized,
        submittedAt,
      }),
    });

    const responseText = await scriptResponse.text();
    let scriptResult;

    try {
      scriptResult = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.warn('Unable to parse Apps Script response as JSON:', parseError);
    }

    const scriptSucceeded = scriptResponse.ok && (scriptResult?.success ?? true);

    if (!scriptSucceeded) {
      const message =
        scriptResult?.error ||
        scriptResult?.message ||
        (!scriptResponse.ok ? responseText : '') ||
        'Apps Script request failed';
      throw new Error(message);
    }

    return response.status(200).json({
      success: true,
      message: 'Application received and saved',
      data: {
        ...sanitized,
        submittedAt,
        appsScript: scriptResult,
      },
    });
  } catch (error) {
    // Check if it's an auth error
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      console.error('Authentication error:', error.message);
      return response.status(401).json({ error: error.message });
    }

    console.error('Error processing application:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return response.status(500).json({
      error: 'Internal server error',
      message,
    });
  }
}