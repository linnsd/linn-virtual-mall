import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_ORDER, STAGE_HULL, stageStop, stageRoadLegs, stageWaypoints, audiencePositions, createStageTour } from '../lib/stage-tour.js';
import { SITES, ROAD_LINKS } from '../lib/sites.js';
import { parkingFor } from '../lib/parking.js';

test('the touring stage starts at Shop 3 and reaches all five shops through existing roads', () => {
  assert.equal(STAGE_ORDER[0],3);assert.deepEqual([...STAGE_ORDER].sort(),[1,2,3,4,5]);
  for(let i=0;i<STAGE_ORDER.length;i++){
    const from=STAGE_ORDER[i],to=STAGE_ORDER[(i+1)%STAGE_ORDER.length],legs=stageRoadLegs(from,to);
    assert.equal(legs[0].from,from);assert.equal(legs.at(-1).destination,to);
    for(const leg of legs)assert.ok(ROAD_LINKS.some(road=>road.key===leg.key));
    const points=stageWaypoints(from,to),start=stageStop(from),end=stageStop(to);
    assert.deepEqual(points[0],[start.x,start.z]);assert.deepEqual(points.at(-1),[end.x,end.z]);
    assert.ok(points.every(p=>p.every(Number.isFinite)));
    assert.ok(points.at(-1)[0]>points.at(-2)[0],'park facing east so the open stage faces the crowd');
  }
  assert.deepEqual(stageRoadLegs(4,5).map(leg=>leg.destination),[2,3,5]);
});

test('audiences and parked stages leave shop entrances, public street and car bays clear', () => {
  for(const site of STAGE_ORDER){
    const stop=stageStop(site),s=SITES[site],park=parkingFor(s);
    assert.ok(Math.abs(stop.x-park.x)>STAGE_HULL.halfLength+5);
    const people=audiencePositions(site);
    assert.equal(people.length,24);
    assert.ok(people.every(p=>p.z>s.oz+6&&p.z<s.oz+10));
    assert.ok(people.every(p=>Math.abs(p.x-(s.ox+s.entryX))>10));
    assert.ok(people.every(p=>p.z>stop.z+STAGE_HULL.halfWidth));
  }
});

test('the truck performs, waits for traffic, drives each leg and repeats the tour without teleporting', () => {
  const paths=STAGE_ORDER.map(()=>({length:2})),tour=createStageTour(paths,{showSeconds:.2,speed:5});
  assert.equal(tour.state().performing,true);
  tour.advance(.1);tour.advance(.1);assert.equal(tour.state().performing,false);
  tour.advance(.1,true);assert.equal(tour.state().distance,0);
  const arrivals=[];
  for(let i=0;i<100&&arrivals.length<5;i++){
    const before=tour.state(),after=tour.advance(.1);
    if(!before.performing&&after.performing)arrivals.push(after.site);
    if(before.site===after.site&&!after.performing)assert.ok(after.distance-before.distance<=.51);
  }
  assert.deepEqual(arrivals,[1,2,4,5,3]);
});

import { stageMustYield } from '../lib/stage-tour.js';
test('the long truck yields early to crossing traffic but can pass a pulled-over car', () => {
  const pose={...STAGE_HULL,x:0,z:0,h:0};
  assert.equal(stageMustYield(pose,[{x:5,z:7,h:Math.PI/2,parked:false}]),true);
  assert.equal(stageMustYield(pose,[{x:0,z:-8,h:0,parked:false}]),false,'following traffic must not stop the stage');
  assert.equal(stageMustYield(pose,[{x:7.5,z:2,h:0,parked:true}]),false);
  assert.equal(stageMustYield(pose,[{x:0,z:1,h:0,parked:true}]),true);
});

test('the actual vehicle collision world includes the stage without breaking bike stations', async () => {
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const start=source.indexOf('      function carWorld()'),end=source.indexOf('      function carBlocked(',start);
  const hull={...STAGE_HULL,x:-70,z:-235,h:Math.PI/2,y:0};
  const world=new Function('CARBOX','CIRC','TRAFFIC','MOTORS','NET','state','stageShow',source.slice(start,end)+';return carWorld();')([],[],[],new Map(),{peers:new Map()},{drive:null},{hull:()=>hull});
  assert.equal(world.vehicles.length,1);assert.equal(world.vehicles[0].kind,'stage-show');assert.equal(world.vehicles[0].height,5.6);
  const a=source.indexOf('      function updateRideStations()'),b=source.indexOf('      // ---- waiting areas',a);
  assert.doesNotThrow(()=>new Function('state','MOTORS','stageShow',source.slice(a,b)+';updateRideStations();')({drive:null},new Map(),{hull:()=>hull}));
});
