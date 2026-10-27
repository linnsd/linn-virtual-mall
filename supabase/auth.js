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
