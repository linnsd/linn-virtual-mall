import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/config.js';
import { createDatabase } from '../supabase/adapter.js';

test('config publishes only the URL and publishable key', () => {
  process.env.SUPABASE_SECRET_KEY = 'must-not-leak';
  const response = { setHeader(){}, status(code){ this.code=code; return this; }, json(body){ this.body=body; } };
  handler({method:'GET'}, response);
  assert.equal(response.code, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ['publishableKey','url']);
  assert.match(response.body.publishableKey, /^sb_publishable_/);
  handler({method:'POST'}, response);
  assert.equal(response.code, 405);
  delete process.env.SUPABASE_SECRET_KEY;
});

test('repair lookup uses exact-job RPC and returns missing-document semantics', async () => {
  const database=createDatabase({ async rpc(name, args){
    assert.equal(name,'mall_repair_lookup'); assert.deepEqual(args,{job_id:'P1-123'});
    return {data:null,error:null};
  }});
  const result=await database.doc('repairStatus/P1-123').get();
  assert.equal(result.exists,false);
});

test('database denial reaches callers so Admin cannot show false Saved status', async () => {
  const denied={code:'42501',message:'permission denied'};
  const database=createDatabase({ from(){ return {upsert:async()=>({error:denied})}; } });
  await assert.rejects(database.doc('config/contact').set({phone:'123'}), error=>error===denied);
});

test('visitor writes require a session and use its verified owner ID', async () => {
  let session=null, written;
  const database=createDatabase({auth:{getSession:async()=>({data:{session}})},from(){return {upsert:async row=>{written=row;return {error:null};}};}});
  await assert.rejects(database.doc('stats/visit-1').set({day:'2026-10-25'}), /authentication unavailable/);
  session={user:{id:'visitor-uid'}};
  await database.doc('stats/visit-1').set({day:'2026-10-25'});
  assert.equal(written.owner_id,'visitor-uid');
  assert.equal(written.id,'visit-1');
});

test('config refuses to expose a secret key accidentally placed in the public variable', () => {
  const previous=process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_PUBLISHABLE_KEY='sb_secret_do_not_publish';
  const response={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
  try {
    handler({method:'GET'},response);
    assert.equal(response.code,503);
    assert.equal(JSON.stringify(response.body).includes('sb_secret_'),false);
  } finally {
    if(previous===undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY=previous;
  }
});
