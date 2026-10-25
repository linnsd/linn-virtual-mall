// Prototype layout: three glazed entrances on ONE connected sales floor.
// The lower cutaway in the reference is a plan of this floor, not another storey.
export function buildShop2({THREE,scene,site,box,plane,sign,bas,block,corner,roofs,plant,seats,addStaff,mkM,mkW,actions,screenTextures,canvasTex,drawLogo}){
  const {ox,oz}=site;
  const b=(x,y,z,w,h,d,m)=>box(x+ox,y,z+oz,w,h,d,m);
  const pl=(texture,w,h,x,y,z,rotation=0,transparent=false)=>plane(texture,w,h,x+ox,y,z+oz,rotation,transparent);
  const obstacle=(x1,x2,z1,z2)=>block(x1+ox,x2+ox,z1+oz,z2+oz,0,2);
  const place=(id,name,x,z,sub,extra={})=>corner(id,name,0,x+ox,z+oz,sub,{site:2,...extra});
  const navy=0x10284a,white=0xf5f5f0;
  // Small shared canvas maps provide showroom detail without downloaded models,
  // reflection render passes or dozens of dynamic lights on phones.
  const tiles=canvasTex(768,512,(g,W,H)=>{
    g.fillStyle='#e6dfd1';g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=32)for(let x=0;x<W;x+=32){
      g.fillStyle=(x/32+y/32)%2?'#eee9df':'#e5e0d6';g.fillRect(x+1,y+1,30,30);
      g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x+2,y+2,28,1);
    }
  });
  const wood=canvasTex(128,256,(g,W,H)=>{g.fillStyle='#c5a57d';g.fillRect(0,0,W,H);for(let i=0;i<32;i++){g.fillStyle=i%3?'#cbae88':'#b89a75';g.fillRect(i*4,0,1,H);}});
  const woodMat=new THREE.MeshLambertMaterial({map:wood,color:0xffffff});
  const panelMat=new THREE.MeshLambertMaterial({color:0xeeeae1,emissive:0x8c7652,emissiveIntensity:.15});
  const screenMap=screenTextures[0];
  const fascia=(title,x,y,z,w,h=.65,color='#10284a',sub=null)=>pl(sign(title,color,'#ffffff',sub,1024,Math.max(80,Math.round(1024*h/w))),w,h,x,y,z);

  const label=(title,x,y,z,w=3,color='#10284a',sub=null)=>fascia(title,x,y,z,w,.65,color,sub);
  const table=(x,z,w,d,color=woodMat)=>{b(x,.12,z,w,.78,d,color);b(x,.9,z,w+.12,.07,d+.12,white);b(x,.08,z,w-.12,.06,d-.12,0x555965);obstacle(x-w/2-.05,x+w/2+.05,z-d/2-.05,z+d/2+.05);};
  const laptop=(x,z)=>{b(x,.97,z,.64,.035,.45,0x87909d);const s=b(x,1,z-.2,.64,.4,.035,navy);s.rotation.x=-.18;const display=pl(screenMap,.58,.33,x,1.22,z-.175);display.rotation.x=-.18;};
  const phone=(x,z,i)=>{const p=b(x,.98,z,.23,.4,.035,[navy,0x0751b2,0xbd683f][i%3]);p.rotation.x=-.22;const display=pl(screenMap,.195,.32,x,1.18,z+.045);display.rotation.x=-.22;};
  const shelf=(x,z,w,title,color)=>{
    b(x,0,z,w,2.85,.4,woodMat);b(x,.25,z+.21,w-.14,2.3,.04,panelMat);label(title,x,3,z+.26,w,color);
    for(let r=0;r<3;r++){b(x,.55+r*.65,z+.12,w,.055,.5,white);b(x,.51+r*.65,z+.35,w-.1,.025,.04,bas(0xffe2a4));for(let i=0;i<5;i++){const px=x-w*.4+i*w*.2;b(px,.6+r*.65,z+.22,.26,.4,.14,0x384252);pl(screenMap,.2,.29,px,.82+r*.65,z+.3);}}
    obstacle(x-w/2,x+w/2,z-.25,z+.45);
  };
  b(0,-.02,16,120,.03,12,0x5d636b);b(0,0,5,120,.08,10,0xb9b2a6);
  for(let x=-56;x<60;x+=8)b(x,.01,16,4,.01,.25,0xf2f2f2);
  b(0,0,-11,34,.06,22,0xf2eee5);const floor=pl(tiles,34,22,0,.065,-11);floor.rotation.x=-Math.PI/2;
  // Shallow tiled thresholds remain level with the walkable floor.
  for(const x of [-11.3,0,11.3])b(x,.015,.9,10.6,.025,1.8,0xd1d2d1);
  b(0,0,-22.2,34.4,4.8,.4,white);b(-17.2,0,-11,.4,4.8,22.4,white);b(17.2,0,-11,.4,4.8,22.4,white);
  roofs.push(b(0,4.8,-11.3,35,.22,22,0xf1eadd));
  const ceiling=pl(canvasTex(512,512,(g,W,H)=>{g.fillStyle='#eee9dd';g.fillRect(0,0,W,H);g.strokeStyle='#c8c0ae';g.lineWidth=2;for(let i=0;i<=512;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.moveTo(0,i);g.lineTo(W,i);g.stroke();}}),34,22,0,4.79,-11);ceiling.rotation.x=Math.PI/2;roofs.push(ceiling);
  // Actual Shop 2 exterior: a tall blue portal with a stepped/sloping cap.
  // These upper panels are signage above the existing single sales floor.
  const facadeBlue=0x064fa8,facadeDark=0x15334e;
  for(const x of [-17.25,17.25])b(x,0,.28,.7,x<0?7.9:7.1,.9,facadeBlue);
  for(const x of [-5.7,5.7])b(x,0,.12,.55,7.05,.7,facadeDark);
  const cap=[[-17.6,7.9],[3.2,7.9],[6.2,7.1],[17.6,7.1]];
  for(let i=1;i<cap.length;i++){
    const [ax,ay]=cap[i-1],[bx,by]=cap[i],dx=bx-ax,dy=by-ay;
    const beam=b((ax+bx)/2,(ay+by)/2-.14,.32,Math.hypot(dx,dy),.28,1.6,facadeBlue);beam.rotation.z=Math.atan2(dy,dx);
    const soffit=b((ax+bx)/2,(ay+by)/2-.23,.22,Math.hypot(dx,dy),.06,1.4,facadeDark);soffit.rotation.z=Math.atan2(dy,dx);
  }
  // Closed cladding behind the roofline avoids a floating sign silhouette.
  b(-6.9,6.85,-.15,20.7,.88,.35,facadeDark);b(11.8,6.85,-.15,10.8,.12,.35,facadeDark);
  for(let i=0;i<6;i++){const x=3.45+i*.5,h=7.72-(x-3.2)*.8/3-6.85;if(h>0)b(x,6.85,-.15,.51,h,.35,facadeDark);}
  pl(canvasTex(1536,140,(g,W,H)=>{
    drawLogo(g,15,8,270);g.fillStyle='#ffffff';g.font='700 56px Arial';g.textBaseline='middle';g.fillText('IT, MOBILE & ELECTRONIC MART',325,94,1190);
  }),22.2,2.02,-6.4,8.65,1.18,0,true);
  const facadePanels=[
    [-11.3,'IT SOLUTION',[['Lenovo','#cf1728'],['ASUS','#16348c'],['acer','#4a992b'],['hp','#149bd3'],['DELL','#2351ad']],'LAPTOP · DESKTOP · IT ACCESSORIES'],
    [0,'SERVICES',[['Apple','#172432'],['Computer Service','#183c62'],['Repair Center','#183c62'],['SAMSUNG','#16409d']],'PROFESSIONAL SERVICE & SUPPORT'],
    [11.3,'MOBILE & ELECTRONIC',[['SAMSUNG','#1745b1'],['oppo','#297d37'],['vivo','#2958c7'],['mi','#ed7114'],['HUAWEI','#c82631'],['realme','#a17d00'],['TECNO','#1745b1']],'SMARTPHONES · ACCESSORIES · HOME ELECTRONICS']
  ];
  for(const [x,title,brands,subtitle] of facadePanels){
    b(x,3.55,.1,10.8,3.3,.22,0xf2f1ea);
    pl(canvasTex(1024,320,(g,W,H)=>{
      g.fillStyle='#f5f5ef';g.fillRect(0,0,W,H);g.strokeStyle='#d4d6d5';g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);
      g.fillStyle='#102e50';g.font='700 65px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(title,W/2,70,W-50);
      brands.forEach(([name,color],i)=>{g.fillStyle=color;g.font='700 '+(name.length>10?23:31)+'px Arial';g.fillText(name,(i+.5)*W/brands.length,145,W/brands.length-14);});
      g.fillStyle='#073478';g.fillRect(0,190,W,130);g.fillStyle='#ffffff';g.font='700 32px Arial';g.fillText(subtitle,W/2,222,W-40);
      g.font='22px Arial';g.fillText(title==='SERVICES'?'Device Repair     Software Service     Data Recovery':title==='IT SOLUTION'?'Laptops & Computers     Gaming     IT Solutions':'Mobile Phones     TV & Electronics     Accessories',W/2,275,W-40);
    }),10.65,3.25,x,5.21,.225);
    b(x,3.45,.17,10.8,.1,.35,facadeBlue);
    for(const dx of [-3.9,0,3.9])b(x+dx,6.9,.72,.18,.035,.18,bas(0xffe1aa));
  }
  const glass=new THREE.MeshLambertMaterial({color:0xcfe8ff,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide});
  for(const [i,x,title] of [[1,-11.3,'IT & Gaming Products'],[2,0,'Service Center'],[3,11.3,'Mobile Phone & Accessories']]){
    b(x,3.4,.14,10.65,.045,.12,bas(0xffdaa0));
    // Fixed glass and open central doorway; collision uses the same 4m opening.
    for(const dx of [-3.65,3.65]){b(x+dx,0,.1,3.25,3.5,.045,glass);b(x+dx,.06,.13,3.25,.04,.055,0x75818d);b(x+dx,3.44,.13,3.25,.04,.055,0x75818d);}
    for(const dx of [-5.28,-2.03,2.03,5.28])b(x+dx,0,.13,.045,3.5,.065,0x75818d);
    for(const dx of [-2.2,2.2])b(x+dx,1.05,.23,.045,.55,.05,0x424b54);
    // Recessed door leaves stay against the fixed panels and outside the path.
    for(const dx of [-2.7,2.7]){b(x+dx,0,-.35,1.3,3.42,.03,glass);b(x+dx,0,-.32,.035,3.42,.045,0x75818d);}
    const welcome=pl(sign('Entrance '+i,i===1?'#0751b2':i===2?'#7530c7':'#ce222c','#ffffff',title,768,220),7,1.5,x,.07,2.2);welcome.rotation.x=-Math.PI/2;
    for(const dx of [-3.6,3.6]){
      roofs.push(b(x+dx,4.55,-11,.06,.08,20,0x323842));
      for(const z of [-2.5,-6,-10,-14,-18]){roofs.push(b(x+dx,4.38,z,.16,.2,.2,0x303640));roofs.push(b(x+dx,4.35,z,.18,.035,.22,bas(0xffdf9b)));}
    }
    for(const z of [-4,-12,-20])roofs.push(b(x,4.65,z,6,.025,.1,bas(0xffedce)));
  }
  // Short rear partitions define departments; the central cross-aisle at z=-7
  // remains clear so customers can walk between all three without going outside.
  for(const x of [-5.7,5.7]){b(x,0,-17,.15,3.6,10,white);obstacle(x-.12,x+.12,-22,-12);}
  // LEFT: branded rear shelves, gaming wall, islands and front IT cashier.
  for(const [x,title,color] of [[-15,'ASUS','#1537a6'],[-12.5,'Lenovo','#b91e27'],[-10,'msi','#be1726'],[-7.5,'acer','#4a9527']])shelf(x,-21.5,2.35,title,color);
  for(const z of [-16,-12]){b(-16.65,.3,z,.18,1.7,2.6,navy);pl(screenTextures[0],2.4,1.35,-16.53,1.6,z,Math.PI/2);}
  label('Gaming & Promo Products',-14.8,2.8,-18.5,3.2);table(-15.3,-7.5,1.6,2.8,navy);fascia('GAMING',-15.3,.6,-6.07,1.4,.35);b(-15.3,.97,-7.5,.6,1,.55,0x202a3c);pl(screenMap,.5,.7,-15.3,1.47,-7.21);
  for(const x of [-13.8,-9])for(const z of [-16,-11.4]){table(x,z,2.5,2);laptop(x-.65,z);laptop(x+.65,z);}
  table(-14,-3.4,3.8,1.2);label('IT CASHIER',-14,.55,-2.78,3.4,'#10284a');b(-14,.12,-2.77,3.6,.035,.035,bas(0x75b5ff));laptop(-14,-3.4);
  place('laptop','IT & Gaming Products',-11.2,-9,'Laptop / Desktop');place('acc','IT Accessories',-11.3,-19,'Accessories');
  // MIDDLE: reception flanks the front door; waiting sofas are behind reception,
  // with repair benches at the rear. A clear centre aisle connects them.
  for(const x of [-2.7,0,2.7]){table(x,-20,2.25,1.2,0xc9ced8);laptop(x,-20);}
  pl(canvasTex(768,300,(g,W,H)=>{g.fillStyle='#faf8f1';g.fillRect(0,0,W,H);drawLogo(g,250,12,270);g.fillStyle='#172642';g.font='700 48px Arial';g.textAlign='center';g.fillText('LINN Service Center',W/2,215);g.font='28px Arial';g.fillText('Repair Area · Technicians',W/2,270);}),5,1.8,0,3.2,-21.7);
  pl(screenMap,2.1,1.15,0,1.9,-21.65);
  for(const [x,title,color] of [[-3.4,'Mobile Service Reception','#0751b2'],[3.4,'Computer Service Reception','#14694d']]){
    table(x,-3.9,3.5,1.3);laptop(x,-3.9);fascia(title,x,.55,-3.22,3.25,.65,color);b(x,.12,-3.2,3.3,.03,.04,bas(0x75b5ff));
  }
  function sofa(x,z){
    b(x,0,z,2.9,.24,1,0x303b49);b(x,.24,z,2.9,.32,1,0x536279);b(x,.48,z+.43,2.9,.75,.18,0x536279);
    for(const dx of [-1.4,1.4])b(x+dx,.35,z,.16,.55,1,0x425067);
    obstacle(x-1.55,x+1.55,z-.55,z+.6);
    for(const dx of [-.72,.72])seats.push({x:ox+x+dx,z:oz+z,y:0,f:0,site:2,rot:Math.PI,taken:false});
  }
  sofa(-2.7,-14);sofa(2.7,-14);table(0,-12.2,1.2,.9,0xadb5be);
  place('seat','Customer Waiting Area',-1.6,-12,'Take a seat',{acts:[{l:'Sit',run:actions.sit}]});
  pl(sign('Customer Waiting Area','#f5f5f0','#10284a',null,1024,100),5,.4,0,.75,-11.7);
  place('service','Repair & Service Center',0,-6.8,'Service',{acts:[{l:'Open',run:actions.service}]});
  // RIGHT: five branded rear bays, three long parallel phone display islands,
  // and the accessory wall along the far right side, as in the supplied plan.
  for(const [i,title,color] of [[0,'SAMSUNG','#1433a2'],[1,'Apple','#202128'],[2,'mi','#f46b13'],[3,'oppo','#16713e'],[4,'vivo','#1f50cf']]){
    const x=7+i*2.1;shelf(x,-21.5,2,title,color);
    if(['SAMSUNG','oppo','vivo'].includes(title))place(title.toLowerCase(),title+' · Mobile',x,-19,'Mobile phones');
  }
  for(const x of [7.8,11.2,14.6]){
    table(x,-12.5,1.5,8);b(x,.15,-8.46,1.25,.65,.025,navy);pl(screenMap,1.12,.55,x,.5,-8.435);
    b(x,.08,-8.42,1.5,.04,.04,bas(0x79a8ee));
    for(let i=0;i<6;i++)phone(x,-15.8+i*1.3,i);
  }
  b(16.65,0,-11,.25,2.9,16,white);obstacle(16.35,16.9,-19,-3);
  for(let r=0;r<3;r++)for(let i=0;i<12;i++)b(16.45,.65+r*.65,-18+i*1.2,.18,.4,.35,[navy,0xb8bfc8,0x0751b2][i%3]);
  label('Mobile Accessories',14.3,3,-4.1,4);
  table(8.2,-3.7,3,1.2);fascia('MOBILE CASHIER',8.2,.55,-3.07,2.8,.6);b(8.2,.12,-3.05,2.8,.03,.04,bas(0x75b5ff));laptop(8.2,-3.7);
  place('smart','Mobile Phone & Accessories',11.3,-5.5,'Mobile / Electronics');
  place('tv','TV & Electronics',15,-18,'Electronics');
  function planter(x,z){
    b(x,0,z,.62,.75,.62,white);b(x,.75,z,.55,.035,.55,0x54452e);b(x,.77,z,.065,1.6,.065,0x705334);
    for(let i=0;i<7;i++){
      const angle=i*Math.PI*2/7,dx=Math.cos(angle)*.35,dz=Math.sin(angle)*.35;
      const leaf=b(x+dx,1.2+(i%3)*.22,z+dz,.14,.95,.09,i%2?0x387634:0x528c3c);leaf.rotation.z=Math.cos(angle)*.65;leaf.rotation.x=Math.sin(angle)*.65;
    }
  }
  for(const x of [-16,-5,5,16])planter(x,.8);
  for(const x of [-4.7,4.7])planter(x,-17.5);
  addStaff(mkM('Ko Lin',ox-14,oz-4.7,0,0,{site:2}));addStaff(mkW('Ma Su',ox-3.4,oz-5.1,0,0,{site:2}));addStaff(mkW('Ma Thiri',ox+8.2,oz-4.9,0,0,{site:2}));
}
