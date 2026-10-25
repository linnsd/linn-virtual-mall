import { parkingFor } from './parking.js';
export const SITE_IDS=[1,3,2,4,5];
export const SITES={
  1:{ox:0,oz:0,name:'Shop 1',entryX:4,area:'Bogyoke Road',addr:'Shop 1, Bogyoke Road, Pyinmana',floors:['1F  Mobile Phone & TV','2F  IT & Home Appliances'],entrances:[{x:4,width:2.8}]},
  3:{ox:-60,oz:-240,name:'Shop 3',entryX:4,area:'Paung Laung',addr:'Shop 3, Paung Laung, Pyinmana · Head Office',floors:['1F  Mobile Phone & Accessories','2F  IT & Apple Devices','3F  Computer Training Center'],entrances:[{x:4,width:2.8}]},
  5:{ox:-180,oz:-640,width:38,depth:26,name:'Shop 5',entryX:0,area:'Ottarathiri',addr:'Shop 5, No.OS-16, Nyarna Dipa Quarter, Ottarathiri Township',floors:['1F  Premium Hall · Mobile · IT · Electronics'],entrances:[{x:-11.2,width:8},{x:0,width:6},{x:11.2,width:8}]},
  4:{ox:-615,oz:-310,width:11,depth:24,name:'Shop 4',entryX:-1.6,area:'Myoma Market',addr:'Shop 4, Pa.(231), Myoma Market, Naypyitaw',floors:['1F  Mobile · IT · Service · Electronics'],entrances:[{x:-2.75,width:3.5},{x:2.75,width:3.5}]},
  2:{ox:-300,oz:-180,name:'Shop 2',entryX:0,area:'Thapyagone',addr:'Shop 2, No.117, Thapyagone Quarter, Naypyitaw',floors:['1F  IT · Service · Mobile'],entrances:[{x:-11.3,width:4},{x:0,width:4},{x:11.3,width:4}],mapUrl:'https://www.google.com/maps/place/Linn+IT+%26+Mobile+Store/@19.7460121,96.1173986,17z/data=!3m1!4b1!4m5!3m4!1s0x30c8bc2897593097:0xe6b322be14967211!8m2!3d19.7460071!4d96.1195873'}
};
export const ROAD_LINKS=[{key:'1-3',from:1,to:3,label:'Bogyoke Road · Paung Laung'},{key:'3-2',from:3,to:2,label:'Paung Laung · Taungnyo Road · Thapyagone'},{key:'2-4',from:2,to:4,trafficStart:.44,trafficEnd:.68,label:'Thapyagone · Taungnyo Road · Myoma Market'},{key:'3-5',from:3,to:5,label:'Paung Laung · Railway Road · Ottarathiri Road'}];
export function destinations(site){return ROAD_LINKS.filter(r=>r.from===site||r.to===site).map(r=>r.from===site?r.to:r.from);}
// Breadth-first routing continues to work as branches require several transfers.
export function nextHop(from,to){
  if(!SITE_IDS.includes(from)||!SITE_IDS.includes(to))return null;
  if(from===to)return from;
  const visited=new Set([from]),queue=destinations(from).map(id=>({id,first:id}));
  for(let i=0;i<queue.length;i++){
    const {id,first}=queue[i];if(visited.has(id))continue;if(id===to)return first;visited.add(id);
    for(const next of destinations(id))if(!visited.has(next))queue.push({id:next,first});
  }
  return null;
}
export function travelLeg(from,to){const destination=nextHop(from,to),route=ROAD_LINKS.find(r=>(r.from===from&&r.to===destination)||(r.to===from&&r.from===destination));return route?{...route,destination,reverse:route.from!==from}:null;}
export function normalizeLocation(site,floor){const id=SITE_IDS.includes(site)?site:1;return {site:id,f:Number.isInteger(floor)&&floor>=0&&floor<SITES[id].floors.length?floor:0};}
export function entranceOpen(site,localX,radius=.35){return site.entrances.some(door=>Math.abs(localX-door.x)<door.width/2-radius);}
export function roadPoints(key){
  const p1=parkingFor(SITES[1]),p3=parkingFor(SITES[3]),p2=parkingFor(SITES[2]),p4=parkingFor(SITES[4]),p5=parkingFor(SITES[5]);
  if(key==='1-3')return [[p1.x,p1.z],[29,12.8],[9,12.8],[-12,15.2],[-38,15.6],[-49,8],[-53,-12],[-52,-38],[-55,-62],[-64,-92],[-76,-122],[-82,-154],[-79,-186],[-73,-206],[-70,-219],[-62,-226.4],[-51,-227.2],[-31,-227.2],[p3.x,p3.z]];
  if(key==='3-2')return [[p3.x,p3.z],[-31,-225],[-10,-224],[-6,-210],[-7,-189],[-10,-172],[-28,-166],[-74,-166],[-113,-168],[-141,-161],[-167,-145],[-190,-140],[-214,-144],[-237,-155],[-250,-165],[-270,-164],[p2.x,p2.z]];
  if(key==='2-4')return [[p2.x,p2.z],[-271,-183],[-253,-184],[-230,-184],[-224,-174],[-226,-164],[-247,-164],[-280,-164],[-318,-164],[-347,-164],[-382,-170],[-414,-176],[-446,-181],[-482,-186],[-519,-193],[-550,-203],[-577,-213],[-601,-224],[-629,-230],[-654,-235],[-686,-252],[-690,-276],[-686,-294],[-665,-294],[-632,-294],[-605,-294],[-586,-294],[-586,-299],[p4.x,p4.z]];
  if(key==='3-5')return [[p3.x,p3.z],[-31,-226],[-17,-224],[2,-224],[15,-232],[18,-260],[18,-288],[12,-322],[9,-375],[9,-431],[5,-480],[-4,-510],[-27,-527],[-67,-530],[-105,-538],[-125,-557],[-127,-590],[-128,-611],[-143,-621],[-151,-622],[-151,-626],[p5.x,p5.z]];
  throw new Error('Unknown road '+key);
}

export function siteSpawn(id){const s=SITES[id]||SITES[1];return {site:SITE_IDS.includes(id)?id:1,x:s.ox+s.entryX,z:s.oz+7};}

export function drivingLane(reverse,u){return (reverse?1.7:-1.7)*Math.max(0,Math.min(1,u/.08,(1-u)/.08));}
