(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./ink.js'),require('./retro.js'));else root.NativeHub=factory(root.Ink,root.RetroBlocks);})(typeof globalThis!=='undefined'?globalThis:this,function(I,R){
  'use strict';
  function create(options){
    const c=options.canvas.getContext('2d'),app=()=>options.getApp(),p=options.platform||{};
    let frameState=null;
    let page='home',scroll=0,height=844,top=55,bottom=24,buttons=[],contentHeight=0,down=null,difficulty=app().snapshot().config.mode==='endless'?1:app().snapshot().config.difficulty;
    const snap=()=>frameState||app().snapshot(),theme=()=>I.theme(snap().config.theme),text=(s,x,y,size=13,color=theme().ink,align='left')=>R.text(c,s,x,y,size,color,align,'sans-serif');
    function line(x,y,x2,y2,color){c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
    function go(next){page=next;scroll=0;down=null;draw();}
    function play(){page='game';scroll=0;app().cancel();}
    function button(id,label,x,y,w,h,primary=false,disabled=false,fixed=false){const sy=fixed?y:top+54+y-scroll;if(sy+h<top+54&&!fixed||sy>height-bottom-57&&!fixed)return;R.rounded(c,x,fixed?y:y,w,h,3,primary?theme().primary:theme().paper,theme().primary);c.save();if(disabled)c.globalAlpha=.35;text(label,x+w/2,(fixed?y:y)+h/2,12,primary?'#fff8e8':theme().ink,'center');c.restore();buttons.push({id,label,x,y:sy,w,h,disabled,fixed});}
    function image(art,x,y,size){if(y+size<scroll||y>scroll+height-top-bottom-110)return;const im=options.image(art);if(im?.ready)c.drawImage(im,x,y,size,size);else{c.fillStyle=theme().dark?'#30364d':'#e6dfd1';c.fillRect(x,y,size,size);}}
    function done(t,ai){return Array.from({length:6},(_,l)=>I.DIFFICULTIES.some((_,d)=>snap().book[`${t}:${ai}:${l}:${d}`])).filter(Boolean).length;}
    function startChapter(ai,l){const before=snap(),existing=before.config.mode==='endless'?p.read?.('session'):before;if(existing&&existing.config.theme===before.config.theme&&existing.config.art===ai&&existing.config.level===l&&existing.config.difficulty===difficulty&&existing.status==='playing'){if(before.config.mode==='endless')app().action('chapter');play();return;}app().action(`level-${ai}-${l}-${difficulty}`);const after=snap();if(after.config.mode!=='endless'&&after.config.art===ai&&after.config.level===l&&after.config.difficulty===difficulty&&after.moves===0)play();}
    function exportArt(t,ai){const s=snap(),a=I.theme(t).arts[ai],best=Array.from({length:6},(_,l)=>I.DIFFICULTIES.map((_,d)=>({...s.book[`${t}:${ai}:${l}:${d}`],level:l,difficulty:d}))).flat().filter(e=>e.stars).sort((a,b)=>b.stars-a.stars)[0];if(best)p.exportArt?.(a,options.image(a),best);}
    function action(id){
      if(id.startsWith('nav-')){go(id.slice(4));return;}if(id==='continue'){play();return;}
      if(id==='endless'){app().action('endless');if(snap().status==='over')app().action('restart-now');play();return;}
      if(id==='daily'){if(snap().config.date===I.chinaDate()&&snap().status==='playing'){play();return;}app().action('daily');if(snap().config.date===I.chinaDate()&&snap().moves===0)play();return;}
      if(id.startsWith('theme-')){app().action(id);go('themes');return;}
      if(id.startsWith('diff-')){difficulty=Number(id.slice(5));draw();return;}
      if(id.startsWith('level-')){const[,a,l]=id.split('-');startChapter(Number(a),Number(l));return;}
      if(id.startsWith('export-')){const[,t,a]=id.split('-');exportArt(t,Number(a));return;}
      if(id.startsWith('source-')){const[,t,a]=id.split('-');p.source?.(I.theme(t).arts[Number(a)]);return;}
      if(id==='sound'){app().action('sound');draw();return;}if(id==='help'){p.help?.();return;}if(id==='privacy'){p.privacy?.();return;}if(id==='reset'){p.reset?.();return;}
    }
    function home(){const s=snap(),a=I.art(s.config);text('空棋盘开始，填满行列即可消除。',24,26,13);image(a,244,48,122);text('真实馆藏',24,69,25);text('随手开一局。',24,103,25);text(theme().name+' · '+a.name,24,148,11);
      button('nav-themes','艺术闯关 ↗',24,198,342,52,true);button('endless','无尽挑战 ↗',24,264,342,52);if(s.moves>0&&s.status==='playing')button('continue','继续'+(s.config.mode==='endless'?'无尽':'闯关')+' · 已放 '+s.moves+' 步',24,330,342,43);
      text('每日同题',24,410,22);text('每天一道题 · 本机保存完成纪录',24,443,12);button('daily','开始今日挑战',24,468,342,47,true);if(s.dailyRecord)text('今日已完成 · '+s.dailyRecord.score+' 分',24,540,12);text('六类艺术 · 十八幅真实作品',24,590,12);contentHeight=630;}
    function gallery(){const t=theme(),s=snap();text('选择艺术风格',24,24,22);I.THEMES.forEach((tt,i)=>{const x=24+i%3*117,y=52+Math.floor(i/3)*142;image(tt.arts[1],x,y,108);button('theme-'+tt.id,tt.name,x,y+112,108,25,tt.id===t.id);});
      text(t.name+' / '+t.collection,24,365,21);I.DIFFICULTIES.forEach((d,i)=>button('diff-'+i,d.name,24+i*117,392,108,32,difficulty===i));
      t.arts.forEach((a,ai)=>{const y=452+ai*222;image(a,24,y,112);text(a.name,153,y+18,Math.min(17,160/Math.max(1,a.name.length)));text(a.artist,153,y+45,12);text(a.date,153,y+67,11);text(done(t.id,ai)+'/6 已完成',153,y+93,11);button('source-'+t.id+'-'+ai,'作品来源',24,y+119,112,29);for(let l=0;l<6;l++)button('level-'+ai+'-'+l,String(l+1).padStart(2,'0'),153+l%3*72,y+119+Math.floor(l/3)*38,64,30,false,!I.unlocked(s.book,ai,l,t.id));});contentHeight=1130;}
    function collection(){text('我的收藏',24,25,23);text('通关一关，即可保存该幅完整作品。',24,56,12);I.THEMES.flatMap(t=>t.arts.map((a,i)=>({a,t,i}))).forEach(({a,t,i},n)=>{const x=24+n%2*176,y=86+Math.floor(n/2)*236,complete=done(t.id,i);c.save();if(!complete)c.globalAlpha=.45;image(a,x,y,166);c.restore();text(a.name,x,y+181,Math.min(13,165/Math.max(1,a.name.length)));button('export-'+t.id+'-'+i,complete?'保存作品':'尚未完成',x,y+198,166,29,false,!complete);});contentHeight=2230;}
    function settings(){const s=snap();text('设置与说明',24,26,23);text('进度与积分保存在本机。',24,65,13);text('无尽最高分：'+Number(p.read?.('best-endless')||0),24,97,14);button('sound','音效：'+(s.sound?'开':'关'),24,139,342,45);button('help','游戏玩法',24,201,342,45);button('nav-credits','作品与授权',24,263,342,45);button('privacy','隐私与数据',24,325,342,45);button('reset','清空本机游戏数据',24,421,342,45);text('每日挑战暂存本机，在线排名待接入。',24,509,12);contentHeight=560;}
    function credits(){text('作品与授权',24,25,23);text('博物馆明确开放的 CC0 图像，非 AI 生成。',24,60,12);I.THEMES.flatMap(t=>t.arts.map((a,i)=>({a,t,i}))).forEach(({a,t,i},n)=>{const y=92+n*115;image(a,24,y,92);text(a.name,134,y+17,Math.min(16,230/Math.max(1,a.name.length)));text(a.artist+' · '+a.date,134,y+44,11);button('source-'+t.id+'-'+i,'馆藏来源 / CC0',134,y+63,228,29);});contentHeight=2180;}
    function draw(){if(page==='game')return;frameState=app().snapshot();const t=theme();c.setTransform(options.canvas.width/390,0,0,options.canvas.width/390,0,0);c.fillStyle=t.paper;c.fillRect(0,0,390,height);buttons=[];const viewBottom=height-bottom-57;
      c.save();c.beginPath();c.rect(0,top+54,390,Math.max(0,viewBottom-top-54));c.clip();c.translate(0,top+54-scroll);({home,themes:gallery,collection,settings,credits}[page]||home)();c.restore();
      const maxScroll=Math.max(0,contentHeight-(viewBottom-top-54));if(scroll>maxScroll){scroll=maxScroll;frameState=null;draw();return;}
      c.fillStyle=t.paper;c.fillRect(0,0,390,top+54);text('方块漫游',24,top+14,25);line(24,top+42,366,top+42,t.dark?'#4b526b':'#d2cbbd');c.fillStyle=t.paper;c.fillRect(0,viewBottom,390,height-viewBottom);line(0,viewBottom,390,viewBottom,t.dark?'#4b526b':'#d2cbbd');[['home','首页'],['themes','闯关'],['collection','收藏'],['settings','设置']].forEach(([id,label],i)=>button('nav-'+id,label,12+i*96,viewBottom+8,90,38,page===id,false,true));frameState=null;
    }
    function pointerDown(x,y){down={x,y,last:y,scroll,moved:false};}
    function pointerMove(x,y){if(!down)return;if(Math.hypot(x-down.x,y-down.y)>8)down.moved=true;if(down.moved&&down.y>=top+54&&down.y<height-bottom-57){scroll=Math.max(0,Math.min(Math.max(0,contentHeight-(height-bottom-57-top-54)),down.scroll+down.y-y));draw();}}
    function pointerUp(x,y){if(!down)return;const d=down;down=null;if(d.moved)return;const b=buttons.slice().reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=Math.max(b.y,b.fixed?0:top+54)&&y<=Math.min(b.y+b.h,b.fixed?height:height-bottom-57));if(b)action(b.id);}
    return{go,play,draw,action,pointerDown,pointerMove,pointerUp,cancel(){down=null;},get isPlaying(){return page==='game';},resize(h,safeTop=0,safeBottom=0,capsuleBottom=0){height=h;top=Math.max(26,safeTop+12,capsuleBottom+8);bottom=safeBottom;draw();},snapshot:()=>({page,scroll,height,top,bottom,buttons:buttons.map(b=>({...b})),contentHeight,difficulty})};
  }
  return{create};
});
