const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game,SHAPES,rotate}=require('../shared/engine.js');
const J=require('../shared/journey.js');
function setup(id){let campaign;const outcomes=[],events=[];const game=new Game({random:()=>.43,onEvent:e=>{events.push(e);campaign?.handle(e);}});campaign=new J.Journey(game,r=>outcomes.push(r));campaign.load(id);game.start();return{game,campaign,outcomes,events};}
function dropAt(game,x,rotations=0){for(let i=0;i<rotations;i++)assert.equal(game.rotate(),true);while(game.piece.x!==x)assert.equal(game.move(x<game.piece.x?-1:1),true);game.hardDrop();}
test('first chapter has authored puzzles, meaningful objectives, rewards, and distinct worlds',()=>{
  assert.equal(J.LEVELS.length,9);assert.equal(J.WORLDS.length,3);assert.equal(new Set(J.LEVELS.map(l=>l.reward)).size,9);
  for(const l of J.LEVELS){const {game,campaign}=setup(l.id);assert.equal(campaign.level.id,l.id);assert.ok(game.valid(game.piece));assert.ok(game.board.flat().some(Boolean));assert.ok(J.goalLabel(l));assert.equal(game.intervalOverride,l.speed);}
});
test('first level has an actual two-piece solution and freezes after success',()=>{
  const {game,campaign,outcomes}=setup(0);dropAt(game,4);assert.equal(campaign.value,2);assert.equal(game.status,'playing');dropAt(game,3);assert.equal(game.status,'won');assert.equal(outcomes.length,1);assert.equal(outcomes[0].stars,3);assert.equal(campaign.metrics.pieces,2);assert.equal(game.lines,3);const score=game.score;game.hardDrop();game.update(100);assert.equal(game.score,score);
});
test('seed rescue counts only seeds from cleared rows and can complete the second level',()=>{
  const {game,campaign}=setup(1);dropAt(game,6);assert.equal(campaign.metrics.seeds,2);dropAt(game,1);assert.equal(campaign.metrics.seeds,4);dropAt(game,4);assert.equal(campaign.value,6);assert.equal(game.status,'won');
});
test('multi-line goal counts clear events, not the number of rows',()=>{
  const {game,campaign}=setup(2);dropAt(game,1);assert.equal(campaign.value,1);dropAt(game,6);dropAt(game,3);assert.equal(campaign.value,3);assert.equal(game.lines,6);assert.equal(game.status,'won');
});
test('exact final step can win; exhausting the budget otherwise loses exactly once',()=>{
  const {game,campaign,outcomes}=setup(0);campaign.metrics.pieces=16;dropAt(game,4);dropAt(game,3);assert.equal(game.status,'won');assert.equal(outcomes.length,1);
  const s=setup(0);s.campaign.metrics.pieces=17;dropAt(s.game,0);assert.equal(s.game.status,'over');assert.equal(s.outcomes[0].reason,'修复步数已用完');assert.equal(s.campaign.active,false);
});
test('time-limited level pauses its timer and ends at its active-play deadline',()=>{
  const {game,campaign,outcomes}=setup(5);game.elapsed=119950;game.pause();game.update(100);campaign.update();assert.equal(outcomes.length,0);game.start();game.update(100);campaign.update();assert.equal(game.status,'over');assert.equal(outcomes[0].reason,'本次修复时间已结束');
});
test('tides add one traversable garbage row on schedule, with overflow detection',()=>{
  const {game,campaign,events}=setup(3);game.board=Array.from({length:20},()=>Array(10).fill(null));campaign.metrics.pieces=1;dropAt(game,0);assert.equal(events.filter(e=>e.type==='tide').length,1);assert.equal(game.board[19].filter(Boolean).length,9);assert.equal(game.board[19].filter(c=>c===null).length,1);
  const s=setup(3);s.game.board[0][0]='M';s.campaign.metrics.pieces=1;dropAt(s.game,4);assert.equal(s.game.status,'over');assert.equal(s.outcomes[0].reason,'潮水抵达了天空边缘');
});
test('star ratings never regress, unsuccessful attempts do not unlock the next level',()=>{
  let p={};assert.equal(J.unlocked(p,0),true);assert.equal(J.unlocked(p,1),false);p=J.record(p,{won:false,level:0,stars:0});assert.deepEqual(p,{});p=J.record(p,{won:true,level:0,stars:3});assert.equal(J.unlocked(p,1),true);p=J.record(p,{won:true,level:0,stars:1});assert.equal(p[0],3);assert.equal(J.unlocked(p,2),false);
});
test('leaving the journey clears its outcome and disables old goals and timers',()=>{
  const {game,campaign,outcomes}=setup(5);campaign.finish(false,'旧关卡结束');assert.equal(outcomes.length,1);campaign.stop();assert.equal(campaign.outcome,null);assert.equal(campaign.level,null);game.reset('classic');game.start();game.elapsed=200000;campaign.update();campaign.handle({type:'lock'});assert.equal(game.status,'playing');assert.equal(outcomes.length,1);
});
function bestPlacement(game,campaign){
  let matrix=SHAPES[game.piece.type].map(r=>r.slice()),best=null;
  for(let r=0;r<4;r++){
    for(let x=-3;x<10;x++){
      const p={type:game.piece.type,matrix,x,y:0};if(!game.valid(p))continue;let y=0;while(game.valid(p,0,y+1))y++;
      const board=game.board.map(row=>row.slice());matrix.forEach((row,dy)=>row.forEach((v,dx)=>{if(v)board[y+dy][x+dx]=p.type;}));
      const full=board.filter(row=>row.every(Boolean)),seeds=full.flat().filter(c=>c==='B').length;
      const cleared=board.filter(row=>!row.every(Boolean));while(cleared.length<20)cleared.unshift(Array(10).fill(null));
      const heights=[];let holes=0;for(let c=0;c<10;c++){const first=cleared.findIndex(row=>row[c]);heights.push(first<0?0:20-first);if(first>=0)for(let y=first;y<20;y++)if(!cleared[y][c])holes++;}
      const bump=heights.slice(1).reduce((n,h,i)=>n+Math.abs(h-heights[i]),0);
      const value=full.length*180+seeds*80+(campaign.level.kind==='multi'&&full.length>=2?400:0)-holes*300-heights.reduce((a,b)=>a+b,0)*8-bump*12-Math.max(...heights)*15;
      if(!best||value>best.value)best={x,r,value};
    }matrix=rotate(matrix);
  }
  return best;
}
test('every campaign level can actually be completed through legal rotations, moves and drops within its budget',()=>{
  const summary=[];
  for(const l of J.LEVELS){const {game,campaign,outcomes}=setup(l.id);let drops=0;
    while(game.status==='playing'&&drops<100){const best=bestPlacement(game,campaign);assert.ok(best,'placement for '+l.name);dropAt(game,best.x,best.r);game.update(100);campaign.update();drops++;}
    summary.push(`${l.id+1}:${drops}步/${game.lines}行`);assert.equal(game.status,'won',`${l.name}: ${JSON.stringify(outcomes)}`);
  }
  console.log('Campaign solutions:',summary.join(', '));
});
