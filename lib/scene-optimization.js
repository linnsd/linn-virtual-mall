// Conservative zones: facade, slabs, shafts and tall pieces keep all-floor
// visibility. Only objects wholly inside a shop can receive a floor restriction.
export function classifyBounds(bounds,sites,floorHeight=4.7){
  const {min,max}=bounds,x=(min.x+max.x)/2,z=(min.z+max.z)/2;
  let site=null,floor=null;
  for(const [id,s] of Object.entries(sites)){
    if(min.x>s.ox-(s.width||34)/2+.1&&max.x<s.ox+(s.width||34)/2-.1&&min.z>s.oz-(s.depth||22)&&max.z<s.oz-.5){
      site=Number(id);
      const f=Math.floor((min.y+.12)/floorHeight);
      if(f>=0&&f<s.floors.length&&max.y<(f+1)*floorHeight-.15)floor=f;
      break;
    }
  }
  return {site,floor,key:`${site??'world'}:${floor??'shell'}:${Math.floor(x/12)}:${Math.floor(z/12)}`};
}
export function floorVisible(zone,{state,camera,sites,floorHeight=4.7,overview=false,wells=[]}){
  if(zone.floor===null||zone.site!==state.site||!state.started||state.drive||state.ride||overview)return true;
  const s=sites[state.site];if(!s)return true;
  // Keep every floor when either the visitor or camera is outside; adjacent
  // floors remain visible through escalator/lift openings even indoors.
  const inside=p=>p.x>s.ox-(s.width||34)/2+.5&&p.x<s.ox+(s.width||34)/2-.5&&p.z>s.oz-(s.depth||22)+.5&&p.z<s.oz-1;
  if(!inside(state)||!inside(camera)||camera.y<state.f*floorHeight||camera.y>(state.f+1)*floorHeight)return true;
  const nearWell=p=>wells.some(w=>w.site===state.site&&p.x>w.ox+w.x0-3&&p.x<w.ox+w.x1+3&&p.z>w.oz+w.zT-3&&p.z<w.oz+w.zB+3);
  if(nearWell(state)||nearWell(camera))return true;
  return Math.abs(zone.floor-state.f)<=1;
}
export function canBatchBox(mesh){
  return !!mesh.userData.staticBox&&mesh.userData.staticBox.every(n=>Number.isFinite(n)&&n>0)&&!mesh.userData.dynamic&&!mesh.userData.noBatch&&!Array.isArray(mesh.material)&&
    !mesh.material.transparent&&mesh.material.opacity===1&&!mesh.material.wireframe&&mesh.visible&&mesh.scale.x*mesh.scale.y*mesh.scale.z>0;
}
export function optimizeScene(THREE,scene,{sites,floorHeight=4.7,batching=true,culling=true,dynamicGroups=[],wells=[]}={}){
  if(!batching&&!culling)return {stats:{zones:0,hiddenZones:0,batchedMeshes:0,batches:0},update(){}};
  const zones=new Map(),unit=new THREE.BoxGeometry(1,1,1);let batchedMeshes=0,batches=0;
  scene.updateMatrixWorld(true);
  for(const mesh of [...scene.children]){
    if(!mesh.isMesh||mesh.isSkinnedMesh||mesh.isInstancedMesh||mesh.userData.dynamic)continue;
    const bounds=new THREE.Box3().setFromObject(mesh),classification=classifyBounds(bounds,sites,floorHeight);
    let zone=zones.get(classification.key);
    if(!zone){const group=new THREE.Group();group.name='Static zone '+classification.key;group.matrixAutoUpdate=false;scene.add(group);zone={...classification,group,bounds:new THREE.Box3(),boxes:new Map()};zones.set(classification.key,zone);}
    zone.bounds.union(bounds);
    // The identity zone transform keeps original world coordinates, UVs and
    // material references (including posters replaced after loading) intact.
    zone.group.add(mesh);
    if(batching&&canBatchBox(mesh)){
      const key=mesh.material.uuid,list=zone.boxes.get(key)||[];list.push(mesh);zone.boxes.set(key,list);
    }
    mesh.updateMatrix();mesh.matrixAutoUpdate=false;
  }
  const scale=new THREE.Matrix4(),matrix=new THREE.Matrix4();
  for(const zone of zones.values())for(const list of zone.boxes.values()){
    if(list.length<2)continue;
    const instance=new THREE.InstancedMesh(unit,list[0].material,list.length);
    instance.name='Static boxes';instance.frustumCulled=false;instance.matrixAutoUpdate=false;
    list.forEach((mesh,i)=>{
      const [w,h,d]=mesh.userData.staticBox;
      scale.makeScale(w,h,d);matrix.copy(mesh.matrixWorld).multiply(scale);instance.setMatrixAt(i,matrix);
      zone.group.remove(mesh);mesh.geometry.dispose();
    });
    instance.instanceMatrix.needsUpdate=true;zone.group.add(instance);batchedMeshes+=list.length;batches++;
  }
  for(const group of dynamicGroups){
    const bounds=new THREE.Box3().setFromObject(group).expandByScalar(.75),zone=classifyBounds(bounds,sites,floorHeight);
    zones.set(group.uuid,{...zone,group,bounds});
  }
  const frustum=new THREE.Frustum(),projection=new THREE.Matrix4();
  const stats={zones:zones.size,hiddenZones:0,batchedMeshes,batches};
  return {stats,update(camera,state,overview=false){
    if(!culling)return;
    camera.updateMatrixWorld();projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
    let hidden=0;
    for(const zone of zones.values()){
      zone.group.visible=frustum.intersectsBox(zone.bounds)&&floorVisible(zone,{state,camera:camera.position,sites,floorHeight,overview,wells});
      if(!zone.group.visible)hidden++;
    }
    stats.hiddenZones=hidden;
  }};
}

// Only opaque, repeated rigid parts inside the swaying lanterns are instanced.
// Transparent bodies and glows keep their original per-object sorting.
export function batchAnimatedParts(THREE,scene,groups){
  const lists=new Map(),matrix=new THREE.Matrix4();
  for(const group of groups) for(const mesh of [...group.children]){
    if(!mesh.isMesh||mesh.isSkinnedMesh||Array.isArray(mesh.material)||mesh.material.transparent||mesh.material.opacity!==1)continue;
    if(!mesh.geometry.parameters)continue;
    const key=mesh.geometry.type+JSON.stringify(mesh.geometry.parameters)+mesh.material.uuid;
    const list=lists.get(key)||[];list.push({mesh,group});lists.set(key,list);
  }
  const batches=[];let sourceCount=0;
  for(const list of lists.values()){
    if(list.length<2)continue;
    const geometry=list[0].mesh.geometry,instance=new THREE.InstancedMesh(geometry,list[0].mesh.material,list.length);
    instance.name='Animated lantern parts';instance.frustumCulled=false;instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(instance);
    const records=list.map(({mesh,group})=>{mesh.updateMatrix();group.remove(mesh);if(mesh.geometry!==geometry)mesh.geometry.dispose();return {group,local:mesh.matrix.clone()};});
    batches.push({instance,records});sourceCount+=records.length;
  }
  return {stats:{animatedParts:sourceCount,animatedBatches:batches.length},update(){
    for(const group of groups)if(group.visible)group.updateMatrixWorld();
    for(const {instance,records} of batches){
      let n=0;for(const {group,local} of records)if(group.visible){matrix.multiplyMatrices(group.matrixWorld,local);instance.setMatrixAt(n++,matrix);}
      instance.count=n;instance.visible=n>0;instance.instanceMatrix.needsUpdate=true;
    }
  }};
}
