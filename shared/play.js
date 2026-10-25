(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./blocks.js'),require('./retro.js'));else root.RetroPlay=factory(root.Blocks,root.RetroBlocks);})(typeof globalThis!=='undefined'?globalThis:this,function(B,R){
  'use strict';
  function create(options){
    const platform=options.platform,canvas=options.canvas,ctx=canvas.getContext('2d');
    const read=(key,fallback)=>{try{return platform.read(key)??fallback;}catch{return fallback;}};
    const write=(key,value)=>{try{platform.write(key,value);}catch{}};
    const state={best:Math.max(0,Number(read('best',0))||0),sound:read('sound',false)===true,displayScore:0,effects:[],drag:null,selected:null,preview:null,keyboard:null,message:'',messageUntil:0,rejectUntil:0};
    const assets=platform.assets||{};let L=R.layout(844),buttons=[],now=0,down=null,last=0,disposed=false;
    const game=new B.Game({state:read('session',null),random:options.random,onEvent:e=>{
      state.drag=null;state.preview=null;state.selected=null;state.keyboard=null;
      if(e.type==='place'){
        if(e.count){if(!platform.reduceMotion?.())state.effects.push({...e,time:now});state.message=e.allClear?'清空！ +'+e.earned:`${e.count>1?e.count+' 线消除':'消除'}${e.combo>1?' · 连消 '+e.combo:''}  +${e.earned}`;state.messageUntil=now+1500;}
        if(state.sound)platform.tone?.(e.count?660:230,e.count ? .18 : .06);platform.haptic?.(!!e.count);
      }
      if(game.score>state.best){state.best=game.score;write('best',state.best);}write('session',game.snapshot());platform.onChange?.(snapshot());
    }});
    state.displayScore=game.score;
    function snapshot(){return{...game.snapshot(),best:state.best,sound:state.sound,selected:state.selected,preview:state.preview?{...state.preview}:null,layout:L,buttons:buttons.map(b=>({...b}))};}
    function resize(width,height,dpr=1,safeTop=0,safeBottom=0,helpX=null){canvas.width=Math.round(width*Math.min(dpr,3));canvas.height=Math.round(height*Math.min(dpr,3));const scale=390/width;L=R.layout(height*scale,safeTop*scale,safeBottom*scale,helpX===null?353:helpX*scale);state.drag=null;state.preview=null;down=null;draw(platform.now());}
    function draw(time){now=time;const dt=last?Math.min(100,time-last):16;last=time;state.displayScore=platform.reduceMotion?.()?game.score:state.displayScore+(game.score-state.displayScore)*Math.min(1,dt/80);if(Math.abs(game.score-state.displayScore)<.3)state.displayScore=game.score;
      state.effects=state.effects.filter(e=>now-e.time<700);ctx.setTransform(canvas.width/390,0,0,canvas.width/390,0,0);buttons=R.render(ctx,game,state,L,now,assets);platform.onRender?.(snapshot());}
    function save(){write('session',game.snapshot());}
    function restart(){game.reset();state.selected=null;state.drag=null;state.preview=null;state.keyboard=null;state.effects=[];state.message='';state.messageUntil=0;state.displayScore=0;save();draw(platform.now());platform.onChange?.(snapshot());}
    function action(id){
      if(id==='help'){cancel();platform.help?.();return;}
      if(id==='restart'){cancel();platform.confirm?.('重新开始？',()=>restart());return;}
      if(id==='restart-now'){restart();return;}
      if(id==='sound'){state.sound=!state.sound;write('sound',state.sound);if(state.sound)platform.tone?.(440,.1);draw(platform.now());return;}
      if(id==='undo'){if(game.undo()){state.effects=[];state.message='';state.displayScore=game.score;draw(platform.now());}return;}
      if(id.startsWith('piece-')){const i=Number(id.slice(6));if(game.tray[i]&&game.status==='playing'){state.selected=state.selected===i?null:i;state.keyboard=state.selected===null?null:{row:0,col:0};state.preview=state.selected===null?null:{index:i,row:0,col:0};draw(platform.now());}}
    }
    function origin(x,y,index,lift=0){const shape=game.getShape(index),b=L.board;return{index,row:Math.round((y-lift-b.y)/b.cell-shape.h/2),col:Math.round((x-b.x)/b.cell-shape.w/2)};}
    function pointerDown(x,y,type='touch'){
      const hit=buttons.slice().reverse().find(b=>!b.disabled&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
      if(hit&&hit.id.startsWith('piece-')){
        const index=Number(hit.id.slice(6));if(game.status!=='playing')return;const shape=game.getShape(index),lift=type==='touch'?58:25;
        down={x,y,index};state.selected=index;state.keyboard=null;state.drag={index,x:x-shape.w*L.board.cell/2,y:y-lift-shape.h*L.board.cell/2,lift,moved:false};state.preview=null;draw(platform.now());return;
      }
      if(hit){down={x,y,command:hit.id};return;}
      if(state.selected!==null&&game.status==='playing'){
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
      if(['1','2','3'].includes(key)){action('piece-'+(Number(key)-1));return true;}
      if(key==='u'||key==='U'){action('undo');return true;}if(key==='m'||key==='M'){action('sound');return true;}if(key==='r'||key==='R'){action('restart');return true;}
      if(key==='Escape'){state.selected=null;state.keyboard=null;cancel();return true;}
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
