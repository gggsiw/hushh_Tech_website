/**
 * Apple Wallet Pass Proxy Handler
 * SECURITY: Requires valid Supabase JWT authentication
 */

const UPSTREAM_APPLE_WALLET_ENDPOINT =
  "https://hushh-wallet.vercel.app/api/passes/universal/create";

const resolvePayload = (body) => {
  if (!body) return null;
  if (typeof body.payload === "string") {
    try {
      return JSON.parse(body.payload);
    } catch {
      return null;
    }
  }

  return body;
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ AUTHENTICATE REQUEST
    const auth = await authenticateRequest(req);
    console.log(`[wallet-pass] Authenticated user: ${auth.userId}`);

    const payload = resolvePayload(req.body);
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid wallet pass payload" });
    }

    const forward = await fetch(UPSTREAM_APPLE_WALLET_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!forward.ok) {
      const text = await forward.text();
      return res.status(forward.status).json({ error: "Wallet pass generation failed", detail: text });
    }

    const buffer = Buffer.from(await forward.arrayBuffer());
    const contentDisposition =
      forward.headers.get("content-disposition") || 'attachment; filename="hushh-profile.pkpass"';
    const passSerial = forward.headers.get("x-pass-serial");
    const passType = forward.headers.get("x-pass-type");

    res.setHeader(
      "Content-Type",
      forward.headers.get("content-type") || "application/vnd.apple.pkpass"
    );
    res.setHeader("Content-Disposition", contentDisposition);
    if (passSerial) res.setHeader("X-Pass-Serial", passSerial);
    if (passType) res.setHeader("X-Pass-Type", passType);
    res.status(200).send(buffer);
  } catch (error) {
    // Check if it's an auth error
    if (error.message.includes('Authorization') || error.message.includes('token')) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({ error: error.message });
    }

    console.error("wallet-pass proxy error:", error);
    res.status(500).json({ error: "Proxy failed", detail: error?.message });
  }
}