// Deterministic scenery for the compressed virtual routes, not a geographic survey.
const distance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};
export function distanceToRoad(point,paths){let best=Infinity;for(const path of paths)for(let i=1;i<path.length;i++)best=Math.min(best,distance(point,path[i-1],path[i]));return best;}
export function planRoadside(routes,sites,{occupied=[],river}={}){
  const paths=routes.map(r=>r.pts200),buildings=[],lamps=[];
  let seed=31;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const inSite=(p,margin=0)=>Object.values(sites).some(s=>Math.abs(p.x-s.ox)<67+margin&&p.z>s.oz-(s.depth||22)-12-margin&&p.z<s.oz+29+margin);
  const water=(p,r)=>river&&Math.abs((p.x-river.x)*-river.dz+(p.z-river.z)*river.dx)<9+r;
  const safe=(p,r)=>p.x>-710+r&&p.x<260-r&&p.z>-775+r&&p.z<330-r&&!inSite(p,r)&&!water(p,r)&&distanceToRoad(p,paths)>8+r&&!occupied.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<r+o.r+2)&&!buildings.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<r+o.radius+3);
  for(const route of routes){
    const count=Math.floor(route.len/28);
    for(let i=2;i<count-1;i++){
      const u=i/count,p=route.curve.getPointAt(u),t=route.curve.getTangentAt(u);
      for(const side of [-1,1]){
        const width=5+rand()*3,depth=5+rand()*3,radius=Math.hypot(width,depth)/2;
        for(const offset of [18,31]){
          const pos={x:p.x-t.z*offset*side,z:p.z+t.x*offset*side};if(!safe(pos,radius))continue;
          const shop=i%5===0,floors=shop||i%4===0?2:1;
          buildings.push({...pos,width,depth,radius,height:floors*2.9,shop,floors,color:Math.floor(rand()*6),roof:Math.floor(rand()*4),yaw:Math.atan2(t.x,t.z)+(side>0?Math.PI/2:-Math.PI/2),route:route.key});break;
        }
      }
      if(i%2===0)for(const side of [-1,1]){
        const lamp={x:p.x-t.z*5.7*side,z:p.z+t.x*5.7*side,yaw:Math.atan2(t.x,t.z)};
        if(!inSite(lamp)&&!water(lamp,1)&&distanceToRoad(lamp,paths)>4.5&&!lamps.some(l=>Math.hypot(l.x-lamp.x,l.z-lamp.z)<16))lamps.push(lamp);
      }
    }
  }
  return {buildings,lamps};
}
export function buildRoadside({THREE,routes,sites,box,scene,carBoxes,circles,river}){
  const occupied=[...circles.map(c=>({x:c.x,z:c.z,r:c.r})),...carBoxes.map(b=>({x:(b[0]+b[1])/2,z:(b[2]+b[3])/2,r:Math.hypot(b[1]-b[0],b[3]-b[2])/2}))];
  const plan=planRoadside(routes,sites,{occupied,river}),walls=[0xe9dcc2,0xd4e1dd,0xf0d1bd,0xc6d3e4,0xf2eadb,0xd5b998],roofs=[0x994b38,0x50718b,0x69765a,0x777f86];
  for(const h of plan.buildings){
    const c=Math.cos(h.yaw),s=Math.sin(h.yaw),local=(x,y,z,w,ht,d,m)=>{const mesh=box(h.x+c*x+s*z,y,h.z-s*x+c*z,w,ht,d,m);mesh.rotation.y=h.yaw;return mesh;};
    local(0,0,0,h.width,h.height,h.depth,walls[h.color]);
    local(0,h.height,0,h.width+.6,.18,h.depth+.6,roofs[h.roof]);
    if(!h.shop){for(const side of [-1,1]){const roof=local(side*h.width/4,h.height+.15,0,h.width*.57,.13,h.depth+.7,roofs[h.roof]);roof.rotation.z=side*.32;}}
    for(let f=0;f<h.floors;f++)for(const x of [-h.width*.28,h.width*.28]){
      local(x,f*2.9+1.1,h.depth/2+.03,1.1,1.1,.04,0x354f63);local(x,f*2.9+1.62,h.depth/2+.06,1.22,.06,.05,0xf2e9da);
    }
    local(0,0,h.depth/2+.04,.9,2.05,.05,0x68584c);
    local(0,0,h.depth/2+.7,h.width+.4,.13,1.4,0xb3aca0);
    if(h.shop){local(0,2.2,h.depth/2+.4,h.width,.14,1.1,0x326e77);local(0,2.5,h.depth/2+.04,h.width*.8,.4,.04,[0x326e77,0x88602f,0x8f4346][h.color%3]);}
    carBoxes.push([h.x-h.radius,h.x+h.radius,h.z-h.radius,h.z+h.radius,h.height+1.5]);
  }
  for(const lamp of plan.lamps){
    box(lamp.x,0,lamp.z,.12,4.9,.12,0x64717b);box(lamp.x,4.75,lamp.z,.7,.12,.25,0x3b4755);box(lamp.x,4.72,lamp.z,.48,.025,.18,0xffe2a5);
    circles.push({x:lamp.x,z:lamp.z,r:.15,h:5});
  }
  // Road edge lines and pedestrian shoulders share vertices at bends.
  const material=new THREE.MeshLambertMaterial({color:0xb2ac9e,side:THREE.DoubleSide}),lineMaterial=new THREE.MeshBasicMaterial({color:0xe6dfca,side:THREE.DoubleSide});
  for(const route of routes)for(const side of [-1,1])for(const [near,far,mat,y] of [[4.4,5.5,material,.009],[3.35,3.43,lineMaterial,.016]]){
    const points=route.curve.getSpacedPoints(240),vertices=[],indices=[];
    const omit=p=>Object.values(sites).some(s=>Math.abs(p.x-s.ox)<63&&Math.abs(p.z-s.oz-16)<13)||(river&&Math.abs((p.x-river.x)*-river.dz+(p.z-river.z)*river.dx)<11)||distanceToRoad(p,routes.filter(r=>r!==route).map(r=>r.pts200))<8;
    for(let i=0;i<points.length;i++){const p=points[i],t=route.curve.getTangentAt(i/240);for(const offset of [near,far])vertices.push(p.x-t.z*offset*side,y,p.z+t.x*offset*side);}
    for(let i=0;i<240;i++){if(omit(points[i])||omit(points[i+1]))continue;const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();scene.add(new THREE.Mesh(geometry,mat));
  }
  return plan;
}
