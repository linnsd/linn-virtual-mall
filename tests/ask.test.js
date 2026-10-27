import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/ask.js';
import { reserveAiQuota } from '../lib/ai-quota.js';
const request=()=>({method:'POST',headers:{'x-forwarded-for':'192.0.2.1'},body:{messages:[{role:'user',content:'Linn IT, Mobile & Electronics Mart: hello'}]}});
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
async function withEnvironment(run) {
  const previous={...process.env},originalFetch=globalThis.fetch;
  Object.assign(process.env,{ANTHROPIC_API_KEY:'test-api-key',SUPABASE_URL:'https://quota.example',SUPABASE_SECRET_KEY:'sb_secret_test'});
  delete process.env.ALLOWED_ORIGIN;
  try {await run();} finally {globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
}

test('a denied shared quota never calls the paid provider and sends Retry-After', async () => withEnvironment(async()=>{
  let calls=0;
  globalThis.fetch=async(url,options)=>{calls++;assert.match(String(url),/mall_reserve_ai_request$/);const body=JSON.parse(options.body);assert.match(body.ip_hash,/^[0-9a-f]{64}$/);assert.equal(options.body.includes('192.0.2.1'),false);return {ok:true,json:async()=>({allowed:false,retry_after:42})};};
  const res=response(); await handler(request(),res);
  assert.equal(res.code,429);assert.equal(res.headers['Retry-After'],'42');assert.equal(calls,1);
}));

test('quota outages and absent server secrets fail closed before a paid request', async () => withEnvironment(async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('offline');};
  const res=response();await handler(request(),res);assert.equal(res.code,503);assert.equal(calls,1);
  delete process.env.SUPABASE_SECRET_KEY;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing=response();await handler(request(),missing);assert.equal(missing.code,503);assert.equal(calls,1);
}));

test('allowed requests reserve first and then call the bounded upstream request', async () => withEnvironment(async()=>{
  const calls=[];globalThis.fetch=async(url,options)=>{calls.push(String(url));assert.ok(options.signal);return calls.length===1?{ok:true,json:async()=>({allowed:true,retry_after:0})}:{ok:true,json:async()=>({content:[{type:'text',text:'Hello'}]})};};
  const res=response();await handler(request(),res);
  assert.equal(res.code,200);assert.deepEqual(res.body,{text:'Hello'});assert.match(calls[0],/mall_reserve_ai_request$/);assert.equal(calls[1],'https://api.anthropic.com/v1/messages');
}));

test('malformed messages receive 400 without reserving quota or calling upstream', async () => withEnvironment(async()=>{
  globalThis.fetch=async()=>{assert.fail('Invalid requests must not consume quota');};
  const req=request();req.body.messages=[null];const res=response();await handler(req,res);assert.equal(res.code,400);
}));

test('new secret keys use only apikey; browser keys are rejected and malformed quota responses fail closed', async()=>{
  const env={SUPABASE_URL:'https://quota.example',SUPABASE_SECRET_KEY:'sb_secret_test'};
  await reserveAiQuota('192.0.2.1',{env,fetchFn:async(url,options)=>{assert.equal(options.headers.Authorization,undefined);assert.equal(options.headers.apikey,env.SUPABASE_SECRET_KEY);return {ok:true,json:async()=>({allowed:true})};}});
  await assert.rejects(reserveAiQuota('ip',{env:{...env,SUPABASE_SECRET_KEY:'sb_publishable_test'},fetchFn:async()=>assert.fail('Public keys must not be sent')}),/server secret/);
  await assert.rejects(reserveAiQuota('ip',{env,fetchFn:async()=>({ok:true,json:async()=>({allowed:false,retry_after:-1})})}),/Invalid AI quota response/);
});

test('legacy service-role JWTs use authorization while quota service errors remain closed', async()=>{
  const key=`e30.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.test`;
  const env={SUPABASE_URL:'https://quota.example',SUPABASE_SERVICE_ROLE_KEY:key};
  await assert.rejects(reserveAiQuota('192.0.2.1',{env,fetchFn:async(url,options)=>{
    assert.equal(options.headers.Authorization,`Bearer ${key}`);return {ok:false};
  }}),/unavailable/);
});

test('all malformed request bodies fail safely before shared quota or provider calls', async () => withEnvironment(async()=>{
  globalThis.fetch=async()=>assert.fail('Malformed input must not reach quota or upstream');
  const valid=request().body.messages[0];
  const bodies=[undefined,null,42,[],{},'{broken',JSON.stringify({messages:[null]}),{messages:'invalid'},{messages:[null]},
    {messages:[[]]},{messages:[{role:'user',content:{text:'invalid'}}]},{messages:[{role:'system',content:'invalid'}]},
    {messages:[valid,{role:'assistant',content:'   '}]},{messages:[{...valid,content:'x'.repeat(14001)}]},
    {messages:[valid,{role:'assistant',content:'x'.repeat(14000)},{role:'user',content:'x'.repeat(14000)}]},
    {messages:Array.from({length:10},()=>valid)},{messages:[valid,null]}];
  for (const body of bodies) {
    const req=request();req.body=body;const res=response();await handler(req,res);
    assert.equal(res.code,400,JSON.stringify(body)?.slice(0,100));assert.deepEqual(res.body,{error:'bad_request'});
  }
  // Invalid input is still 400 if server credentials are temporarily absent.
  delete process.env.ANTHROPIC_API_KEY;
  const req=request();req.body={messages:[null]};const res=response();await handler(req,res);assert.equal(res.code,400);
}));

test('valid serialized JSON requests still reach the provider and malformed upstream responses return 502', async () => withEnvironment(async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;return calls%2===1?{ok:true,json:async()=>({allowed:true})}:{ok:true,json:async()=>({content:[null,{type:'image'},{type:'text',text:'Hello'}]})};};
  const req=request();req.body=JSON.stringify(req.body);const res=response();await handler(req,res);assert.equal(res.code,200);assert.equal(res.body.text,'Hello');
  calls=0;globalThis.fetch=async()=>{calls++;return calls===1?{ok:true,json:async()=>({allowed:true})}:{ok:true,json:async()=>({content:{bad:'shape'}})};};
  const bad=response();await handler(request(),bad);assert.equal(bad.code,502);
}));
