import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceCar, findCarContact, boxContact, CAR_HULL, drivingSpeed, autoDriveMustYield, waitsForAutoCrossing } from '../lib/driving.js';
const pose = { x:0,z:0,h:0,y:0,speed:0 };
const wall = { x:0,z:6,halfWidth:10,halfLength:0.08,height:10 };

test('a fast car cannot tunnel through a thin wall at low frame rates', () => {
  const world={boxes:[wall]}, hit=p=>findCarContact(p,world);
  let car={...pose,speed:60}; let impact=0;
  for(let i=0;i<5;i++){car=advanceCar(car,0.05,hit);impact=Math.max(impact,car.impact);}
  assert.ok(car.z+CAR_HULL.halfLength<=wall.z-wall.halfLength);
  assert.ok(impact>10);assert.ok(Math.abs(car.speed)<10);assert.equal(hit(car),null);
});

test('a glancing impact keeps tangential motion while dissipating energy', () => {
  const car={...pose,x:3.6,z:0,h:Math.PI/4,speed:15};
  const sideWall={x:7,z:0,halfWidth:0.08,halfLength:50,height:5};
  let next=car, max=0;
  for(let i=0;i<15;i++){next=advanceCar(next,0.03,p=>findCarContact(p,{boxes:[sideWall]}));max=Math.max(max,next.impact);}
  assert.ok(max>1);assert.ok(next.z>car.z);assert.ok(next.x<sideWall.x);
  assert.ok(Math.hypot(Math.sin(next.h)*next.speed+next.slideX,Math.cos(next.h)*next.speed+next.slideZ)<15);
});

test('car hulls catch rotated corners and allow reverse recovery after impact', () => {
  assert.ok(boxContact({...CAR_HULL,x:0,z:0,h:Math.PI/4},{...CAR_HULL,x:2.4,z:1,h:0}));
  const hit=p=>findCarContact(p,{boxes:[wall]});let car={...pose,speed:20};
  for(let i=0;i<10;i++) car=advanceCar(car,0.05,hit);
  const start=car.z;car.speed=-3;
  for(let i=0;i<10;i++) car=advanceCar(car,0.05,hit);
  assert.ok(car.z<start-1);assert.equal(hit(car),null);
});

test('parked and moving vehicle hulls collide only at the same altitude', () => {
  const vehicles=[{...CAR_HULL,x:0,z:4,h:Math.PI/2,y:0,velocity:{x:8,z:0}}];
  assert.equal(findCarContact({...pose,y:4},{vehicles}),null);
  const hit=findCarContact(pose,{vehicles});
  // At z=4 the sideways vehicle's front-to-side clearance is still positive.
  assert.equal(hit,null);
  assert.equal(findCarContact({...pose,z:1},{vehicles}).kind,'vehicle');
});

test('tree collision covers the hull centre and ignores obstacles below a flying car', () => {
  const circles=[{x:0,z:0,r:0.2,height:5}];
  assert.ok(findCarContact(pose,{circles}));
  assert.equal(findCarContact({...pose,y:6},{circles}),null);
});

test('braking stops without reversing, and opposite throttle brakes before reversing', () => {
  assert.equal(drivingSpeed(0.1,1,true,0.05),0);
  assert.equal(drivingSpeed(-0.1,0,true,0.05),-0);
  assert.ok(drivingSpeed(10,-1,false,0.05)>0);
  assert.ok(drivingSpeed(10,-1,false,0.05)<drivingSpeed(10,0,false,0.05));
});


test('auto rides yield before entering cross traffic and still fit parked bays',()=>{
  const crossing={x:0,z:5,h:Math.PI/2,y:0};
  assert.equal(findCarContact(pose,{vehicles:[crossing]}),null,'physical hulls are still clear');
  assert.equal(autoDriveMustYield(pose,[crossing]),true,'wait before blocking the crossing lane');
  assert.equal(autoDriveMustYield(pose,[{...crossing,x:10}]),false,'resume when the crossing clears');
  assert.equal(autoDriveMustYield(pose,[{x:3.6,z:0,h:0,y:0,parked:true}]),false,'marked adjacent bay remains usable');
  assert.equal(autoDriveMustYield({...pose,y:4},[crossing]),false,'flying cars do not block ground traffic');
  assert.equal(autoDriveMustYield(pose,[{x:3.4,z:0,h:Math.PI,y:0}]),false,'opposite road lanes remain separate');
  assert.equal(autoDriveMustYield(pose,[{x:0,z:-6,h:0,y:0,velocity:{x:0,z:9}}]),false,'a following car must not make the lead auto car stop');
  assert.equal(autoDriveMustYield(pose,[{x:0,z:-4,h:0,y:0}]),true,'physical overlaps still block even behind the player');
  assert.equal(autoDriveMustYield(pose,[{x:-12,z:5,h:Math.PI/2,y:0,velocity:{x:9,z:0}}]),true,'forecast approaching cross traffic before entering the lane');
});


test('street crossings let existing traffic clear while stopping new arrivals outside the auto route',()=>{
  const corridor=[{x:0,z:0,h:0},{x:0,z:4,h:0}];
  assert.equal(waitsForAutoCrossing({x:5,z:1,h:Math.PI/2},{x:4,z:1,h:Math.PI/2},corridor),true);
  assert.equal(waitsForAutoCrossing({x:0,z:1,h:Math.PI/2},{x:-1,z:1,h:Math.PI/2},corridor),false);
  assert.equal(waitsForAutoCrossing({x:8,z:1,h:Math.PI/2},{x:7,z:1,h:Math.PI/2},corridor),false);
});
