async(page)=>{
  const assert=(value,label)=>{if(!value)throw new Error(label);},errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4186');await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('retro-blocks:')).forEach(k=>localStorage.removeItem(k)));await page.reload();
  await page.waitForFunction(()=>document.querySelectorAll('#controls button').length===7);await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/retro/')&&r.name.endsWith('.jpg')).length===2);
  let s=await page.evaluate(()=>window.blockPuzzle.snapshot());assert(s.status==='playing'&&s.score===0,'immediate game');
  const bounds=await page.locator('#game-surface').boundingBox(),factor=bounds.width/390;
  const screen=p=>({x:bounds.x+p.x*factor,y:bounds.y+p.y*factor});
  const slot=s.layout.slots[0],b=s.layout.board,start=screen({x:slot.x+55,y:s.layout.trayY}),end=screen({x:b.x+4*b.cell,y:b.y+7*b.cell+25});
  await page.screenshot({path:'output/playwright/retro-mobile.png'});
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});
  assert((await page.evaluate(()=>window.blockPuzzle.snapshot())).preview?.row===6,'drag ghost');await page.screenshot({path:'output/playwright/retro-drag.png'});await page.mouse.up();
  s=await page.evaluate(()=>window.blockPuzzle.snapshot());assert(s.score===84&&s.cleared===2&&s.tray[0]===null,'drag clears two rows');
  await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/retro-played.png'});await page.reload();s=await page.evaluate(()=>window.blockPuzzle.snapshot());assert(s.score===84&&s.best===84&&s.tray[0]===null,'resume session');
  await page.getByRole('button',{name:'撤回 3',exact:true}).focus();await page.keyboard.press('Enter');s=await page.evaluate(()=>window.blockPuzzle.snapshot());assert(s.score===0&&s.best===84&&s.undoLeft===2,'accessible undo');
  await page.locator('#game').focus();await page.keyboard.press('1');for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');for(let i=0;i<6;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Space');assert((await page.evaluate(()=>window.blockPuzzle.snapshot())).score===84,'keyboard placement');
  await page.getByRole('button',{name:'重开',exact:true}).focus();await page.keyboard.press('Enter');assert(await page.locator('#dialog').evaluate(d=>d.open),'restart confirmation');await page.getByRole('button',{name:'继续玩',exact:true}).click();assert((await page.evaluate(()=>window.blockPuzzle.snapshot())).score===84,'cancel restart');
  await page.getByRole('button',{name:'玩法',exact:true}).focus();await page.keyboard.press('Enter');assert(await page.locator('#dialog').evaluate(d=>d.open),'help');await page.getByRole('button',{name:'知道了',exact:true}).click();
  await page.getByRole('button',{name:'音效关',exact:true}).focus();await page.keyboard.press('Enter');assert((await page.evaluate(()=>window.blockPuzzle.snapshot())).sound,'sound');
  await page.getByRole('button',{name:'重开',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'重开本局',exact:true}).click();s=await page.evaluate(()=>window.blockPuzzle.snapshot());assert(s.score===0&&s.best===84,'restart keeps best');
  // Pointer taps are another complete placement path, independent of dragging.
  const r=await page.locator('#game-surface').boundingBox();s=await page.evaluate(()=>window.blockPuzzle.snapshot());const scale=r.width/390,ts=s.layout.slots[0],tb=s.layout.board;
  await page.mouse.click(r.x+(ts.x+55)*scale,r.y+s.layout.trayY*scale);assert((await page.evaluate(()=>window.blockPuzzle.snapshot())).selected===0,'tap selects');await page.mouse.click(r.x+(tb.x+4*tb.cell)*scale,r.y+(tb.y+7*tb.cell)*scale);assert((await page.evaluate(()=>window.blockPuzzle.snapshot())).score===84,'tap places');
  const layouts=[];for(const [width,height]of [[320,568],[375,667],[390,844],[430,932],[568,320],[1440,1080]]){await page.setViewportSize({width,height});await page.waitForTimeout(60);const layout=await page.evaluate(()=>window.blockPuzzle.snapshot().layout),box=await page.locator('#game-surface').boundingBox();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1),'page overflow '+width);assert(layout.board.cell>20&&layout.board.w===layout.board.h,'square board '+width);assert(box.y>=-1&&box.y+box.height<=height+1,'surface fits '+width);layouts.push({width,height});}
  await page.setViewportSize({width:1440,height:1080});await page.screenshot({path:'output/playwright/retro-desktop.png'});await page.setViewportSize({width:390,height:844});
  assert(errors.length===0,'page errors '+errors.join(','));return{verified:'real drag, ghost, row clear, tap placement, keyboard, undo, resume, restart/cancel, help, sound, portrait and landscape',layouts,errors};
}
