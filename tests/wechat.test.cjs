const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('WeChat entry renders and starts using only Mini Game APIs, including high DPI touch mapping',()=>{
  const events={},storage={},drawn=[];let frames=0;
  const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),fillText:(...args)=>drawn.push(args)}, {get(target,key){return key in target?target[key]:(()=>{});},set(target,key,value){target[key]=value;return true;}});
  const canvas=()=>({width:0,height:0,getContext:()=>context});
  const wx={createCanvas:canvas,createOffscreenCanvas:canvas,createImage:()=>({width:1536,height:1024}),getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:3,safeArea:{top:24,bottom:810}}),getStorageSync:key=>storage[key]??'',setStorageSync:(k,v)=>storage[k]=v,
    onWindowResize:fn=>events.resize=fn,onTouchStart:fn=>events.start=fn,onTouchMove:fn=>events.move=fn,onTouchEnd:fn=>events.end=fn,onTouchCancel:fn=>events.cancel=fn,onHide:fn=>events.hide=fn,showModal:options=>options.success?.({confirm:true})};
  const file=path.resolve(__dirname,'../game.js');const source=fs.readFileSync(file,'utf8');
  // Expose only a test-time getter, not a debug API in the shipping Mini Game.
  const sandbox={wx,require:createRequire(file),Date,console,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame:()=>frames++};
  vm.runInNewContext(source+'\nthis.inspect = () => ({status:game.status,score:game.score,x:game.piece.x,hold:game.hold,layout}); this.redraw = frame;',sandbox);
  assert.equal(frames,1);assert.equal(sandbox.inspect().status,'ready');assert.ok(drawn.some(args=>args[0]==='✳ 方块花园'));
  let {layout}=sandbox.inspect();const startY=layout.boardY+layout.boardH/2+38;
  events.start({touches:[{clientX:195,clientY:startY}]});assert.equal(sandbox.inspect().status,'playing');sandbox.redraw();
  const x=sandbox.inspect().x;events.start({touches:[{clientX:100,clientY:layout.boardY+layout.boardH+40}]});events.end({changedTouches:[{clientX:100,clientY:layout.boardY+layout.boardH+40}]});assert.equal(sandbox.inspect().x,x-1);
  events.hide();assert.equal(sandbox.inspect().status,'paused');assert.equal(typeof events.resize,'function');
});
