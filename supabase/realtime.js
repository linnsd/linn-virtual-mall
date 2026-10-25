import { normalizeLocation } from '../lib/sites.js';
import { createUuid } from '../lib/uuid.js';

// Private, account-owned peer channels prevent forged sender IDs and staff badges.
// The shared lobby is discovery only: never render a lobby payload as an avatar.
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const TOPIC = new RegExp(`^mall:(guest|staff):(${UUID}):(${UUID})$`);
// Keep a conservative shared budget across all Presence channels on one socket.
const presenceBudgets = new WeakMap();
const EMOJIS = new Set(['👋', '❤️', '😂', '👍', '🎉', '😍', '🙏', '🔥', '😮']);
export function normalizeState(input, staffAllowed = false) {
  if (!input || typeof input !== 'object' || !['x', 'y', 'z', 'r'].every(k => Number.isFinite(input[k]))) return null;
  if (Math.abs(input.x) > 10000 || Math.abs(input.z) > 10000 || Math.abs(input.y) > 1000) return null;
  const output = { n: String(input.n || 'Guest').slice(0, 20), s: input.s === 'f' ? 'f' : 'm',
    l: input.l === 'real' ? 'real' : 'custom', x: input.x, y: input.y, z: input.z, r: input.r,
    ...normalizeLocation(input.site,input.f),
    m: input.m ? 1 : 0, d: input.d ? 1 : 0, st: input.st ? 1 : 0, staff: staffAllowed && input.staff ? 1 : 0 };
  if(output.d&&input.v==='bike')output.v='bike';
  if (input.c && typeof input.c === 'object') {
    output.c = {};
    for (const key of ['top', 'bottom', 'hair', 'glasses', 'hat']) {
      if (typeof input.c[key] === 'string') output.c[key] = input.c[key].slice(0, 20);
    }
    for (const key of ['topColor', 'bottomColor', 'hairColor', 'skin']) {
      if (Number.isInteger(input.c[key]) && input.c[key] >= 0 && input.c[key] <= 0xffffff) output.c[key] = input.c[key];
    }
  }
  if (input.emo && EMOJIS.has(input.emo.e) && Number.isFinite(input.emo.at)) output.emo = { e: input.emo.e, at: input.emo.at };
  return output;
}

// Private-channel joins must wait for the session JWT. SDK auth-event propagation
// can still be pending immediately after sign-in (including restored sessions).
export async function connectMallRoom(client, options = {}) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Guest session unavailable');
  await client.realtime.setAuth(data.session.access_token);
  return createMallRoom(client, { ...options, userId: data.session.user.id });
}

export function createMallRoom(client, { userId, staffAllowed = false, tabId = createUuid(),
  onStatus = () => {}, onDiagnostic = detail => console.warn("Mall realtime", detail), now = () => Date.now(), setIntervalFn = setInterval, clearIntervalFn = clearInterval } = {}) {
  if (!new RegExp(`^${UUID}$`).test(userId) || !new RegExp(`^${UUID}$`).test(tabId)) throw new Error('Invalid room identity');
  const ownTopic = `mall:${staffAllowed ? 'staff' : 'guest'}:${userId}:${tabId}`;
  const listeners = new Set(), chatListeners = new Set(), remotes = new Map();
  let closed = false, lobbyReady = false, ownReady = false, latest = null, lastMove = -Infinity, lastChat = -Infinity;
  let ownAnnounced = false, lobbyAnnounced = false, nextMembershipAttempt = -Infinity, version = 0, authSubscription = null, pendingMove = false, snapshotBusy = false;
  const managers = new Set(), teardowns = new Map();
  function releaseChannel(channel,topic) {
    const pending=Promise.resolve(client.removeChannel(channel)).catch(error=>onDiagnostic({scope:'teardown',message:error.message}));
    teardowns.set(topic,pending);
    pending.then(()=>{if(teardowns.get(topic)===pending) teardowns.delete(topic);});
    return pending;
  }
  // A server CLOSED removes the SDK channel from its socket. Build a fresh channel
  // after teardown; a CLOSED channel does not automatically resubscribe itself.
  function managedChannel(topic) {
    const bindings = []; let current = null, callback, stopped = false, ready = false;
    let retryAt = Infinity, attempts = 0, retiring = false, generation = 0;
    const facade = {
      get ready() { return ready; }, get generation() { return generation; },
      on(type, filter, fn) { bindings.push([type, filter, fn]); return facade; },
      subscribe(fn) { callback = fn; bind(); return facade; },
      presenceState() { return current?.presenceState() || {}; },
      async track(payload) { const channel=current; if(!ready||!channel) return 'error'; const result=await channel.track(payload); return channel===current&&ready?result:'error'; },
      async send(payload) { const channel=current; if(!ready||!channel) return 'error'; const result=await channel.send(payload); return channel===current&&ready?result:'error'; },
      tick() {
        if(stopped||retiring||now()<retryAt) return;
        retiring=true; retryAt=Infinity; const previous=current; current=null;
        releaseChannel(previous,topic).then(()=>{
          retiring=false; if(!stopped) bind();
        });
      },
      close() {
        if(stopped) return; stopped=true; ready=false; managers.delete(facade);
        if(current) releaseChannel(current,topic);
        current=null;
      },
    };
    async function bind() {
      // Never reuse an SDK topic while its previous unsubscribe is still pending.
      if(teardowns.has(topic)) await teardowns.get(topic);
      if(stopped) return;
      const channel=client.channel(topic,{config:{private:true,broadcast:{ack:true,self:false},presence:{key:tabId}}});
      current=channel; generation++;
      for(const [type,filter,fn] of bindings) channel.on(type,filter,payload=>{if(!stopped&&current===channel) fn(payload);});
      channel.on('system',{event:'*'},payload=>{
        if(payload?.status==='error') onDiagnostic({scope:topic==='mall:lobby'?'lobby':'peer',message:payload.message,extension:payload.extension});
      });
      channel.subscribe((status,error)=>{
        if(stopped||current!==channel) return;
        ready=status==='SUBSCRIBED';
        if(ready){ attempts=0; retryAt=Infinity; }
        else if(['CLOSED','CHANNEL_ERROR','TIMED_OUT'].includes(status)){
          if(retryAt===Infinity) retryAt=now()+Math.min(30000,1000*2**attempts++);
          onDiagnostic({scope:topic==='mall:lobby'?'lobby':'peer',status,message:error?.message});
        }
        callback?.(status);
      });
    }
    managers.add(facade); return facade;
  }
  const own = managedChannel(ownTopic), lobby = managedChannel('mall:lobby');
  const online = () => !closed && lobbyReady && ownReady;
  const emit = change => { for (const fn of listeners) fn(change); };
  const send = async (channel, event, payload) => {
    const result = await channel.send({ type: 'broadcast', event, payload });
    if (result !== 'ok') throw new Error('Realtime message not delivered');
  };
  const remove = topic => {
    const rec = remotes.get(topic); if (!rec) return;
    remotes.delete(topic); rec.channel.close();
    if (rec.state) emit({ joined: [], updated: [], left: [{ peer: topic }] });
  };
  function accept(topic, input) {
    const rec = remotes.get(topic); if (!rec || closed || !online()) return;
    const state = normalizeState(input, rec.staffAllowed);
    if (!state || !Number.isSafeInteger(input.v) || input.v <= rec.version) return;
    rec.version = input.v;
    const first = !rec.state; rec.state = state;
    emit({ joined: first ? [{ peer: topic, presence: state }] : [], updated: first ? [] : [{ peer: topic, presence: state }], left: [] });
  }
  function discover() {
    if (!online()) return;
    const topics = new Set();
    for (const entries of Object.values(lobby.presenceState())) {
      for (const entry of entries) if (typeof entry.topic === 'string' && TOPIC.test(entry.topic) && entry.topic !== ownTopic) topics.add(entry.topic);
    }
    for (const topic of remotes.keys()) if (!topics.has(topic)) remove(topic);
    for (const topic of topics) {
      if (remotes.has(topic)) continue;
      const channel = managedChannel(topic);
      const rec = { channel, state: null, version: 0, staffAllowed: TOPIC.exec(topic)[1] === 'staff', seen: new Set(), lastChat: -Infinity };
      remotes.set(topic, rec);
      channel.on('presence', { event: 'sync' }, () => {
        // Only the topic owner can publish Presence here; lobby data isn't trusted.
        const states = Object.values(channel.presenceState()).flat();
        if (states.length) accept(topic, states[states.length - 1].state);
        else if (rec.state) { rec.state = null; rec.version = 0; emit({ joined: [], updated: [], left: [{ peer: topic }] }); }
      }).on('broadcast', { event: 'state' }, ({ payload }) => accept(topic, payload))
        .on('broadcast', { event: 'chat' }, ({ payload }) => {
          if (closed || !online() || remotes.get(topic) !== rec || !payload || typeof payload.id !== 'string' || payload.id.length > 80
            || typeof payload.text !== 'string' || !payload.text.trim() || rec.seen.has(payload.id) || now() - rec.lastChat < 800) return;
          const state = normalizeState(payload.state, rec.staffAllowed); if (!state) return;
          rec.lastChat = now(); rec.seen.add(payload.id);
          if (rec.seen.size > 100) rec.seen.delete(rec.seen.values().next().value);
          accept(topic, payload.state);
          for (const fn of chatListeners) fn({ peer: topic, name: state.n, staff: !!state.staff, text: payload.text.trim().slice(0, 160) });
        }).subscribe(status => {
          if (closed || remotes.get(topic) !== rec) return;
          if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status) && rec.state) {
            rec.state = null; rec.version = 0; emit({ joined: [], updated: [], left: [{ peer: topic }] });
          }
        });
    }
  }
  function reservePresence() {
    const times=(presenceBudgets.get(client)||[]).filter(time=>now()-time<31000);
    presenceBudgets.set(client,times);
    if(times.length>=4) return false;
    times.push(now()); return true;
  }
  async function publishMembership() {
    if (!online() || !latest || snapshotBusy || now()<nextMembershipAttempt) return;
    snapshotBusy = true;
    try {
      if(!ownAnnounced){
        if(!reservePresence()) return;
        const result=await own.track({state:latest});
        if(result!=='ok') throw new Error('Presence join failed: '+result);
        ownAnnounced=true;
      }
      if(!lobbyAnnounced){
        if(!reservePresence()) return;
        const result=await lobby.track({topic:ownTopic});
        if(result!=='ok') throw new Error('Lobby join failed: '+result);
        lobbyAnnounced=true;
      }
      if(!closed) onStatus('connected');
    } catch(error) {
      nextMembershipAttempt=now()+5000;
      if(!closed){onDiagnostic({scope:'presence',message:error.message});onStatus('error');}
    } finally { snapshotBusy = false; }
  }
  function statusChanged() {
    if (closed) return;
    onStatus(online() ? 'connected' : 'reconnecting');
    if (!online()) {
      for (const topic of [...remotes.keys()]) remove(topic);
    } else {
      publishMembership(); discover();
    }
  }
  own.subscribe(status => { ownReady = status === 'SUBSCRIBED'; if(!ownReady) ownAnnounced=false; statusChanged(); });
  lobby.on('presence', { event: 'sync' }, discover).subscribe(status => { lobbyReady = status === 'SUBSCRIBED'; if(!lobbyReady) lobbyAnnounced=false; statusChanged(); });
  async function flushMovement() {
    if (!online() || !latest || !pendingMove || now() - lastMove < 200) return;
    lastMove = now(); pendingMove = false;
    try { await send(own, 'state', latest); }
    catch (error) { pendingMove = true; throw error; }
  }
  // Presence is membership only. Idle Broadcast heartbeats update late joiners
  // without triggering the server's per-client Presence rate limit.
  const timer = setIntervalFn(() => {
    for(const channel of managers) channel.tick();
    if(online()&&latest){
      if(!ownAnnounced||!lobbyAnnounced) publishMembership();
      if(now()-lastMove>=2000) pendingMove=true;
    }
    flushMovement().catch(() => onStatus('error'));
  }, 200);
  const room = {
    canStaff: staffAllowed,
    get connected() { return online(); },
    peers() {
      const peers = [...remotes].filter(([, rec]) => rec.state).map(([peer, rec]) => ({ peer, presence: rec.state }));
      if (online() && latest) peers.push({ peer: ownTopic, presence: latest, sameTab: true });
      return peers;
    },
    onPeers(fn) { listeners.add(fn); fn({ joined: room.peers(), updated: [], left: [] }); return () => listeners.delete(fn); },
    onChat(fn) { chatListeners.add(fn); return () => chatListeners.delete(fn); },
    async presence(input) {
      const state = normalizeState(input, staffAllowed); if (!state) return;
      latest = { ...state, v: ++version }; pendingMove = true;
      if (!online()) return;
      if (!ownAnnounced || !lobbyAnnounced) await publishMembership();
      await flushMovement();
    },
    async sendChat(text) {
      if (!online() || !latest) throw new Error('Chat is reconnecting. Please try again.');
      text = String(text).trim().slice(0, 160); if (!text) return;
      if (now() - lastChat < 1000) throw new Error('Please wait a second before sending again.');
      lastChat = now(); await send(own, 'chat', { id: createUuid(), text, state: latest });
    },
    close() {
      if (closed) return;
      closed = true; clearIntervalFn(timer); authSubscription?.unsubscribe();
      for (const topic of [...remotes.keys()]) remove(topic);
      own.close(); lobby.close(); listeners.clear(); chatListeners.clear();
    },
  };
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    if (session?.user.id !== userId) { room.close(); onStatus('signed_out'); }
    else if(_event==='TOKEN_REFRESHED') {
      // Do not await Auth API work inside the auth state callback.
      Promise.resolve().then(()=>client.realtime.setAuth(session.access_token)).catch(error=>onDiagnostic({scope:'auth',message:error.message}));
    }
  });
  authSubscription = data.subscription;
  if (closed) authSubscription.unsubscribe();
  return room;
}
