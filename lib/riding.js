export const BIKE_HULL={halfWidth:.48,halfLength:1.12,height:1.45};
export function bikeParkingFor(site){const x=site.ox+24,z=site.oz+6.7;return {x,z,rot:0,exit:[x-1.2,z]};}
// Replace car-bay endpoints with bike-station approaches; keep the road's bends.
export function bikeRoutePoints(samples,from,to,reverse=false){
  const path=reverse?[...samples].reverse():samples;
  const a=bikeParkingFor(from),b=bikeParkingFor(to);
  const startZ=path[1].z<path[0].z?from.oz-4:from.oz+12.8,endZ=path.at(-2).z<path.at(-1).z?to.oz-4:to.oz+12.8;
  return [{x:a.x,z:a.z},{x:a.x,z:startZ},...path.slice(6,-6).map(p=>({x:p.x,z:p.z})),{x:b.x,z:endZ},{x:b.x,z:b.z}];
}
export function canParkBike(pose,site){const p=bikeParkingFor(site);return (pose.y||0)<.2&&Math.abs(pose.speed||0)<1.5&&Math.hypot(p.x-pose.x,p.z-pose.z)<2.3;}
