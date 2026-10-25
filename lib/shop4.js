// Narrow Myoma Market shop: 11m frontage, 24m depth, ONE sales floor.
// The tall white/silver front is signage, not an upstairs showroom.
export function buildShop4({THREE,site,box,plane,sign,canvasTex,drawLogo,bas,block,corner,roofs,seats,addStaff,mkM,mkW,actions,screenTextures}){
  const {ox,oz}=site,white=0xf5f5f2,navy=0x12366c;
  const b=(x,y,z,w,h,d,m)=>box(ox+x,y,oz+z,w,h,d,m);
  const pl=(map,w,h,x,y,z,ry=0)=>plane(map,w,h,ox+x,y,oz+z,ry);
  const obstacle=(x1,x2,z1,z2)=>block(ox+x1,ox+x2,oz+z1,oz+z2,0,4);
  const place=(id,name,x,z,sub,extra={})=>corner(id,name,0,ox+x,oz+z,sub,{site:4,...extra});
  const label=(text,x,y,z,w=4,h=.5,color='#12366c')=>pl(sign(text,color,'#ffffff',null,768,Math.max(48,Math.round(768*h/w))),w,h,x,y,z);
  const wood=new THREE.MeshLambertMaterial({map:canvasTex(128,128,(g,W,H)=>{g.fillStyle='#c8ad86';g.fillRect(0,0,W,H);g.fillStyle='#b49771';for(let x=0;x<W;x+=7)g.fillRect(x,0,1,H);})});
  const deviceMat=new THREE.MeshLambertMaterial({map:screenTextures[0],color:0xffffff,emissive:0xffffff,emissiveMap:screenTextures[0],emissiveIntensity:.35});
  const desk=(x,z,w,d)=>{b(x,.1,z,w,.78,d,wood);b(x,.88,z,w+.1,.07,d+.1,white);b(x,.04,z,w-.15,.06,d-.15,0x58616e);obstacle(x-w/2-.1,x+w/2+.1,z-d/2-.1,z+d/2+.1);};
  const laptop=(x,z)=>{b(x,.95,z,.7,.04,.48,0x646f80);b(x,1,z-.22,.7,.4,.04,0x202939);b(x,1.03,z-.195,.64,.33,.012,deviceMat);};
  const phone=(x,z)=>{const p=b(x,.96,z,.23,.4,.04,deviceMat);p.rotation.x=-.2;};
  const planter=(x,z)=>{b(x,0,z,.45,.6,.45,white);b(x,.6,z,.36,.025,.36,0x50492e);b(x,.62,z,.05,1.1,.05,0x6c5734);for(let i=0;i<6;i++){const a=i*Math.PI/3,leaf=b(x+Math.cos(a)*.2,1+(i%2)*.15,z+Math.sin(a)*.2,.1,.65,.07,i%2?0x3f8035:0x5a943a);leaf.rotation.z=Math.cos(a)*.6;leaf.rotation.x=Math.sin(a)*.6;}};
  const wallShelf=(side,z,title,color)=>{
    const x=side*5.18,ry=side<0?Math.PI/2:-Math.PI/2;
    b(x,0,z,.35,2.65,2.7,wood);b(x-side*.2,.25,z,.04,1.9,2.55,white);
    pl(sign(title,color,'#ffffff',null,512,120),2.6,.5,x-side*.23,2.4,z,ry);
    for(let r=0;r<3;r++){b(x-side*.1,.45+r*.58,z,.42,.05,2.6,white);for(let i=0;i<4;i++)b(x-side*.23,.5+r*.58,z-.85+i*.57,.08,.3,.22,deviceMat);}
    obstacle(side<0?-5.4:4.75,side<0?-4.75:5.4,z-1.4,z+1.4);
  };
  // Keep the market street and existing car approach; shrink the shop itself.
  b(0,-.02,16,120,.03,12,0x5d636b);b(0,0,5,120,.08,10,0xc5c1b7);
  for(let x=-56;x<60;x+=8)b(x,.01,16,4,.01,.25,0xf5f5ee);
  b(0,0,-12,11,.06,24,0xebe6da);
  const floor=pl(canvasTex(384,768,(g,W,H)=>{g.fillStyle='#e9e4da';g.fillRect(0,0,W,H);g.strokeStyle='#d0cabe';for(let x=0;x<W;x+=32)for(let y=0;y<H;y+=32)g.strokeRect(x,y,32,32);}),11,24,0,.065,-12);floor.rotation.x=-Math.PI/2;
  b(0,0,-24.2,11.4,3.55,.4,white);for(const x of [-5.7,5.7])b(x,0,-12,.4,3.55,24.4,white);
  roofs.push(b(0,3.55,-12.15,11.4,.18,24,0xede8dd));
  // Original photo proportions: narrow frontage with a tall unbroken panel.
  b(-3.75,3.6,.1,3.5,5.6,.35,white);b(1.25,3.6,.1,6.5,5.6,.35,0xbdc9dc);b(5,3.6,.1,1,5.6,.35,white);
  pl(canvasTex(512,768,(g,W,H)=>{g.fillStyle='#f7f8f7';g.fillRect(0,0,W,H);drawLogo(g,24,135,460);g.fillStyle='#182632';g.font='700 32px Arial';g.textAlign='center';g.fillText('IT, Mobile & Electronic',W/2,405,490);}),3.35,5.35,-3.75,6.4,.29);
  pl(canvasTex(640,560,(g,W,H)=>{
    const grad=g.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#d5dfec');grad.addColorStop(1,'#abb9cf');g.fillStyle=grad;g.fillRect(0,0,W,H);
    g.strokeStyle='#f5f7fa';g.lineWidth=3;for(let i=-H;i<W+H;i+=200){g.beginPath();g.moveTo(i,0);g.lineTo(i+H,H);g.moveTo(i,H);g.lineTo(i+H,0);g.stroke();}
    for(const [text,x,y,color,size] of [['HUAWEI',110,125,'#b32133',32],['Apple',355,68,'#24323d',39],['ASUS',490,160,'#173eb5',49],['HONOR',230,240,'#24323d',42],['SAMSUNG',360,310,'#263b55',38],['msi',550,260,'#d42331',48],['Lenovo',460,450,'#ed3437',47],['realme',125,505,'#cfa91c',42]]){g.font='700 '+size+'px Arial';g.textAlign='center';g.fillStyle='rgba(48,67,91,.2)';g.fillText(text,x+3,y+5);g.fillStyle=color;g.fillText(text,x,y);}
  }),6.35,5.35,1.25,6.4,.29);
  b(0,9.2,.1,11.4,.14,.65,0xd5dae0);b(0,3.48,.2,11.4,.16,.85,0xd2d5d6);
  for(const x of [-5.5,0,5.5])b(x,0,.15,.48,3.55,.7,0xe4e5e3);
  pl(canvasTex(256,128,(g,W,H)=>{g.fillStyle='#fff';g.fillRect(0,0,W,H);drawLogo(g,8,7,240);}),.42,.21,0,2.5,.51);
  const glass=new THREE.MeshLambertMaterial({color:0xbdd6e8,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
  for(const [x,title] of [[-2.75,'Mobile & Accessories'],[2.75,'Computer & IT']]){
    label(title,x,3.15,-.12,4.6,.3,'#64778a');
    for(const dx of [-2.25,2.25]){b(x+dx,0,.1,.85,2.95,.04,glass);b(x+dx,.05,.14,.85,.04,.05,0x74818c);}
    for(const dx of [-2.65,-1.82,1.82,2.65])b(x+dx,0,.15,.035,2.95,.06,0x74818c);
    for(const dx of [-1.9,1.9])b(x+dx,1,.2,.035,.45,.05,0x56616b);
    const mat=pl(sign('LINN SHOP 4','#0e3a89','#ffffff',null,512,128),2.7,.7,x,.07,.7);mat.rotation.x=-Math.PI/2;
  }
  for(const x of [-3.7,0,3.7]){roofs.push(b(x,3.35,-12,.045,.05,22,0x303a46));for(const z of [-3,-8,-13,-18,-22])roofs.push(b(x,3.25,z,.13,.05,.15,bas(0xffe3ad)));}
  // Small sales islands, side-wall displays, and an uninterrupted centre aisle.
  for(const [i,title,color] of [[0,'SAMSUNG','#153ab2'],[1,'oppo','#217b37'],[2,'vivo','#2352bd'],[3,'mi','#ed6b17']])wallShelf(-1,-3-i*3,title,color);
  desk(-3.2,-6.5,1.3,4.5);for(let i=0;i<4;i++)phone(-3.2,-8+i);
  place('macc','Mobile Phone & Accessories',-1.6,-3,'Mobile phones');place('samsung','Samsung · Mobile',-4.1,-3,'Mobile phones');place('oppo','OPPO · Mobile',-4.1,-6,'Mobile phones');place('vivo','vivo · Mobile',-4.1,-9,'Mobile phones');
  desk(3.2,-6.5,1.4,4.5);for(const z of [-7.8,-6.3,-4.8])laptop(3.2,z);
  for(const [i,title,color] of [[0,'ASUS','#153cb0'],[1,'msi','#a31b27'],[2,'Lenovo','#c32232']])wallShelf(1,-3-i*3.7,title,color);
  place('laptop','Computer & IT Products',1.5,-3,'Laptop / Desktop');place('acc','IT Accessories',3.7,-11.5,'Accessories');
  // Rear-left service and a two-seat waiting bench, scaled for the real shop.
  desk(-2.7,-21.5,4,1.1);laptop(-3.6,-21.5);laptop(-1.7,-21.5);
  label('Service Center',-2.7,2.7,-23.95,4.5,.6);label('Mobile · Computer · Printer',-2.7,2.15,-23.94,4.4,.35);
  place('service','Repair & Service Center',-2.5,-19.4,'Mobile / Computer / Printer',{acts:[{l:'Open',run:actions.service}]});
  b(-2.9,.1,-16,2.6,.35,1,0x515f73);b(-2.9,.45,-16.45,2.6,.7,.14,0x515f73);for(const dx of [-1.22,1.22])b(-2.9+dx,.4,-16,.15,.5,1,0x435164);obstacle(-4.3,-1.5,-16.6,-15.4);
  for(const dx of [-.65,.65])seats.push({x:ox-2.9+dx,z:oz-16,y:0,f:0,site:4,rot:0,standDistance:1.25,taken:false});
  desk(-2.9,-14,1,.6);place('seat','Customer Waiting Area',-1.05,-15.6,'Take a seat',{acts:[{l:'Sit',run:actions.sit}]});
  // Compact rear-right electronics, with enough space to browse each display.
  label('Electronics & Home Appliances',2.7,2.8,-23.95,4.8,.55);
  b(2,1.1,-23.75,3.2,1.8,.1,0x1c293d);pl(screenTextures[0],3,1.6,2,2,-23.68);
  b(4.2,0,-21.2,1.2,2.3,.85,0xd6dce2);b(4.2,1.4,-20.75,.04,.5,.035,0x515b68);obstacle(3.5,4.9,-21.8,-20.6);
  b(1.6,0,-20,1.1,1.2,.85,white);b(1.6,.3,-19.55,.7,.65,.035,0x344556);obstacle(.95,2.25,-20.6,-19.4);
  desk(3.8,-16,1.1,1);b(3.8,.95,-16,.4,.8,.3,0x263952);
  place('tv','TV & Electronics',2.1,-22,'TV');place('fridge','Refrigerators',3.1,-20,'Home appliances');place('washer','Washing Machines',.3,-20,'Home appliances');place('audio','Audio & Smart Devices',2.5,-16,'Audio');
  for(const x of [-5,5])planter(x,.7);
  addStaff(mkW('Ma Hnin',ox-2.5,oz-22.5,0,0,{site:4}));addStaff(mkM('Ko Aung',ox+4.1,oz-12.4,0,0,{site:4}));
}
