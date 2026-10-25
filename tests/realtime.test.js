import test from 'node:test';
import assert from 'node:assert/strict';
import { connectMallRoom, createMallRoom, normalizeState } from '../supabase/realtime.js';
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TA = '11111111-1111-4111-8111-111111111111', TB = '22222222-2222-4222-8222-222222222222';
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const state = (n, staff=0) => ({ n, x:1, y:0, z:7, r:0, staff });
// A network boundary fake routes channels and enforces the migration's topic ownership.
function network({rateLimitPresence=false}={}) {
  const all = new Set(), timers = new Set(); let time=10000;
  function client(uid, staff=false) {
    const authListeners=new Set();
    return {
      auth: { onAuthStateChange(fn){authListeners.add(fn);return {data:{subscription:{unsubscribe(){authListeners.delete(fn);}}}};} },
      signOut(){for(const fn of authListeners) fn('SIGNED_OUT',null);},
      refreshToken(token){for(const fn of authListeners) fn('TOKEN_REFRESHED',{user:{id:uid},access_token:token});},
      channels: [], tracks: [],
      channel(topic,options) {
        const thisClient=this, events=[];
        const c={topic,options,uid,staff,active:false,tracked:null,trackTimes:[],
          on(type,filter,fn){events.push({type,filter,fn});return c;},
          subscribe(fn){c.status=fn;all.add(c);c.active=true;queueMicrotask(()=>{fn('SUBSCRIBED'); sync(topic);});return c;},
          presenceState(){const result={};for(const peer of all) if(peer.active&&peer.topic===topic&&peer.tracked) (result[peer.options.config.presence.key]??=[]).push(peer.tracked);return result;},
          async track(payload){if(!allowed(c,'presence')) return 'error';c.trackTimes=c.trackTimes.filter(at=>time-at<30000);if(rateLimitPresence&&c.trackTimes.length>=5){c.active=false;c.status('CLOSED');return 'error';}c.trackTimes.push(time);thisClient.tracks.push({time,topic});c.tracked=structuredClone(payload);sync(topic);return 'ok';},
          async send(message){if(!allowed(c,'broadcast')) return 'error';for(const peer of all) if(peer!==c&&peer.active&&peer.topic===topic) peer.emit('broadcast',message.event,{payload:structuredClone(message.payload)});return 'ok';},
          emit(type,event,arg){for(const item of events) if(item.type===type&&item.filter.event===event)item.fn(arg);},
        };
        this.channels.push(c);return c;
      },
      removeChannel(c){c.active=false;all.delete(c);sync(c.topic);return Promise.resolve('ok');},
    };
  }
  function allowed(c,type){const parts=c.topic.split(':');return c.active&&(c.topic==='mall:lobby'?type==='presence':parts[2]===c.uid&&(parts[1]==='guest'||c.staff));}
  function sync(topic){for(const c of [...all])if(c.active&&c.topic===topic)c.emit('presence','sync',{});}
  const make=(c,uid,tab,staffAllowed=false,statuses=[])=>createMallRoom(c,{userId:uid,tabId:tab,staffAllowed,onDiagnostic:()=>{},onStatus:s=>statuses.push(s),now:()=>time,setIntervalFn:fn=>{timers.add(fn);return fn;},clearIntervalFn:fn=>timers.delete(fn)});
  return {client,make,advance(ms){time+=ms;},pulse(){for(const fn of timers) fn();},all};
}

test('two guests discover each other, move, send one chat and disappear on departure', async () => {
  const net=network(), ca=net.client(A), cb=net.client(B), a=net.make(ca,A,TA), b=net.make(cb,B,TB);
  const messages=[];b.onChat(m=>messages.push(m));
  await tick();await a.presence(state('Alice'));await b.presence(state('Bob'));await tick();
  assert.equal(a.peers().length,2);assert.equal(b.peers().length,2);
  net.advance(250);await a.presence({...state('Alice'),x:42,m:1});
  assert.equal(b.peers().find(p=>!p.sameTab).presence.x,42);
  await a.sendChat('Hello <script>');
  assert.equal(messages.length,1);assert.equal(messages[0].text,'Hello <script>');
  await assert.rejects(a.sendChat('spam'),/wait a second/);
  a.close();await tick();assert.equal(b.peers().length,1);b.close();assert.equal(net.all.size,0);
});

test('payload flags and forged lobby discovery cannot impersonate staff', async () => {
  const net=network(), ca=net.client(A), cb=net.client(B), a=net.make(ca,A,TA), b=net.make(cb,B,TB);
  const messages=[];b.onChat(m=>messages.push(m));await tick();
  await a.presence(state('Fake staff',1));await b.presence(state('Bob'));await tick();await a.sendChat('I am staff');
  assert.equal(b.peers().find(p=>!p.sameTab).presence.staff,0);assert.equal(messages[0].staff,false);
  const forgedTopic=`mall:staff:${B}:${TA}`;
  await ca.channels.find(c=>c.topic==='mall:lobby').track({topic:forgedTopic});await tick();
  const forged=ca.channel(forgedTopic,{config:{private:true,presence:{key:TA}}});forged.subscribe(()=>{});await tick();
  assert.equal(await forged.track({state:{...state('Fake',1),v:1}}),'error');
  assert.equal(b.peers().some(p=>p.peer===forgedTopic),false);
  ca.removeChannel(forged);a.close();b.close();
});

test('authorized staff can switch duty off and @staff messages retain sender identity', async () => {
  const net=network(), ca=net.client(A,true), cb=net.client(B), a=net.make(ca,A,TA,true), b=net.make(cb,B,TB);
  const messages=[];a.onChat(m=>messages.push(m));await tick();await a.presence(state('Linn staff',1));await b.presence(state('Bob'));await tick();
  assert.equal(b.peers().find(p=>!p.sameTab).presence.staff,1);
  await b.sendChat('@staff help');assert.equal(messages[0].name,'Bob');assert.equal(messages[0].staff,false);
  net.advance(250);await a.presence(state('Off duty',0));assert.equal(b.peers().find(p=>!p.sameTab).presence.staff,0);
  a.close();b.close();
});

test('reconnect re-advertises idle state, rejects stale snapshots, and sign-out closes every channel', async () => {
  const net=network(), ca=net.client(A), cb=net.client(B), statuses=[], a=net.make(ca,A,TA,false,statuses), b=net.make(cb,B,TB);
  await tick();await a.presence(state('Alice'));await b.presence(state('Bob'));await tick();
  const own=ca.channels.find(c=>c.topic.startsWith('mall:guest:'));
  net.advance(250);await a.presence({...state('Alice'),x:50});
  own.emit('presence','sync',{}); // A local presence event does not replace remote movement.
  const reader=cb.channels.find(c=>c.topic===own.topic);
  reader.emit('presence','sync',{});assert.equal(b.peers().find(p=>!p.sameTab).presence.x,50);
  reader.status('CHANNEL_ERROR');assert.equal(b.peers().length,1);
  reader.status('SUBSCRIBED');reader.emit('presence','sync',{});
  assert.equal(b.peers().length,2);
  own.status('CHANNEL_ERROR');assert.equal(a.connected,false);
  own.status('SUBSCRIBED');await tick();assert.equal(a.connected,true);assert.equal(a.peers().length,2);
  assert.equal(b.peers().find(p=>!p.sameTab).presence.x,50);
  ca.signOut();assert.equal(a.connected,false);assert.equal(statuses.at(-1),'signed_out');
  assert.equal(ca.channels.some(c=>net.all.has(c)),false);b.close();
});

test('malformed movement cannot inject non-finite coordinates, nested data or arbitrary reactions', () => {
  assert.equal(normalizeState({...state('Bad'),x:NaN}),null);
  assert.equal(normalizeState({...state('Bad'),z:10001}),null);
  const valid=normalizeState({...state('Guest',1),c:{top:'tee',skin:-1,topColor:0xff00ff,untrusted:{bad:1}},say:{t:'replayed'},emo:{e:'bogus',at:1}});
  assert.equal(valid.staff,0);assert.deepEqual(valid.c,{top:'tee',topColor:0xff00ff});assert.equal(valid.say,undefined);assert.equal(valid.emo,undefined);
});

test('a throttled final stop is sent without waiting for another movement or presence snapshot', async () => {
  const net=network(), ca=net.client(A), cb=net.client(B), a=net.make(ca,A,TA), b=net.make(cb,B,TB);
  await tick();await a.presence({...state('Alice'),m:1});await b.presence(state('Bob'));await tick();
  net.advance(100);await a.presence({...state('Alice'),m:0});
  assert.equal(b.peers().find(p=>!p.sameTab).presence.m,1);
  net.advance(100);net.pulse();await tick();
  assert.equal(b.peers().find(p=>!p.sameTab).presence.m,0);a.close();b.close();
});


test('private channels wait for the session JWT before subscribing', async () => {
  const net=network(), client=net.client(A);
  client.auth.getSession=async()=>({data:{session:{user:{id:A},access_token:'guest-session-jwt'}}});
  let release, token;
  client.realtime={setAuth:async value=>{token=value;await new Promise(resolve=>{release=resolve;});}};
  const connected=connectMallRoom(client,{tabId:TA,setIntervalFn:()=>0,clearIntervalFn:()=>{}});
  await tick();
  assert.equal(token,'guest-session-jwt');
  assert.equal(client.channels.length,0,'no private join may race ahead of authentication');
  release();const room=await connected;
  assert.equal(client.channels.length,2);room.close();
});

test('missing or failed sessions never open private realtime channels', async () => {
  const net=network(), client=net.client(A);
  client.auth.getSession=async()=>({data:{session:null}});
  await assert.rejects(connectMallRoom(client),/Guest session unavailable/);
  assert.equal(client.channels.length,0);
  const denied=new Error('Session refresh failed');
  client.auth.getSession=async()=>({data:{session:null},error:denied});
  await assert.rejects(connectMallRoom(client),error=>error===denied);
  assert.equal(client.channels.length,0);
});


test('two-minute movement and idle sessions stay below Presence limits and remain connected', async () => {
  const net=network({rateLimitPresence:true}),ca=net.client(A),cb=net.client(B),a=net.make(ca,A,TA),b=net.make(cb,B,TB);
  await tick();await a.presence(state('Alice'));await b.presence(state('Bob'));await tick();
  for(let i=0;i<1200;i++){
    net.advance(100);
    if(i<600) await a.presence({...state('Alice'),x:i/100,m:1});
    net.pulse();await tick();
    assert.equal(a.connected,true);assert.equal(b.connected,true);assert.equal(b.peers().length,2);
  }
  assert.equal(ca.tracks.length,2,'Presence is announced once on peer and lobby, never used as a heartbeat');
  assert.equal(cb.tracks.length,2);
  a.close();b.close();
});

test('late joiners receive a stationary guest latest position via Broadcast, without another Presence track', async () => {
  const net=network(),ca=net.client(A),a=net.make(ca,A,TA);
  await tick();await a.presence(state('Alice'));net.advance(250);await a.presence({...state('Alice'),x:42});
  const cb=net.client(B),b=net.make(cb,B,TB);await tick();await b.presence(state('Bob'));await tick();
  net.advance(2100);net.pulse();await tick();
  assert.equal(b.peers().find(p=>!p.sameTab).presence.x,42);
  assert.equal(ca.tracks.length,2);a.close();b.close();
});

test('server CLOSED recreates the publisher and receiver channels and resumes movement', async () => {
  const net=network(),ca=net.client(A),cb=net.client(B),a=net.make(ca,A,TA),b=net.make(cb,B,TB);
  await tick();await a.presence(state('Alice'));await b.presence(state('Bob'));await tick();
  const publisher=ca.channels.find(c=>c.topic.startsWith('mall:guest:'+A));
  publisher.active=false;publisher.status('CLOSED');assert.equal(a.connected,false);
  net.advance(1100);net.pulse();await tick();
  assert.equal(a.connected,true);assert.ok(ca.channels.some(c=>c!==publisher&&c.topic===publisher.topic&&c.active));
  await a.presence({...state('Alice'),x:12});await tick();
  assert.equal(b.peers().find(p=>!p.sameTab).presence.x,12);
  const receiver=cb.channels.find(c=>c.topic===publisher.topic&&c.active);
  receiver.active=false;receiver.status('CLOSED');net.advance(1100);net.pulse();await tick();
  assert.ok(cb.channels.some(c=>c!==receiver&&c.topic===receiver.topic&&c.active));
  net.advance(250);await a.presence({...state('Alice'),x:18});await tick();
  assert.equal(b.peers().find(p=>!p.sameTab).presence.x,18);a.close();b.close();
});


test('rapid server reconnects respect one shared Presence budget instead of flooding retries', async () => {
  const net=network(),ca=net.client(A),a=net.make(ca,A,TA);
  await tick();await a.presence(state('Alice'));await tick();
  for(let i=0;i<6;i++){
    const own=ca.channels.find(c=>c.active&&c.topic.startsWith('mall:guest:'+A));
    own.active=false;own.status('CLOSED');net.advance(1100);net.pulse();await tick();
  }
  assert.ok(ca.tracks.length<=4);
  net.advance(31000);net.pulse();await tick();
  assert.equal(a.connected,true);assert.ok(ca.tracks.length>4);a.close();
});

test('token refresh updates private-channel authentication without recreating channels', async () => {
  const net=network(),ca=net.client(A),a=net.make(ca,A,TA);await tick();
  const tokens=[];ca.realtime={setAuth:async token=>tokens.push(token)};
  const count=ca.channels.length;ca.refreshToken('refreshed-session-jwt');await tick();
  assert.deepEqual(tokens,['refreshed-session-jwt']);assert.equal(ca.channels.length,count);assert.equal(a.connected,true);a.close();
});


test('a peer that rejoins quickly waits for its previous SDK topic teardown', async () => {
  const net=network(),ca=net.client(A),cb=net.client(B),a=net.make(ca,A,TA),b=net.make(cb,B,TB);
  await tick();await a.presence(state('Alice'));await b.presence(state('Bob'));await tick();
  const topic=ca.channels.find(c=>c.topic.startsWith('mall:guest:'+A)).topic;
  const remove=cb.removeChannel.bind(cb);let release;
  cb.removeChannel=channel=>channel.topic===topic?new Promise(resolve=>{release=()=>{remove(channel);resolve('ok');};}):remove(channel);
  const lobby=ca.channels.find(c=>c.topic==='mall:lobby');
  await lobby.track({});await tick();await lobby.track({topic});await tick();
  assert.equal(cb.channels.filter(c=>c.topic===topic).length,1,'do not bind a topic that is still leaving');
  cb.removeChannel=remove;release();await tick();
  assert.equal(cb.channels.filter(c=>c.topic===topic).length,2);assert.equal(b.peers().length,2);
  a.close();b.close();
});
