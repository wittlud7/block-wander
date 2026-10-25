(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.GardenRender = factory(root.GardenEngine);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Engine) {
  'use strict';
  const COLORS = { I:'#70d5db', O:'#e9c574', T:'#bca0dc', J:'#7fa5da', L:'#e5a178', S:'#8ebc99', Z:'#db8d9c', M:'#667d72', N:'#53695f', B:'#98d7ad' };
  const STAGES = [ { at:0, name:'初见小岛', next:'湖畔小屋' }, { at:4, name:'湖畔小屋', next:'风车花园' }, { at:10, name:'风车花园', next:'林间书店' }, { at:18, name:'林间书店', next:'星光灯塔' }, { at:28, name:'星光灯塔', next:'云端花园' }, { at:40, name:'云端花园', next:null } ];
  function stage(energy) { return STAGES.reduce((best, s, i) => energy >= s.at ? i : best, 0); }
  function round(ctx, x,y,w,h,r,fill,stroke) {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
    if(fill) { ctx.fillStyle=fill; ctx.fill(); } if(stroke) { ctx.strokeStyle=stroke; ctx.stroke(); }
  }
  function poly(ctx, pts, fill, stroke) { ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.stroke();} }
  function block(ctx,x,y,s,type,ghost=false) {
    const color=COLORS[type]||'#829c8b',r=Math.max(2,s*.12);
    if(ghost) { ctx.lineWidth=1.5;ctx.globalAlpha=.65;round(ctx,x+2,y+2,s-4,s-4,r,null,color);ctx.globalAlpha=.12;round(ctx,x+3,y+3,s-6,s-6,r,color);ctx.globalAlpha=1;return; }
    const fill=ctx.createLinearGradient(x,y,x+s,y+s);fill.addColorStop(0,color);fill.addColorStop(.52,color);fill.addColorStop(1,'#243f42');
    round(ctx,x+1,y+2,s-2,s-2,r,'#051b1e');round(ctx,x+1,y+1,s-2,s-3,r,fill);
    const inset=s*.15;
    poly(ctx,[[x+2,y+2],[x+s-2,y+2],[x+s-inset,y+inset],[x+inset,y+inset]],'#ffffff55');
    poly(ctx,[[x+2,y+2],[x+inset,y+inset],[x+inset,y+s-inset],[x+2,y+s-3]],'#ffffff28');
    poly(ctx,[[x+s-2,y+2],[x+s-2,y+s-3],[x+s-inset,y+s-inset],[x+s-inset,y+inset]],'#082c3630');
    round(ctx,x+inset,y+inset,s-inset*2,s-inset*2,r*.6,'#ffffff0a','#ffffff20');
    if(type==='B'){
      ctx.save();ctx.translate(x+s/2,y+s/2);ctx.strokeStyle='#f4f6c6';ctx.lineWidth=Math.max(1,s*.05);ctx.beginPath();ctx.moveTo(0,s*.2);ctx.quadraticCurveTo(-s*.05,0,s*.09,-s*.16);ctx.stroke();
      ctx.fillStyle='#f4f6c6';ctx.beginPath();ctx.ellipse(-s*.1,-s*.03,s*.12,s*.06,.6,0,7);ctx.ellipse(s*.1,-s*.13,s*.12,s*.06,-.5,0,7);ctx.fill();ctx.restore();
    }else if(type==='M'||type==='N'){
      ctx.strokeStyle='#d4e2c92a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+s*.2,y+s*.7);ctx.lineTo(x+s*.45,y+s*.4);ctx.lineTo(x+s*.7,y+s*.55);ctx.stroke();
    }else{
      ctx.fillStyle='#ffffff58';ctx.beginPath();ctx.arc(x+s*.27,y+s*.26,Math.max(.8,s*.035),0,7);ctx.fill();
    }
  }
  function board(ctx, game, w,h,time,effects=[]) {
    ctx.clearRect(0,0,w,h); const size=Math.min(w/10,h/20),ox=(w-size*10)/2,oy=(h-size*20)/2;
    const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#102c30');bg.addColorStop(1,'#0b2227');ctx.fillStyle=bg;ctx.fillRect(ox,oy,size*10,size*20);
    for(let y=0;y<20;y++)for(let x=0;x<10;x++)if((x+y)%2===0){ctx.fillStyle='#ffffff02';ctx.fillRect(ox+x*size,oy+y*size,size,size);}
    ctx.strokeStyle='#7ea99a18';ctx.lineWidth=.7;
    for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(ox+i*size,oy);ctx.lineTo(ox+i*size,oy+20*size);ctx.stroke();}
    for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(ox,oy+i*size);ctx.lineTo(ox+10*size,oy+i*size);ctx.stroke();}
    game.board.forEach((row,y)=>row.forEach((type,x)=>{if(type)block(ctx,ox+x*size,oy+y*size,size,type);}));
    const p=game.piece;
    if(p && !['over','won'].includes(game.status)) {
      const gy=game.ghostY();
      p.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v && gy+y>=0)block(ctx,ox+(p.x+x)*size,oy+(gy+y)*size,size,p.type,true);}));
      p.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v && p.y+y>=0)block(ctx,ox+(p.x+x)*size,oy+(p.y+y)*size,size,p.type);}));
    }
    effects.forEach(e=>{
      const age=(time-e.time)/650; if(age<0||age>1)return;
      if(e.type==='drop'&&e.piece){const p=e.piece;ctx.save();ctx.globalAlpha=(1-age)*.35;const trail=ctx.createLinearGradient(0,p.y*size,0,(p.y+e.distance+2)*size);trail.addColorStop(0,'#a6f4de00');trail.addColorStop(1,'#b3efdf');ctx.fillStyle=trail;ctx.fillRect(ox+p.x*size,oy+p.y*size,p.matrix.length*size,e.distance*size);ctx.restore();}
      if(e.type==='clear')e.rows.forEach(row=>{ctx.globalAlpha=(1-age)*.8;ctx.fillStyle='#fff9cc';ctx.fillRect(ox,oy+row*size,size*10,size);ctx.globalAlpha=1;
        for(let i=0;i<16;i++){const px=ox+(i+.5)/16*size*10,py=oy+row*size+size/2-age*60*(.5+(i%3)/3);ctx.globalAlpha=1-age;ctx.fillStyle=i%2?'#ebbf62':'#5b947d';ctx.fillRect(px+Math.sin(i)*age*25,py,4*(1-age)+1,4*(1-age)+1);ctx.globalAlpha=1;}});
    });
  }
  function preview(ctx,type,w,h) {
    ctx.clearRect(0,0,w,h); if(!type)return;
    const m=Engine.SHAPES[type], cells=[];
    m.forEach((row,y)=>row.forEach((v,x)=>{if(v)cells.push([x,y]);}));
    const minX=Math.min(...cells.map(p=>p[0])),maxX=Math.max(...cells.map(p=>p[0]));
    const minY=Math.min(...cells.map(p=>p[1])),maxY=Math.max(...cells.map(p=>p[1]));
    const s=Math.min(21,(w-12)/(maxX-minX+1),(h-8)/(maxY-minY+1));
    cells.forEach(([x,y])=>block(ctx,(w-(maxX-minX+1)*s)/2+(x-minX)*s,(h-(maxY-minY+1)*s)/2+(y-minY)*s,s,type));
  }
  function city(ctx,w,h,time,energy=0,options={}) {
    ctx.clearRect(0,0,w,h);ctx.save();ctx.scale(w/620,h/450);
    const t=time/1000, st=stage(energy);
    const gradient=ctx.createLinearGradient(0,0,0,450);gradient.addColorStop(0,'#edf4ed');gradient.addColorStop(1,'#e2eee6');ctx.fillStyle=gradient;ctx.fillRect(0,0,620,450);
    // Quiet orbital lines, drifting clouds and distant birds.
    ctx.strokeStyle='#b6d0c580';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(310,315,260,95,-.08,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.ellipse(310,315,235,80,-.08,0,Math.PI*2);ctx.stroke();
    function cloud(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#ffffffa0';for(const [a,b,r]of [[0,0,17],[20,-7,23],[45,0,18]]){ctx.beginPath();ctx.arc(a,b,r,0,7);ctx.fill();}ctx.restore();}
    cloud(70+Math.sin(t*.12)*12,105,.9);cloud(466+Math.sin(t*.1)*14,170,.7);cloud(415,65,.5);
    ctx.strokeStyle='#718f83';ctx.lineWidth=1.5;
    for(let i=0;i<3;i++){const x=380+i*18+Math.sin(t*.2)*12,y=90+i%2*10;ctx.beginPath();ctx.moveTo(x-5,y);ctx.quadraticCurveTo(x-2,y-4-Math.sin(t*3+i)*2,x,y);ctx.quadraticCurveTo(x+2,y-4-Math.sin(t*3+i)*2,x+5,y);ctx.stroke();}
    ctx.save();ctx.translate(310,218+Math.sin(t*.65)*3);
    ctx.fillStyle='#6a978827';ctx.beginPath();ctx.ellipse(0,140,153,39,0,0,7);ctx.fill();
    // Chunky floating island, with a little lake set into its lawn.
    poly(ctx,[[-190,30],[5,132],[190,27],[190,66],[5,176],[-190,74]],'#91ad94');
    poly(ctx,[[5,132],[190,27],[190,66],[5,176]],'#729782');
    poly(ctx,[[-190,30],[-5,-75],[190,27],[5,132]],'#b7cda2');
    poly(ctx,[[-178,30],[-5,-62],[176,27],[5,119]],'#c5d8af');
    poly(ctx,[[-189,55],[-115,95],[-115,110],[-189,72]],'#a5ba9a');
    poly(ctx,[[53,122],[97,97],[97,123],[53,148]],'#82a187');
    ctx.strokeStyle='#688d753b'; for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-175+i*32,48+i*17);ctx.lineTo(-175+i*32,73+i*17);ctx.stroke();}
    // Isometric world coordinates.
    const project=(x,z,y=0)=>[(x-z)*.82,(x+z)*.43-y+28];
    function tile(x,z,s,color){poly(ctx,[project(x,z),project(x+s,z),project(x+s,z+s),project(x,z+s)],color);}
    function box(x,z,sx,sz,height,color='#f5ead0'){
      const a=project(x,z),b=project(x+sx,z),c=project(x+sx,z+sz),d=project(x,z+sz);
      const at=project(x,z,height),bt=project(x+sx,z,height),ct=project(x+sx,z+sz,height),dt=project(x,z+sz,height);
      poly(ctx,[d,c,ct,dt],color);poly(ctx,[b,c,ct,bt],'#d3d6bd');poly(ctx,[at,bt,ct,dt],'#fff5dc');
      return {a,b,c,d,at,bt,ct,dt};
    }
    function tree(x,z,s=1){
      const [px,py]=project(x,z);ctx.fillStyle='#77977538';ctx.beginPath();ctx.ellipse(px+4,py+3,15*s,6*s,0,0,7);ctx.fill();
      ctx.fillStyle='#9b8665';ctx.fillRect(px-2*s,py-26*s,4*s,27*s);
      for(const [dx,dy,r,col]of [[0,-32,17,'#568e78'],[-9,-25,13,'#669e7c'],[9,-26,12,'#78aa83'],[-2,-45,12,'#86b38a']]){ctx.fillStyle=col;ctx.beginPath();ctx.arc(px+dx*s,py+dy*s,r*s,0,7);ctx.fill();}
    }
    function house(x,z,size=43){
      const q=box(x,z,size,size,42,'#f6ecd6'),mid=project(x+size/2,z,68),mid2=project(x+size/2,z+size,68);
      poly(ctx,[q.dt,mid2,q.ct],'#f8e9cd');poly(ctx,[q.at,mid,q.bt],'#f5e6c8');
      poly(ctx,[q.at,mid,mid2,q.dt],'#dba080');poly(ctx,[mid,q.bt,q.ct,mid2],'#c6816c');
      for(let i=1;i<5;i++){const a=project(x+size/2+i*size/10,z,68-i*5.2),b=project(x+size/2+i*size/10,z+size,68-i*5.2);ctx.strokeStyle='#ad705c55';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
      const door=project(x+size*.4,z+size,0);poly(ctx,[[door[0]-6,door[1]-2],[door[0]+5,door[1]+4],[door[0]+5,door[1]-19],[door[0]-6,door[1]-25]],'#7e9c8c');
      const win=project(x+size,z+size*.5,25);poly(ctx,[[win[0]-6,win[1]+3],[win[0]+6,win[1]-3],[win[0]+6,win[1]-15],[win[0]-6,win[1]-9]],'#6f9c99');
      ctx.strokeStyle='#fff2ce';ctx.beginPath();ctx.moveTo(win[0],win[1]-12);ctx.lineTo(win[0],win[1]);ctx.stroke();
      box(x+7,z+9,8,8,67,'#f1dfc1');
      const smoke=project(x+11,z+13,78);ctx.globalAlpha=.2;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(smoke[0]+Math.sin(t)*5,smoke[1]-(t*8)%24,6,0,7);ctx.fill();ctx.globalAlpha=1;
    }
    // Lake and stepping stones.
    tile(-30,22,83,'#91bfbd');tile(-25,28,70,'#a2ceca');
    for(let i=0;i<4;i++){const [x,y]=project(-10+i*10,55+i*2);ctx.strokeStyle='#d9f0de';ctx.beginPath();ctx.moveTo(x,y+Math.sin(t*2+i)*2);ctx.lineTo(x+13,y-5+Math.sin(t*2+i)*2);ctx.stroke();}
    for(let i=0;i<7;i++)tile(-75+i*19,-16,15,'#eee8cc');
    for(let i=0;i<4;i++)tile(36,-15+i*18,13,'#e7e2c6');
    tree(-93,-57,1.05);tree(-64,-83,.8);tree(-24,-92,.9);
    house(-45,-63,42);
    if(st>=1)house(37,-60,34);
    else {tile(37,-60,34,'#a9bf98');const p=project(53,-43);ctx.strokeStyle='#e1ead2';ctx.setLineDash([3,3]);ctx.beginPath();ctx.ellipse(p[0],p[1],22,12,0,0,7);ctx.stroke();ctx.setLineDash([]);}
    if(st>=2){
      box(-85,5,24,24,54,'#f2e7c9');const [x,y]=project(-73,17,55);ctx.fillStyle='#b97960';ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fill();
      ctx.save();ctx.translate(x,y);ctx.rotate(t*.5);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);round(ctx,-3,-42,6,38,2,'#fff4d9','#c4b997');}ctx.restore();
    }
    if(st>=3)house(9,-6,29);
    if(st>=4){box(73,-8,18,18,82,'#f9ecd0');box(70,-11,24,24,8,'#f3e5c4');const p=project(82,1,85);ctx.fillStyle='#edcd7b';ctx.beginPath();ctx.arc(p[0],p[1],9,0,7);ctx.fill();}
    tree(87,-49,.7);tree(75,45,.8);tree(-92,53,.78);tree(-47,91,.65);
    if(st>=5){tree(37,77,.75);tree(67,65,.6);house(-2,70,23);}
    // Tiny flowers, fence and a resident enjoying the garden.
    for(let i=0;i<17;i++){const [x,y]=project(-100+(i*31)%190,-75+(i*47)%170);if(Math.abs(x)<65&&y>35&&y<80)continue;ctx.fillStyle=i%3?'#f3e7b1':'#dc9e8b';ctx.beginPath();ctx.arc(x,y-3,2,0,7);ctx.fill();ctx.strokeStyle='#8ca47a';ctx.beginPath();ctx.moveTo(x,y-1);ctx.lineTo(x,y+3);ctx.stroke();}
    for(let i=0;i<6;i++)box(-60+i*14,110-i*2,3,3,10,'#ece6ce');
    const person=project(1,-15);ctx.fillStyle='#cf977a';ctx.beginPath();ctx.arc(person[0],person[1]-9,3,0,7);ctx.fill();round(ctx,person[0]-3,person[1]-6,6,9,2,'#6c8d9e');
    ctx.restore();
    // Little boat below the island.
    const bx=450+Math.sin(t*.25)*14,by=363+Math.sin(t)*2;
    poly(ctx,[[bx-15,by],[bx+17,by],[bx+9,by+8],[bx-8,by+8]],'#a6bcb0');
    poly(ctx,[[bx,by-31],[bx,by-3],[bx+17,by-3]],'#fff6df');ctx.strokeStyle='#8fa497';ctx.beginPath();ctx.moveTo(bx,by-32);ctx.lineTo(bx,by+2);ctx.stroke();
    ctx.restore();
  }
  return { COLORS, STAGES, stage, round, board, preview, city };
});
