import { createHmac } from 'node:crypto';

// Server module only. Never import this into the browser entry point.
export async function reserveAiQuota(ip, { env = process.env, fetchFn = fetch } = {}) {
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const url = env.SUPABASE_URL;
  if (!url || !key) throw new Error('AI quota configuration unavailable');
  const headers = { apikey: key, 'content-type': 'application/json' };
  if (!key.startsWith('sb_secret_')) {
    let role;
    try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role; } catch { }
    if (role !== 'service_role') throw new Error('AI quota requires a server secret');
    headers.Authorization = `Bearer ${key}`;
  }
  const ipHash = createHmac('sha256', env.AI_RATE_LIMIT_SALT || key).update(ip || 'unknown').digest('hex');
  const response = await fetchFn(new URL('/rest/v1/rpc/mall_reserve_ai_request', url), {
    method: 'POST', headers, body: JSON.stringify({ ip_hash: ipHash }), signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('AI quota service unavailable');
  const result = await response.json();
  if (result?.allowed === true) return { allowed: true };
  if (result?.allowed !== false || !Number.isInteger(result.retry_after) || result.retry_after < 1 || result.retry_after > 86400) throw new Error('Invalid AI quota response');
  return { allowed: false, retryAfter: result.retry_after };
}
