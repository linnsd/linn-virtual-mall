import test from 'node:test';
import assert from 'node:assert/strict';
import {vehicleAppearance,VEHICLE_PROFILES,VEHICLE_COLORS} from '../lib/vehicles.js';
import {CAR_HULL,findCarContact,autoDriveMustYield} from '../lib/driving.js';

test('traffic and parking sequences mix all four silhouettes and twelve paints without adjacent duplicates',()=>{
  const fleet=Array.from({length:48},(_,i)=>vehicleAppearance(i));
  assert.equal(new Set(fleet.map(v=>v.profile.id)).size,4);
  assert.equal(new Set(fleet.map(v=>v.color)).size,12);
  assert.equal(new Set(fleet.map(v=>`${v.profile.id}:${v.color}`)).size,48);
  for(let i=1;i<fleet.length;i++){assert.notEqual(fleet[i].profile.id,fleet[i-1].profile.id);assert.notEqual(fleet[i].color,fleet[i-1].color);}
  for(const v of fleet)assert.ok(VEHICLE_COLORS.includes(v.color));
});
test('peer appearance is stable and every vehicle fits the existing lane and parking footprint',()=>{
  assert.deepEqual(vehicleAppearance('peer-123'),vehicleAppearance('peer-123'));
  for(const seed of [-21,NaN,undefined,'remote-guest']){const v=vehicleAppearance(seed);assert.ok(v.profile);assert.ok(VEHICLE_COLORS.includes(v.color));}
  for(const p of VEHICLE_PROFILES){assert.ok(p.width/2+.08<=CAR_HULL.halfWidth);assert.ok(p.length/2+.06<=CAR_HULL.halfLength);}
});
test('flying cars must clear the taller SUV roof before ignoring collisions',()=>{
  const pose={x:0,z:0,h:0,y:1.7},vehicles=[{x:0,z:0,h:0,y:0,height:1.92}];
  assert.ok(findCarContact(pose,{vehicles}));assert.ok(autoDriveMustYield(pose,vehicles));
  assert.equal(findCarContact({...pose,y:2},{vehicles}),null);assert.equal(autoDriveMustYield({...pose,y:2},vehicles),false);
});
