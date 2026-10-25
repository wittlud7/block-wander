/* WeChat entry: no DOM, same 8x8 game, input and artwork as the web preview. */
const Play=require('./shared/studio.js');
const canvas=wx.createCanvas(),assets={};
for(const [name,file] of require('./shared/ink.js').ARTS.map(a=>[a.id,a.file])){const image=wx.createImage();image.ready=false;image.onload=()=>{image.ready=true;};image.src=file;assets[name]=image;}
let audio,hidden=false,scale=1,activeTouch=null;
function tone(frequency,duration){try{audio ||= wx.createWebAudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
const app=Play.create({canvas,platform:{assets,
  read:key=>{const value=wx.getStorageSync('ink-studio:'+key);return value===''?null:value;},write:(key,value)=>wx.setStorageSync('ink-studio:'+key,value),now:()=>Date.now(),requestFrame:fn=>requestAnimationFrame(()=>fn(Date.now())),hidden:()=>hidden,tone,
  help:()=>wx.showModal({title:'方块漫游',content:'填满行列即可消除并揭开作品。揭开目标格数，并消除所有标记位置即可过关。大师模式的加固格需消除两次。提示只建议当前落点。每张作品六关，通关即可收藏。',showCancel:false,confirmText:'知道了'}),
  confirm:(title,fn)=>wx.showModal({title,content:'当前棋盘将重置，已完成的关卡保留。',confirmText:'重开',cancelText:'继续玩',success:r=>{if(r.confirm)fn();}}),
  exportArt:(art,image,result)=>{if(!image?.ready)return;const out=wx.createCanvas();require('./shared/postcard.js').draw(out,image,art,result);wx.canvasToTempFilePath({canvas:out,success:r=>wx.previewImage({urls:[r.tempFilePath]}),fail:()=>wx.showToast({title:'作品生成失败，请重试',icon:'none'})});}
}});
function resize(){const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();scale=390/info.windowWidth;const top=info.safeArea?.top||0;let helpX=null;try{const menu=wx.getMenuButtonBoundingClientRect?.();if(menu?.left)helpX=Math.min(info.windowWidth-25,Math.max(info.windowWidth*.57,menu.left-27));else if(menu?.bottom)helpX=info.windowWidth*.67;}catch{}const bottom=info.safeArea?Math.max(0,info.windowHeight-info.safeArea.bottom):0;app.resize(info.windowWidth,info.windowHeight,info.pixelRatio||2,top,bottom,helpX);}
resize();if(wx.onWindowResize)wx.onWindowResize(resize);
wx.onTouchStart(e=>{if(activeTouch!==null)return;const t=e.changedTouches?.[0]||e.touches[0];if(t){activeTouch=t.identifier??0;app.pointerDown(t.clientX*scale,t.clientY*scale,'touch');}});wx.onTouchMove(e=>{const t=e.touches.find(t=>(t.identifier??0)===activeTouch);if(t)app.pointerMove(t.clientX*scale,t.clientY*scale);});wx.onTouchEnd(e=>{const t=e.changedTouches.find(t=>(t.identifier??0)===activeTouch);if(t){activeTouch=null;app.pointerUp(t.clientX*scale,t.clientY*scale);}});wx.onTouchCancel(()=>{activeTouch=null;app.cancel();});
wx.onHide(()=>{hidden=true;activeTouch=null;app.cancel();});if(wx.onShow)wx.onShow(()=>{hidden=false;});
app.start();
