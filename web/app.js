(() => {
  'use strict';
  const surface=document.getElementById('game-surface'),canvas=document.getElementById('game'),controls=document.getElementById('controls'),dialog=document.getElementById('dialog');
  let audio,confirmAction=null,signature='',app;
  const assets={};
  function loadAsset(name,file){if(assets[name])return;const image=new Image();image.ready=false;image.onload=()=>image.ready=true;image.src='./'+file;assets[name]=image;}

  function loadTheme(id){Ink.theme(id).arts.forEach(a=>loadAsset(a.id,a.file));}
  loadTheme('retro');
  function tone(frequency,duration){try{audio ||= new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const oscillator=audio.createOscillator(),filter=audio.createBiquadFilter(),gain=audio.createGain();oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(frequency*.75,audio.currentTime+duration);filter.type='lowpass';filter.frequency.value=1600;gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);oscillator.connect(filter);filter.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);}catch{}}
  function showDialog(title,text,confirmLabel,fn=null){confirmAction=fn;document.getElementById('dialog-title').textContent=title;document.getElementById('dialog-text').textContent=text;document.getElementById('dialog-confirm').textContent=confirmLabel;document.getElementById('dialog-cancel').hidden=!fn;dialog.showModal();}
  function syncButtons(snapshot){loadTheme(snapshot.config.theme);const next=JSON.stringify(snapshot.buttons);if(signature===next)return;signature=next;controls.replaceChildren(...snapshot.buttons.map(b=>{const button=document.createElement('button');button.dataset.id=b.id;button.setAttribute('aria-label',b.label);button.disabled=!!b.disabled;button.style.left=b.x/390*100+'%';button.style.top=b.y/snapshot.layout.h*100+'%';button.style.width=b.w/390*100+'%';button.style.height=b.h/snapshot.layout.h*100+'%';button.addEventListener('click',e=>{if(e.detail===0&&!dialog.open)app.action(b.id);});return button;}));}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  app=InkStudio.create({canvas,platform:{
    assets,read:key=>{try{return JSON.parse(localStorage.getItem('ink-studio:'+key));}catch{return null;}},write:(key,value)=>localStorage.setItem('ink-studio:'+key,JSON.stringify(value)),now:()=>performance.now(),requestFrame:fn=>requestAnimationFrame(fn),hidden:()=>document.hidden||(typeof window.hub?.isPlaying==='function'&&!window.hub.isPlaying()),reduceMotion:()=>reduced.matches,tone,
    home:()=>window.hub?.navigate?.('home'),
    help:()=>showDialog('方块漫游',app.snapshot().config.mode==='endless'?'填满整行或整列即可消除。没有步数和揭图目标。\n每消除一条行列赚25积分，清空棋盘额外赚50积分。\n先选中一块，再点换块；首次100积分，此后每次增加50。换块不扣得分。\n三个备选方块都放不下就结束，结束后不能换块或撤回。':'拖动方块，填满整行或整列即可消除并揭开作品。\n同时消除两条以上行列，可以多揭开一圈。\n\n揭开目标格数，并消除所有标记位置即可过关。大师模式的加固格需要消除两次。\n每张作品六关，通关即可收藏。提示只建议当前落点，不保证后续通关。','知道了'),
    confirm:(title,fn)=>showDialog(title,'当前棋盘将重置，已完成的关卡保留。','确定重开',fn),
    exportArt:(art,image,result)=>{if(!image?.ready)return;const out=InkPostcard.draw(document.createElement('canvas'),image,art,result);out.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='方块漫游-'+art.name+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},'image/png');},
    onRender:syncButtons,onChange:s=>{window.dispatchEvent(new CustomEvent('ink:change',{detail:s}));document.getElementById('readout').textContent=`得分 ${s.score}，最高 ${s.best}，已消除 ${s.cleared} 行列，${s.status==='won'?'关卡完成':s.status==='over'?'本局结束':'可以继续放置'}`;}
  }});
  function resize(){const rect=surface.getBoundingClientRect();if(rect.width<10||rect.height<10)return;const style=getComputedStyle(document.documentElement);app.resize(rect.width,rect.height,devicePixelRatio||1,parseFloat(style.getPropertyValue('--safe-top'))||0,parseFloat(style.getPropertyValue('--safe-bottom'))||0);}
  new ResizeObserver(resize).observe(surface);resize();app.start();
  const point=e=>{const b=surface.getBoundingClientRect();return{x:(e.clientX-b.x)*390/b.width,y:(e.clientY-b.y)*390/b.width};};
  surface.addEventListener('pointerdown',e=>{if(dialog.open||e.button>0||e.isPrimary===false)return;e.preventDefault();surface.setPointerCapture(e.pointerId);const p=point(e);app.pointerDown(p.x,p.y,e.pointerType);});
  surface.addEventListener('pointermove',e=>{if(dialog.open||e.isPrimary===false)return;const p=point(e);app.pointerMove(p.x,p.y);});surface.addEventListener('pointerup',e=>{if(dialog.open||e.isPrimary===false)return;const p=point(e);app.pointerUp(p.x,p.y);});surface.addEventListener('pointercancel',e=>{if(e.isPrimary!==false)app.cancel();});
  window.addEventListener('keydown',e=>{if(window.hub?.isPlaying&&!window.hub.isPlaying())return;if(e.target.closest?.('input,textarea,select,[contenteditable]'))return;if(dialog.open||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target instanceof HTMLButtonElement&&(e.key==='Enter'||e.key===' '))return;if(app.key(e.key))e.preventDefault();});
  function close(){confirmAction=null;dialog.close();canvas.focus({preventScroll:true});}
  document.getElementById('dialog-close').onclick=close;document.getElementById('dialog-cancel').onclick=close;document.getElementById('dialog-confirm').onclick=()=>{const fn=confirmAction;close();fn?.();};dialog.addEventListener('cancel',()=>confirmAction=null);
  window.addEventListener('blur',()=>app.cancel());document.addEventListener('visibilitychange',()=>{if(document.hidden)app.cancel();});
  window.inkGame={snapshot:()=>app.snapshot(),action:id=>app.action(id)};
})();
