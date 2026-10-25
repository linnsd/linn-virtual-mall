export const MALL_TRACKS = [
  {title:'မီးပုံပွဲ',src:'assets/music/hlawn-paing-v1.m4a'},
  {title:'သီတင်းကျွတ်ညလေးတည',src:'assets/music/thadingyut-night-v1.mp3'},
  {title:'သီတင်းကျွတ်ဖူးစာ',src:'assets/music/thadingyut-phoo-sar-v1.mp3'},
  {title:'သီတင်းကျွတ်အထာ',src:'assets/music/nora-thindingyut-ahtar.m4a'}
];

// One media element and one Web Audio source for the entire playlist. Only the
// current song is fetched, and changing songs respects a paused Music button.
export function createPlaylist(audio, tracks=MALL_TRACKS, onChange=()=>{}) {
  if(!tracks.length) throw new Error('The playlist needs at least one song');
  let index=0, enabled=false, generation=0, error='', failures=new Set();
  audio.loop=false; audio.preload='none';
  const notify=()=>onChange({index,track:tracks[index],enabled,error});
  function play(){
    if(!enabled) return;
    const current=generation;
    Promise.resolve(audio.play()).catch(e=>{
      if(current!==generation||!enabled||e.name==='AbortError') return;
      // Loading/codec failures use the media error event to advance just once.
      if(e.name==='NotSupportedError') return;
      enabled=false; error='Tap Music to play'; notify();
    });
  }
  function select(next){
    generation++; index=(next+tracks.length)%tracks.length; error='';
    audio.pause(); audio.src=tracks[index].src; audio.load(); notify(); play();
  }
  function next(){ failures.clear(); select(index+1); }
  audio.addEventListener('ended',()=>{ if(enabled) next(); });
  audio.addEventListener('error',()=>{
    failures.add(index);
    if(failures.size>=tracks.length){ enabled=false; error='Music unavailable · tap to retry'; audio.pause(); notify(); return; }
    let nextIndex=(index+1)%tracks.length;
    while(failures.has(nextIndex)) nextIndex=(nextIndex+1)%tracks.length;
    select(nextIndex);
  });
  return {
    start(){ if(!audio.getAttribute('src')) select(index); this.toggle(true); },
    next,
    toggle(on){ const retry=!!error; generation++; enabled=!!on; error=''; if(on){ failures.clear(); if(retry) audio.load(); play(); }else audio.pause(); notify(); },
    current(){ return {index,track:tracks[index],enabled,error}; }
  };
}
