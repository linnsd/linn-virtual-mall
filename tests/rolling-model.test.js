import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizedAttributeValues,rollWheels,steerWheels} from '../lib/rolling-model.js';

test('quantized GLB vertices ignore interleaved padding and preserve signed coordinates and UVs',()=>{
 const p={array:new Int16Array([-32768,0,32767,1234,16384,-16384,0,5678]),count:2,itemSize:3,isInterleavedBufferAttribute:true,data:{stride:4},offset:0};
 const values=normalizedAttributeValues(p);assert.equal(values.length,6);assert.equal(values[0],-1);assert.equal(values[1],0);assert.equal(values[2],1);assert.ok(Math.abs(values[3]-.5)<.0001);assert.ok(values[4]<0);assert.equal(values[5],0);
 assert.deepEqual([...normalizedAttributeValues({array:new Uint16Array([0,65535]),count:1,itemSize:2})],[0,1]);
});
test('wheel rotation follows travel distance and radius, reverses, stops, and front wheels alone steer',()=>{
 const wheel=(front,radius)=>({front,radius,spin:{rotation:{x:0}},pivot:{rotation:{y:0}}}),wheels=[wheel(true,.36),wheel(false,.275)];
 rollWheels(wheels,Math.PI*.72);assert.ok(Math.abs(wheels[0].spin.rotation.x-Math.PI*2)<1e-9);assert.ok(wheels[1].spin.rotation.x>wheels[0].spin.rotation.x);
 const before=wheels[0].spin.rotation.x;rollWheels(wheels,0);rollWheels(wheels,NaN);assert.equal(wheels[0].spin.rotation.x,before);
 rollWheels(wheels,-Math.PI*.72);assert.ok(Math.abs(wheels[0].spin.rotation.x)<1e-9);
 steerWheels(wheels,1);assert.equal(wheels[0].pivot.rotation.y,.65);assert.equal(wheels[1].pivot.rotation.y,0);
});
