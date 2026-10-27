import test from 'node:test';
import assert from 'node:assert/strict';
import { createCouponStore, isRegisteredUser } from '../supabase/coupons.js';

test('only explicitly registered sessions can collect or read member coupons', async () => {
  for (const user of [null, {id:'guest',is_anonymous:true}, {id:'unknown'}]) {
    assert.equal(isRegisteredUser(user), false);
    const store = createCouponStore({auth:{getSession:async()=>({data:{session:user ? {user} : null}})}});
    await assert.rejects(store.collect('2-0-1--10'), /Sign in or register/);
    await assert.rejects(store.list('2026-10-27'), /Sign in or register/);
    await assert.rejects(store.history(), /Sign in or register/);
  }
});

test('member collections load only the signed-in account and requested day', async () => {
  const filters = {};
  const query = {eq(key,value){filters[key]=value;return this;},then(resolve){resolve({data:[{coupon_id:'2-0-1--10'}],error:null});}};
  const store = createCouponStore({auth:{getSession:async()=>({data:{session:{user:{id:'member',is_anonymous:false}}}})},from:()=>({select:()=>query})});
  assert.deepEqual(await store.list('2026-10-27'), new Set(['2-0-1--10']));
  assert.deepEqual(filters,{user_id:'member',day:'2026-10-27'});
});

test('collection preserves duplicate result and surfaces database errors', async () => {
  let error = null;
  const store = createCouponStore({auth:{getSession:async()=>({data:{session:{user:{id:'member',is_anonymous:false}}}})},rpc:async(name,args)=>{
    assert.equal(name,'mall_collect_coupon'); assert.deepEqual(args,{coupon:'2-0-1--10'});
    return {data:false,error};
  }});
  assert.equal(await store.collect('2-0-1--10'),false);
  error = new Error('permission denied');
  await assert.rejects(store.collect('2-0-1--10'), /permission denied/);
});

test('coupon history pages stay within the account and retain past collection days', async () => {
  const filters={}; let pageRange;
  const rows=Array.from({length:31},(_,i)=>({coupon_id:`3-0-${i}--8`,day:i<18?'2026-10-27':'2026-10-26'}));
  const query={eq(key,value){filters[key]=value;return this;},order(){return this;},range(start,end){pageRange=[start,end];return Promise.resolve({data:rows,error:null});}};
  const store=createCouponStore({auth:{getSession:async()=>({data:{session:{user:{id:'member',is_anonymous:false}}}})},from:()=>({select:()=>query})});
  const result=await store.history(30);
  assert.deepEqual(filters,{user_id:'member'});
  assert.deepEqual(pageRange,[30,60]);
  assert.equal(result.rows.length,30); assert.equal(result.hasMore,true);
  assert.equal(result.rows[29].day,'2026-10-26');
  await assert.rejects(store.history(-1),/Invalid coupon page/);
});

test('daily claims send the expected UTC day to the guarded RPC', async () => {
  const store=createCouponStore({auth:{getSession:async()=>({data:{session:{user:{id:'member',is_anonymous:false}}}})},rpc:async(name,args)=>{
    assert.equal(name,'mall_collect_coupon_for_day');assert.deepEqual(args,{coupon:'2-0-1--10',collection_day:'2026-10-28'});
    return {data:true};
  }});
  assert.equal(await store.collect('2-0-1--10','2026-10-28'),true);
});
