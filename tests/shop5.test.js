import test from 'node:test';
import assert from 'node:assert/strict';
import {buildShop5,shouldOpenShop5Entrance,shop5GroundHeight} from '../lib/shop5.js';
import {SITES,entranceOpen,siteSpawn,nextHop,travelLeg,normalizeLocation,roadPoints} from '../lib/sites.js';
import {parkingFor} from '../lib/parking.js';
import {normalizeState} from '../supabase/realtime.js';

function showroom(){
  const site=SITES[5],boxes=[],walls=[],places=[],seats=[];
  const room=buildShop5({THREE:{MeshLambertMaterial:class{}},site,
    box:(x,y,z,w,h,d,material)=>{assert.notEqual(material,undefined);const mesh={position:{x,y:y+h/2,z},rotation:{},userData:{staticBox:[w,h,d]}};boxes.push(mesh);return mesh;},
    plane:()=>({rotation:{}}),sign:()=>null,canvasTex:()=>null,drawLogo:()=>{},bas:c=>c,
    block:(x1,x2,z1,z2,f,id)=>{assert.equal(id,5);assert.equal(f,0);walls.push({x1:x1-site.ox,x2:x2-site.ox,z1:z1-site.oz,z2:z2-site.oz});},
    corner:(id,name,f,x,z,sub,extra)=>{assert.equal(f,0);places.push({id,name,x:x-site.ox,z:z-site.oz,...extra});},
    roofs:[],seats,addStaff:()=>{},mkM:()=>({}),mkW:()=>({}),actions:{service(){},sit(){},notice(){}},screenTextures:[null,null]
  });
  return {site,boxes,walls,places,seats,room};
}

test('Shop 5 is a single hall linked to Shop 3 in both directions',()=>{
  const s=SITES[5];assert.equal(s.floors.length,1);assert.ok(s.width>=34&&s.depth>=24);assert.equal(s.entrances.length,3);
  const spawn=siteSpawn(5);assert.ok(entranceOpen(s,spawn.x-s.ox));
  assert.equal(nextHop(4,5),2);assert.equal(nextHop(2,5),3);assert.equal(nextHop(1,5),3);assert.equal(nextHop(5,4),3);
  assert.equal(travelLeg(3,5).key,'3-5');assert.equal(travelLeg(5,3).reverse,true);
  const points=roadPoints('3-5');assert.deepEqual(points[0],[parkingFor(SITES[3]).x,parkingFor(SITES[3]).z]);assert.deepEqual(points.at(-1),[parkingFor(s).x,parkingFor(s).z]);
  assert.deepEqual(normalizeLocation(5,1),{site:5,f:0});assert.equal(normalizeState({x:s.ox,z:s.oz,y:0,r:0,site:5,f:0}).site,5);
});

test('all Shop 5 departments and room doorways can be reached around the hall furniture',()=>{
  const {site,walls,places,seats}=showroom();
  const clear=(x,z)=>x> -18.6&&x<18.6&&z> -25.6&&z<3&&(!(z>-.5&&z<.5)||entranceOpen(site,x))&&!walls.some(w=>x>w.x1-.35&&x<w.x2+.35&&z>w.z1-.35&&z<w.z2+.35);
  const key=(x,z)=>`${x},${z}`,seen=new Set(),queue=[[0,2]];
  for(let i=0;i<queue.length;i++){const [x,z]=queue[i];if(seen.has(key(x,z))||!clear(x,z))continue;seen.add(key(x,z));for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]])queue.push([x+dx,z+dz]);}
  for(const door of site.entrances)assert.ok(seen.has(key(Math.round(door.x*2)/2,-1)),`entrance ${door.x} connects to the hall`);
  for(const id of ['samsung','apple','tv','laptop','gaming','service','fridge','washer','office','wc','server','seat']){
    const p=places.find(p=>p.id===id);assert.ok(p,`${id} missing`);assert.equal(p.site,5);
    assert.ok(seen.has(key(Math.round(p.x*2)/2,Math.round(p.z*2)/2)),`${id} cannot be reached`);
  }
  assert.ok(seen.has(key(-5.5,-14)),'WC doorway actually leads inside the room');assert.ok(seen.has(key(12,-14)),'office doorway actually leads inside');
  for(let z=1;z>=-22;z-=.25)assert.ok(clear(0,z),`central approach blocked at ${z}`);
  assert.ok(places.find(p=>p.id==='samsung').x<0&&places.find(p=>p.id==='apple').x>0);
  for(const seat of seats)assert.ok(clear(seat.x-site.ox-Math.sin(seat.rot)*seat.standDistance,seat.z-site.oz-Math.cos(seat.rot)*seat.standDistance),'standing clears the table and other seats');
  assert.equal(places.some(p=>['lift','up','down'].includes(p.id)),false);
});

test('automatic glass doors respond to local and multiplayer visitors and close when clear',()=>{
  const {site,boxes,room}=showroom(),parts=boxes.filter(b=>b.userData.dynamic),initial=parts.map(p=>p.position.x);
  assert.ok(parts.length>=10,'door glass, frames and handles must stay movable');
  const near={started:true,site:5,x:site.ox,z:site.oz+4};
  assert.equal(shouldOpenShop5Entrance(near,site),true);assert.equal(shouldOpenShop5Entrance({...near,drive:{}},site),false);
  assert.equal(shouldOpenShop5Entrance({...near,site:3},site),false);
  room.update(1,near);assert.ok(parts.every((p,i)=>Math.abs(p.position.x-initial[i])>3));
  room.update(1,{...near,z:site.oz+10});assert.deepEqual(parts.map(p=>p.position.x),initial);
  room.update(1,{...near,site:3},[{pr:{site:5},x:site.ox,z:site.oz+2,d:false}]);assert.ok(parts.some((p,i)=>p.position.x!==initial[i]));
  room.update(1,{...near,site:3},[]);assert.deepEqual(parts.map(p=>p.position.x),initial);
});

 test('Shop 5 rear gallery rises through the central three-step approach and returns to the front floor',()=>{
 const s=SITES[5],h=(x,z)=>shop5GroundHeight(s.ox+x,s.oz+z,s);
 assert.equal(h(0,-10),0);assert.equal(h(0,-17.25),0);
 assert.ok(Math.abs(h(0,-17.75)-.15)<1e-9);assert.ok(Math.abs(h(0,-18.25)-.3)<1e-9);
 assert.equal(h(0,-19),.45);assert.equal(h(15,-23),.45);assert.equal(h(0,3),0);
 const {walls,places,seats}=showroom();
 assert.equal(walls.some(w=>0>w.x1-.35&&0<w.x2+.35&&-18.9>w.z1-.35&&-18.9<w.z2+.35),false);
 assert.ok(walls.some(w=>10>w.x1&&10<w.x2&&-18.9>w.z1&&-18.9<w.z2),'raised edge outside stairs is blocked');
 assert.ok(places.find(p=>p.id==='service').z<-19);assert.ok(seats.some(s=>s.y===.45));
 });
