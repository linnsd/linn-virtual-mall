import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaylist, MALL_TRACKS } from '../lib/playlist.js';
import { stat } from 'node:fs/promises';
class Media extends EventTarget {
  src=''; plays=0; paused=true;
  getAttribute(){return this.src||null;}
  load(){}
  play(){this.plays++;this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  fire(type){this.dispatchEvent(new Event(type));}
}
test('the supplied songs exist, play in order and loop the entire playlist',async()=>{
  for(const track of MALL_TRACKS) assert.ok((await stat(new URL('../'+track.src,import.meta.url))).size>100000);
  const audio=new Media(), p=createPlaylist(audio);
  assert.equal(audio.src,'','no download before entering the mall');
  p.start();assert.equal(audio.src,MALL_TRACKS[0].src);assert.equal(audio.loop,false);
  for(const index of [1,2,0]){audio.fire('ended');assert.equal(p.current().index,index);assert.equal(audio.paused,false);}
});
test('skip changes songs while paused without enabling playback, and Music resumes the selection',()=>{
  const audio=new Media(),p=createPlaylist(audio);p.start();p.toggle(false);
  const count=audio.plays;p.next();assert.equal(p.current().index,1);assert.equal(audio.plays,count);assert.equal(audio.paused,true);
  p.toggle(true);assert.equal(audio.paused,false);assert.equal(p.current().index,1);
});
test('broken songs are skipped, all failures stop instead of looping forever, and retry is possible',()=>{
  const audio=new Media(),p=createPlaylist(audio);p.start();
  audio.fire('error');assert.equal(p.current().index,1);
  audio.fire('error');assert.equal(p.current().index,2);
  audio.fire('error');assert.equal(p.current().enabled,false);assert.equal(audio.paused,true);assert.match(p.current().error,/unavailable/);
  p.toggle(true);assert.equal(p.current().enabled,true);assert.equal(p.current().error,'');
});
test('autoplay rejection can be retried and a stale play rejection cannot stop a newer song',async()=>{
  const audio=new Media();let reject;
  audio.play=()=>new Promise((_,fail)=>{reject=fail;});
  const p=createPlaylist(audio);p.start();const oldReject=reject;
  p.next();oldReject({name:'NotAllowedError'});await Promise.resolve();await Promise.resolve();
  assert.equal(p.current().enabled,true);
  reject({name:'NotAllowedError'});await Promise.resolve();await Promise.resolve();
  assert.equal(p.current().enabled,false);assert.match(p.current().error,/Tap Music/);
  audio.play=()=>Promise.resolve();p.toggle(true);assert.equal(p.current().enabled,true);
});
