// Public browser configuration only. Never add a secret/service-role key here.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Cache-Control', 'no-store');
  const config = {
    url: process.env.SUPABASE_URL || 'https://purmadxwvtruxdtrsutg.supabase.co',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_F1HVnU352beJCJgPeUonow_LQw3j8gJ',
  };
  if (!config.publishableKey.startsWith('sb_publishable_')) {
    return res.status(503).json({ error: 'invalid_public_configuration' });
  }
  return res.status(200).json(config);
}

