// Lightweight oriented car hulls. Metres, radians, seconds; no rendering dependency.
export const CAR_HULL = { halfWidth: 1.04, halfLength: 2.58, height: 1.55 };
const axes = h => [{ x: Math.cos(h), z: -Math.sin(h) }, { x: Math.sin(h), z: Math.cos(h) }];
const dot = (a, b) => a.x * b.x + a.z * b.z;
const radius = (hull, basis, axis) => hull.halfWidth * Math.abs(dot(basis[0], axis)) + hull.halfLength * Math.abs(dot(basis[1], axis));
export function boxContact(car, box) {
  const a = axes(car.h), b = axes(box.h || 0), offset = { x: car.x - box.x, z: car.z - box.z };
  let depth = Infinity, normal;
  for (const axis of [...a, ...b]) {
    const overlap = radius(car, a, axis) + radius(box, b, axis) - Math.abs(dot(offset, axis));
    if (overlap <= 0) return null;
    if (overlap < depth) { depth = overlap; const sign = dot(offset, axis) < 0 ? -1 : 1; normal = { x: axis.x * sign, z: axis.z * sign }; }
  }
  return { ...normal, depth, velocity: box.velocity || { x: 0, z: 0 }, kind: box.kind || 'wall' };
}
export function circleContact(car, circle) {
  const [right, forward] = axes(car.h), offset = { x: circle.x - car.x, z: circle.z - car.z };
  const x = dot(offset, right), z = dot(offset, forward);
  const cx = Math.max(-car.halfWidth, Math.min(car.halfWidth, x)), cz = Math.max(-car.halfLength, Math.min(car.halfLength, z));
  const dx = cx - x, dz = cz - z, distance = Math.hypot(dx, dz);
  if (distance >= circle.r) return null;
  if (distance > 1e-8) return { x: (right.x * dx + forward.x * dz) / distance, z: (right.z * dx + forward.z * dz) / distance, depth: circle.r - distance, kind: 'obstacle' };
  // Circle centre inside the hull: push toward the nearest hull edge.
  const side = car.halfWidth - Math.abs(x) < car.halfLength - Math.abs(z);
  const axis = side ? right : forward, sign = (side ? x : z) > 0 ? -1 : 1;
  return { x: axis.x * sign, z: axis.z * sign, depth: circle.r + (side ? car.halfWidth - Math.abs(x) : car.halfLength - Math.abs(z)), kind: 'obstacle' };
}
export function findCarContact(pose, { boxes = [], circles = [], vehicles = [], hazard } = {}) {
  const car = { ...CAR_HULL, ...pose };
  for (const box of boxes) {
    if ((pose.y || 0) >= (box.height ?? 10) || (pose.y || 0) + CAR_HULL.height <= (box.y || 0)) continue;
    const hit = boxContact(car, box); if (hit) return hit;
  }
  for (const circle of circles) {
    if ((pose.y || 0) >= (circle.height ?? 8)) continue;
    const hit = circleContact(car, circle); if (hit) return hit;
  }
  for (const vehicle of vehicles) {
    if (Math.abs((pose.y || 0) - (vehicle.y || 0)) >= CAR_HULL.height) continue;
    if (Math.hypot(car.x - vehicle.x, car.z - vehicle.z) > 8) continue;
    const hit = boxContact(car, { ...CAR_HULL, ...vehicle, kind: 'vehicle' }); if (hit) return hit;
  }
  return hazard?.(car) || null;
}
export function advanceCar(input, dt, contactAt) {
  dt = Math.max(0, Math.min(0.05, dt));
  const result = { ...input, slideX: (input.slideX || 0) * Math.exp(-5 * dt), slideZ: (input.slideZ || 0) * Math.exp(-5 * dt), impact: 0 };
  const turn = Math.atan2(Math.sin((input.targetH ?? input.h) - input.h), Math.cos((input.targetH ?? input.h) - input.h));
  // Sweep translation AND rotation, so low frame rates cannot tunnel through thin objects.
  const travel = (Math.abs(input.speed) + Math.hypot(result.slideX, result.slideZ)) * dt + Math.abs(turn) * 2.8;
  const steps = Math.max(1, Math.ceil(travel / 0.16)), stepDt = dt / steps;
  for (let i = 0; i < steps; i++) {
    const h = result.h + turn / steps;
    const vx = Math.sin(h) * result.speed + result.slideX, vz = Math.cos(h) * result.speed + result.slideZ;
    const candidate = { ...result, h, x: result.x + vx * stepDt, z: result.z + vz * stepDt };
    const hit = contactAt(candidate);
    if (!hit) { result.x = candidate.x; result.z = candidate.z; result.h = h; continue; }
    const normalSpeed = (vx - (hit.velocity?.x || 0)) * hit.x + (vz - (hit.velocity?.z || 0)) * hit.z;
    // A small penetration correction also separates stationary cars hit by traffic.
    const correction = Math.min(hit.depth || 0, 0.2) + 0.005;
    const separated = { ...result, x: result.x + hit.x * correction, z: result.z + hit.z * correction };
    if (!contactAt(separated)) { result.x = separated.x; result.z = separated.z; }
    if (normalSpeed < 0) {
      result.impact = Math.max(result.impact, -normalSpeed);
      const nx = vx - 1.12 * normalSpeed * hit.x, nz = vz - 1.12 * normalSpeed * hit.z;
      // Low restitution and tyre friction dissipate the impact; glancing hits slide.
      const forward = nx * Math.sin(result.h) + nz * Math.cos(result.h);
      result.speed = forward * 0.72;
      result.slideX = (nx - forward * Math.sin(result.h)) * 0.72;
      result.slideZ = (nz - forward * Math.cos(result.h)) * 0.72;
    }
  }
  return result;
}

export function drivingSpeed(speed, throttle, brake, dt, maxSpeed = 24) {
  if (brake) return Math.sign(speed) * Math.max(0, Math.abs(speed) - 18 * dt);
  if (throttle) speed += throttle * (speed * throttle < 0 ? 14 : throttle > 0 ? 6.5 : 4) * dt;
  else speed = Math.sign(speed) * Math.max(0, Math.abs(speed) - 2.2 * dt);
  return Math.max(-5, Math.min(maxSpeed, speed * Math.exp(-0.12 * dt)));
}

// Stop auto rides before occupying a junction, leaving room for cross traffic
// to finish passing. Parked cars use their physical hull so marked bays fit.
export function autoDriveMustYield(pose, vehicles) {
  return vehicles.some(vehicle => {
    if(Math.abs((pose.y||0)-(vehicle.y||0))>=CAR_HULL.height||Math.hypot(pose.x-vehicle.x,pose.z-vehicle.z)>40)return false;
    const physical={...CAR_HULL,...pose},other={...CAR_HULL,...vehicle};
    if(boxContact(physical,other))return true;
    const behind=(vehicle.x-pose.x)*Math.sin(pose.h)+(vehicle.z-pose.z)*Math.cos(pose.h)<0;
    if(behind&&Math.cos((vehicle.h||0)-pose.h)>.5)return false;
    const hull={...physical,
      halfWidth:CAR_HULL.halfWidth+(vehicle.parked?0:.35),
      halfLength:CAR_HULL.halfLength+(vehicle.parked?0:2.2)
    };
    const velocity=vehicle.velocity||{x:0,z:0};
    for(let t=0;t<=(vehicle.parked?0:2.5);t+=.5){
      if(boxContact(hull,{...CAR_HULL,...vehicle,x:vehicle.x+velocity.x*t,z:vehicle.z+velocity.z*t}))return true;
    }
    return false;
  });
}

// Reserve the auto car's immediate route at street crossings. Cars already
// inside can clear the crossing; approaching cars wait outside the clearance.
export function waitsForAutoCrossing(current, next, corridor) {
  const inside=vehicle=>corridor.some(p=>boxContact({
    ...CAR_HULL,...p,halfWidth:CAR_HULL.halfWidth+.85,halfLength:CAR_HULL.halfLength+3.3
  },{...CAR_HULL,...vehicle}));
  return !inside(current)&&inside(next);
}
