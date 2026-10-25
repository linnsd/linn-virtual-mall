import test from 'node:test';
import assert from 'node:assert/strict';
import { parkingFor } from '../lib/parking.js';
import { CAR_HULL, findCarContact } from '../lib/driving.js';

test('parking bays fit car hulls off the street and exits are outside occupied bays', () => {
  for(const site of [{ox:0,oz:0},{ox:-60,oz:-240}]){
    const park=parkingFor(site),cars=park.bays.map(bay=>({...CAR_HULL,...bay,h:park.rot,y:0}));
    assert.ok(park.z+CAR_HULL.halfLength<site.oz+10);
    assert.ok(Math.abs(park.exit[0]-park.x)>CAR_HULL.halfWidth+.35);
    for(let i=0;i<cars.length;i++) assert.equal(findCarContact(cars[i],{vehicles:cars.filter((_,j)=>j!==i)}),null);
  }
});
