// The existing browser Supabase SDK completes the OAuth callback before getSession.
export async function signInWithGoogle(client, pageUrl) {
  const page = new URL(pageUrl);
  if (!['https:', 'http:'].includes(page.protocol)) throw new Error('Open the mall in a web browser to use Google sign-in.');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Return to this site without forwarding query parameters or auth fragments.
      redirectTo: page.origin + page.pathname,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Google sign-in unavailable. Please try again.');
}

export function hasOAuthError(pageUrl) {
  const page = new URL(pageUrl);
  return [page.search.slice(1), page.hash.slice(1)].some(part => {
    const params = new URLSearchParams(part);
    return params.has('error') || params.has('error_description');
  });
}

export function authReturnUrl(pageUrl, action) {
  const page = new URL(pageUrl);
  if (!['https:', 'http:'].includes(page.protocol)) throw new Error('Open the mall in a web browser.');
  return page.origin + page.pathname + (action === 'recovery' ? '?account=recovery' : '');
}

export function isRecoveryReturn(pageUrl) {
  const page = new URL(pageUrl);
  return page.searchParams.get('account') === 'recovery' || new URLSearchParams(page.hash.slice(1)).get('type') === 'recovery';
}

export async function sendAccountEmail(client, action, email, pageUrl) {
  const address = typeof email === 'string' ? email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) throw new Error('မှန်ကန်သော email address ထည့်ပါ။');
  let result;
  if (action === 'forgot') result = await client.auth.resetPasswordForEmail(address, { redirectTo: authReturnUrl(pageUrl, 'recovery') });
  else if (action === 'resend') result = await client.auth.resend({ type: 'signup', email: address, options: { emailRedirectTo: authReturnUrl(pageUrl) } });
  else throw new Error('Invalid account email action');
  if (result.error) throw result.error;
}

export async function updateRecoveryPassword(client, password, confirmation) {
  if (typeof password !== 'string' || password.length < 6) throw new Error('Password အနည်းဆုံး ၆ လုံး ထည့်ပါ။');
  if (password !== confirmation) throw new Error('Password နှစ်ခု တူညီရပါမယ်။');
  // Verify the session with Auth; a URL flag or anonymous session cannot authorize an update.
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id || data.user.is_anonymous !== false) throw new Error('Reset link သက်တမ်းကုန်သွားပါပြီ။ Link အသစ် ပြန်တောင်းပါ။');
  const result = await client.auth.updateUser({ password });
  if (result.error) throw result.error;
  if (!result.data?.user) throw new Error('Password မပြောင်းနိုင်ပါ။ ပြန်ကြိုးစားပါ။');
}
