// Vercel serverless function: the AI staff in the mall talk to Claude through here.
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
// Optional: ANTHROPIC_MODEL (default below) and ALLOWED_ORIGIN (e.g. https://mall.linn.com.mm).
const hits = new Map(); // simple per-instance rate limit (best effort on serverless)

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin && req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: "forbidden" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "missing_api_key" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now(), win = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (win.length >= 12) return res.status(429).json({ error: "rate_limited" });
  win.push(now); hits.set(ip, win);

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const msgs = (Array.isArray(body?.messages) ? body.messages : []).slice(-9)
    .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 14000) }));
  const total = msgs.reduce((n, m) => n + m.content.length, 0);
  if (!msgs.length || msgs[0].role !== "user" || total > 24000 || !/Linn IT, Mobile & Electronics Mart/.test(msgs[0].content))
    return res.status(400).json({ error: "bad_request" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 600, messages: msgs }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: "upstream", type: j?.error?.type });
    const text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: "upstream_unreachable" });
  }
}
