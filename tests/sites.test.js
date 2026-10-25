import test from 'node:test';
import assert from 'node:assert/strict';
import { SITES, SITE_IDS, ROAD_LINKS, destinations, nextHop, travelLeg, normalizeLocation, entranceOpen, roadPoints, siteSpawn, drivingLane } from '../lib/sites.js';
import { parkingFor } from '../lib/parking.js';
import { normalizeState } from '../supabase/realtime.js';

test('Shop 2 is one connected ground floor with three accessible front entrances',()=>{
  assert.equal(SITES[2].floors.length,1);
  for(const x of [-11.3,0,11.3]){assert.equal(entranceOpen(SITES[2],x),true);assert.equal(entranceOpen(SITES[2],x+2.3),false);}
  for(const x of [-17,-5.7,5.7,17])assert.equal(entranceOpen(SITES[2],x),false);
  assert.equal(entranceOpen(SITES[1],4),true);assert.equal(entranceOpen(SITES[1],0),false);
  const spawn=siteSpawn(2);assert.equal(spawn.site,2);assert.ok(entranceOpen(SITES[2],spawn.x-SITES[2].ox));
});
test('travel graph supports Shop 3 to Shop 2 and return, and routes Shop 1 via Shop 3',()=>{
  assert.deepEqual(destinations(3),[1,2]);assert.deepEqual(destinations(2),[3]);
  assert.equal(nextHop(1,2),3);assert.equal(nextHop(2,1),3);assert.equal(nextHop(3,2),2);
  assert.deepEqual([travelLeg(3,2).key,travelLeg(3,2).reverse],['3-2',false]);
  assert.equal(travelLeg(2,3).reverse,true);assert.equal(travelLeg(3,1).reverse,true);
  assert.equal(travelLeg(1,999),null);assert.equal(travelLeg(2,2),null);
});
test('both roads connect the correct parking bays and have finite waypoints',()=>{
  for(const road of ROAD_LINKS){
    const points=roadPoints(road.key),from=parkingFor(SITES[road.from]),to=parkingFor(SITES[road.to]);
    assert.deepEqual(points[0],[from.x,from.z]);assert.deepEqual(points.at(-1),[to.x,to.z]);
    assert.ok(points.every(p=>p.every(Number.isFinite)));
  }
  const road=roadPoints('3-2');assert.ok(Math.max(...road.slice(2,-2).map(p=>p[1]))>SITES[3].oz+50,'southern Taungnyo Road detour follows the supplied map shape');
});
test('realtime preserves Shop 2 and rejects nonexistent floors for every shop',()=>{
  const base={x:-300,y:0,z:-180,r:0,site:2,f:0};
  assert.equal(normalizeState(base).site,2);assert.equal(normalizeState({...base,f:1}).f,0);
  for(const id of SITE_IDS)for(let f=0;f<SITES[id].floors.length;f++)assert.deepEqual(normalizeLocation(id,f),{site:id,f});
  assert.deepEqual(normalizeLocation(999,90),{site:1,f:0});
});


test('automatic driving uses separated opposing lanes and joins parking without a sideways jump',()=>{
  assert.equal(Math.abs(drivingLane(false,0)),0);assert.equal(drivingLane(true,1),0);
  assert.equal(drivingLane(false,.5),-1.7);assert.equal(drivingLane(true,.5),1.7);
  for(let u=0;u<=1;u+=.01)assert.ok(Math.abs(drivingLane(false,u)+drivingLane(true,u))<1e-9);
  assert.ok(Math.abs(drivingLane(false,.001))<.03);
});

test('Shop 2 reference layout keeps all three entrances connected to departments and waiting seats',async()=>{
  const {buildShop2}=await import('../lib/shop2.js');
  const walls=[],places=[],seats=[],boxes=[];
  buildShop2({
    THREE:{MeshLambertMaterial:class{},TextureLoader:class{load(){}}},scene:{},site:SITES[2],
    box:(x,y,z,w,h,d,material)=>{assert.notEqual(material,undefined);boxes.push({x,y,z,w,h,d});return {rotation:{}};},
    plane:()=>({rotation:{},material:{}}),sign:()=>null,bas:c=>c,canvasTex:()=>null,drawLogo:()=>{},
    block:(x1,x2,z1,z2)=>walls.push({x1:x1-SITES[2].ox,x2:x2-SITES[2].ox,z1:z1-SITES[2].oz,z2:z2-SITES[2].oz}),
    corner:(id,name,f,x,z)=>places.push({id,name,f,x:x-SITES[2].ox,z:z-SITES[2].oz}),
    roofs:[],plant:()=>{},seats,addStaff:()=>{},mkM:()=>({}),mkW:()=>({}),
    actions:{service(){},sit(){}},screenTextures:[null]
  });
  const clear=(x,z)=>x> -16.5&&x<16.5&&z> -21.5&&z<3&&(!(z>-.5&&z<.5)||entranceOpen(SITES[2],x))&&!walls.some(w=>x>w.x1-.35&&x<w.x2+.35&&z>w.z1-.35&&z<w.z2+.35);
  // Reachability on a player-sized grid catches a counter/partition sealing
  // an entrance or the aisle connecting departments, without testing mesh counts.
  const visited=new Set(),queue=[[0,2]],key=(x,z)=>`${x},${z}`;
  for(let i=0;i<queue.length;i++){
    const [x,z]=queue[i];if(visited.has(key(x,z))||!clear(x,z))continue;
    visited.add(key(x,z));for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]])queue.push([x+dx,z+dz]);
  }
  for(const x of [-11.5,0,11.5])assert.ok(visited.has(key(x,1)),`entrance ${x} is accessible`);
  for(const id of ['laptop','acc','service','smart','seat']){
    const p=places.find(p=>p.id===id);assert.ok(p,`missing ${id}`);
    assert.ok(visited.has(key(Math.round(p.x*2)/2,Math.round(p.z*2)/2)),`${id} is reachable from every entrance`);
  }
  assert.equal(seats.length,4);assert.ok(seats.every(s=>s.site===2&&s.f===0&&s.z<SITES[2].oz-10),'waiting seats are behind the front reception desks');
  assert.equal(places.some(p=>p.id==='shop2-photo'),false);
  assert.equal(boxes.filter(b=>b.w>=30&&b.d>=20&&b.y>1).length,1,'only the ceiling slab sits above the single sales floor');
});
