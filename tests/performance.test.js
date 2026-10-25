import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameSamples, performanceOptions } from '../lib/performance.js';
import { classifyBounds, floorVisible, canBatchBox } from '../lib/scene-optimization.js';
const sites={1:{ox:0,oz:0,floors:[1,2]},3:{ox:-60,oz:-240,floors:[1,2,3]}};
const bounds=(min,max)=>({min:{x:min[0],y:min[1],z:min[2]},max:{x:max[0],y:max[1],z:max[2]}});

test('performance capture is bounded and reports actual frame intervals separately from CPU work',()=>{
  const sample=new FrameSamples(20);
  for(let i=0;i<20;i++)sample.add({frameMs:i===19?100:20,cpuMs:4,drawCalls:100,triangles:1200,updateMs:1,renderMs:3});
  const s=sample.summary();assert.equal(s.samples,20);assert.equal(s.frameP95,20);assert.equal(s.cpuMs,4);assert.equal(s.framesOver50ms,1);assert.ok(s.fps<50);
  sample.add({frameMs:10,cpuMs:2});assert.equal(sample.summary().samples,20);
  sample.add({frameMs:NaN});sample.add({frameMs:-1});assert.equal(sample.summary().samples,20);
  sample.reset();assert.deepEqual(sample.summary(),{samples:0});
  sample.add({frameMs:1500,cpuMs:1400});assert.equal(sample.summary().framesOver50ms,1,'real long freezes must not be hidden');
});
test('normal visits keep optimizations enabled and only explicit diagnostics can disable them',()=>{
  assert.deepEqual(performanceOptions('?batch=0&cull=0'),{enabled:false,batching:true,culling:true});
  assert.deepEqual(performanceOptions('?perf=1&batch=0&cull=0'),{enabled:true,batching:false,culling:false});
});
test('interior fixtures get the correct shop and floor while slabs and facades keep cross-floor visibility',()=>{
  assert.equal(classifyBounds(bounds([-5,5,-15],[-4,6,-14]),sites).floor,1);
  const third=classifyBounds(bounds([-65,9.5,-255],[-64,11,-254]),sites);assert.equal(third.site,3);assert.equal(third.floor,2);
  assert.equal(classifyBounds(bounds([-5,4.4,-15],[5,4.7,-5]),sites).floor,null,'slabs must never disappear with their upper floor');
  assert.equal(classifyBounds(bounds([-5,9.5,-.2],[5,11,0]),sites).site,null,'facade remains visible from the street');
});
test('floor culling preserves adjacent floors, outside views, overview and lift/escalator transitions',()=>{
  const context={state:{site:3,started:true,x:-60,z:-250,f:0},camera:{x:-60,y:2,z:-249},sites};
  assert.equal(floorVisible({site:3,floor:2},context),false);
  assert.equal(floorVisible({site:3,floor:1},context),true);
  for(const extra of [{overview:true},{camera:{x:-60,y:2,z:-238}},{state:{...context.state,ride:{}}},{state:{...context.state,drive:{}}}])
    assert.equal(floorVisible({site:3,floor:2},{...context,...extra}),true);
  assert.equal(floorVisible({site:3,floor:null},context),true);
  assert.equal(floorVisible({site:3,floor:2},{...context,wells:[{site:3,ox:-60,oz:-240,x0:-2,x1:2,zT:-12,zB:-6}]}),true,'keep upper-floor views open near escalator wells');
});
test('batching excludes glass, movable doors, visibility-controlled roofs and mirrored or invalid boxes',()=>{
  const box={userData:{staticBox:[1,2,3]},material:{transparent:false,opacity:1},visible:true,scale:{x:1,y:1,z:1}};
  assert.equal(canBatchBox(box),true);
  for(const changed of [{userData:{...box.userData,dynamic:true}},{userData:{...box.userData,noBatch:true}},{material:{transparent:true,opacity:.2}},{scale:{x:-1,y:1,z:1}},{userData:{staticBox:[0,2,3]}}])
    assert.equal(canBatchBox({...box,...changed}),false);
});

test('compact Shop 4 culling uses the narrow walls and full interior depth',async()=>{
  const {SITES}=await import('../lib/sites.js'),s=SITES[4];
  const rear=classifyBounds(bounds([s.ox-.5,.1,s.oz-23.3],[s.ox,2,s.oz-22.8]),SITES);
  assert.equal(rear.site,4);assert.equal(rear.floor,0,'deep rear fixtures belong to the ground floor');
  const neighbour=classifyBounds(bounds([s.ox+6,.1,s.oz-5],[s.ox+6.5,2,s.oz-4.5]),SITES);
  assert.equal(neighbour.site,null,'neighbouring market units are outside the narrow shop');
});
