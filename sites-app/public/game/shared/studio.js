(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./ink.js'),require('./studio-view.js'));else root.InkStudio=factory(root.Ink,root.StudioView);})(typeof globalThis!=='undefined'?globalThis:this,function(B,R){
  'use strict';
  function create(options){
    const platform=options.platform,canvas=options.canvas,ctx=canvas.getContext('2d');
    const read=(key,fallback)=>{try{return platform.read(key)??fallback;}catch{return fallback;}};
    const write=(key,value)=>{try{platform.write(key,value);}catch{}};
    const wallTime=platform.wallNow?.()??Date.now();
    const migrateBook=b=>Object.fromEntries(Object.entries(b||{}).map(([k,v])=>[k.split(':').length===3?'retro:'+k:k,v]));
    const state={book:migrateBook(read('book',{})),dailyDate:B.chinaDate(wallTime),dailyRecord:read('daily-'+B.chinaDate(wallTime),null),panel:null,clock:wallTime,best:Math.max(0,Number(read('best',0))||0),sound:read('sound',false)===true,displayScore:0,effects:[],drag:null,selected:null,preview:null,keyboard:null,message:'',messageUntil:0,rejectUntil:0};
    const assets=platform.assets||{};let L=R.layout(844),buttons=[],now=0,down=null,last=0,disposed=false;
    const game=new B.Game({state:read('mode','chapter')==='endless'?read('session-endless',null):read('session',null),config:read('mode','chapter')==='endless'?B.endlessConfig(read('theme','retro')):B.config(B.seasonal(platform.wallNow?.()??Date.now())?1:0,0,1,null,read('theme','retro')),onEvent:e=>{
      state.drag=null;state.preview=null;state.selected=null;state.keyboard=null;
      if(e.type==='place'){
        if(e.count){if(!platform.reduceMotion?.())state.effects.push({...e,time:now});state.message=game.c.mode==='endless'?'消除 '+e.count+' 行列 · +'+(e.count*25+(e.allClear?50:0))+' 积分':e.broken.length?'加固解除，再消一次':e.bleed?'连消，揭开 '+e.restored.length+' 格':'揭开 '+e.restored.length+' 格';state.messageUntil=now+1500;}
        if(state.sound)platform.tone?.(e.count?660:230,e.count ? .18 : .06);platform.haptic?.(!!e.count);
      }
      if(game.status==='won'){if(game.c.date){const result={stars:game.stars,score:game.score};write('daily-'+game.c.date,result);if(game.c.date===state.dailyDate)state.dailyRecord=result;}else{state.book=B.record(state.book,game);write('book',state.book);}}
      if(game.score>state.best){state.best=game.score;write(game.c.mode==='endless'?'best-endless':'best',state.best);}write(game.c.mode==='endless'?'session-endless':'session',game.snapshot());platform.onChange?.(snapshot());
    }});
    state.best=read(game.c.mode==='endless'?'best-endless':'best',0);state.displayScore=game.score;
    function snapshot(){return{...game.snapshot(),best:state.best,sound:state.sound,book:JSON.parse(JSON.stringify(state.book)),panel:state.panel,repairedCount:game.repairedCount,stamps:game.stamps,remaining:game.remaining,stars:game.stars,selected:state.selected,preview:state.preview?{...state.preview}:null,layout:L,buttons:buttons.map(b=>({...b}))};}
    function resize(width,height,dpr=1,safeTop=0,safeBottom=0,helpX=null){canvas.width=Math.round(width*Math.min(dpr,3));canvas.height=Math.round(height*Math.min(dpr,3));const scale=390/width;L=R.layout(height*scale,safeTop*scale,safeBottom*scale,helpX===null?353:helpX*scale);state.drag=null;state.preview=null;down=null;draw(platform.now());}
    function draw(time){now=time;state.clock=platform.wallNow?.()??Date.now();const date=B.chinaDate(state.clock);if(date!==state.dailyDate){state.dailyDate=date;state.dailyRecord=read('daily-'+date,null);}const dt=last?Math.min(100,time-last):16;last=time;state.displayScore=platform.reduceMotion?.()?game.score:state.displayScore+(game.score-state.displayScore)*Math.min(1,dt/80);if(Math.abs(game.score-state.displayScore)<.3)state.displayScore=game.score;
      state.effects=state.effects.filter(e=>now-e.time<900);ctx.setTransform(canvas.width/390,0,0,canvas.width/390,0,0);buttons=R.render(ctx,game,state,L,now,assets);platform.onRender?.(snapshot());}
    function save(){write(game.c.mode==='endless'?'session-endless':'session',game.snapshot());write('mode',game.c.mode==='endless'?'endless':'chapter');}
    function load(c){game.load(c);state.best=read(c.mode==='endless'?'best-endless':'best',0);state.panel=null;state.selected=null;state.drag=null;state.preview=null;state.keyboard=null;state.effects=[];state.message='';state.messageUntil=0;state.displayScore=0;save();draw(platform.now());platform.onChange?.(snapshot());}
    function restart(){load(game.c.mode==='endless'?B.endlessConfig(game.c.theme):game.c);}
    function switchMode(mode){save();const endless=mode==='endless',saved=read(endless?'session-endless':'session',null);load(endless?B.endlessConfig(game.c.theme):B.config(0,0,1,null,game.c.theme));if(saved){game.restore(saved);game.c.theme=read('theme',game.c.theme);save();draw(platform.now());platform.onChange?.(snapshot());}}
    function action(id){
      if(id==='endless'||id==='chapter'){switchMode(id);return;}
      if(id==='swap'){if(game.c.mode!=='endless'||game.status!=='playing')return;if(state.selected===null){state.message='先选择一块，再点换块';state.messageUntil=now+1800;}else if(game.swap(state.selected)){state.selected=null;state.preview=null;state.keyboard=null;state.message='已更换方块';state.messageUntil=now+1200;}else{state.message='积分不足，消行可以赚取积分';state.messageUntil=now+1800;}draw(platform.now());return;}
      if(id==='home'){cancel();save();if(platform.home)platform.home();else{state.panel='album';draw(platform.now());}return;}
      if(id.startsWith('theme-')){const theme=id.slice(6);if(!B.THEMES.some(t=>t.id===theme))return;game.c=game.c.mode==='endless'?{...game.c,theme}:B.config(game.c.art,game.c.level,game.c.difficulty,game.c.date,theme);write('theme',theme);save();draw(platform.now());platform.onChange?.(snapshot());return;}
      if(id==='album'){cancel();state.panel='album';draw(platform.now());return;}
      if(id==='close-panel'){state.panel=null;draw(platform.now());return;}
      if(id==='daily'){const c=B.config(...(()=>{const d=B.daily(state.clock);return[d.art,d.level,d.difficulty,d.date,game.c.theme];})());if(game.moves>0&&game.status==='playing')platform.confirm?.('开始每日挑战将替换当前棋盘',()=>load(c));else load(c);return;}
      if(id.startsWith('level-')){save();const parts=id.split('-'),art=Number(parts[1]),level=Number(parts[2]);if(B.unlocked(state.book,art,level,game.c.theme)){const c=B.config(art,level,game.c.difficulty,null,game.c.theme);if(game.moves>0&&game.status==='playing')platform.confirm?.('切换章节将替换当前棋盘',()=>load(c));else load(c);}return;}
      if(id.startsWith('difficulty-')){if(game.c.mode==='endless')return;const d=Number(id.split('-')[1]);if(d===game.c.difficulty)return;const fn=()=>load(B.config(game.c.art,game.c.level,d,game.c.date,game.c.theme));if(game.moves>0&&game.status==='playing')platform.confirm?.('更换难度将重开本关',fn);else fn();return;}
      if(id==='hint'){const p=game.hint();if(p){state.selected=p.index;state.keyboard={row:p.row,col:p.col};state.preview={index:p.index,row:p.row,col:p.col};state.message='建议落点 · 轻点或按空格放置';state.messageUntil=now+1800;save();draw(platform.now());}return;}
      if(id==='next'){if(game.status==='over')restart();else if(game.c.date||game.c.level===5){state.panel='album';draw(platform.now());}else load(B.config(game.c.art,game.c.level+1,game.c.difficulty,null,game.c.theme));return;}
      if(id==='export'){if(game.status==='won')platform.exportArt?.(B.art(game.c),assets[B.art(game.c).id],{...game.c,stars:game.stars,moves:game.moves});return;}
      if(id==='help'){cancel();platform.help?.();return;}
      if(id==='restart'){cancel();platform.confirm?.('重新开始？',()=>restart());return;}
      if(id==='restart-now'){restart();return;}
      if(id==='sound'){state.sound=!state.sound;write('sound',state.sound);if(state.sound)platform.tone?.(440,.1);draw(platform.now());return;}
      if(id==='undo'){if(game.undo()){state.effects=[];state.message='';state.displayScore=game.score;draw(platform.now());}return;}
      if(id.startsWith('piece-')){const i=Number(id.slice(6));if(game.tray[i]&&game.status==='playing'&&!state.panel){state.selected=state.selected===i?null:i;state.keyboard=state.selected===null?null:{row:0,col:0};state.preview=state.selected===null?null:{index:i,row:0,col:0};draw(platform.now());}}
    }
    function origin(x,y,index,lift=0){const shape=game.getShape(index),b=L.board;return{index,row:Math.round((y-lift-b.y)/b.cell-shape.h/2),col:Math.round((x-b.x)/b.cell-shape.w/2)};}
    function pointerDown(x,y,type='touch'){
      const hit=buttons.slice().reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
      if(hit&&hit.id.startsWith('piece-')){
        const index=Number(hit.id.slice(6));if(game.status!=='playing')return;const shape=game.getShape(index),lift=type==='touch'?58:25;
        down={x,y,index};state.selected=index;state.keyboard=null;state.drag={index,x:x-shape.w*L.board.cell/2,y:y-lift-shape.h*L.board.cell/2,lift,moved:false};state.preview=null;draw(platform.now());return;
      }
      if(hit){down={x,y,command:hit.id};return;}
      if(state.selected!==null&&game.status==='playing'&&!state.panel){
        const b=L.board;if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){down={x,y,tap:true};state.preview=origin(x,y,state.selected);draw(platform.now());}
      }
    }
    function pointerMove(x,y){if(!state.drag||!down)return;const d=state.drag,shape=game.getShape(d.index);if(Math.hypot(x-down.x,y-down.y)>7)d.moved=true;d.x=x-shape.w*L.board.cell/2;d.y=y-d.lift-shape.h*L.board.cell/2;state.preview=origin(x,y,d.index,d.lift);draw(platform.now());}
    function pointerUp(x,y){
      if(!down)return;const pressed=down;down=null;
      if(pressed.command){const b=buttons.find(b=>b.id===pressed.command);if(b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)action(pressed.command);return;}
      const d=state.drag;
      if(d&&!d.moved){state.drag=null;state.preview=null;draw(platform.now());return;}
      const p=d?origin(x,y,d.index,d.lift):state.preview;
      if(p&&!game.place(p.index,p.row,p.col)){state.rejectUntil=platform.now()+240;state.drag=null;state.preview=null;}
      else{state.drag=null;state.preview=null;}
      draw(platform.now());
    }
    function cancel(){state.drag=null;state.preview=null;down=null;draw(platform.now());}
    function key(key){
      if(state.panel&&key!=='Escape')return false;
      if(['1','2','3'].includes(key)){action('piece-'+(Number(key)-1));return true;}
      if(key==='u'||key==='U'){action('undo');return true;}if(key==='m'||key==='M'){action('sound');return true;}if(key==='r'||key==='R'){action('restart');return true;}
      if(key==='Escape'){state.panel=null;state.selected=null;state.keyboard=null;cancel();return true;}
      if(state.panel||game.status!=='playing')return false;
      if(state.selected===null)return false;
      const sh=game.getShape(state.selected);state.keyboard ||= {row:0,col:0};const k=state.keyboard;
      if(key==='ArrowLeft')k.col=Math.max(0,k.col-1);else if(key==='ArrowRight')k.col=Math.min(8-sh.w,k.col+1);else if(key==='ArrowUp')k.row=Math.max(0,k.row-1);else if(key==='ArrowDown')k.row=Math.min(8-sh.h,k.row+1);else if(key==='Enter'||key===' '){if(!game.place(state.selected,k.row,k.col))state.rejectUntil=platform.now()+240;}else return false;
      if(state.selected!==null&&state.keyboard)state.preview={index:state.selected,...state.keyboard};draw(platform.now());return true;
    }
    function frame(time){if(disposed)return;if(!platform.hidden?.())draw(time);platform.requestFrame(frame);}
    return{resize,pointerDown,pointerMove,pointerUp,cancel,key,action,snapshot,start(){draw(platform.now());platform.requestFrame(frame);},dispose(){disposed=true;save();}};
  }
  return{create};
});
