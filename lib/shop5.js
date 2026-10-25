// Premium single-floor hall. Upper reference cutaways describe the same floor.
export function buildShop5({THREE,site,box,plane,sign,canvasTex,drawLogo,bas,block,corner,roofs,seats,addStaff,mkM,mkW,actions,screenTextures}){
  const {ox,oz}=site,white=0xf5f5f0,blue=0x064fbe,navy=0x16394f;
  let fascia=false;
  const level=z=>z<=-19?.45:0;
  const b=(x,y,z,w,h,d,m)=>{const mesh=box(ox+x,y+level(z),oz+z,w,h,d,m);if(fascia)roofs.push(mesh);return mesh;};
  const pl=(map,w,h,x,y,z,ry=0,alpha=false)=>{const mesh=plane(map,w,h,ox+x,y+level(z),oz+z,ry,alpha);if(fascia)roofs.push(mesh);return mesh;};
  const obstacle=(x1,x2,z1,z2)=>block(ox+x1,ox+x2,oz+z1,oz+z2,0,5);
  const place=(id,name,x,z,sub,extra={})=>corner(id,name,0,ox+x,oz+z,sub,{site:5,...extra});
  const label=(text,x,y,z,w=4,h=.55,color='#143668')=>pl(sign(text,color,'#ffffff',null,1024,Math.max(48,Math.round(1024*h/w))),w,h,x,y,z);
  const wood=new THREE.MeshLambertMaterial({map:canvasTex(128,128,(g,W,H)=>{g.fillStyle='#c9ae85';g.fillRect(0,0,W,H);g.fillStyle='#b99b70';for(let i=0;i<W;i+=7)g.fillRect(i,0,1,H);})});
  const displayMat=new THREE.MeshLambertMaterial({map:screenTextures[0],emissive:0xffffff,emissiveMap:screenTextures[0],emissiveIntensity:.3});
  const desk=(x,z,w,d)=>{b(x,.1,z,w,.8,d,wood);b(x,.9,z,w+.12,.06,d+.12,white);b(x,.04,z,w-.12,.06,d-.12,0x62676c);obstacle(x-w/2-.1,x+w/2+.1,z-d/2-.1,z+d/2+.1);};
  const laptop=(x,z)=>{b(x,.96,z,.7,.035,.5,0x6a7687);b(x,1,z-.23,.7,.43,.04,0x273244);b(x,1.04,z-.2,.64,.34,.012,displayMat);};
  const phone=(x,z)=>{const p=b(x,.97,z,.22,.39,.04,displayMat);p.rotation.x=-.2;};
  const plant=(x,z)=>{b(x,0,z,.55,.65,.55,white);b(x,.65,z,.46,.025,.46,0x5d4c2a);b(x,.68,z,.07,1.25,.07,0x725738);for(let i=0;i<6;i++){const a=i*Math.PI/3,p=b(x+Math.cos(a)*.25,1.15+(i%2)*.15,z+Math.sin(a)*.25,.12,.8,.08,i%2?0x528841:0x326e37);p.rotation.z=Math.cos(a)*.6;p.rotation.x=Math.sin(a)*.6;}};
  const wallBay=(side,z,title,color)=>{
    const x=side*18.55,ry=side<0?Math.PI/2:-Math.PI/2;
    b(x,0,z,.45,3.15,3.6,wood);b(x-side*.25,.25,z,.04,2.1,3.4,white);
    pl(sign(title,color,'#ffffff',null,512,120),3.4,.65,x-side*.28,2.75,z,ry);
    for(let r=0;r<3;r++){b(x-side*.15,.5+r*.65,z,.6,.05,3.4,white);for(let i=0;i<5;i++)b(x-side*.3,.55+r*.65,z-1.25+i*.62,.09,.36,.24,displayMat);}
    obstacle(side<0?-18.9:18,side<0?-18:18.9,z-1.9,z+1.9);
  };
  b(0,-.02,16,120,.03,12,0x5d636b);b(0,0,5,120,.08,10,0xc4bfb5);for(let x=-56;x<60;x+=8)b(x,.01,16,4,.01,.25,0xf4f4f0);
  b(0,0,-13,38,.06,26,0xebe5db);
  const floor=pl(canvasTex(768,512,(g,W,H)=>{g.fillStyle='#eee7d8';g.fillRect(0,0,W,H);g.strokeStyle='#d3cbbc';for(let x=0;x<W;x+=32)for(let y=0;y<H;y+=32)g.strokeRect(x,y,32,32);}),38,26,0,.065,-13);floor.rotation.x=-Math.PI/2;
  b(0,0,-26.2,38.4,4.8,.4,white);for(const x of [-19.2,19.2])b(x,0,-13,.4,4.8,26.4,white);
  roofs.push(b(0,4.8,-13.2,38.4,.2,26,0xeee7db));
  for(const x of [-14,-7,0,7,14]){roofs.push(b(x,4.53,-13,.055,.06,24,0x343e49));for(const z of [-3,-8,-13,-18,-23])roofs.push(b(x,4.42,z,.15,.045,.2,bas(0xffe3a8)));}
  roofs.push(b(0,4.7,-13,9,.025,23,wood));
  fascia=true;
  // Blue portal and recessed white main panel match the real Shop 5 frontage.
  for(const side of [-1,1]){const p=b(side*19.2,0,.3,.9,9.3,1.35,blue);p.rotation.z=side*.045;}
  b(0,9.1,.25,38.7,.55,1.4,blue);b(0,8.8,.05,37.4,.18,1.1,navy);
  b(-3.25,4.05,.05,30.2,4.55,.25,white);b(15.2,4.05,.05,6.2,4.55,.25,navy);
  pl(canvasTex(1536,240,(g,W,H)=>{g.fillStyle='#f5f5f0';g.fillRect(0,0,W,H);g.fillStyle='#163655';g.textAlign='center';g.font='700 48px Arial';g.fillText('IT SOLUTIONS',260,72,480);g.fillText('SERVICES',660,72,260);g.fillText('MOBILE & ELECTRONICS',1160,72,700);
    const brands=[['mi','#f16c17'],['vivo','#225fd4'],['oppo','#247b47'],['HUAWEI','#bd2236'],['realme','#b99a00'],['HONOR','#273644'],['POCO','#b99500'],['Infinix','#273644'],['TECNO','#136eb9']];
    brands.forEach(([name,color],i)=>{g.fillStyle=color;g.font='700 39px Arial';g.fillText(name,(i+.5)*W/brands.length,136,W/brands.length-10);});
    g.fillStyle='#bbd5e9';g.fillRect(0,158,W,82);for(let i=0;i<16;i++){g.fillStyle=['#1e4c83','#d7587a','#58a5af','#dacdee'][i%4];g.fillRect(25+i*95,171,45,59);g.fillStyle='#eef7ff';g.fillRect(30+i*95,176,35,42);}
  }),29.9,4.3,-3.25,6.3,.19);
  pl(canvasTex(512,360,(g,W,H)=>{g.fillStyle='#16394f';g.fillRect(0,0,W,H);drawLogo(g,60,15,390);g.textAlign='center';for(const [name,x,y,color] of [['DELL',110,245,'#e2eaf1'],['hp',260,245,'#4ab4e2'],['acer',400,245,'#71bc4d'],['Lenovo',110,320,'#f05050'],['ASUS',260,320,'#67b6ed'],['msi',400,320,'#f05050']]){g.fillStyle=color;g.font='700 42px Arial';g.fillText(name,x,y);}}),6,4.3,15.2,6.3,.19);
  pl(canvasTex(1536,84,(g,W,H)=>{g.fillStyle='#f6f8f3';g.fillRect(0,0,W,H);drawLogo(g,8,3,160);g.fillStyle='#123fb7';g.font='700 56px Arial';g.textBaseline='middle';g.fillText('IT, MOBILE & ELECTRONICS MART',205,48,1300);}),29.5,1.6,-2,9.9,1);
  for(let x=-17;x<=17;x+=4)b(x,8.76,.6,.18,.035,.2,bas(0xffe3a8));
  fascia=false;
  // Flanking glazed brand corners and a recessed central automatic door.
  const glass=new THREE.MeshLambertMaterial({color:0xb4dbe3,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
  for(const [x,title] of [[-11.2,'SAMSUNG'],[11.2,'Apple · iPhone']]){b(x,3.45,.2,15.2,.65,.5,navy);label(title,x,3.76,.48,14.7,.5,'#315a70');for(const dx of [-5.7,5.7])b(x+dx,0,.1,3.4,3.4,.045,glass);for(const dx of [-7.4,-4,4,7.4])b(x+dx,0,.15,.045,3.4,.07,0x708492);}
  for(const x of [-3.65,3.65])b(x,0,.15,1.25,4.05,.8,0xd2d7d6);
  b(0,3.55,-.25,6,.16,.5,white);
  const leaves=[-1,1].map(side=>{
    const parts=[];
    const add=(x,y,z,w,h,d,m)=>{const mesh=b(x,y,z,w,h,d,m);mesh.userData.dynamic=true;parts.push({mesh,x:mesh.position.x});return mesh;};
    add(side*1.5,0,-.05,2.98,3.4,.045,glass);
    for(const dx of [-1.48,1.48])add(side*1.5+dx,0,0,.035,3.4,.055,0x6c828b);
    add(side*1.5,.05,0,2.98,.035,.055,0x6c828b);add(side*1.5,3.37,0,2.98,.035,.055,0x6c828b);add(side*.25,1.05,.06,.035,.6,.055,0x53656f);
    return {side,parts};
  });
  const welcome=pl(sign('WELCOME TO LINN SHOP 5','#0d3e85','#ffffff',null,768,128),5,1,0,.07,1);welcome.rotation.x=-Math.PI/2;
  // Reference floor plan: three front entrances and a raised rear gallery.
  // Side entrances are open glazed portals; the centre retains sliding doors.
  for(const [x,text] of [[-11.2,'Entrance 1 · Mobile'],[11.2,'Entrance 2 · IT Products']])label(text,x,3.05,.3,7,.45);
  const tile=canvasTex(768,512,(g,W,H)=>{g.fillStyle='#eee7d8';g.fillRect(0,0,W,H);g.strokeStyle='#d3cbbc';for(let x=0;x<W;x+=32)for(let y=0;y<H;y+=32)g.strokeRect(x,y,32,32);});
  b(0,-.45,-22.5,38,.45,7,0xe3d6bd);
  const rearFloor=pl(tile,38,7,0,.07,-22.5);rearFloor.rotation.x=-Math.PI/2;
  // Shallow, walkable steps; only the middle opening connects the two levels.
  for(let i=0;i<3;i++){
    const z=-17.5-i*.5;b(0,0,z,7,(i+1)*.15,.5,0xc5c3b9);b(0,(i+1)*.15+.01,z+.22,7,.015,.04,0xb19a60);
  }
  obstacle(-19,-3.6,-18.95,-18.85);obstacle(3.6,19,-18.95,-18.85);
  for(const [x,id,title] of [[-11.2,'samsung','Samsung Display Corner'],[11.2,'apple','iPhone Display Corner']]){
    desk(x,-3.1,7.2,1.7);for(let i=0;i<7;i++)phone(x-2.6+i*.85,-3.1);
    b(x,.1,-4.25,7.5,2.8,.15,id==='apple'?0x202936:blue);label(title,x,2.45,-4.14,7,.5);place(id,title,x,-1.1,'Mobile phones');
  }
  for(const [i,title,color] of [[0,'Accessories','#163b7d'],[1,'oppo','#257442'],[2,'vivo','#1c54be']])wallBay(-1,-5.5-i*4,title,color);
  wallBay(1,-6,'IT Accessories','#24364d');wallBay(1,-11,'Laptop','#24364d');
  for(const x of [-14,-10,-6])for(const z of [-7,-9.5]){desk(x,z,3,1.5);for(let i=0;i<3;i++)phone(x-.9+i*.9,z);}
  place('macc','Mobile Accessories',-16.3,-6.2,'Accessories');place('oppo','OPPO · Mobile',-16.3,-9,'Mobile phones');place('vivo','vivo · Mobile',-16.3,-12,'Mobile phones');place('huawei','Huawei · Mobile',-14,-12,'Mobile phones');
  const waiting=(x,z)=>{
    b(x,.1,z,.18,.65,.18,0x58616a);
    const top=pl(canvasTex(128,128,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='#d8b47b';g.beginPath();g.arc(W/2,H/2,W*.49,0,Math.PI*2);g.fill();}),1.5,1.5,x,.78,z,0,true);top.rotation.x=-Math.PI/2;
    obstacle(x-.65,x+.65,z-.65,z+.65);
    for(const [dx,dz,rot] of [[0,1.25,Math.PI],[-1.25,0,Math.PI/2],[1.25,0,-Math.PI/2],[0,-1.25,0]]){
      b(x+dx,.1,z+dz,.6,.38,.6,0x536677);b(x+dx+Math.sin(rot)*.25,.48,z+dz+Math.cos(rot)*.25,Math.abs(dx)>.1?.1:.6,.55,Math.abs(dx)>.1?.6:.1,0x536677);
      obstacle(x+dx-.35,x+dx+.35,z+dz-.35,z+dz+.35);
      seats.push({x:ox+x+dx,z:oz+z+dz,y:level(z),f:0,site:5,rot,standDistance:.85,taken:false});
    }
    plant(x+1.1,z-1.4);
  };
  waiting(-2.8,-5.3);waiting(3.2,-5.3);waiting(-12,-22);waiting(-7.8,-22);
  place('seat','Waiting Tables',.2,-3.2,'Take a seat',{acts:[{l:'Sit',run:actions.sit}]});
  for(const x of [10,15]){desk(x,-8.5,3.8,1.8);for(const dx of [-1,0,1])laptop(x+dx,-8.5);}
  place('laptop','Laptops Area',12.5,-6.6,'Laptop / Desktop');place('itacc','IT Products & Accessories',16,-9.5,'IT accessories');
  const wall=(x,z,w,d)=>{b(x,0,z,w,2.5,d,white);obstacle(x-w/2,x+w/2,z-d/2,z+d/2);};
  const room=(x,w,name,door)=>{
    wall(x-w/2,-15.4,.15,6);wall(x+w/2,-15.4,.15,6);wall(x,-18.4,w,.15);
    const l=x-w/2,r=x+w/2,gap=1.8;
    if(door-gap/2>l)wall((l+door-gap/2)/2,-12.4,door-gap/2-l,.15);
    if(r>door+gap/2)wall((r+door+gap/2)/2,-12.4,r-door-gap/2,.15);
    roofs.push(b(x,2.5,-15.4,w,.1,6,0xe5dfd5));label(name,x,2.02,-12.28,w-.5,.5);
  };
  room(-12,8,'Server Room',-10);room(-5.5,5,'WC',-5.5);room(6.7,6.2,'Gaming Corner',6.7);room(14,8.4,'Office Room',12.1);
  for(const x of [-14.7,-13.3]){b(x,0,-17.5,.9,2,1,0x23313b);for(let i=0;i<9;i++)b(x,.25+i*.18,-16.98,.75,.05,.025,0x6d8293);obstacle(x-.55,x+.55,-18.1,-16.9);}
  place('server','Server Room',-10,-11.5,'Network / Server room',{acts:[{l:'Ask our staff',run:()=>actions.notice('Server Room · please ask Linn staff')}]});
  b(-5.5,.1,-17,.6,.4,.8,white);b(-5.5,.5,-17.3,.6,.65,.18,white);obstacle(-5.9,-5.1,-17.6,-16.5);
  place('wc','WC',-5.5,-11.5,'Restroom',{acts:[{l:'Open',run:()=>actions.notice('WC · walk through the marked doorway')}]});
  b(6.7,.07,-15.4,6,.03,5.8,0x29313d);
  for(const x of [3.8,9.6])b(x,.1,-17.8,.035,2.2,.04,bas(0x8470ff));
  desk(6.7,-17,4.5,1.5);for(const x of [5.5,7.9]){laptop(x,-17);b(x,1.12,-17.35,1.4,.85,.07,0x222937);pl(screenTextures[1],1.3,.75,x,1.55,-17.3);b(x,.1,-15.2,.65,.4,.7,0x202735);b(x,.5,-14.88,.65,1,.13,0x234884);obstacle(x-.4,x+.4,-15.6,-14.7);seats.push({x:ox+x,z:oz-15.2,y:0,f:0,site:5,rot:Math.PI,standDistance:1.1,taken:false});}
  place('gaming','Gaming Corner',6.7,-13.5,'Gaming PCs');
  desk(15,-16.7,4,1.3);laptop(14,-16.7);laptop(16,-16.7);place('office','Office Room',12.1,-11,'Please ask Linn staff',{acts:[{l:'Ask our staff',run:()=>actions.notice('Office Room · please ask Linn staff')}]});
  // Back-left service wall, rear-centre TV wall, rear-right appliances.
  desk(-17,-22.3,1.6,6);for(const z of [-20.6,-22.3,-24])laptop(-17,z);
  label('Service Counter',-16,3.3,-25.65,5,.6);place('service','Repair & Service Center',-15,-20,'Mobile / Computer / Printer',{acts:[{l:'Open',run:actions.service}]});
  for(const x of [-4.5,-1.5,1.5,4.5]){b(x,1.35,-25.65,2.8,1.65,.1,0x273447);pl(screenTextures[0],2.65,1.5,x,2.15,-25.58);}
  desk(0,-24.6,11.5,1.1);label('TV Display Area',0,3.5,-25.65,9,.6);place('tv','TV Display Area',0,-22.5,'TV / Home entertainment');
  for(const x of [8.3,10.3,16,17.8]){b(x,0,-24.4,1.45,2.4,1.2,0xc5cdd3);b(x,1.3,-23.76,.04,.6,.035,0x5d6b7b);obstacle(x-.8,x+.8,-25.1,-23.7);}
  for(const x of [12.2,14]){b(x,0,-24.4,1.5,1.2,1.2,white);b(x,.25,-23.77,.9,.8,.04,0x344958);obstacle(x-.8,x+.8,-25.1,-23.7);}
  label('Washing Machine · Refrigerator',13,3.5,-25.65,10,.6);place('fridge','Refrigerators',9.5,-22.2,'Home appliances');place('washer','Washing Machines',13,-22.2,'Home appliances');place('audio','Audio & Smart Devices',16.5,-21,'Audio');
  for(const [x,z] of [[-18,.8],[18,.8],[-4,.8],[4,.8],[-3.6,-17.5],[3.6,-17.5],[-17,-25],[6,-25],[18,-20]])plant(x,z);
  addStaff(mkW('Ma Yu',ox-18,oz-22,0,0,{site:5,elevation:.45}));addStaff(mkM('Ko Min',ox+15,oz-9.8,0,0,{site:5}));addStaff(mkW('Ma Thwe',ox+12,oz-4.1,0,0,{site:5}));
  let opening=0;
  return {update(dt,visitor,peers=[]){let target=shouldOpenShop5Entrance(visitor,site)?1:0;
    if(!target)for(const peer of peers){if(shouldOpenShop5Entrance({started:true,site:peer.pr?.site,x:peer.x,z:peer.z,drive:peer.d},site)){target=1;break;}}
    opening+=(target-opening)*Math.min(1,Math.max(0,dt)*7);for(const {side,parts} of leaves)for(const {mesh,x} of parts)mesh.position.x=x+side*opening*3.1;}};
}

export function shouldOpenShop5Entrance(visitor,site){
  return !!visitor.started&&visitor.site===5&&!visitor.drive&&Math.hypot(visitor.x-site.ox,visitor.z-site.oz)<5.5;
}

// Continuous stair height keeps walking/camera and broadcast avatar elevation in sync.
export function shop5GroundHeight(x,z,site){
  const lx=x-site.ox,lz=z-site.oz;
  if(Math.abs(lx)>19||lz < -26||lz>0)return 0;
  if(lz<=-19)return .45;
  if(Math.abs(lx)<3.6&&lz< -17.25)return Math.min(.45,(-17.25-lz)*.3);
  return 0;
}
