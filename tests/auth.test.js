import test from 'node:test';
import assert from 'node:assert/strict';
import { signInWithGoogle, hasOAuthError } from '../supabase/auth.js';

test('Google sign-in returns to the current site without forwarding auth fragments or query parameters', async () => {
  let request;
  await signInWithGoogle({auth:{signInWithOAuth:async args=>{request=args;return {data:{url:'https://accounts.google.com/'},error:null};}}},'https://mall.example/shop/?next=https://other.example#access_token=private');
  assert.deepEqual(request,{provider:'google',options:{redirectTo:'https://mall.example/shop/',queryParams:{prompt:'select_account'}}});
});

test('Google provider failures and missing redirects reach the UI for retry', async () => {
  const failure = new Error('Google provider disabled');
  await assert.rejects(signInWithGoogle({auth:{signInWithOAuth:async()=>({error:failure})}},'http://localhost:3000/'),error=>error===failure);
  await assert.rejects(signInWithGoogle({auth:{signInWithOAuth:async()=>({data:{url:null}})}},'https://mall.example/'),/unavailable/);
  await assert.rejects(signInWithGoogle({},'file:///mall/index.html'),/web browser/);
});

test('OAuth cancellation is detected in either callback format without treating successful tokens as errors', () => {
  assert.equal(hasOAuthError('https://mall.example/#error=access_denied&error_description=Cancelled'),true);
  assert.equal(hasOAuthError('https://mall.example/?error=access_denied'),true);
  assert.equal(hasOAuthError('https://mall.example/#access_token=token'),false);
  assert.equal(hasOAuthError('https://mall.example/'),false);
});
