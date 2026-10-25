const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Game, SHAPES, rotate } = require('../shared/engine.js');
function playing(options){const g=new Game(options);g.start();return g;}
function piece(g,type,x,y,rotation=0){let matrix=SHAPES[type].map(r=>r.slice());for(let i=0;i<rotation;i++)matrix=rotate(matrix);g.piece={type,x,y,matrix,rotation};}
test('each seven-bag contains every tetromino exactly once',()=>{
  const g=new Game();const stream=[g.piece.type,...g.queue];for(let i=0;i<133;i++)stream.push(g.takeBag());
  for(let i=0;i<140;i+=7)assert.deepEqual([...stream.slice(i,i+7)].sort(),Object.keys(SHAPES).sort());
});
test('ready and paused states freeze input and time',()=>{
  const g=new Game();const p=JSON.stringify(g.piece);g.move(1);g.rotate();g.hardDrop();g.update(100);assert.equal(JSON.stringify(g.piece),p);assert.equal(g.elapsed,0);
  g.start();g.update(100);g.pause();g.update(100);assert.equal(g.elapsed,100);assert.equal(g.swapHold(),false);
});
test('movement respects both walls and stack; ghost lands above existing blocks',()=>{
  const g=playing();piece(g,'O',0,0);assert.equal(g.move(-1),false);assert.equal(g.move(8),true);assert.equal(g.move(1),false);
  g.board[19][8]='T';assert.equal(g.ghostY(),17);g.hardDrop();assert.equal(g.board[17][8],'O');assert.equal(g.board[18][9],'O');assert.equal(g.board[19][8],'T');assert.equal(g.score,34);
});
test('SRS wall kick rotates a vertical T against the left wall',()=>{
  const g=playing();piece(g,'T',-1,4,1);assert.equal(g.valid(g.piece),true);assert.equal(g.rotate(),true);assert.equal(g.piece.x,0);assert.equal(g.piece.rotation,2);assert.equal(g.valid(g.piece),true);
});
test('I rotation can kick away from the right wall',()=>{
  const g=playing();piece(g,'I',7,5,1);assert.equal(g.valid(g.piece),true);assert.equal(g.rotate(),true);assert.equal(g.valid(g.piece),true);assert.ok(g.piece.x<=6);
});
test('failed rotation leaves every field unchanged',()=>{
  const g=playing();piece(g,'T',3,5);for(let y=0;y<20;y++)g.board[y].fill('Z');g.piece.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v)g.board[y+5][x+3]=null;}));
  const before=JSON.stringify(g.piece);assert.equal(g.rotate(),false);assert.equal(JSON.stringify(g.piece),before);
});
test('hold can only happen once per active piece and restores spawn orientation',()=>{
  const g=playing();const first=g.piece.type,next=g.queue[0];g.rotate();assert.equal(g.swapHold(),true);assert.equal(g.hold,first);assert.equal(g.piece.type,next);assert.equal(g.swapHold(),false);
  g.hardDrop();assert.equal(g.holdUsed,false);assert.equal(g.swapHold(),true);assert.equal(g.piece.type,first);assert.equal(g.piece.rotation,0);
});
test('four-line clear awards energy, score, removes rows and emits original row indices',()=>{
  const events=[],g=playing({onEvent:e=>events.push(e)});for(let y=16;y<20;y++){g.board[y].fill('S');g.board[y][4]=null;}
  piece(g,'I',2,16,1);g.hardDrop();assert.equal(g.lines,4);assert.equal(g.energy,4);assert.equal(g.score,800);assert.equal(g.board.flat().filter(Boolean).length,0);
  assert.deepEqual(events.find(e=>e.type==='clear').rows,[16,17,18,19]);
});
test('successive clears reward combo and ten lines level up',()=>{
  const g=playing();for(let i=0;i<10;i++){g.board[19].fill('J');g.board[19][4]=null;piece(g,'I',2,16,1);g.hardDrop();}
  assert.equal(g.level,2);assert.equal(g.lines,10);assert.equal(g.energy,10);assert.equal(g.combo,9);assert.equal(g.score,3250);
});
test('lock delay allows adjustment; at most 15 grounded resets',()=>{
  const g=playing();piece(g,'O',4,18);g.update(100);g.update(100);g.update(100);g.update(100);assert.equal(g.board.flat().filter(Boolean).length,0);
  g.move(1);assert.equal(g.lockTime,0);for(let i=0;i<20;i++)g.move(i%2?1:-1);assert.equal(g.lockResets,15);
  for(let i=0;i<5;i++)g.update(100);assert.equal(g.board.flat().filter(Boolean).length,4);
});
test('classic spawn collision ends the run; zen recycles the board and retains progress',()=>{
  const events=[],g=playing({onEvent:e=>events.push(e)});g.board[0].fill('Z');g.board[1].fill('Z');g.spawn('O');assert.equal(g.status,'over');assert.ok(events.some(e=>e.type==='over'));
  const zen=playing({mode:'zen'});zen.score=123;zen.energy=8;zen.board[0].fill('T');zen.spawn('O');assert.equal(zen.status,'playing');assert.equal(zen.board.flat().filter(Boolean).length,0);assert.equal(zen.score,123);assert.equal(zen.energy,8);assert.equal(zen.recycles,1);
});
test('zen speed remains constant while classic accelerates',()=>{
  const g=playing({mode:'zen'});g.level=20;piece(g,'O',4,0);for(let i=0;i<9;i++)g.update(100);assert.equal(g.piece.y,0);g.update(100);g.update(100);assert.equal(g.piece.y,1);
  const classic=playing();classic.level=20;piece(classic,'O',4,0);classic.update(100);assert.equal(classic.piece.y,1);
});
test('reset clears run state and switches mode without mutating the shape templates',()=>{
  const before=JSON.stringify(SHAPES),g=playing();g.rotate();g.hardDrop();g.swapHold();g.reset('zen');assert.equal(g.status,'ready');assert.equal(g.mode,'zen');assert.equal(g.score,0);assert.equal(g.hold,null);assert.equal(g.holdUsed,false);assert.equal(g.board.flat().filter(Boolean).length,0);assert.equal(JSON.stringify(SHAPES),before);
});
test('long randomized play keeps the board valid through moves, rotation, hold and drops',()=>{
  let seed=123456;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const g=playing({mode:'zen',random});
  for(let i=0;i<3000;i++){const a=Math.floor(random()*6);if(a===0)g.move(-1);if(a===1)g.move(1);if(a===2)g.rotate();if(a===3)g.swapHold();if(a===4)g.hardDrop();if(a===5)g.update(100);assert.equal(g.board.length,20);assert.ok(g.board.every(r=>r.length===10));assert.ok(g.valid(g.piece));assert.equal(g.status,'playing');}
});
