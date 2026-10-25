async(page)=>{
  await page.goto('http://127.0.0.1:4186');await page.locator('#game').focus();
  const result=await page.evaluate(()=>{
    const press=key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));let seed=98765,turns=0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    while(window.blockPuzzle.snapshot().status==='playing'&&turns<180){
      const s=window.blockPuzzle.snapshot(),moves=[];
      s.tray.forEach((p,i)=>{if(p)for(const spot of Blocks.locations(s.board,Blocks.BY_ID[p.shape]))moves.push({i,...spot});});
      if(!moves.length)throw new Error('playing without moves');const move=moves[Math.floor(random()*moves.length)];press(String(move.i+1));for(let i=0;i<move.row;i++)press('ArrowDown');for(let i=0;i<move.col;i++)press('ArrowRight');press(' ');turns++;
    }
    const s=window.blockPuzzle.snapshot();return{status:s.status,score:s.score,turns,undoLeft:s.undoLeft};
  });
  if(result.status!=='over')throw new Error('no game over reached');await page.getByRole('button',{name:'再来一局',exact:true}).waitFor();await page.screenshot({path:'output/playwright/retro-end.png'});
  if(result.undoLeft>0){await page.getByRole('button',{name:'撤回继续',exact:true}).focus();await page.keyboard.press('Enter');if((await page.evaluate(()=>window.blockPuzzle.snapshot())).status!=='playing')throw new Error('undo did not revive');}
  await page.getByRole('button',{name:'重开',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'重开本局',exact:true}).click();if((await page.evaluate(()=>window.blockPuzzle.snapshot())).score!==0)throw new Error('restart failed');return{verified:'real play until game over, end screen, undo revive, restart',...result};
}
