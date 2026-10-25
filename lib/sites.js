import { parkingFor } from './parking.js';
export const SITE_IDS=[1,3,2];
export const SITES={
  1:{ox:0,oz:0,name:'Shop 1',entryX:4,area:'Bogyoke Road',addr:'Shop 1, Bogyoke Road, Pyinmana',floors:['1F  Mobile Phone & TV','2F  IT & Home Appliances'],entrances:[{x:4,width:2.8}]},
  3:{ox:-60,oz:-240,name:'Shop 3',entryX:4,area:'Paung Laung',addr:'Shop 3, Paung Laung, Pyinmana · Head Office',floors:['1F  Mobile Phone & Accessories','2F  IT & Apple Devices','3F  Computer Training Center'],entrances:[{x:4,width:2.8}]},
  2:{ox:-300,oz:-180,name:'Shop 2',entryX:0,area:'Thapyagone',addr:'Shop 2, No.117, Thapyagone Quarter, Naypyitaw',floors:['1F  IT · Service · Mobile'],entrances:[{x:-11.3,width:4},{x:0,width:4},{x:11.3,width:4}],mapUrl:'https://www.google.com/maps/place/Linn+IT+%26+Mobile+Store/@19.7460121,96.1173986,17z/data=!3m1!4b1!4m5!3m4!1s0x30c8bc2897593097:0xe6b322be14967211!8m2!3d19.7460071!4d96.1195873'}
};
export const ROAD_LINKS=[{key:'1-3',from:1,to:3,label:'Bogyoke Road · Paung Laung'},{key:'3-2',from:3,to:2,label:'Paung Laung · Taungnyo Road · Thapyagone'}];
export function destinations(site){return ROAD_LINKS.filter(r=>r.from===site||r.to===site).map(r=>r.from===site?r.to:r.from);}
export function nextHop(from,to){if(from===to)return from;return destinations(from).includes(to)?to:destinations(from).find(id=>destinations(id).includes(to))??null;}
export function travelLeg(from,to){const destination=nextHop(from,to),route=ROAD_LINKS.find(r=>(r.from===from&&r.to===destination)||(r.to===from&&r.from===destination));return route?{...route,destination,reverse:route.from!==from}:null;}
export function normalizeLocation(site,floor){const id=SITE_IDS.includes(site)?site:1;return {site:id,f:Number.isInteger(floor)&&floor>=0&&floor<SITES[id].floors.length?floor:0};}
export function entranceOpen(site,localX,radius=.35){return site.entrances.some(door=>Math.abs(localX-door.x)<door.width/2-radius);}
export function roadPoints(key){
  const p1=parkingFor(SITES[1]),p3=parkingFor(SITES[3]),p2=parkingFor(SITES[2]);
  if(key==='1-3')return [[p1.x,p1.z],[29,12.8],[9,12.8],[-12,15.2],[-38,15.6],[-49,8],[-53,-12],[-52,-38],[-55,-62],[-64,-92],[-76,-122],[-82,-154],[-79,-186],[-73,-206],[-70,-219],[-62,-226.4],[-51,-227.2],[-31,-227.2],[p3.x,p3.z]];
  if(key==='3-2')return [[p3.x,p3.z],[-31,-225],[-10,-224],[-6,-210],[-7,-189],[-10,-172],[-28,-166],[-74,-166],[-113,-168],[-141,-161],[-167,-145],[-190,-140],[-214,-144],[-237,-155],[-250,-165],[-270,-164],[p2.x,p2.z]];
  throw new Error('Unknown road '+key);
}

export function siteSpawn(id){const s=SITES[id]||SITES[1];return {site:SITE_IDS.includes(id)?id:1,x:s.ox+s.entryX,z:s.oz+7};}

export function drivingLane(reverse,u){return (reverse?1.7:-1.7)*Math.max(0,Math.min(1,u/.08,(1-u)/.08));}
