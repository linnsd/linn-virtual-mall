import test from 'node:test';
import assert from 'node:assert/strict';
import { initialQuality, renderBudget } from '../lib/quality.js';

test('phones start in Lite, scarce memory and Save Data force Low even after an HD preference', () => {
  assert.equal(initialQuality({touch:true}),'lite');
  assert.equal(initialQuality({touch:true,memory:2,preference:'hd'}),'low');
  assert.equal(initialQuality({saveData:true,preference:'hd'}),'low');
  assert.equal(initialQuality({touch:false,cores:8}),'hd');
});

test('high-DPI phone and tablet render buffers stay within their pixel budgets', () => {
  for(const [width,height] of [[390,844],[768,1024],[1440,2960],[3840,2160]]){
    for(const [quality,cap] of [['lite',850000],['low',420000],['hd',2600000]]){
      const {ratio,fps}=renderBudget(quality,{width,height,dpr:3});
      assert.ok(width*height*ratio*ratio<=cap+1);
      assert.equal(fps,quality==='hd'?60:30);
    }
  }
});
