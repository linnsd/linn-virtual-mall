// The supplied GLBs have a single baked mesh. Separate tyre regions without
// changing their UVs/materials so the original textured wheels can roll/steer.
export function rollingModel(THREE,root,kind='car'){
  root.updateMatrixWorld(true);
  const bike=kind==='bike',radius=bike?.275:.36,expected=bike?[.64,-.62]:[1.46,-1.46],centres=[];
  const meshes=[];root.traverse(m=>{if(!m.isMesh)return;const geometry=m.geometry.clone();
    for(const [name,a] of Object.entries(geometry.attributes))if(a.normalized){
      const values=normalizedAttributeValues(a);
      geometry.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize));
    }
    geometry.applyMatrix4(m.matrixWorld);meshes.push({geometry,material:m.material});
  });
  for(const z of expected)for(const side of bike?[0]:[-1,1]){
    let sum=0,count=0;
    for(const mesh of meshes){const pos=mesh.geometry.attributes.position,p=new THREE.Vector3();for(let i=0;i<pos.count;i++){
      p.fromBufferAttribute(pos,i);
      if(p.y<.09&&Math.abs(p.z-z)<.3&&(bike||p.x*side>.6)){sum+=p.z;count++;}
    }}
    centres.push({x:side*(bike?0:.86),y:radius,z:count?sum/count:z,radius,front:z>0});
  }
  const result=new THREE.Group(),wheels=centres.map(c=>{const pivot=new THREE.Group(),spin=new THREE.Group();pivot.position.set(c.x,c.y,c.z);pivot.add(spin);result.add(pivot);return {...c,pivot,spin,triangles:0};});
  for(const mesh of meshes){
    const geo=mesh.geometry;const pos=geo.attributes.position,index=geo.index,parts=Array.from({length:wheels.length+1},()=>[]),n=index?index.count:pos.count;
    for(let i=0;i<n;i+=3){
      const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k),p=new THREE.Vector3();for(const id of ids){p.x+=pos.getX(id)/3;p.y+=pos.getY(id)/3;p.z+=pos.getZ(id)/3;}
      const wheel=wheels.findIndex(w=>ids.every(id=>Math.abs(pos.getX(id)-w.x)<(bike?.13:.25)&&Math.hypot(pos.getY(id)-w.y,pos.getZ(id)-w.z)<radius+.035));
      parts[wheel+1].push(...ids);if(wheel>=0)wheels[wheel].triangles++;
    }
    parts.forEach((ids,i)=>{if(!ids.length)return;const part=new THREE.BufferGeometry();for(const [name,attribute] of Object.entries(geo.attributes))part.setAttribute(name,attribute);part.setIndex(ids);part.computeBoundingSphere();
      const m=new THREE.Mesh(part,mesh.material);m.userData.originalVehiclePart=true;if(i){const w=wheels[i-1];m.position.set(-w.x,-w.y,-w.z);w.spin.add(m);}else result.add(m);
    });
  }
  if(bike){
    const rubber=new THREE.MeshPhongMaterial({color:0x171b20,shininess:8}),alloy=new THREE.MeshPhongMaterial({color:0xb6c0c9,shininess:95}),hubMat=new THREE.MeshPhongMaterial({color:0x414850,shininess:40});
    const tyre=new THREE.TorusGeometry(radius-.045,.045,8,28);tyre.rotateY(Math.PI/2);
    const hub=new THREE.CylinderGeometry(.12,.12,.09,20);hub.rotateZ(Math.PI/2);
    const spoke=new THREE.BoxGeometry(.055,radius*1.55,.018);
    for(const w of wheels){for(const child of w.spin.children)child.visible=false;w.spin.add(new THREE.Mesh(tyre,rubber),new THREE.Mesh(hub,hubMat));for(let i=0;i<6;i++){const m=new THREE.Mesh(spoke,alloy);m.rotation.x=i*Math.PI/6;w.spin.add(m);}}
  }
  result.userData.rollingWheels=wheels;
  return result;
}
export function rollWheels(wheels,distance){if(!Number.isFinite(distance))return;for(const wheel of wheels)wheel.spin.rotation.x+=distance/(wheel.radius||.34);}
export function steerWheels(wheels,angle){for(const wheel of wheels)if(wheel.front)wheel.pivot.rotation.y=Math.max(-.65,Math.min(.65,angle));}
export function cloneRollingModel(template){
  const saved=template.userData;template.userData={};const model=template.clone(true);template.userData=saved;
  model.userData.rollingWheels=saved.rollingWheels.map(({pivot,spin,...data},i)=>({...data,pivot:model.children[i],spin:model.children[i].children[0]}));
  return model;
}

export function normalizedAttributeValues(a){
  const signed=a.array instanceof Int8Array||a.array instanceof Int16Array||a.array instanceof Int32Array,bits=a.array.BYTES_PER_ELEMENT*8,max=signed?2**(bits-1)-1:2**bits-1,values=new Float32Array(a.count*a.itemSize);
  for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++){const at=a.isInterleavedBufferAttribute?i*a.data.stride+a.offset+k:i*a.itemSize+k;values[i*a.itemSize+k]=Math.max(signed?-1:0,a.array[at]/max);}
  return values;
}
