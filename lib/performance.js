export function performanceOptions(search='') {
  const query=new URLSearchParams(search),enabled=query.get('perf')==='1';
  return {enabled,culling:!enabled||query.get('cull')!=='0',batching:!enabled||query.get('batch')!=='0'};
}
export class FrameSamples {
  constructor(capacity=240){this.capacity=capacity;this.samples=[];}
  reset(){this.samples.length=0;}
  add(sample){if(!Number.isFinite(sample.frameMs)||sample.frameMs<=0)return;this.samples.push(sample);if(this.samples.length>this.capacity)this.samples.shift();}
  summary(){
    const samples=this.samples,n=samples.length;if(!n)return {samples:0};
    const avg=key=>samples.reduce((sum,s)=>sum+(s[key]||0),0)/n;
    const percentile=key=>samples.map(s=>s[key]||0).sort((a,b)=>a-b)[Math.ceil(n*.95)-1];
    return {samples:n,fps:1000/avg('frameMs'),frameP95:percentile('frameMs'),cpuMs:avg('cpuMs'),cpuP95:percentile('cpuMs'),updateMs:avg('updateMs'),renderMs:avg('renderMs'),drawCalls:avg('drawCalls'),triangles:avg('triangles'),framesOver50ms:samples.filter(s=>s.frameMs>50).length};
  }
}
export function createPerformanceReporter({enabled,renderer,options}){
  if(!enabled)return {record(){},reset(){}};
  const samples=new FrameSamples();let lastPaint=0,configuration="";
  const panel=document.createElement('details');panel.id='perfPanel';panel.className='hud';panel.open=false;
  panel.style.cssText='position:fixed;z-index:20;left:12px;bottom:110px;max-width:calc(100vw - 24px);width:355px;padding:10px;background:#101b30ee;color:#fff;border:1px solid #7fd38e;border-radius:10px;font:12px/1.5 monospace;user-select:text';
  panel.innerHTML='<summary>Performance · CPU timings, not GPU timings</summary><div>Scenario: <select id="perfScenario"><option>Standing</option><option>Walking</option><option>Driving</option><option>Multiplayer</option></select> <button id="perfReset" type="button">Reset</button> <button id="perfExport" type="button">Export JSON</button></div><pre id="perfReadout" style="white-space:pre-wrap;margin:8px 0 0"></pre>';
  for(const control of panel.querySelectorAll('select,button'))control.style.cssText='font:inherit;color:#10223b;background:#fff;border:1px solid #91a1b6;border-radius:4px;padding:2px 4px';
  document.body.append(panel);
  const scenario=panel.querySelector('select'),readout=panel.querySelector('pre');let report={};
  const reset=()=>{samples.reset();lastPaint=0;};
  panel.querySelector('#perfReset').onclick=reset;scenario.onchange=reset;
  panel.querySelector('#perfExport').onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='mall-performance.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  panel.addEventListener('keydown',event=>event.stopPropagation());
  return {reset,record(sample,context){
    const key=`${context.quality}:${innerWidth}:${innerHeight}:${renderer.getPixelRatio()}`;
    if(key!==configuration){samples.reset();configuration=key;}
    samples.add(sample);if(sample.at-lastPaint<500)return;lastPaint=sample.at;
    const stats=samples.summary();report={...context,scenario:scenario.value,options,...stats,memory:{...renderer.info.memory},pixelRatio:renderer.getPixelRatio(),viewport:[innerWidth,innerHeight],collectedAt:new Date().toISOString()};
    const f=n=>Number(n||0).toFixed(1);
    readout.textContent=`${scenario.value} · ${context.quality} · site ${context.site} / ${context.floor+1}F\nCull ${options.culling?'ON':'OFF'} · Batch ${options.batching?'ON':'OFF'}\nFPS ${f(stats.fps)} · frame p95 ${f(stats.frameP95)} ms\nCPU ${f(stats.cpuMs)} ms · p95 ${f(stats.cpuP95)} ms\nUpdate ${f(stats.updateMs)} · render submit ${f(stats.renderMs)} ms\nDraw calls ${f(stats.drawCalls)} · triangles ${Math.round(stats.triangles||0)}\n>50 ms frames ${stats.framesOver50ms||0} / ${stats.samples}\nGeometries ${renderer.info.memory.geometries} · textures ${renderer.info.memory.textures}\nPeers ${context.peers} · hidden zones ${context.hiddenZones||0}\nBatched boxes ${context.batchedMeshes||0} → ${context.batches||0} batches\nLantern parts ${context.animatedParts||0} → ${context.animatedBatches||0} batches`;
  }};
}
