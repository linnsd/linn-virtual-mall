// Shared vehicle geometry and finishes keep the varied fleet lightweight.
export const VEHICLE_COLORS=[0xe9edf0,0x26333d,0xb52d39,0x356caa,0xd2a340,0x438477,0x997057,0x9ca4ae,0x694c82,0xe68542,0xf2eee1,0x527149];
export const VEHICLE_PROFILES=[
  {id:'sedan',width:1.8,length:4.8,height:1.45,cabin:2.5,cabinZ:-.25,wheelbase:2.9},
  {id:'hatchback',width:1.72,length:3.85,height:1.5,cabin:2.3,cabinZ:-.35,wheelbase:2.5},
  {id:'suv',width:1.9,length:4.65,height:1.85,cabin:2.9,cabinZ:-.25,wheelbase:2.9},
  {id:'pickup',width:1.88,length:4.95,height:1.76,cabin:1.85,cabinZ:.65,wheelbase:3.1}
];
export function vehicleAppearance(seed=0){
  let n;
  if(typeof seed==='number'&&Number.isFinite(seed))n=Math.abs(Math.trunc(seed));
  else{n=2166136261;for(const char of String(seed))n=Math.imul(n^char.charCodeAt(0),16777619)>>>0;}
  const index=n%VEHICLE_PROFILES.length;
  return {profile:VEHICLE_PROFILES[index],color:VEHICLE_COLORS[(n*5+3*Math.floor(n/4))%VEHICLE_COLORS.length]};
}
export function createVehicleFactory(THREE,{envMap=null,shadowMaterial=null,tireMap=null}={}){
  const cube=new THREE.BoxGeometry(1,1,1),tire=new THREE.TorusGeometry(.285,.075,8,28),rimRing=new THREE.TorusGeometry(.225,.018,6,24),disc=new THREE.CylinderGeometry(.205,.205,.12,20);
  tire.rotateY(Math.PI/2);rimRing.rotateY(Math.PI/2);disc.rotateZ(Math.PI/2);
  const materials=new Map(),paint=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshPhongMaterial({color,envMap,reflectivity:.32,shininess:95,specular:0xaab6c6}));return materials.get(color);};
  const black=new THREE.MeshPhongMaterial({color:0x151a20,shininess:12}),rubber=new THREE.MeshPhongMaterial({color:0x24252a,map:tireMap,shininess:7}),glass=new THREE.MeshPhongMaterial({color:0x1d3445,envMap,reflectivity:.7,shininess:150,specular:0xffffff});
  const metal=new THREE.MeshPhongMaterial({color:0xc2cbd4,envMap,reflectivity:.5,shininess:120}),brakes=new THREE.MeshLambertMaterial({color:0x37404a}),red=new THREE.MeshLambertMaterial({color:0xb82731}),light=new THREE.MeshPhongMaterial({color:0xedf6ff,emissive:0x718090,shininess:130}),amber=new THREE.MeshLambertMaterial({color:0xe6ae42});
  const bodies=new Map(),cabins=new Map();
  const extrude=(shape,width,bevel=.035)=>{const geometry=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:10});geometry.translate(0,0,-width/2);geometry.rotateY(-Math.PI/2);return geometry;};
  for(const p of VEHICLE_PROFILES){
    const end=p.length/2,top=p.id==='suv'||p.id==='pickup'?1.03:.87,r=.405,wb=p.wheelbase/2;
    const shape=new THREE.Shape();shape.moveTo(-end,.34);shape.lineTo(-wb-r,.34);shape.absarc(-wb,.36,r,Math.PI,0,true);shape.lineTo(wb-r,.34);shape.absarc(wb,.36,r,Math.PI,0,true);shape.lineTo(end-.06,.34);shape.quadraticCurveTo(end+.01,.48,end-.04,.64);shape.quadraticCurveTo(end-.08,top-.08,end-.3,top-.045);shape.lineTo(end-1,top);shape.lineTo(-end+.26,top);shape.quadraticCurveTo(-end,top-.03,-end,.72);shape.lineTo(-end,.34);
    bodies.set(p.id,extrude(shape,p.width-.12,.055));
    const lo=top-.025,hi=p.height-.1,z0=p.cabinZ-p.cabin/2,z1=p.cabinZ+p.cabin/2,rear=p.id==='sedan'?.5:.2,cabin=new THREE.Shape();
    cabin.moveTo(z0,lo);cabin.lineTo(z1,lo);cabin.quadraticCurveTo(z1-.25,hi-.06,z1-.58,hi);cabin.lineTo(z0+rear+.06,hi);cabin.quadraticCurveTo(z0+rear,hi-.01,z0,lo);
    cabins.set(p.id,extrude(cabin,p.width*.8,.035));
  }
  // Merge spokes once: one alloy mesh per wheel instead of separate draws.
  const spokeParts=[];
  for(let i=0;i<5;i++){const geo=new THREE.BoxGeometry(.035,.41,.045);geo.rotateX(i*Math.PI*2/5);spokeParts.push(geo.toNonIndexed());}
  const spoke=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){const values=[];for(const part of spokeParts)values.push(...part.attributes[name].array);spoke.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));}for(const part of spokeParts)part.dispose();
  return function build(seed){
    const {profile:p,color}=vehicleAppearance(seed),g=new THREE.Group(),finish=paint(color),wheels=[];
    g.userData.vehicle={type:p.id,color,height:p.height+.07};
    const box=(x,y,z,w,h,d,m,parent=g)=>{const mesh=new THREE.Mesh(cube,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;};
    const bodyTop=p.id==='suv'||p.id==='pickup'?1.03:.87,cw=p.width*.8,bottom=bodyTop-.025,top=p.height-.1;
    g.add(new THREE.Mesh(bodies.get(p.id),finish));g.add(new THREE.Mesh(cabins.get(p.id),glass));
    const rearSlope=p.id==='sedan'?.5:.2,frontTop=p.cabinZ+p.cabin/2-.58,rearTop=p.cabinZ-p.cabin/2+rearSlope;
    box(0,p.height-.085,(frontTop+rearTop)/2,cw+.07,.08,frontTop-rearTop+.08,finish);
    for(const side of [-1,1]){
      const x=side*cw/2;
      box(x,(bottom+top)/2,p.cabinZ,.055,top-bottom,.095,black);
      for(const [lowZ,highZ] of [[p.cabinZ-p.cabin/2,rearTop],[p.cabinZ+p.cabin/2,frontTop]]){const pillar=box(x,(bottom+top)/2,(lowZ+highZ)/2,.045,Math.hypot(top-bottom,highZ-lowZ),.055,finish);pillar.rotation.x=Math.atan2(highZ-lowZ,top-bottom);}
      box(x,bodyTop+.015,p.cabinZ,.025,.025,p.cabin,metal);
      for(const z of [p.cabinZ-.5,p.cabinZ+.5]){
        box(side*(p.width/2-.005),bodyTop-.12,z,.025,.035,.2,metal);
        box(side*(p.width/2-.008),.65,z-.34,.012,.32,.012,black);
      }
      box(side*(p.width/2+.01),bodyTop+.11,.72,.12,.1,.2,finish);box(side*(p.width/2+.025),bodyTop+.11,.64,.07,.075,.015,glass);
      box(side*(p.width/2-.045),.35,0,.055,.085,p.wheelbase-.8,black);
      if(p.id==='suv')box(side*.57,p.height+.035,p.cabinZ,.055,.07,p.cabin-.25,black);
    }
    if(p.id==='hatchback')box(0,p.height-.08,-p.length/2+.18,p.width*.82,.06,.3,finish);
    if(p.id==='pickup'){
      box(0,bodyTop+.02,-1.5,p.width-.2,.05,1.5,black);
      for(const side of [-1,1]){box(side*(p.width/2-.07),bodyTop+.16,-1.5,.12,.32,1.65,finish);box(side*(p.width/2-.07),bodyTop+.33,-1.5,.13,.04,1.65,black);}
      box(0,bodyTop+.16,-p.length/2+.07,p.width-.05,.32,.14,finish);box(0,bodyTop+.15,-p.length/2-.015,.24,.04,.02,metal);
    }
    for(const end of [-1,1]){
      box(0,.43,end*(p.length/2-.04),p.width-.05,.13,.13,black);
      box(0,.55,end*(p.length/2+.025),.4,.115,.025,metal);
    }
    box(0,.63,p.length/2-.005,.75,.18,.055,black);
    for(const y of [.57,.63,.69])box(0,y,p.length/2+.03,.7,.012,.018,metal);
    for(const side of [-1,1]){
      box(side*p.width*.34,.72,p.length/2+.005,.45,.17,.065,black);
      box(side*p.width*.33,.75,p.length/2+.045,.34,.055,.025,light);box(side*p.width*.33,.69,p.length/2+.045,.34,.022,.025,light);
      box(side*p.width*.43,.73,p.length/2+.045,.045,.08,.025,amber);
      box(side*p.width*.36,.76,-p.length/2-.015,.3,.13,.04,red);
      box(side*p.width*.36,.8,-p.length/2-.04,.25,.022,.015,light);
    }
    for(const side of [-1,1])for(const z of [-1,1]){
      const pivot=new THREE.Group(),spin=new THREE.Group();pivot.position.set(side*(p.width/2-.08),.36,z*p.wheelbase/2);g.add(pivot);pivot.add(spin);
      const tyre=new THREE.Mesh(tire,rubber);spin.add(tyre);
      const rotor=new THREE.Mesh(disc,brakes);spin.add(rotor);
      for(const face of [-1,1]){const ring=new THREE.Mesh(rimRing,metal);ring.position.x=face*.07;spin.add(ring);const alloy=new THREE.Mesh(spoke,metal);alloy.position.x=face*.075;spin.add(alloy);}
      box(side*.035,.09,0,.04,.12,.08,red,pivot);
      wheels.push({pivot,spin,front:z>0,side,radius:.36});
    }
    if(shadowMaterial){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.scale.set(p.width+1,p.length+.8,1);shadow.position.y=.015;g.add(shadow);}
    return {g,wheels,spin(distance){for(const w of wheels)w.spin.rotation.x+=distance/w.radius;},steer(angle){for(const w of wheels)if(w.front)w.pivot.rotation.y=Math.max(-.6,Math.min(.6,angle));}};
  };
}
