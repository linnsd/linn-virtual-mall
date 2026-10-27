import { createDatabase } from './adapter.js';
import { hasOAuthError, isRecoveryReturn } from './auth.js';

export async function connectMall() {
  const response = await fetch('/api/config');
  if (!response.ok) throw new Error('Supabase configuration unavailable');
  const config = await response.json();
  if (!window.supabase) throw new Error('Supabase SDK unavailable');
  const recovery = { requested: isRecoveryReturn(window.location.href), error: hasOAuthError(window.location.href), verified: false };
  const client = window.supabase.createClient(config.url, config.publishableKey, {
    // Keep socket heartbeats off the busy 3D render thread where workers exist.
    realtime: { worker: typeof Worker !== 'undefined' },
  });
  // Subscribe before getSession waits for SDK URL initialization; otherwise the
  // initial PASSWORD_RECOVERY event can be missed after the hash is consumed.
  let recoveryUserId = null;
  const { data: listener } = client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      recovery.requested = true;
      recoveryUserId = session?.user?.id || null;
      recovery.verified = !!recoveryUserId && session.user.is_anonymous === false;
    }
  });
  let session;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      if (!recovery.requested) throw error;
      recovery.error = true;
    }
    session = data?.session;
  } finally { listener.subscription.unsubscribe(); }
  if (recovery.requested) {
    recovery.verified = recovery.verified && !recovery.error && !!session?.user?.id && session.user.id === recoveryUserId && session.user.is_anonymous === false;
  } else if (!session) {
    const result = await client.auth.signInAnonymously();
    // Public catalog still works if anonymous sign-ins have not been enabled yet.
    if (result.error) console.warn('Visitor stats need Anonymous Sign-Ins enabled:', result.error.message);
  }
  return { client, recovery, database: createDatabase(client) };
}
