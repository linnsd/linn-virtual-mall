import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyCoupons } from '../lib/daily-coupons.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('UTC rollover clears yesterday immediately and reloads today without page refresh', async () => {
  let time=new Date('2026-10-27T23:59:59Z'), snapshot; const days=[];
  const controller=createDailyCoupons({now:()=>time,store:{list:async day=>{days.push(day);return new Set(day.endsWith('27')?['old']:[]);}},onChange:s=>{snapshot=s;}});
  await controller.refresh(); assert.deepEqual([...snapshot.ids],['old']);
  time=new Date('2026-10-28T00:00:00Z'); const request=controller.refresh();
  assert.equal(snapshot.day,'2026-10-28'); assert.equal(snapshot.ready,false); assert.equal(snapshot.ids.size,0);
  await request; assert.equal(controller.ready,true); assert.deepEqual(days,['2026-10-27','2026-10-28']);
});

test('a late yesterday load or collection cannot mark a coupon collected today', async () => {
  let time=new Date('2026-10-27T23:59:59Z'), snapshot; const load=deferred(), claim=deferred(); let first=true;
  const store={list:()=>first?(first=false,load.promise):Promise.resolve(new Set()),collect:async(id,day)=>{assert.equal(day,'2026-10-28');return claim.promise;}};
  const controller=createDailyCoupons({now:()=>time,store,onChange:s=>{snapshot=s;}});
  const oldLoad=controller.refresh(); time=new Date('2026-10-28T00:00:00Z'); await controller.refresh();
  load.resolve(new Set(['yesterday'])); await oldLoad; assert.equal(snapshot.ids.size,0);
  const oldClaim=controller.collect('coupon'); time=new Date('2026-10-29T00:00:00Z'); await controller.refresh();
  claim.resolve(true); assert.equal(await oldClaim,null); assert.equal(snapshot.ids.size,0); assert.equal(controller.isPending('coupon'),false);
});

test('normal claims update the HUD once, block pending duplicates and recover after network failure', async () => {
  let time=new Date('2026-10-27T12:00:00Z'), fail=true, snapshot; const claim=deferred();
  const controller=createDailyCoupons({now:()=>time,onChange:s=>{snapshot=s;},store:{list:async()=>{if(fail)throw new Error('offline');return new Set();},collect:()=>claim.promise}});
  await assert.rejects(controller.refresh(),/offline/); assert.equal(controller.ready,false);
  fail=false; time=new Date(time.getTime()+10001); await controller.refresh();
  const pending=controller.collect('one'); assert.equal(await controller.collect('one'),null);
  claim.resolve(true); assert.deepEqual(await pending,{added:true,count:1,day:'2026-10-27'}); assert.deepEqual([...snapshot.ids],['one']);
  assert.equal(await controller.collect('one'),null);
});

test('daily draw cannot overlap while a midnight rollover occurs', async () => {
  const { readFile } = await import('node:fs/promises');
  const source=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const start=source.indexOf('      $("spinBtn").onclick = () => {'),end=source.indexOf('      $("drawClose").onclick',start);
  const elements={};const $=id=>elements[id]??={disabled:false,textContent:'',style:{}};
  const clock={day:'2026-10-27'},values=new Map(),callbacks=[];let tracks=0;
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  new Function('$','clock','localStorage','PRIZES','track','setTimeout',`let TODAY=clock.day,wheelRot=0,drawBusy=false;function syncDailyState(){TODAY=clock.day;} ${source.slice(start,end)}`)($,clock,storage,[['Case']],()=>tracks++,fn=>callbacks.push(fn));
  $('spinBtn').onclick();clock.day='2026-10-28';$('spinBtn').onclick();
  assert.equal(callbacks.length,1);
  callbacks.shift()();assert.equal($('spinBtn').disabled,false);assert.equal(tracks,0);assert.equal(values.size,0);
  $('spinBtn').onclick();callbacks.shift()();assert.equal(values.get('linnmall.draw'),'2026-10-28');assert.equal(tracks,1);
});
