import test from 'node:test';
import assert from 'node:assert/strict';
import { renderVisitorStats } from '../lib/stats.js';

test('visitor metric HTML cannot become executable admin markup', () => {
  const payload='<img src=x onerror=alert(1)>';
  const html=renderVisitorStats([{day:'2026-10-27',coupons:payload,draws:payload,drives:payload,flights:payload,sits:payload,
    corners:{[payload]:payload},prizes:{[payload]:payload},asks:[{q:payload,staff:payload,site:payload}]}]);
  assert.equal(html.includes('<img'),false);
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('Coupons found: <b>0</b>'));
});

test('valid engagement totals stay numeric and malformed rows/dictionaries do not break stats', () => {
  const html=renderVisitorStats([null,{day:'invalid',coupons:100},{day:'2026-10-27',coupons:2,device:'phone',corners:{Phones:3},prizes:{Case:1},asks:'invalid'},
    {day:'2026-10-27',coupons:4,draws:-1,flights:Infinity,sits:'3',corners:['invalid'],prizes:null}]);
  assert.ok(html.includes('2 total, 1 on phones'));
  assert.ok(html.includes('Coupons found: <b>6</b>'));
  assert.ok(html.includes('Lucky draws: <b>0</b>'));
  assert.ok(html.includes('<span>Phones</span>'));
});

test('the actual Admin stats click handler uses safe rendering for legacy visitor rows', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const start=source.indexOf('      $("statsBtn").onclick = async () => {');
  const end=source.indexOf('      $("statsClose").onclick',start);
  assert.ok(start>=0 && end>start);
  const elements={}; const $=id=>elements[id]??={classList:{add(){}},textContent:'',innerHTML:''};
  const marker='<img src=x onerror=alert(1)>';
  const row={day:'2026-10-27',coupons:marker,corners:{Phones:marker},prizes:{Case:marker},asks:[]};
  const dbApi={collection:()=>({where:()=>({limit:()=>({get:async()=>({docs:[{data:()=>row}]})})})})};
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  new Function('$','dbApi','state','esc','renderVisitorStats',source.slice(start,end))($,dbApi,{},escape,renderVisitorStats);
  await $('statsBtn').onclick();
  assert.ok($('statBody').innerHTML.includes('Coupons found: <b>0</b>'));
  assert.equal($('statBody').innerHTML.includes('<img'),false);
});
