(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./blocks.js'));else root.RetroBlocks=factory(root.Blocks);})(typeof globalThis!=='undefined'?globalThis:this,function(B){
  'use strict';
  const COLORS=['','#ae5f48','#526e5c','#bc9853','#71858a','#927b7d','#465f66'];
  function rounded(c,x,y,w,h,r,fill,stroke){if(w<=0||h<=0)return;c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
  function text(c,s,x,y,size=12,color='#3e493d',align='left',family='sans-serif',weight='400'){c.fillStyle=color;c.font=`${weight} ${size}px ${family}`;c.textAlign=align;c.textBaseline='middle';c.fillText(String(s),x,y);}
  function line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
  function tile(c,x,y,s,color,alpha=1){
    c.save();c.globalAlpha=alpha;const r=Math.max(2,s*.075);
    rounded(c,x+1.5,y+2.5,s-3,s-3,r,'#152a263d');rounded(c,x+1.5,y+1,s-3,s-4,r,COLORS[color]);
    line(c,x+5,y+3,x+s-5,y+3,'#ffffff2d',1);line(c,x+5,y+s-5,x+s-5,y+s-5,'#162a2c33',1);
    rounded(c,x+4,y+3.5,s-8,s-9,r*.7,null,'#efe2c71c');
    // Fine deterministic screen-print flecks, not glossy plastic or gems.
    for(let i=0;i<12;i++){const px=x+4+(i*17%29)/29*(s-8),py=y+4+(i*13%23)/23*(s-10);c.fillStyle=i%3?'#eddfbd12':'#17291c16';c.fillRect(px,py,.65,.65);}
    c.restore();
  }
  function shape(c,piece,x,y,size,alpha=1){const s=B.BY_ID[piece.shape];s.cells.forEach(([dx,dy])=>tile(c,x+dx*size,y+dy*size,size,piece.color,alpha));}
  function layout(h,safeTop=0,safeBottom=0,helpX=353){
    const top=Math.max(20,safeTop+13),side=Math.min(342,h-top-safeBottom-350),cell=(side-20)/8,bx=(390-side)/2,by=top+153;
    const controlsY=Math.min(h-safeBottom-66,by+side+248),trayY=Math.min(by+side+96,controlsY-85);
    return{h,top,helpX,frame:{x:bx,y:by,w:side,h:side},board:{x:bx+10,y:by+10,w:side-20,h:side-20,cell},trayY,controlsY,slots:[0,1,2].map(i=>({x:20+i*120,y:trayY-49,w:110,h:100}))};
  }
  function icon(c,id,x,y,size=20,color='#58634e'){
    c.save();c.translate(x,y);c.scale(size/24,size/24);c.strokeStyle=color;c.lineWidth=1.5;c.lineCap='round';c.lineJoin='round';
    if(id==='undo'){c.beginPath();c.moveTo(-8,-3);c.lineTo(-8,-8);c.moveTo(-8,-3);c.lineTo(-3,-3);c.moveTo(-8,-4);c.bezierCurveTo(6,-13,15,3,4,9);c.stroke();}
    if(id==='restart'){c.beginPath();c.arc(0,0,8,-Math.PI*.1,Math.PI*1.6);c.stroke();c.beginPath();c.moveTo(3,-10);c.lineTo(4,-5);c.lineTo(-1,-5);c.stroke();}
    if(id==='sound'||id==='muted'){c.beginPath();c.moveTo(-9,-4);c.lineTo(-5,-4);c.lineTo(0,-8);c.lineTo(0,8);c.lineTo(-5,4);c.lineTo(-9,4);c.closePath();c.stroke();if(id==='sound'){c.beginPath();c.arc(1,0,7,-.8,.8);c.stroke();}else{c.beginPath();c.moveTo(5,-4);c.lineTo(11,4);c.moveTo(11,-4);c.lineTo(5,4);c.stroke();}}
    if(id==='help'){c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.stroke();text(c,'?',0,1,15,color,'center','Georgia, serif');}
    if(id==='cup'){c.beginPath();c.moveTo(-5,-7);c.lineTo(5,-7);c.lineTo(4,0);c.quadraticCurveTo(0,5,-4,0);c.closePath();c.moveTo(-5,-5);c.bezierCurveTo(-12,-8,-9,3,-3,1);c.moveTo(5,-5);c.bezierCurveTo(12,-8,9,3,3,1);c.moveTo(0,4);c.lineTo(0,9);c.moveTo(-4,9);c.lineTo(4,9);c.stroke();}
    c.restore();
  }
  function render(c,game,state,L,now,assets={}){
    c.clearRect(0,0,390,L.h);c.fillStyle='#f1e8d6';c.fillRect(0,0,390,L.h);
    if(assets.paper?.ready){c.save();c.globalAlpha=.6;c.drawImage(assets.paper,0,0,390,L.h);c.restore();}
    const buttons=[];
    // A compact printed heading and score, with a little vermilion maker's mark.
    for(const [x,y]of [[0,0],[9,0],[0,9]])rounded(c,27+x,L.top+4+y,7,7,1,'#a55742');
    text(c,'方块消消乐',54,L.top+13,22,'#364c3f','left','"STSong", "SimSun", serif','700');
    icon(c,'help',L.helpX,L.top+13,21,'#8b8b72');buttons.push({id:'help',label:'玩法',x:L.helpX-22,y:L.top-9,w:44,h:44});
    line(c,27,L.top+43,363,L.top+43,'#aaa88a66',.75);
    text(c,'得 分',28,L.top+66,10,'#8b8e72');text(c,Math.round(state.displayScore).toLocaleString(),26,L.top+109,58,'#354d40','left','Georgia, "Times New Roman", serif');
    icon(c,'cup',285,L.top+70,14,'#a28d56');text(c,'最高纪录',362,L.top+70,10,'#8b8e72','right');text(c,state.best.toLocaleString(),361,L.top+106,26,'#8d784d','right','Georgia, serif');
    const f=L.frame,b=L.board,s=b.cell;
    c.save();c.shadowColor='#40342038';c.shadowBlur=12;c.shadowOffsetY=6;rounded(c,f.x,f.y,f.w,f.h,8,'#634b34');c.restore();
    c.save();rounded(c,f.x,f.y,f.w,f.h,8);c.clip();if(assets.walnut?.ready)c.drawImage(assets.walnut,f.x,f.y,f.w,f.h);else{c.fillStyle='#69513b';c.fillRect(f.x,f.y,f.w,f.h);}c.fillStyle='#352c212b';c.fillRect(f.x,f.y,f.w,f.h);c.restore();
    c.lineWidth=.6;rounded(c,f.x+2,f.y+2,f.w-4,f.h-4,6,null,'#dbbc7859');rounded(c,f.x+7,f.y+7,f.w-14,f.h-14,3,'#263a33','#1a2f29');
    for(let row=0;row<8;row++)for(let col=0;col<8;col++){
      const x=b.x+col*s,y=b.y+row*s;rounded(c,x+1,y+1,s-2,s-2,2,(row+col)%2?'#304339':'#2d4036','#c1c3a00b');
      if(game.board[row][col])tile(c,x,y,s,game.board[row][col]);
      else{c.fillStyle='#cad5b90d';c.fillRect(x+s*.5,y+s*.5,1,1);}
    }
    if(state.preview&&game.tray[state.preview.index]){
      const p=state.preview,sh=game.getShape(p.index);const valid=game.canPlace(p.index,p.row,p.col);
      const virtual=game.board.map(r=>r.slice());if(valid)sh.cells.forEach(([x,y])=>virtual[p.row+y][p.col+x]=game.tray[p.index].color);
      const full=valid?B.lines(virtual):{rows:[],cols:[]};
      full.rows.forEach(row=>{c.fillStyle='#dfc68638';c.fillRect(b.x,b.y+row*s,b.w,s);});full.cols.forEach(col=>{c.fillStyle='#dfc68638';c.fillRect(b.x+col*s,b.y,s,b.h);});
      sh.cells.forEach(([x,y])=>{const row=p.row+y,col=p.col+x;if(row<0||row>7||col<0||col>7)return;const px=b.x+col*s,py=b.y+row*s;if(valid)tile(c,px,py,s,game.tray[p.index].color,.6);c.lineWidth=1;rounded(c,px+2,py+2,s-4,s-4,2,null,valid?'#ead5a2b0':'#cd816e');});
    }
    if(state.keyboard&&state.selected!==null){const k=state.keyboard;c.lineWidth=1.5;rounded(c,b.x+k.col*s+1,b.y+k.row*s+1,s-2,s-2,2,null,'#f4ddb2');}
    for(const e of state.effects){const age=(now-e.time)/650;if(age<0||age>1)continue;
      e.removed?.forEach(({row,col,color},i)=>{const x=b.x+(col+.5)*s,y=b.y+(row+.5)*s;c.save();c.globalAlpha=(1-age)*.9;c.translate(x+Math.sin(i*3)*age*14,y-age*25);c.rotate(age*(i%2?1:-1));rounded(c,-s*.28*(1-age),-s*.28*(1-age),s*.56*(1-age),s*.56*(1-age),2,COLORS[color]);c.restore();});
    }
    if(state.rejectUntil>now){c.lineWidth=1.5;rounded(c,f.x+6,f.y+6,f.w-12,f.h-12,3,null,'#ad5c48');}
    const message=state.messageUntil>now?state.message:(game.moves===0?'拖动方块，填满一行或一列':'');
    const messageY=L.trayY-f.y-f.h<80?f.y-16:f.y+f.h+28;
    text(c,message,195,messageY,11,state.messageUntil>now?'#a35d40':'#92917b','center','"STSong", "SimSun", serif');
    for(let i=0;i<3;i++){
      const slot=L.slots[i],p=game.tray[i],selected=state.selected===i;
      if(selected){rounded(c,slot.x+5,slot.y+2,slot.w-10,slot.h-8,8,'#ac9b6e0c','#b0a17c6b');}
      if(p&&state.drag?.index!==i){const sh=game.getShape(i),size=Math.min(28,92/sh.w,80/sh.h),x=slot.x+(slot.w-sh.w*size)/2,y=L.trayY-sh.h*size/2;shape(c,p,x,y,size);}
      if(!p)line(c,slot.x+slot.w/2-6,L.trayY,slot.x+slot.w/2+6,L.trayY,'#a8a08460');
      c.fillStyle=selected?'#aa644b':'#b4aa8b';c.beginPath();c.arc(slot.x+slot.w/2,slot.y+slot.h+6,1.5,0,7);c.fill();
      buttons.push({id:'piece-'+i,label:p?`第${i+1}块，${B.BY_ID[p.shape].cells.length}格`:`第${i+1}块已使用`,x:slot.x,y:slot.y,w:slot.w,h:slot.h,disabled:!p});
    }
    for(const [i,id,label]of [[0,'undo','撤回 '+game.undoLeft],[1,'restart','重开'],[2,'sound',state.sound?'音效开':'音效关']]){
      const x=75+i*120,y=L.controlsY;const disabled=id==='undo'&&!game.canUndo;
      c.save();if(disabled)c.globalAlpha=.35;icon(c,id==='sound'&&!state.sound?'muted':id,x,y,22);text(c,label,x,y+29,10,'#7d8269','center');c.restore();buttons.push({id,label,x:x-36,y:y-24,w:72,h:70,disabled});
    }
    if(state.drag&&game.tray[state.drag.index]){const d=state.drag,p=game.tray[d.index];c.save();c.shadowColor='#13282030';c.shadowBlur=12;c.shadowOffsetY=7;shape(c,p,d.x,d.y,s,.98);c.restore();}
    if(game.status==='over'){
      c.fillStyle='#f1e7d5bc';c.fillRect(0,0,390,L.h);const mw=300,mh=264,mx=45,my=(L.h-mh)/2;
      c.save();c.shadowColor='#3c352034';c.shadowBlur=30;c.shadowOffsetY=10;rounded(c,mx,my,mw,mh,9,'#f6edda','#b1aa88');c.restore();
      line(c,mx+12,my+12,mx+mw-12,my+12,'#b7a67866');text(c,'本局结束',195,my+42,24,'#3f5142','center','"STSong", "SimSun", serif','700');text(c,game.score.toLocaleString(),195,my+98,52,'#415745','center','Georgia, serif');
      text(c,`消除 ${game.cleared} 行列`,195,my+137,11,'#949279','center');
      rounded(c,83,my+164,224,40,5,'#536d54');text(c,'再来一局',195,my+184,13,'#f4e7ca','center');
      const canUndo=game.canUndo;text(c,canUndo?'撤回，继续':'最高纪录已保存',195,my+231,11,canUndo?'#9d704d':'#aaa083','center');
      return[{id:'restart-now',label:'再来一局',x:83,y:my+164,w:224,h:40},...(canUndo?[{id:'undo',label:'撤回继续',x:95,y:my+211,w:200,h:40}]:[])];
    }
    return buttons;
  }
  return{COLORS,rounded,text,layout,render,tile,shape,icon};
});
