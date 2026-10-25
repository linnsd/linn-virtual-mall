import test from 'node:test';
import assert from 'node:assert/strict';
import { clothingRegion, clothingColors } from '../lib/clothing.js';
import { normalizeState } from '../supabase/realtime.js';

test('clothing masks keep skin, hands, hair and shoes out of both colour regions',()=>{
  for(const sex of ['m','f']) for(const bone of ['Head','head_end','neck','LeftHand','RightFoot','LeftToeBase'])
    assert.deepEqual(clothingRegion(.7,bone,sex),[0,0]);
  assert.deepEqual(clothingRegion(.7,'Spine01','m'),[1,0]);
  assert.deepEqual(clothingRegion(.5,'LeftForeArm','m'),[1,0]);
  assert.deepEqual(clothingRegion(.3,'LeftLeg','m'),[0,1]);
  assert.deepEqual(clothingRegion(.55,'Hips','f'),[0,1],'female skirt extends higher than trousers');
  assert.deepEqual(clothingRegion(.2,'LeftLeg','f'),[0,0],'bare lower legs keep original skin');
});

test('original colours reset independently, and invalid network values cannot enable a tint',()=>{
  assert.deepEqual(clothingColors(),{});
  assert.deepEqual(clothingColors({topColor:null,bottomColor:0}),{bottomColor:0});
  assert.deepEqual(clothingColors({topColor:0xffffff,bottomColor:0x123456}),{topColor:0xffffff,bottomColor:0x123456});
  for(const bad of [-1,0x1000000,NaN,Infinity,'red',1.5]) assert.deepEqual(clothingColors({topColor:bad}),{});
});

test('realistic clothing survives the realtime state boundary, including independent reset',()=>{
  const input={n:'Guest',s:'f',l:'real',x:1,y:0,z:7,r:0,c:{topColor:0xc8323a,bottomColor:0xb59a73}};
  assert.deepEqual(normalizeState(input).c,input.c);
  assert.deepEqual(normalizeState({...input,c:clothingColors({bottomColor:0})}).c,{bottomColor:0});
  assert.deepEqual(normalizeState({...input,c:{}}).c,{});
});
