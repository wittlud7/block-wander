/* Native WeChat entry. No DOM or webview; shares the tested puzzle engine. */
const Play=require('./shared/studio.js'),GameInk=require('./shared/ink.js'),Hub=require('./shared/native-hub.js');
const canvas=wx.createCanvas(),assets={},used=new Map();
let app,hub,audio,hidden=false,scale=1,activeTouch=null;
const read=key=>{const value=wx.getStorageSync('ink-studio:'+key);return value===''?null:value;};
function image(art){if(!assets[art.id]){const im=wx.createImage();im.ready=false;im.onload=()=>{im.ready=true;if(hub&&!hub.isPlaying)hub.draw();};im.onerror=()=>{im.failed=true;};im.src=art.file;assets[art.id]=im;}used.set(art.id,Date.now());if(used.size>12){const pinned=new Set(GameInk.theme(app?.snapshot().config.theme||'retro').arts.map(a=>a.id));for(const[id]of [...used].sort((a,b)=>a[1]-b[1])){if(used.size<=12)break;if(id===art.id||pinned.has(id))continue;delete assets[id];used.delete(id);}}return assets[art.id];}
function loadTheme(){GameInk.theme(app?.snapshot().config.theme||'retro').arts.forEach(image);}
function tone(frequency,duration){try{audio ||= wx.createWebAudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function help(){const endless=app.snapshot().config.mode==='endless';wx.showModal({title:'怎么玩',content:endless?'填满整行或整列即可消除。三个备选方块都放不下，本局结束。每消一条行列赚25积分，清空另加50。先选择方块再换块，首次100积分，此后每次增加50。失败后不能撤回或换块。':'拖动或点选方块，填满整行或整列即可消除并揭开作品。多线消除可以多揭一圈。揭开目标格数并覆盖全部标记位置即可通关。大师的加固格需要消除两次。失败后直接结算。',showCancel:false,confirmText:'知道了'});}
function exportArt(art,im,result){if(!im?.ready){image(art);wx.showToast?.({title:'图片加载中，请稍后再试',icon:'none'});return;}const out=wx.createCanvas();require('./shared/postcard.js').draw(out,im,art,result);wx.canvasToTempFilePath({canvas:out,success:r=>wx.previewImage({urls:[r.tempFilePath]}),fail:()=>wx.showToast?.({title:'作品保存失败，请重试',icon:'none'})});}
function makeApp(){app=Play.create({canvas,platform:{assets,read,write:(key,value)=>wx.setStorageSync('ink-studio:'+key,value),now:()=>Date.now(),requestFrame:fn=>requestAnimationFrame(()=>{if(!hidden&&hub&&!hub.isPlaying)hub.draw();fn(Date.now());}),hidden:()=>hidden||!!hub&&!hub.isPlaying,tone,home:()=>hub.go('home'),album:()=>hub.go('themes'),onRender:()=>loadTheme(),help,
  confirm:(title,fn)=>wx.showModal({title,content:'已完成的关卡和另一模式的存档保留。',confirmText:'确定',cancelText:'取消',success:r=>{if(r.confirm){fn();hub?.play();}}}),exportArt
}});}
makeApp();
hub=Hub.create({canvas,getApp:()=>app,image,platform:{read,help,exportArt,
  source:a=>wx.showModal({title:a.name,content:a.artist+' · '+a.date+'\n'+a.museum+'\n图像授权：CC0\n'+a.source,confirmText:'复制链接',cancelText:'关闭',success:r=>{if(r.confirm)wx.setClipboardData?.({data:a.source});}}),
  privacy:()=>wx.showModal({title:'隐私与数据',content:'章节、收藏、棋盘、积分与每日完成纪录保存在本机。当前微信版本没有在线登录、广告、支付或聊天读取。作品为博物馆CC0开放图像。清空本机数据会删除这些游戏记录。',showCancel:false,confirmText:'知道了'}),
  reset:()=>wx.showModal({title:'清空本机游戏数据？',content:'章节、收藏、棋盘、积分和最高分将被删除，无法撤回。',confirmText:'清空',cancelText:'取消',success:r=>{if(!r.confirm)return;app.dispose();const keys=wx.getStorageInfoSync?.().keys||['session','session-endless','book','best','best-endless','theme','sound','mode'].map(k=>'ink-studio:'+k);for(const key of keys)if(key.startsWith('ink-studio:')){if(wx.removeStorageSync)wx.removeStorageSync(key);else wx.setStorageSync(key,null);}makeApp();resize();app.start();hub.go('home');}})
}});
function resize(){const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();scale=390/info.windowWidth;const top=info.safeArea?.top||0,bottom=info.safeArea?Math.max(0,info.windowHeight-info.safeArea.bottom):0;let helpX=null,capBottom=0;try{const menu=wx.getMenuButtonBoundingClientRect?.();capBottom=menu?.bottom||0;if(menu?.left)helpX=Math.min(info.windowWidth-25,Math.max(info.windowWidth*.57,menu.left-27));else if(menu?.bottom)helpX=info.windowWidth*.67;}catch{}app.resize(info.windowWidth,info.windowHeight,info.pixelRatio||2,top,bottom,helpX);hub.resize(info.windowHeight*scale,top*scale,bottom*scale,capBottom*scale);}
resize();if(wx.onWindowResize)wx.onWindowResize(resize);
wx.onTouchStart(e=>{if(activeTouch!==null)return;const t=e.changedTouches?.[0]||e.touches[0];if(t){activeTouch=t.identifier??0;(hub.isPlaying?app:hub).pointerDown(t.clientX*scale,t.clientY*scale,'touch');}});
wx.onTouchMove(e=>{const t=e.touches.find(t=>(t.identifier??0)===activeTouch);if(t)(hub.isPlaying?app:hub).pointerMove(t.clientX*scale,t.clientY*scale);});
wx.onTouchEnd(e=>{const t=e.changedTouches.find(t=>(t.identifier??0)===activeTouch);if(t){activeTouch=null;(hub.isPlaying?app:hub).pointerUp(t.clientX*scale,t.clientY*scale);}});
wx.onTouchCancel(()=>{activeTouch=null;app.cancel();hub.cancel();if(!hub.isPlaying)hub.draw();});
wx.onHide(()=>{hidden=true;activeTouch=null;app.cancel();hub.cancel();});if(wx.onShow)wx.onShow(()=>{hidden=false;if(!hub.isPlaying)hub.draw();});
app.start();hub.draw();
