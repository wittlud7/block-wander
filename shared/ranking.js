(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./ink.js'));else root.InkRanking=factory(root.Ink);})(typeof globalThis!=='undefined'?globalThis:this,function(I){
  const compare=(a,b)=>a.moves-b.moves||a.hints-b.hints||a.undos-b.undos||b.score-a.score||String(a.achievedAt).localeCompare(String(b.achievedAt));
  function verify(input,now=Date.now()){
    if(!input||input.date!==I.chinaDate(now)||!Array.isArray(input.actions)||!input.actions.length||input.actions.length>200)throw new Error('仅接受今日挑战的完整操作记录');
    const d=I.daily(now),c=I.config(d.art,d.level,d.difficulty,d.date,input.theme||'retro'),g=new I.Game({config:c});let hints=0,undos=0;
    for(const a of input.actions){if(!Array.isArray(a)||g.status==='won'||(g.status==='over'&&a[0]!=='u'))throw new Error('操作记录无效');
      if(a[0]==='p'&&a.length===4&&a.slice(1).every(Number.isInteger)){if(!g.place(a[1],a[2],a[3]))throw new Error('含有非法落点');}
      else if(a[0]==='u'&&a.length===1){if(!g.undo())throw new Error('撤回次数无效');undos++;}
      else if(a[0]==='h'&&a.length===1){if(!g.hint())throw new Error('提示次数无效');hints++;}
      else throw new Error('未知操作');
    }
    if(g.status!=='won')throw new Error('对局尚未达成目标');
    return{date:d.date,theme:c.theme,moves:g.moves,score:g.score,stars:g.stars,hints,undos,achievedAt:new Date(now).toISOString()};
  }
  function nickname(value){const s=String(value||'').normalize('NFKC').trim();if(s.length<2||s.length>12||/[<>\u0000-\u001f\u007f]/.test(s))throw new Error('昵称需为2–12个字符');return s;}
  return{compare,verify,nickname};
});
