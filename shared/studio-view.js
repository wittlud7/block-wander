(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./blocks.js'),require('./retro.js'),require('./ink.js'));else root.StudioView=factory(root.Blocks,root.RetroBlocks,root.Ink);})(typeof globalThis!=='undefined'?globalThis:this,function(B,R,I){
  const {rounded:box,text,line}=R;
  function layout(h,top=0,bottom=0,helpX=353){const L=R.layout(h,top,bottom,helpX);const size=Math.min(338,h-L.top-bottom-371);L.frame={x:(390-size)/2,y:L.top+187,w:size,h:size};L.board={x:L.frame.x+9,y:L.frame.y+9,w:size-18,h:size-18,cell:(size-18)/8};L.controlsY=Math.min(h-bottom-62,L.frame.y+size+204);L.trayY=Math.min(L.frame.y+size+76,L.controlsY-73);L.slots=[0,1,2].map(i=>({x:20+i*120,y:L.trayY-43,w:110,h:87}));return L;}
  function art(c,image,x,y,w,h){if(image?.ready)c.drawImage(image,x,y,w,h);else{c.fillStyle='#c1bca2';c.fillRect(x,y,w,h);}}
  const palettes={comic:['#e6ac39','#e47a58','#609bae','#8c77ab','#87a06c','#ca84a1'],clay:['#cb8873','#d0b278','#83a9a0','#b2a0b2','#94a680','#d09caa'],paper:['#b08a48','#a95d4a','#5c8288','#7c7289','#82946a','#aa7b77'],neon:['#c38c60','#bd6a9a','#4b9dab','#8775c0','#719a9b','#b589b8'],oriental:['#a59161','#aa6455','#61847f','#8a7c8b','#83977d','#a6886b']};
  function tile(c,x,y,size,color,alpha,theme){if(theme==='retro')return R.tile(c,x,y,size,color,alpha);const ink=palettes[theme]||palettes.clay,fill=ink[(color-1)%6],pad=Math.max(1,size*.055),w=size-pad*2;c.save();c.globalAlpha=alpha??1;
    if(theme==='clay'){c.shadowColor='#57433335';c.shadowBlur=size*.12;c.shadowOffsetY=size*.06;box(c,x+pad,y+pad,w,w,size*.18,fill);c.shadowBlur=0;c.shadowOffsetY=0;box(c,x+pad+2,y+pad+2,w-4,w-4,size*.14,null,'#ffffff25');}
    else if(theme==='comic'){box(c,x+pad+1,y+pad+1,w,w,1,'#30283c');box(c,x+pad,y+pad,w-1,w-1,1,fill,'#30283c');}
    else if(theme==='neon'){c.shadowColor=fill;c.shadowBlur=4;box(c,x+pad,y+pad,w,w,3,fill+'99',fill);c.shadowBlur=0;box(c,x+pad+3,y+pad+3,w-6,w-6,1,null,fill+'77');}
    else if(theme==='paper'){box(c,x+pad+1,y+pad+2,w,w,0,'#183c4638');box(c,x+pad,y+pad,w,w,0,fill);c.strokeStyle='#fff6da33';c.lineWidth=1;c.beginPath();c.moveTo(x+pad,y+size-pad);c.lineTo(x+pad,y+pad);c.lineTo(x+size-pad,y+pad);c.stroke();}
    else{box(c,x+pad,y+pad,w,w,2,fill);box(c,x+pad+2,y+pad+2,w-4,w-4,1,null,'#f5eed22b');}c.restore();
  }
  function shape(c,p,x,y,size,alpha,theme){const sh=B.BY_ID[p.shape];sh.cells.forEach(([dx,dy])=>tile(c,x+dx*size,y+dy*size,size,p.color,alpha,theme));}
  function render(c,g,s,L,now,assets){
    c.fillStyle=I.theme(g.c.theme).paper;c.fillRect(0,0,390,L.h);
    const buttons=[],a=I.art(g.c),image=assets[a.id],theme=I.theme(g.c.theme),endless=g.c.mode==='endless';
    const btn=(id,label,x,y,w,h,selected=false)=>{box(c,x,y,w,h,5,selected?theme.primary:theme.paper,selected?null:'#c0b79a');text(c,label,x+w/2,y+h/2,10,selected?'#fff8e8':theme.ink,'center');buttons.push({id,label,x,y,w,h});};
    box(c,25,L.top+3,5,20,1,'#a45c49');text(c,'方块漫游',41,L.top+14,24,theme.ink,'left','STSong, SimSun, serif','700');
    text(c,'首页',L.helpX,L.top+13,11,I.theme(g.c.theme).ink,'center');buttons.push({id:'home',label:'返回首页',x:L.helpX-24,y:L.top-9,w:48,h:44});
    R.icon(c,s.sound?'sound':'muted',L.helpX-57,L.top+13,18,'#8b8b71');buttons.push({id:'sound',label:s.sound?'关闭音效':'开启音效',x:L.helpX-79,y:L.top-9,w:44,h:44});
    if(endless){text(c,'无尽挑战',26,L.top+57,16,theme.ink);text(c,'不限步数 · 放不下即结束',364,L.top+57,10,theme.ink,'right');}else I.DIFFICULTIES.forEach((d,i)=>btn('difficulty-'+i,d.name,25+i*115,L.top+43,108,28,g.c.difficulty===i));
    const bannerY=L.top+83;box(c,25,bannerY,340,70,3,theme.primary);
    text(c,endless?String(g.score)+' 分':a.name,38,bannerY+24,18,'#fff2d7','left','STSong, SimSun, serif','700');text(c,endless?'本机最高 '+s.best+' 分':g.c.date?'每日挑战 '+g.c.date:theme.name+' / 第'+(g.c.level+1)+'关',38,bannerY+49,9,'#eee2bd');
    text(c,endless?String(g.credits):`${g.repairedCount} / ${g.c.goal}`,351,bannerY+26,21,'#fff4d5','right','Georgia, serif');text(c,endless?'可用积分':'揭图格数',351,bannerY+49,8,'#e4d8b8','right');
    text(c,endless?'已放 '+g.moves+' 步':g.remaining===null?'不限步数':`余 ${g.remaining} 步`,26,L.top+170,11,theme.ink);text(c,endless?'已消 '+g.cleared+' 行列':`${g.stamps}/${g.marks.length} 标记`,195,L.top+170,11,theme.ink,'center');text(c,`${g.score} 分`,364,L.top+170,11,theme.ink,'right');
    const f=L.frame,b=L.board,cell=b.cell;
    c.save();c.shadowColor='#3c311a35';c.shadowBlur=10;c.shadowOffsetY=4;box(c,f.x,f.y,f.w,f.h,g.c.theme==='clay'?14:7,theme.primary);c.restore();
    c.save();box(c,f.x,f.y,f.w,f.h,7);c.clip();c.restore();
    if(endless){c.fillStyle=theme.dark?'#20263b':'#e8e2d3';c.fillRect(b.x,b.y,b.w,b.h);}else art(c,image,b.x,b.y,b.w,b.h);
    for(let r=0;r<8;r++)for(let col=0;col<8;col++){
      const x=b.x+col*cell,y=b.y+r*cell;if(!endless&&!g.repaired[r][col]){c.fillStyle=theme.dark?'#172139ef':'#ede4ccef';c.fillRect(x,y,cell+.5,cell+.5);}
      c.strokeStyle=theme.dark?'#afbded22':'#4b60421c';c.lineWidth=.55;c.strokeRect(x,y,cell,cell);
      if(g.board[r][col])tile(c,x,y,cell,g.board[r][col],.94,g.c.theme);
      if(g.seals[r][col]){c.fillStyle='#a45443';c.beginPath();c.arc(x+cell*.5,y+cell*.5,cell*.2,0,7);c.fill();text(c,'封',x+cell*.5,y+cell*.5,cell*.21,'#f1d2ac','center','serif');}
    }
    for(const[r,col]of g.marks){const x=b.x+(col+.5)*cell,y=b.y+(r+.5)*cell;box(c,x-cell*.19,y-cell*.19,cell*.38,cell*.38,2,g.repaired[r][col]?'#a45643':'#f0e6cdde','#aa6849');text(c,'印',x,y,cell*.2,g.repaired[r][col]?'#f3e6c9':'#a06349','center','serif');}
    if(s.preview&&g.tray[s.preview.index]){const p=s.preview,previewShape=g.getShape(p.index),valid=g.canPlace(p.index,p.row,p.col);previewShape.cells.forEach(([x,y])=>{const r=p.row+y,col=p.col+x;if(r<0||r>7||col<0||col>7)return;if(valid)tile(c,b.x+col*cell,b.y+r*cell,cell,g.tray[p.index].color,.55,g.c.theme);box(c,b.x+col*cell+2,b.y+r*cell+2,cell-4,cell-4,2,null,valid?'#e3bb74':'#b25c4b');});}
    for(const e of s.effects){const age=(now-e.time)/850;if(age<0||age>1)continue;
      for(const[r,col]of e.restored||[]){c.fillStyle=`rgba(247,228,174,${(1-age)*.65})`;c.fillRect(b.x+col*cell,b.y+r*cell,cell,cell);}
      if(e.rows)for(const row of e.rows){c.save();c.globalAlpha=(1-age)*.5;c.strokeStyle='#e6cc90';c.lineWidth=cell*.32;c.lineCap='round';c.beginPath();c.moveTo(b.x,b.y+(row+.5)*cell);c.lineTo(b.x+b.w*Math.min(1,age*3),b.y+(row+.5)*cell);c.stroke();c.restore();}
    }
    if(s.rejectUntil>now)box(c,b.x,b.y,b.w,b.h,2,null,'#ae624c');
    const msg=s.messageUntil>now?s.message:(g.moves===0?(endless?'消行赚积分，选择方块后可以换块':g.c.difficulty===2?'加固格需消除两次':'填满行列，揭开作品'):'');
    text(c,msg,195,L.trayY-f.y-f.h<65?f.y-5:f.y+f.h+22,10,'#8e8060','center');
    for(let i=0;i<3;i++){const slot=L.slots[i],p=g.tray[i];if(s.selected===i)box(c,slot.x+5,slot.y,slot.w-10,slot.h,6,'#b49a6610','#aa947557');if(p&&s.drag?.index!==i){const sh=g.getShape(i),size=Math.min(27,88/sh.w,72/sh.h);shape(c,p,slot.x+(slot.w-sh.w*size)/2,L.trayY-sh.h*size/2,size,1,g.c.theme);}else if(!p)text(c,'—',slot.x+55,L.trayY,13,'#b1aa8c','center');buttons.push({id:'piece-'+i,label:p?`第${i+1}块 ${B.BY_ID[p.shape].cells.length}格`:`第${i+1}块已用`,...slot,disabled:!p});}
    for(const[i,id,label]of (endless?[[0,'swap','换块 '+g.swapCost],[1,'home','首页'],[2,'restart','重开'],[3,'help','玩法']]:[[0,'undo','撤回 '+g.undoLeft],[1,'hint','提示 '+g.hintsLeft],[2,'restart','重开'],[3,'help','玩法']])){const x=53+i*95,y=L.controlsY,disabled=id==='swap'?g.credits<g.swapCost||g.status!=='playing':id==='undo'?!g.canUndo:id==='hint'?g.hintsLeft<=0:false;c.save();if(disabled)c.globalAlpha=.35;if(id==='hint'){c.strokeStyle='#7e8d6a';c.lineWidth=1.6;c.beginPath();c.moveTo(x-5,y+8);c.lineTo(x+7,y-7);c.moveTo(x-8,y+10);c.lineTo(x-5,y+3);c.lineTo(x-1,y+7);c.closePath();c.stroke();}else if(id==='home'){text(c,'⌂',x,y,23,theme.ink,'center');}else if(id==='swap'){text(c,'⇄',x,y,24,theme.ink,'center');}else R.icon(c,id,x,y,19);text(c,label,x,y+26,9,theme.dark?'#bdc4db':'#69725d','center');c.restore();buttons.push({id,label,x:x-34,y:y-21,w:68,h:62,disabled});}
    if(s.drag&&g.tray[s.drag.index])shape(c,g.tray[s.drag.index],s.drag.x,s.drag.y,cell,.96,g.c.theme);
    function veil(){c.fillStyle='#263b32a8';c.fillRect(0,0,390,L.h);}
    if(!s.panel&&endless&&g.status==='over'){veil();const y=Math.max(30,(L.h-360)/2);box(c,35,y,320,360,7,theme.paper);text(c,'本局结束',195,y+40,25,theme.ink,'center','serif');text(c,String(g.score),195,y+105,48,theme.ink,'center','Georgia, serif');text(c,'分',195,y+143,13,theme.ink,'center');text(c,'已放 '+g.moves+' 步 · 消除 '+g.cleared+' 行列',195,y+185,13,theme.ink,'center');text(c,'三个备选方块都没有可放位置',195,y+217,11,theme.ink,'center');const start=buttons.length;btn('next','再来一局',65,y+251,260,40,true);btn('home','返回首页',65,y+303,260,30);return buttons.slice(start);}
    if(!s.panel&&(g.status==='won'||g.status==='over')){
      veil();const y=Math.max(40,(L.h-490)/2);box(c,35,y,320,490,9,'#f4ead5','#d6c198');
      text(c,g.status==='won'?'过关了！':'本局结束',195,y+37,24,'#405b46','center','STSong, SimSun, serif','700');
      art(c,image,65,y+64,260,260);
      if(g.status==='over'){c.fillStyle='#f2e7d07d';c.fillRect(65,y+64,260,260);}
      text(c,a.name+' · '+g.c.name,195,y+348,14,'#7a795a','center','serif');
      text(c,g.status==='won'?'★'.repeat(g.stars)+'☆'.repeat(3-g.stars):g.failure||'没有可放位置',195,y+376,17,g.status==='won'?'#ad7e43':'#9c7861','center');
      const modalStart=buttons.length;btn('next',g.status==='won'?(g.c.date?'选择关卡':g.c.level===5?'查看作品':'下一关'):'再试一次',66,y+402,258,38,true);
      btn('album','画册',66,y+451,78,26);btn(g.status==='won'?'export':'home',g.status==='won'?'保存作品':'首页',154,y+451,84,26);btn('sound',s.sound?'音效开':'音效关',249,y+451,75,26);
      return buttons.slice(modalStart).map(b=>b.id==='undo'?{...b,disabled:!g.canUndo}:b);
    }
    if(s.panel==='album'){
      veil();box(c,19,Math.max(18,(L.h-650)/2),352,650,10,'#f4ebd8');const y=Math.max(18,(L.h-650)/2);
      text(c,'关 卡',43,y+30,23,'#405c46','left','serif','700');btn('close-panel','返回',299,y+15,49,27);
      const albumButtons=buttons.slice(-1);
      for(let ai=0;ai<3;ai++){const py=y+61+ai*165,aa=I.art({...g.c,art:ai}),im=assets[aa.id];art(c,im,39,py,106,106);text(c,aa.name,161,py+14,18,'#58694f','left','serif');const done=Array.from({length:6},(_,l)=>l).filter(l=>I.DIFFICULTIES.some((_,d)=>s.book[`${g.c.theme||'retro'}:${ai}:${l}:${d}`])).length;text(c,aa.style+' · '+done+'/6 已完成',161,py+40,9,'#979373');
        for(let l=0;l<6;l++){const bx=161+(l%3)*62,by=py+57+Math.floor(l/3)*31,open=I.unlocked(s.book,ai,l,g.c.theme);btn(`level-${ai}-${l}`,open?String(l+1).padStart(2,'0'):'·',bx,by,54,25,ai===g.c.art&&l===g.c.level);const bb=buttons[buttons.length-1];bb.label=aa.name+' 第'+(l+1)+'关'+(open?'':' 未解锁');bb.disabled=!open;albumButtons.push(bb);}
      }
      btn('daily',(s.dailyRecord?'今日已完成 · ':'每日挑战 · ')+I.chinaDate(s.clock),39,y+573,308,38,true);albumButtons.push(buttons[buttons.length-1]);
      return albumButtons;
    }
    return buttons;
  }
  return{layout,render};
});
