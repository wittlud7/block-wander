// Playwright CLI: run-code --filename scripts/verify-browser.js
async(page)=>{
  const assert=(value,message)=>{if(!value)throw new Error(message);},errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Math.random=()=>.43;});
  await page.setViewportSize({width:1440,height:1080});await page.goto('http://127.0.0.1:4186');
  await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('block-garden:')).forEach(k=>localStorage.removeItem(k)));await page.reload();
  await page.locator('#world-image').evaluate(img=>img.decode());
  assert((await page.evaluate(()=>window.blockGarden.snapshot())).mode==='journey','default journey mode');
  await page.getByRole('button',{name:'探索全部关卡 ↗'}).click();assert(await page.getByRole('button',{name:'第2关 沉睡的种子'}).isDisabled(),'future levels locked');await page.getByRole('button',{name:'返回花园 ↗'}).click();
  await page.getByRole('button',{name:'启程，唤醒花园 ↗',exact:true}).click();await page.keyboard.press('Space');
  let s=await page.evaluate(()=>window.blockGarden.snapshot());assert(s.lines===2&&s.journey.value===2&&s.journey.remaining===17,'authored puzzle responds');
  await page.screenshot({path:'output/playwright/v2-desktop.png',fullPage:true});
  await page.keyboard.press('Space');s=await page.evaluate(()=>window.blockGarden.snapshot());assert(s.status==='won'&&s.progress[0]===3,'two-piece win awards three stars');
  await page.screenshot({path:'output/playwright/v2-victory.png',fullPage:true});await page.reload();s=await page.evaluate(()=>window.blockGarden.snapshot());assert(s.progress[0]===3&&s.energy===3,'campaign and energy survive reload');
  await page.getByRole('button',{name:'探索全部关卡 ↗'}).click();assert(await page.getByRole('button',{name:'第2关 沉睡的种子'}).isEnabled(),'next unlock survives reload');await page.getByRole('button',{name:'第2关 沉睡的种子'}).click();
  await page.getByRole('button',{name:'启程，唤醒花园 ↗',exact:true}).click();
  await page.keyboard.press('p');const paused=await page.evaluate(()=>window.blockGarden.snapshot());await page.keyboard.press('ArrowLeft');await page.waitForTimeout(300);s=await page.evaluate(()=>window.blockGarden.snapshot());assert(s.status==='paused'&&s.piece.x===paused.piece.x&&s.piece.y===paused.piece.y,'pause freezes');await page.keyboard.press('p');
  await page.getByRole('button',{name:'玩法指南',exact:true}).click();assert((await page.evaluate(()=>window.blockGarden.snapshot())).status==='paused','help pauses');await page.locator('#dialog-confirm').click();assert((await page.evaluate(()=>window.blockGarden.snapshot())).status==='playing','close help resumes');
  // Complete levels via public keyboard input and the read-only board snapshot.
  // The planner simulates placements locally; it never writes game or progress.
  const playLevel=async()=>await page.evaluate(()=>{
    const {SHAPES,rotate}=GardenEngine,press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));let count=0;
    while(window.blockGarden.snapshot().status==='playing'&&count<100){
      const s=window.blockGarden.snapshot(),level=GardenJourney.LEVELS[s.journey.id];let matrix=SHAPES[s.piece.type].map(r=>r.slice()),best=null;
      const valid=(x,y,m)=>m.every((row,dy)=>row.every((v,dx)=>!v||(x+dx>=0&&x+dx<10&&y+dy<20&&(y+dy<0||!s.board[y+dy][x+dx]))));
      for(let rotation=0;rotation<4;rotation++){
        for(let x=-3;x<10;x++){
          if(!valid(x,0,matrix))continue;let y=0;while(valid(x,y+1,matrix))y++;
          const board=s.board.map(r=>r.slice());matrix.forEach((row,dy)=>row.forEach((v,dx)=>{if(v)board[y+dy][x+dx]=s.piece.type;}));
          const full=board.filter(r=>r.every(Boolean)),seeds=full.flat().filter(v=>v==='B').length,cleared=board.filter(r=>!r.every(Boolean));while(cleared.length<20)cleared.unshift(Array(10).fill(null));
          const heights=[];let holes=0;for(let c=0;c<10;c++){const first=cleared.findIndex(row=>row[c]);heights.push(first<0?0:20-first);if(first>=0)for(let y=first;y<20;y++)if(!cleared[y][c])holes++;}
          const bump=heights.slice(1).reduce((n,h,i)=>n+Math.abs(h-heights[i]),0),value=full.length*180+seeds*80+(level.kind==='multi'&&full.length>=2?400:0)-holes*300-heights.reduce((a,b)=>a+b,0)*8-bump*12-Math.max(...heights)*15;
          if(!best||value>best.value)best={x,rotation,value};
        }matrix=rotate(matrix);
      }
      if(!best)throw new Error('no legal move');for(let i=0;i<best.rotation;i++)press('ArrowUp');const dx=best.x-window.blockGarden.snapshot().piece.x;for(let i=0;i<Math.abs(dx);i++)press(dx<0?'ArrowLeft':'ArrowRight');press(' ');count++;
    }
    const s=window.blockGarden.snapshot();return {id:s.journey.id,status:s.status,outcome:s.journey.outcome,progress:s.progress,count};
  });
  const results=[];
  for(let id=1;id<9;id++){
    const result=await playLevel();assert(result.status==='won',`level ${id+1} failed: ${JSON.stringify(result)}`);results.push(result);
    if(id===3||id===6){await page.locator('#world-image').evaluate(img=>img.decode());await page.screenshot({path:`output/playwright/v2-world-${id===3?'tide':'night'}.png`,fullPage:true});}
    if(id<8)await page.getByRole('button',{name:'下一段旅程 ↗',exact:true}).click();
  }
  assert(Object.keys(results.at(-1).progress).length===9,'all nine levels unlocked and completed');
  await page.reload();s=await page.evaluate(()=>window.blockGarden.snapshot());assert(Object.keys(s.progress).length===9,'all stars persist');
  await page.getByRole('button',{name:'自由漫游',exact:true}).click();await page.getByRole('button',{name:'启程，唤醒花园 ↗',exact:true}).click();
  const before=await page.evaluate(()=>window.blockGarden.snapshot());await page.keyboard.press('c');s=await page.evaluate(()=>window.blockGarden.snapshot());assert(s.hold===before.piece.type&&s.holdUsed,'hold');await page.keyboard.press('c');assert((await page.evaluate(()=>window.blockGarden.snapshot())).piece.type===s.piece.type,'hold guard');await page.keyboard.press('Space');
  await page.getByRole('button',{name:'重新开始',exact:true}).click();await page.getByRole('button',{name:'关闭',exact:true}).click();assert((await page.evaluate(()=>window.blockGarden.snapshot())).score>0,'cancel restart preserves');await page.getByRole('button',{name:'重新开始',exact:true}).click();await page.getByRole('button',{name:'重新开始 ↗',exact:true}).click();assert((await page.evaluate(()=>window.blockGarden.snapshot())).score===0,'confirm restart resets');
  await page.setViewportSize({width:390,height:844});s=await page.evaluate(()=>window.blockGarden.snapshot());await page.getByRole('button',{name:'向左移动',exact:true}).click();assert((await page.evaluate(()=>window.blockGarden.snapshot())).piece.x===s.piece.x-1,'touch button');
  await page.getByRole('button',{name:'直接落下',exact:true}).click();assert((await page.evaluate(()=>window.blockGarden.snapshot())).score>0,'touch drop');
  await page.locator('#board').evaluate(el=>el.scrollIntoView({block:'center'}));
  const b=await page.locator('#board').boundingBox();s=await page.evaluate(()=>window.blockGarden.snapshot());await page.mouse.move(b.x+b.width*.45,b.y+b.height*.3);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.3,{steps:3});await page.mouse.up();assert((await page.evaluate(()=>window.blockGarden.snapshot())).piece.x>s.piece.x,'board swipe');
  await page.getByRole('button',{name:'开启音效',exact:true}).click();assert(await page.getByRole('button',{name:'关闭音效',exact:true}).isVisible(),'sound toggle');
  await page.screenshot({path:'output/playwright/v2-mobile.png',fullPage:true});
  for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
  await page.setViewportSize({width:1440,height:1080});await page.getByRole('button',{name:'暂停游戏',exact:true}).click();
  await page.getByRole('button',{name:'✧ 浮岛旅程',exact:true}).click();await page.getByRole('button',{name:'切换模式 ↗',exact:true}).click();
  await page.getByRole('button',{name:'探索全部关卡 ↗'}).click();await page.getByRole('button',{name:'第1关 第一缕晨光'}).click();
  assert(errors.length===0,'page errors: '+errors.join(','));
  return {verified:'nine real campaign wins, stars and unlocks, save persistence, pause, help, hold, restart, modes, touch, swipe, sound, five responsive widths',levels:results.map(r=>({id:r.id+1,pieces:r.count,stars:r.outcome.stars})),errors};
}
