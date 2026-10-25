async(page)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4186/scripts/wechat-preview.html');
  await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('wx-preview:')).forEach(k=>localStorage.removeItem(k)));await page.reload();
  await page.waitForFunction(()=>images.every(i=>i.ready));
  const tap=async id=>{const b=await page.evaluate(id=>window.wxPreview().buttons.find(b=>b.id===id),id);if(!b)throw new Error('missing '+id);await page.mouse.click(b.x+b.w/2,b.y+b.h/2);};
  await page.screenshot({path:'output/playwright/v2-wechat.png'});await tap('start');await tap('drop');await tap('drop');
  await page.waitForFunction(()=>window.wxPreview().status==='won');if((await page.evaluate(()=>window.wxPreview().progress[0]))!==3)throw new Error('native canvas stars');
  await page.screenshot({path:'output/playwright/v2-wechat-win.png'});await tap('start');await page.waitForFunction(()=>window.wxPreview().level===1&&window.wxPreview().status==='playing');
  await page.setViewportSize({width:320,height:667});await page.waitForTimeout(100);
  const bounds=await page.evaluate(()=>({h:logicalHeight,buttons:window.wxPreview().buttons}));if(bounds.buttons.some(b=>b.y+b.h>bounds.h))throw new Error('small native screen overflow');
  await page.screenshot({path:'output/playwright/v2-wechat-small.png'});
  if(errors.length)throw new Error(errors.join(','));return {status:'passed',checks:'native canvas artwork loading, touch input, real win, stars, next level, 390 and 320 layouts',errors};
}
