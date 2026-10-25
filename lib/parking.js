// Parking bay coordinates shared by navigation, traffic and the player car.
export const PARKING_BAYS = [29, 32.6, 36.2];
export function parkingFor(site) {
  const x=site.ox+PARKING_BAYS[0],z=site.oz+6.7;
  return {x,z,rot:0,exit:[x-2.2,z],bays:PARKING_BAYS.map(offset=>({x:site.ox+offset,z}))};
}
