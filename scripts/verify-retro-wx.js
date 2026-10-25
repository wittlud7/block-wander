async(page)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4186/scripts/wechat-preview.html');await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('wx-preview:retro-blocks:')).forEach(k=>localStorage.removeItem(k)));await page.reload();await page.waitForFunction(()=>Object.values(assets).every(image=>image.ready));
  let s=await page.evaluate(()=>window.wxPreview()),b=s.layout.board,slot=s.layout.slots[0];if(s.status!=='playing'||s.score!==0)throw new Error('not immediately playable');
  await page.screenshot({path:'output/playwright/retro-wechat.png'});
  await page.mouse.move(slot.x+55,s.layout.trayY);await page.mouse.down();await page.mouse.move(b.x+4*b.cell,b.y+7*b.cell+58,{steps:12});await page.mouse.up();s=await page.evaluate(()=>window.wxPreview());if(s.score!==84||s.cleared!==2)throw new Error('native input clear');
  const undo=s.buttons.find(b=>b.id==='undo');await page.mouse.click(undo.x+undo.w/2,undo.y+undo.h/2);s=await page.evaluate(()=>window.wxPreview());if(s.score!==0||s.undoLeft!==2)throw new Error('native undo');
  await page.reload();s=await page.evaluate(()=>window.wxPreview());if(s.score!==0||s.undoLeft!==2||s.best!==84)throw new Error('native persistence');
  await page.setViewportSize({width:375,height:667});await page.waitForTimeout(100);s=await page.evaluate(()=>window.wxPreview());if(s.buttons.some(b=>b.y<0||b.y+b.h>s.layout.h-23))throw new Error('small native screen overflow');
  await page.waitForFunction(()=>Object.values(assets).every(image=>image.ready));await page.screenshot({path:'output/playwright/retro-wechat-small.png'});if(errors.length)throw new Error(errors.join(','));return{verified:'native canvas textures, capsule safe area, real drag, two-row clear, undo, persisted session, small screen',errors};
}
