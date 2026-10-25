import test from 'node:test';
import assert from 'node:assert/strict';
import {BIKE_HULL,bikeParkingFor,bikeRoutePoints,canParkBike} from '../lib/riding.js';
import {SITES,ROAD_LINKS,roadPoints} from '../lib/sites.js';
import {parkingFor} from '../lib/parking.js';
import {findCarContact,advanceCar,CAR_HULL} from '../lib/driving.js';
import {normalizeState} from '../supabase/realtime.js';

test('every shop has a bike station with clear dismount space beside the car bays',()=>{
 for(const s of Object.values(SITES)){
  const p=bikeParkingFor(s),car=parkingFor(s);
  assert.ok(p.x+BIKE_HULL.halfWidth<car.x-CAR_HULL.halfWidth);
  assert.ok(p.exit[0]<p.x-BIKE_HULL.halfWidth-.35);
  assert.equal(canParkBike({...p,speed:0},s),true);assert.equal(canParkBike({...p,speed:3},s),false);assert.equal(canParkBike({...p,y:2},s),false);
 }
});
test('bike trips preserve each road and use bike endpoints in both directions',()=>{
 for(const r of ROAD_LINKS)for(const reverse of [false,true]){
  const samples=roadPoints(r.key).flatMap(([x,z],i,a)=>i===a.length-1?[]:Array.from({length:12},(_,j)=>({x:x+(a[i+1][0]-x)*j/12,z:z+(a[i+1][1]-z)*j/12}))).concat([{x:roadPoints(r.key).at(-1)[0],z:roadPoints(r.key).at(-1)[1]}]);
  const from=SITES[reverse?r.to:r.from],to=SITES[reverse?r.from:r.to],path=bikeRoutePoints(samples,from,to,reverse);
  const a=bikeParkingFor(from),b=bikeParkingFor(to);assert.deepEqual(path[0],{x:a.x,z:a.z});assert.deepEqual(path.at(-1),{x:b.x,z:b.z});assert.ok(path.length>20);
 }
});
test('narrow bike hull passes a lane gap a car cannot and still collides with barriers',()=>{
 const world={boxes:[{x:-1,z:0,halfWidth:.3,halfLength:10,height:3},{x:1,z:0,halfWidth:.3,halfLength:10,height:3}]};
 assert.equal(findCarContact({...BIKE_HULL,x:0,z:0,h:0,y:0},world),null);
 assert.ok(findCarContact({x:0,z:0,h:0,y:0},world));
 let pose={...BIKE_HULL,x:0,z:-5,h:0,y:0,speed:20};
 for(let i=0;i<30;i++)pose=advanceCar(pose,.05,p=>findCarContact(p,{boxes:[{x:0,z:0,halfWidth:3,halfLength:.05,height:3}]}));
 assert.ok(pose.z+BIKE_HULL.halfLength<=-.05);
});
test('presence preserves bike rides and rejects arbitrary vehicle kinds',()=>{
 const p={x:1,y:0,z:1,r:0,d:1,v:'bike'};assert.equal(normalizeState(p).v,'bike');
 assert.equal(normalizeState({...p,v:'plane'}).v,undefined);assert.equal(normalizeState({...p,d:0}).v,undefined);
});
