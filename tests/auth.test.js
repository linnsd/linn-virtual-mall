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

import { sendAccountEmail, updateRecoveryPassword, isRecoveryReturn, authReturnUrl } from '../supabase/auth.js';

test('reset and confirmation emails use this site and never forward auth tokens or arbitrary redirects', async () => {
  const calls=[];
  const client={auth:{resetPasswordForEmail:async(...args)=>{calls.push(args);return {};},resend:async args=>{calls.push(args);return {};}}};
  const url='https://mall.example/?next=https://evil.example#access_token=private';
  await sendAccountEmail(client,'forgot',' user@example.com ',url);
  await sendAccountEmail(client,'resend','user@example.com',url);
  assert.deepEqual(calls,[['user@example.com',{redirectTo:'https://mall.example/?account=recovery'}],{type:'signup',email:'user@example.com',options:{emailRedirectTo:'https://mall.example/'}}]);
  assert.equal(isRecoveryReturn('https://mall.example/?account=recovery'),true);
  assert.equal(isRecoveryReturn('https://mall.example/#type=recovery'),true);
  assert.equal(isRecoveryReturn('https://mall.example/'),false);
  assert.equal(authReturnUrl(url),'https://mall.example/');
});

test('email helpers reject invalid email, preserve provider failures and never claim success after an error', async () => {
  await assert.rejects(sendAccountEmail({},'forgot','invalid','https://mall.example/'),/email address/);
  await assert.rejects(sendAccountEmail({},'unknown','user@example.com','https://mall.example/'),/Invalid account email action/);
  await assert.rejects(sendAccountEmail({auth:{resend:async()=>({error:new Error('Email rate limit exceeded')})}},'resend','user@example.com','https://mall.example/'),/rate limit/);
});

test('password changes require matching passwords and a verified registered session', async () => {
  let updates=0;
  const client={auth:{getUser:async()=>({data:{user:{id:'member',is_anonymous:false}}}),updateUser:async args=>{updates++;assert.deepEqual(args,{password:'new-password'});return {data:{user:{id:'member'}}};}}};
  await assert.rejects(updateRecoveryPassword(client,'short','short'),/၆/);
  await assert.rejects(updateRecoveryPassword(client,'new-password','different'),/တူညီ/);
  assert.equal(updates,0);
  await updateRecoveryPassword(client,'new-password','new-password');assert.equal(updates,1);
  client.auth.getUser=async()=>({data:{user:{id:'guest',is_anonymous:true}}});
  await assert.rejects(updateRecoveryPassword(client,'new-password','new-password'),/Reset link/);assert.equal(updates,1);
  client.auth.getUser=async()=>({error:new Error('Auth session expired')});
  await assert.rejects(updateRecoveryPassword(client,'new-password','new-password'),/expired/);
});
