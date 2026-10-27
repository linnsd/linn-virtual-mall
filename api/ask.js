// Vercel serverless function: the AI staff in the mall talk to Claude through here.
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
// Optional: ANTHROPIC_MODEL (default below) and ALLOWED_ORIGIN (e.g. https://mall.linn.com.mm).
import { reserveAiQuota } from '../lib/ai-quota.js';
import { parseAskMessages } from '../lib/ask-input.js';

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin && req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: "forbidden" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const msgs = parseAskMessages(req.body);
  if (!msgs) return res.status(400).json({ error: "bad_request" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "missing_api_key" });

  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  try {
    const quota = await reserveAiQuota(ip);
    if (!quota.allowed) {
      res.setHeader('Retry-After', String(quota.retryAfter));
      return res.status(429).json({ error: "rate_limited" });
    }
  } catch {
    // Fail closed: no paid upstream call without a shared reservation.
    return res.status(503).json({ error: "ai_temporarily_unavailable" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.timeout(20000),
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 600, messages: msgs }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: "upstream", type: j?.error?.type });
    if (!Array.isArray(j?.content)) return res.status(502).json({ error: "invalid_upstream_response" });
    const text = j.content.filter(c => c?.type === "text" && typeof c.text === "string").map(c => c.text).join("");
    if (!text.trim()) return res.status(502).json({ error: "invalid_upstream_response" });
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: "upstream_unreachable" });
  }
}
