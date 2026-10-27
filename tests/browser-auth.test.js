import test from 'node:test';
import assert from 'node:assert/strict';
import { connectMall } from '../supabase/browser.js';

async function bootstrap(url, session, { event, error } = {}) {
  const previousWindow=globalThis.window,previousFetch=globalThis.fetch;
  let callback,anonymous=0,unsubscribed=false;
  const client={auth:{onAuthStateChange(fn){callback=fn;return {data:{subscription:{unsubscribe(){unsubscribed=true;}}}};},
    async getSession(){if(event)callback(event,session);return {data:{session},error};},
    async signInAnonymously(){anonymous++;return {};}}};
  globalThis.window={location:{href:url},supabase:{createClient:()=>client}};
  globalThis.fetch=async()=>({ok:true,json:async()=>({url:'https://supabase.example',publishableKey:'test'})});
  try { const backend=await connectMall();return {backend,anonymous,unsubscribed}; }
  finally {globalThis.window=previousWindow;globalThis.fetch=previousFetch;}
}

test('recovery initialization captures the initial event before getSession and skips anonymous sign-in', async () => {
  const result=await bootstrap('https://mall.example/#type=recovery',{user:{id:'member',is_anonymous:false}},{event:'PASSWORD_RECOVERY'});
  assert.deepEqual(result.backend.recovery,{requested:true,error:false,verified:true});
  assert.equal(result.anonymous,0);assert.equal(result.unsubscribed,true);
});

test('expired recovery links cannot reuse an older session or silently create a guest session', async () => {
  const result=await bootstrap('https://mall.example/?account=recovery#error=access_denied',{user:{id:'old-member',is_anonymous:false}});
  assert.equal(result.backend.recovery.verified,false);assert.equal(result.anonymous,0);
  const markerOnly=await bootstrap('https://mall.example/?account=recovery',{user:{id:'old-member',is_anonymous:false}});
  assert.equal(markerOnly.backend.recovery.verified,false, 'A URL marker and an older signed-in session must not authorize recovery');
  const expired=await bootstrap('https://mall.example/?account=recovery',null,{error:new Error('Invalid link')});
  assert.equal(expired.backend.recovery.error,true);assert.equal(expired.backend.recovery.verified,false);assert.equal(expired.anonymous,0);
});

test('ordinary visits keep anonymous entry and signed-in member sessions unchanged', async () => {
  assert.equal((await bootstrap('https://mall.example/',null)).anonymous,1);
  assert.equal((await bootstrap('https://mall.example/',{user:{id:'member',is_anonymous:false}})).anonymous,0);
});
