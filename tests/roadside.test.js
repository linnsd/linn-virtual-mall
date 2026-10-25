import test from 'node:test';
import assert from 'node:assert/strict';
import {planRoadside,distanceToRoad} from '../lib/roadside.js';
import {SITES,ROAD_LINKS,roadPoints} from '../lib/sites.js';
function route(link){const points=roadPoints(link.key).map(([x,z])=>({x,z})),lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),len=lengths.reduce((a,b)=>a+b,0);
 const at=u=>{let left=u*len,i=0;while(i<lengths.length-1&&left>lengths[i])left-=lengths[i++];const k=Math.min(1,left/lengths[i]);return {x:points[i].x+(points[i+1].x-points[i].x)*k,z:points[i].z+(points[i+1].z-points[i].z)*k};};
 return {...link,len,pts200:Array.from({length:201},(_,i)=>at(i/200)),curve:{getPointAt:at,getTangentAt:u=>{const a=at(Math.max(0,u-.001)),b=at(Math.min(1,u+.001)),l=Math.hypot(b.x-a.x,b.z-a.z);return {x:(b.x-a.x)/l,z:(b.z-a.z)/l};}}};}
test('scenery fills all four roads while keeping buildings clear of roads, shops, water and one another',()=>{
 const routes=ROAD_LINKS.map(route),river={x:-53,z:-46,dx:1/Math.hypot(1,.35),dz:-.35/Math.hypot(1,.35)},occupied=[{x:-120,z:-145,r:12}],plan=planRoadside(routes,SITES,{river,occupied});
 assert.ok(plan.buildings.length>40);for(const r of routes)assert.ok(plan.buildings.some(b=>b.route===r.key),r.key);
 assert.deepEqual(plan,planRoadside(routes,SITES,{river,occupied}));assert.ok(plan.lamps.length>10);
 for(const [i,b] of plan.buildings.entries()){
  assert.ok(distanceToRoad(b,routes.map(r=>r.pts200))>8+b.radius);
  assert.ok(Math.abs((b.x-river.x)*-river.dz+(b.z-river.z)*river.dx)>9+b.radius);
  for(const o of occupied)assert.ok(Math.hypot(b.x-o.x,b.z-o.z)>b.radius+o.r+2);
  for(const other of plan.buildings.slice(i+1))assert.ok(Math.hypot(b.x-other.x,b.z-other.z)>b.radius+other.radius+3);
  for(const s of Object.values(SITES))assert.ok(Math.abs(b.x-s.ox)>=67+b.radius||b.z<=s.oz-(s.depth||22)-12-b.radius||b.z>=s.oz+29+b.radius);
 }
});
