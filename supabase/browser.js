import { createDatabase } from './adapter.js';

export async function connectMall() {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Supabase configuration unavailable');
  const config = await response.json();
  if (!window.supabase) throw new Error('Supabase SDK unavailable');
  const client = window.supabase.createClient(config.url, config.publishableKey, {
    // Keep socket heartbeats off the busy 3D render thread where workers exist.
    realtime: { worker: typeof Worker !== 'undefined' },
  });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    const result = await client.auth.signInAnonymously();
    // Public catalog still works if anonymous sign-ins have not been enabled yet.
    if (result.error) console.warn('Visitor stats need Anonymous Sign-Ins enabled:', result.error.message);
  }
  return { client, database: createDatabase(client) };
}
