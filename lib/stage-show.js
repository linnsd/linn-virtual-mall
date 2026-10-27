import { STAGE_ORDER, STAGE_HULL, stageStop, stageWaypoints, createStageTour, audiencePositions } from './stage-tour.js';

export function buildStageShow({ THREE, scene, canvasTex, drawLogo, quality = 'lite' }) {
  const materials = new Map(), boxGeo = new THREE.BoxGeometry(1,1,1), sphereGeo = new THREE.SphereGeometry(1,8,6), cylinderGeo = new THREE.CylinderGeometry(1,1,1,10);
  const mat = color => { if (!materials.has(color)) materials.set(color,new THREE.MeshLambertMaterial({color})); return materials.get(color); };
  function mesh(parent,geometry,color,x,y,z,sx,sy,sz) {
    const m=new THREE.Mesh(geometry,typeof color==='number'?mat(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
  }
  const box=(p,x,y,z,w,h,d,c)=>mesh(p,boxGeo,c,x,y,z,w,h,d);
  const root = new THREE.Group();root.name='Linn touring concert truck';root.userData.dynamic=true;scene.add(root);
  const wheels=[],people=[],lights=[];
  const stageLight=new THREE.PointLight(0xffe5bc,1.8,12,2);stageLight.position.set(-.6,4.5,-.5);root.add(stageLight);
  const yellow=0xf6c927,navy=0x152b55,dark=0x171c25,green=0x2fa84a;
  box(root,0,.67,0,2.8,.38,8,dark);box(root,0,1.26,-.5,2.9,.85,6.4,yellow);
  // Cab and real exposed wheels beneath the wrap, plus a broad side-open platform.
  box(root,0,1.52,2.9,2.65,1.9,1.8,yellow);box(root,0,1.88,3.82,2.25,.78,.04,0x284452);
  box(root,0,1.1,3.87,2.45,.3,.08,0xe9e1bf);
  for(const x of [-.9,.9])box(root,x,1.42,3.89,.43,.22,.05,0xfff1b2);
  for(const z of [-2.65,2.65])for(const x of [-1.33,1.33]) {
    const spin=new THREE.Group();spin.position.set(x,.53,z);root.add(spin);
    const tyre=mesh(spin,cylinderGeo,dark,0,0,0,.52,.32,.52);tyre.rotation.z=Math.PI/2;
    const hub=mesh(spin,cylinderGeo,0x9da8b2,x>0?.18:-.18,0,0,.26,.02,.26);hub.rotation.z=Math.PI/2;wheels.push(spin);
  }
  box(root,0,2,-.65,3.04,.18,6.65,0x323943);
  // Yellow sponsor wrap with Linn logo, festival typography and lantern motifs.
  const banner=canvasTex(1024,256,(g,W,H)=>{
    const gradient=g.createLinearGradient(0,0,0,H);gradient.addColorStop(0,'#ffe466');gradient.addColorStop(1,'#f3b70e');g.fillStyle=gradient;g.fillRect(0,0,W,H);
    g.fillStyle='#173765';g.fillRect(0,H-14,W,7);g.fillStyle='#2fa84a';g.fillRect(0,H-7,W,7);
    drawLogo(g,24,17,160);g.textAlign='center';g.fillStyle='#193469';g.font='bold 43px "Noto Sans Myanmar", sans-serif';g.fillText('လင်း သီချင်းဖျော်ဖြေပွဲ',610,91,720);
    g.font='bold 32px sans-serif';g.fillText('LINN LIVE · FESTIVAL ROADSHOW',600,150,740);
    g.font='23px sans-serif';g.fillText('SHOP 1 · SHOP 2 · SHOP 3 · SHOP 4 · SHOP 5',600,199,750);
    for(const x of [35,985]){g.fillStyle='#dd4934';g.beginPath();g.ellipse(x,180,20,29,0,0,Math.PI*2);g.fill();g.fillStyle='#ffe794';g.fillRect(x-16,177,32,4);}
  });
  const bannerMat=new THREE.MeshLambertMaterial({map:banner,side:THREE.DoubleSide});
  const planeGeo=new THREE.PlaneGeometry(1,1);
  for(const side of [-1,1]) {
    const sign=mesh(root,planeGeo,bannerMat,side*1.51,1.3,-.65,6.7,1.12,1);sign.rotation.y=side*Math.PI/2;
    box(root,side*1.55,2.13,-.65,.07,.07,6.6,green);
    // Scalloped gold skirt remains above road height.
    for(let j=0;j<28;j++)box(root,side*1.52,.62,-3.85+j*.24,.05,.3,.13,j%2?0xeab11e:0xffdb51);
  }
  // Canopy is a shallow barrel roof, a green underside and gold valance.
  const roofVertices=[],roofIndices=[];
  for(let i=0;i<=12;i++){const x=-1.65+i*3.3/12,y=5.1+.45*Math.sqrt(Math.max(0,1-(x/1.65)**2));for(const z of [-4.05,2.8])roofVertices.push(x,y,z);if(i<12){const a=i*2;roofIndices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(roofVertices,3));roofGeo.setIndex(roofIndices);roofGeo.computeVertexNormals();
  const roof=new THREE.Mesh(roofGeo,new THREE.MeshLambertMaterial({color:0xffd83e,side:THREE.DoubleSide}));root.add(roof);
  for(const x of [-1.52,1.52])for(const z of [-3.8,2.55])box(root,x,3.59,z,.065,3.1,.065,0xe5d381);
  for(const side of [-1,1]){
    box(root,side*1.65,5.02,-.62,.09,.26,6.95,yellow);
    for(let i=0;i<23;i++){const flag=box(root,side*1.66,4.87,-3.83+i*.29,.065,.22,.22,i%3===0?green:yellow);flag.rotation.x=.32;}
  }
  // PA towers at both ends of the side-facing stage, leaving the singer visible.
  for(const z of [-3.25,1.95])for(let i=0;i<3;i++){
    box(root,-1.03,2.48+i*.63,z,.7,.58,.94,dark);
    box(root,-1.395,2.48+i*.63,z,.025,.48,.8,0x353c45);
    for(const dz of [-.21,.21]){const driver=mesh(root,cylinderGeo,0x0c111a,-1.42,2.48+i*.63,z+dz,.16,.025,.16);driver.rotation.z=Math.PI/2;}
  }
  box(root,.98,2.6,-.55,.45,.88,1.3,0x1c2332);
  box(root,.8,3.1,-.55,.8,.12,1.5,navy);
  // Reusable low-polygon people, with pivoted arms for singing and cheering.
  function person(parent,{shirt=0xffffff,trousers=0x161d2d,hair=false,singer=false}={}){
    const g=new THREE.Group(),body=new THREE.Group();g.add(body);parent.add(g);
    for(const x of [-.14,.14]){box(body,x,.46,0,.19,.87,.23,trousers);box(body,x,.075,.08,.24,.13,.37,dark);}
    box(body,0,1.12,0,.51,.65,.29,shirt);
    if(singer)box(body,0,1.06,.17,.36,.53,.035,0x29212a);
    mesh(body,sphereGeo,0xc88c66,0,1.64,.015,.2,.25,.19);
    mesh(body,sphereGeo,dark,0,1.82,-.035,.205,.13,.2);
    if(hair)box(body,0,1.58,-.17,.37,.62,.12,dark);
    for(const x of [-.075,.075])box(body,x,1.67,.197,.035,.035,.018,dark);
    const arms=[];
    for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.31,1.37,0);body.add(arm);box(arm,0,-.24,0,.15,.48,.17,shirt);mesh(arm,sphereGeo,0xc88c66,0,-.51,0,.083,.1,.083);arms.push(arm);}
    return {g,body,arms};
  }
  const singer=person(root,{hair:true,singer:true});singer.g.position.set(-.32,2.1,-.6);singer.g.rotation.y=-Math.PI/2;
  // Bent microphone arm: the hand and mic stay at mouth height.
  const forearm=new THREE.Group();singer.arms[1].add(forearm);forearm.position.y=-.44;forearm.rotation.x=-2.1;
  box(forearm,0,-.16,0,.12,.32,.13,0xffffff);
  mesh(forearm,cylinderGeo,dark,0,-.35,0,.04,.24,.04);mesh(forearm,sphereGeo,0x9ca9b5,0,-.48,0,.065,.07,.065);
  singer.arms[1].rotation.x=-1.2;
  const guitarist=person(root,{shirt:0x24283a,trousers:0x26334c,hair:true});guitarist.g.position.set(.45,2.1,-2);guitarist.g.rotation.y=-Math.PI/2;
  mesh(guitarist.body,sphereGeo,0xc47e26,0,1.03,.28,.29,.33,.09);const neck=box(guitarist.body,.2,1.32,.26,.1,.65,.07,0x6b452c);neck.rotation.z=-.6;
  box(root,-.9,2.9,-.6,.035,1.65,.035,0x8a949c);
  for(const z of [-2.6,.9])for(const c of [0xff5884,0x5be4ca,0xffde67]){
    const bulb=new THREE.Mesh(sphereGeo,new THREE.MeshBasicMaterial({color:c}));bulb.position.set(-.8+(lights.length%3)*.8,4.91,z);bulb.scale.setScalar(.09);root.add(bulb);lights.push(bulb);
  }
  mesh(root,planeGeo,new THREE.MeshBasicMaterial({map:banner,side:THREE.DoubleSide}),0,4.15,-3.94,2.65,.68,1);
  // A single reusable crowd is moved to each stop, and hidden while travelling.
  const crowd=new THREE.Group();crowd.name='Roadshow audience';crowd.userData.dynamic=true;scene.add(crowd);
  const palette=[0xd14d59,0x4c7caa,0xf2d383,0x66a97d,0xe5e6df,0x8a6caa];
  const count=24;
  for(let i=0;i<count;i++){
    const fan=person(crowd,{shirt:palette[i%palette.length],trousers:i%3===0?0x35676f:0x222d43,hair:i%3===0});
    const scale=.88+(i%4)*.05;fan.g.scale.setScalar(scale);fan.g.rotation.y=Math.PI+(i%3-1)*.12;fan.phase=i*.73;
    if(i%4===0){box(fan.arms[1],0,-.56,.05,.11,.18,.025,0x0d1725);box(fan.arms[1],0,-.56,.069,.08,.13,.007,0x9edbe9);}
    people.push(fan);
  }
  function applyCrowdQuality() { const count=quality==='low'?12:quality==='lite'?18:24;people.forEach((fan,i)=>{fan.g.visible=i<count;}); }
  applyCrowdQuality();
  const paths=STAGE_ORDER.map((from,i)=>{
    const points=stageWaypoints(from,STAGE_ORDER[(i+1)%STAGE_ORDER.length]);
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
    return {curve,length:curve.getLength()};
  });
  // Instance repeated parts while retaining their animated source transforms.
  // Truck and crowd each keep their own parent so hiding an off-screen show is cheap.
  function instanceParts(container) {
    const groups=new Map(),inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4();
    container.traverse(object=>{if(!object.isMesh||object.material.transparent)return;const key=object.geometry.uuid+object.material.uuid;const list=groups.get(key)||[];list.push(object);groups.set(key,list);});
    const batches=[];
    for(const sources of groups.values()){
      if(sources.length<2)continue;
      const instance=new THREE.InstancedMesh(sources[0].geometry,sources[0].material,sources.length);
      instance.frustumCulled=false;instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);container.add(instance);
      sources.forEach(object=>{object.visible=false;});batches.push({instance,sources});
    }
    return ()=>{
      if(!container.visible)return;
      container.updateMatrixWorld(true);inverse.copy(container.matrixWorld).invert();
      for(const {instance,sources} of batches){let count=0;for(const object of sources){let visible=true;for(let p=object.parent;p&&p!==container;p=p.parent)if(!p.visible)visible=false;if(visible){matrix.multiplyMatrices(inverse,object.matrixWorld);instance.setMatrixAt(count++,matrix);}}instance.count=count;instance.visible=count>0;instance.instanceMatrix.needsUpdate=true;}
    };
  }
  const updateTruckInstances=instanceParts(root),updateCrowdInstances=instanceParts(crowd);
  const tour=createStageTour(paths),point=new THREE.Vector3(),tangent=new THREE.Vector3();
  let lastSite=null,travelled=0,blockedFor=0,lastWait=false;
  function poseAt(state,ahead=0){
    if(state.performing)return stageStop(state.site);
    const u=Math.min(1,(state.distance+ahead)/state.path.length);
    state.path.curve.getPointAt(u,point);state.path.curve.getTangentAt(u,tangent);
    const lane=1.65*Math.max(0,Math.min(1,state.distance/15,(state.path.length-state.distance)/15));
    return {x:point.x+tangent.z*lane,z:point.z-tangent.x*lane,h:Math.atan2(tangent.x,tangent.z),site:state.site};
  }
  return {
    root,crowd,paths,
    setQuality(next){if(next!==quality){quality=next;applyCrowdQuality();}},
    hull(){return {...STAGE_HULL,x:root.position.x,z:root.position.z,h:root.rotation.y,y:0,parked:tour.state().performing,velocity:{x:Math.sin(root.rotation.y)*(tour.state().performing||lastWait?0:6),z:Math.cos(root.rotation.y)*(tour.state().performing||lastWait?0:6)}};},
    state:tour.state,
    yielding:()=>blockedFor>.2,
    corridor:()=>{const state=tour.state();return state.performing&&state.elapsed<62?[]:[0,4,8,12,18,24,32].map(ahead=>poseAt({...state,performing:false},ahead));},
    update(dt,time,viewer,blocked=()=>false){
      const before=tour.state(),candidate=poseAt(before,1.6),next=poseAt(before,6*Math.max(0,Math.min(.1,dt))),wait=!before.performing&&(blocked({...STAGE_HULL,...next})||blocked({...STAGE_HULL,...candidate}));
      lastWait=wait;blockedFor=wait?blockedFor+dt:0;
      const state=tour.advance(dt,wait),pose=poseAt(state);
      const step=state.performing||wait?0:6*Math.min(.1,dt);travelled+=step;
      root.position.set(pose.x,0,pose.z);root.rotation.y=pose.h;
      for(const wheel of wheels)wheel.rotation.x=travelled/.52;
      const near=Math.hypot(viewer.x-pose.x,viewer.z-pose.z)<(quality==='low'?65:120);
      root.visible=near;crowd.visible=near&&state.performing;
      if(lastSite!==state.site){lastSite=state.site;const positions=audiencePositions(state.site,people.length);people.forEach((fan,i)=>fan.g.position.set(positions[i].x,0,positions[i].z));}
      if(near){
        const beat=time*3.8;
        singer.body.rotation.z=Math.sin(beat)*.045;singer.arms[0].rotation.z=.4+Math.sin(beat*.5)*.65;
        guitarist.arms[1].rotation.x=-.7+Math.sin(beat*2)*.15;
        lights.forEach((light,i)=>light.scale.setScalar(.07+.035*(1+Math.sin(beat+i))));
        if(state.performing)people.forEach((fan,i)=>{fan.body.position.y=Math.max(0,Math.sin(beat+fan.phase))*.045;fan.arms[0].rotation.x=-.8-Math.sin(beat*.5+fan.phase)*.6;fan.arms[1].rotation.x=i%4===0?-2.4:-.7+Math.cos(beat+fan.phase)*.35;});
      }
      updateTruckInstances();updateCrowdInstances();
      return state;
    },
    musicLevel(viewer){return Math.max(0,1-Math.hypot(viewer.x-root.position.x,viewer.z-root.position.z)/28)*.9;},
  };
}
