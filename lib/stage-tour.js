import { SITES, travelLeg, roadPoints } from './sites.js';
import { CAR_HULL, boxContact } from './driving.js';
export const STAGE_ORDER = [3, 1, 2, 4, 5];
export const STAGE_HULL = { halfWidth: 1.42, halfLength: 4.1, height: 5.6 };
export function stageStop(site) { const s = SITES[site]; return { site, x: s.ox + (site === 3 ? -10 : -40), z: s.oz + (site === 3 ? 4.3 : 3.8), h: Math.PI / 2 }; }
export function stageRoadLegs(from, to) {
  const result = []; let current = from;
  while (current !== to && result.length < 8) {
    const leg = travelLeg(current, to); if (!leg) throw new Error('Stage route unavailable');
    result.push({ ...leg, from: current }); current = leg.destination;
  }
  if (current !== to) throw new Error('Stage route cycle');
  return result;
}

// All transfers use the existing road graph. Join on the street, never the car bays.
export function stageWaypoints(from, to) {
  const legs = stageRoadLegs(from, to), start = stageStop(from), end = stageStop(to);
  const roads = legs.map(leg => {
    const points = roadPoints(leg.key).slice(1, -1);
    return leg.reverse ? points.reverse() : points;
  });
  function anchor(points, site, stop, atStart) {
    const s = SITES[site], candidates = [];
    points.forEach((p, i) => {
      if ((atStart ? i < 7 : i >= points.length - 7) && Math.abs(p[0] - s.ox) < 60 && p[1] > s.oz + 10 && p[1] < s.oz + 23) candidates.push(i);
    });
    return candidates.sort((a,b) => Math.hypot(points[a][0]-stop.x,points[a][1]-stop.z)-Math.hypot(points[b][0]-stop.x,points[b][1]-stop.z))[0] ?? (atStart ? 0 : points.length - 1);
  }
  roads[0] = roads[0].slice(anchor(roads[0], from, start, true));
  const last = roads.length - 1; roads[last] = roads[last].slice(0, anchor(roads[last], to, end, false) + 1);
  const points = [[start.x,start.z],[start.x+3,start.z],[start.x+7,start.z+3],[start.x+8,start.z+9],
    ...roads.flat(),[end.x-7,end.z+9],[end.x-7,end.z+3],[end.x-3,end.z],[end.x,end.z]];
  return points.filter((p,i) => !i || Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]) > .05);
}

export function createStageTour(paths, { showSeconds = 70, speed = 6 } = {}) {
  let index = 0, elapsed = 0, distance = 0, performing = true;
  const current = () => ({ site: STAGE_ORDER[index], next: STAGE_ORDER[(index+1)%STAGE_ORDER.length], performing, elapsed, distance, path: paths[index] });
  return {
    state: current,
    advance(dt, blocked = false) {
      dt = Math.max(0, Math.min(.1, dt));
      if (performing) { elapsed += dt; if (elapsed >= showSeconds) { performing = false; elapsed = 0; distance = 0; } }
      else if (!blocked) {
        distance = Math.min(paths[index].length, distance + dt * speed);
        if (distance >= paths[index].length) { index = (index+1)%STAGE_ORDER.length; distance = 0; performing = true; elapsed = 0; }
      }
      return current();
    },
  };
}

export function audiencePositions(site, count = 24) {
  const stop = stageStop(site);
  return Array.from({length:count},(_,i) => ({ x: stop.x + (i%8-3.5)*.83, z: stop.z+2.8+Math.floor(i/8)*1.05, phase:i*.73 }));
}

// A long turning truck needs room beyond a car-sized stopping margin. Let
// vehicles already in the reserved junction clear before entering it.
export function stageMustYield(pose, vehicles) {
  for (const vehicle of vehicles) {
    const distance = Math.hypot(pose.x-vehicle.x,pose.z-vehicle.z);
    if (distance > 14) continue;
    const behind = (vehicle.x-pose.x)*Math.sin(pose.h)+(vehicle.z-pose.z)*Math.cos(pose.h)<0;
    if (vehicle.parked) { if (boxContact(pose,{...CAR_HULL,...vehicle})) return true; continue; }
    if (behind && Math.cos(vehicle.h-pose.h)>.5 && !boxContact(pose,{...CAR_HULL,...vehicle})) continue;
    if (distance < 12 || boxContact(pose,{...CAR_HULL,...vehicle})) return true;
  }
  return false;
}
