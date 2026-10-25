(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./blocks.js'),require('./themes.js'));else root.Ink=factory(root.Blocks,root.InkThemes);})(typeof globalThis!=='undefined'?globalThis:this,function(B,T){
  'use strict';
  const ARTS=T.get('retro').arts;
  const art=c=>T.art(c.theme||'retro',c.art);
  const DIFFICULTIES=[{id:'easy',name:'轻松',undo:3,hints:3,maxSize:4},{id:'normal',name:'标准',undo:2,hints:2,maxSize:6},{id:'master',name:'大师',undo:1,hints:1,maxSize:9}];
  const STAGES=['第1关','第2关','第3关','第4关','第5关','第6关'];
  const GOALS=[[24,28,32,36,40,44],[32,36,40,44,48,50],[36,40,44,48,50,52]];
  const clone=v=>JSON.parse(JSON.stringify(v));
  function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function random(seed){let n=seed>>>0;return()=>{n=(n+0x6D2B79F5)>>>0;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
  function chinaDate(time=Date.now()){return new Date(time+28800000).toISOString().slice(0,10);}
  function seasonal(time=Date.now()){const date=chinaDate(time);return date>='2026-10-23'&&date<='2026-11-06';}
  function daily(time=Date.now()){const date=chinaDate(time);return{art:seasonal(time)?1:hash(date)%3,level:2+hash(date+'stage')%3,difficulty:1,date,seed:hash('ink-daily-'+date)};}
  function config(art=1,level=0,difficulty=1,date=null,theme='retro'){
    if(!Number.isInteger(art)||art<0||art>2||!Number.isInteger(level)||level<0||level>5||!Number.isInteger(difficulty)||difficulty<0||difficulty>2)throw new Error('Invalid chapter');
    if(!T.THEMES.some(t=>t.id===theme))throw new Error('Invalid theme');
    return{art,level,difficulty,date,theme,seed:hash(`ink-${art}-${level}-${difficulty}-${date||'book'}`),goal:GOALS[difficulty][level],budget:difficulty===0?null:(difficulty===1?28:24)+level*2,...DIFFICULTIES[difficulty],name:STAGES[level]};
  }
  function initial(c){
    const board=B.empty(),seals=B.empty(),lvl=c.level;
    if(c.mode==='endless')return{board,seals,marks:[],deck:[]};
    const marks=[[[4,5],[6,2],[7,6]],[[1,6],[5,4],[7,7]],[[2,0],[4,1],[7,6]],[[2,3],[4,6],[7,1]],[[1,3],[4,2],[6,5]],[[1,1],[3,5],[6,2],[7,7]]][lvl].map(p=>p.slice());
    // Targets are overlays, never prefilled blocks: every chapter starts empty.
    if(c.difficulty===2){const row=7,col=lvl===1?7:0;seals[row][col]=1;marks[marks.length-1]=[row,col];}
    const deck=[];
    return{board,marks,seals,deck};
  }
  const validMask=m=>Array.isArray(m)&&m.length===8&&m.every(r=>Array.isArray(r)&&r.length===8&&r.every(v=>v===0||v===1));
  class Game extends B.Game{
    constructor(options={}){super({random:random(1)});this.external=options.onEvent||(()=>{});this.onEvent=()=>{};this.load(options.config||config());if(options.state?.version===4){try{this.load(config(options.state.config.art,options.state.config.level,options.state.config.difficulty,options.state.config.date));}catch{}}else if(options.state)this.restore(options.state);}
    load(c){this.c={...c};this.rngState=c.seed;this.random=()=>{this.rngState=(Math.imul(this.rngState,1664525)+1013904223)>>>0;return this.rngState/4294967296;};super.reset();const start=initial(c);this.board=start.board;this.marks=start.marks;this.seals=start.seals;this.deck=start.deck;this.deckAt=0;this.repaired=B.empty();this.undoLeft=c.undo;this.hintsLeft=c.hints;this.credits=0;this.swaps=0;this.inkHistory=[];this.actions=[];this.ranked=c.mode!=='endless';this.failure='';this.status='playing';this.refill();this.onEvent=()=>{};}
    refill(){const pool=B.SHAPES.filter(s=>s.cells.length<=DIFFICULTIES[this.c.difficulty].maxSize);const virtual=this.board.map(r=>r.slice()),tray=[];
      if(this.c.mode==='endless'){this.tray=Array.from({length:3},()=>{let pick=this.random()*pool.reduce((n,s)=>n+s.weight,0),chosen=pool[pool.length-1];for(const s of pool){pick-=s.weight;if(pick<0){chosen=s;break;}}return{shape:chosen.id,color:1+Math.floor(this.random()*6)};});return;}
      for(let i=0;i<3;i++){let shape,spots;const wanted=B.BY_ID[this.deck[this.deckAt++]];if(wanted&&(spots=B.locations(virtual,wanted)).length)shape=wanted;
        else{const choices=pool.map(s=>({s,spots:B.locations(virtual,s)})).filter(x=>x.spots.length);const total=choices.reduce((n,x)=>n+x.s.weight,0);let n=this.random()*total;let choice=choices[choices.length-1];for(const x of choices){n-=x.s.weight;if(n<0){choice=x;break;}}if(!choice){this.status='over';return;}shape=choice.s;spots=choice.spots;}
        const p=spots[Math.floor(this.random()*spots.length)],color=1+Math.floor(this.random()*6);tray.push({shape:shape.id,color});shape.cells.forEach(([x,y])=>virtual[p.row+y][p.col+x]=color);B.clear(virtual);
      }this.tray=tray;
    }
    get repairedCount(){return this.repaired.flat().reduce((a,b)=>a+b,0);}
    get canUndo(){return this.status!=='over'&&super.canUndo&&!!this.inkHistory?.length;}
    get stamps(){return this.marks.filter(([r,c])=>this.repaired[r][c]).length;}
    get remaining(){return this.c.budget===null?null:Math.max(0,this.c.budget-this.moves);}
    get stars(){if(this.status!=='won')return 0;const par=14+this.c.level*2;return this.moves<=par?3:this.moves<=par+6?2:1;}
    inkState(){return{repaired:clone(this.repaired),seals:clone(this.seals),deckAt:this.deckAt,rngState:this.rngState};}
    place(index,row,col){if(!this.canPlace(index,row,col))return false;const before=this.inkState(),refilled=this.tray.filter(Boolean).length===1;const e=super.place(index,row,col);this.inkHistory.push(before);if(this.inkHistory.length>3)this.inkHistory.shift();
      const repaired=[],broken=[];const repair=(r,c)=>{if(r<0||r>=8||c<0||c>=8||this.seals[r][c])return;if(!this.repaired[r][c]){this.repaired[r][c]=1;repaired.push([r,c]);}};
      for(const p of e.removed){if(this.seals[p.row][p.col]){this.seals[p.row][p.col]--;this.board[p.row][p.col]=p.color;broken.push([p.row,p.col]);}else repair(p.row,p.col);}
      if(e.count>=2)for(const p of e.removed)for(const[dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]])if(!broken.some(([r,c])=>r===p.row+dr&&c===p.col+dc))repair(p.row+dr,p.col+dc);
      if(refilled&&broken.length)this.refill();
      if(this.c.mode==='endless')this.credits+=e.count*25+(e.allClear?50:0);
      if(this.c.mode!=='endless'&&this.repairedCount>=this.c.goal&&this.stamps===this.marks.length)this.status='won';
      else if(this.remaining===0){this.status='over';this.failure='步数用完';}else if(!this.hasMoves()){this.status='over';this.failure='没有可放的位置';}else this.status='playing';
      const event={...e,restored:repaired,broken,bleed:e.count>=2,over:this.status==='over',won:this.status==='won'};if(this.c.mode==='endless'){this.history=[];this.inkHistory=[];this.actions=[];}else this.actions.push(['p',index,row,col]);this.external(event);return event;
    }
    undo(){if(!this.canUndo)return false;const m=this.inkHistory[this.inkHistory.length-1];const ok=super.undo();if(!ok)return false;this.inkHistory.pop();Object.assign(this,clone(m));this.failure='';this.actions.push(['u']);this.external({type:'undo'});return true;}
    get swapCost(){return 100+this.swaps*50;}
    swap(index){if(this.c.mode!=='endless'||this.status!=='playing'||!Number.isInteger(index)||!this.tray[index]||this.credits<this.swapCost)return false;const old=this.tray[index],pool=B.SHAPES.filter(s=>s.cells.length<=9&&s.id!==old.shape&&B.locations(this.board,s).length);if(!pool.length)return false;const cost=this.swapCost;this.tray[index]={shape:pool[Math.floor(this.random()*pool.length)].id,color:old.color};this.credits-=cost;this.swaps++;this.external({type:'swap',cost});return true;}
    snapshot(history=true){const base=super.snapshot(history);return{...base,version:6,actions:clone(this.actions),ranked:this.ranked,config:{...this.c},ink:this.inkState(),credits:this.credits,swaps:this.swaps,hintsLeft:this.hintsLeft,...(history?{inkHistory:clone(this.inkHistory)}:{}),status:this.status};}
    restore(s){if(![5,6].includes(s?.version)||!s.config||!validMask(s.ink?.repaired)||!validMask(s.ink?.seals)||!Array.isArray(s.tray)||!Number.isSafeInteger(s.ink.deckAt)||s.ink.deckAt<0||!Number.isInteger(s.ink.rngState)||s.ink.rngState<0||s.ink.rngState>4294967295)return false;
      let c;try{c=s.config.mode==='endless'?endlessConfig(s.config.theme,s.config.seed):config(s.config.art,s.config.level,s.config.difficulty,s.config.date,s.config.theme||'retro');}catch{return false;}if(s.config.seed!==c.seed)return false;
      const base={...s,version:3,history:Array.isArray(s.history)?s.history.map(h=>({...h,version:3})):[]};if(!B.validState(base))return false;
      this.load(c);super.restore(base);Object.assign(this,clone(s.ink));this.hintsLeft=Math.max(0,Math.min(c.hints,Number.isInteger(s.hintsLeft)?s.hintsLeft:0));this.inkHistory=Array.isArray(s.inkHistory)?s.inkHistory.filter(m=>validMask(m.repaired)&&validMask(m.seals)).slice(-3).map(clone):[];
      this.credits=Number.isSafeInteger(s.credits)&&s.credits>=0?s.credits:0;this.swaps=Number.isSafeInteger(s.swaps)&&s.swaps>=0?s.swaps:0;
      this.status=c.mode!=='endless'&&this.repairedCount>=c.goal&&this.stamps===this.marks.length?'won':this.remaining===0||!this.hasMoves()?'over':'playing';this.actions=s.version===6&&Array.isArray(s.actions)?clone(s.actions):[];this.ranked=c.mode!=='endless'&&s.version===6&&s.ranked===true;this.failure=this.status==='over'?(this.remaining===0?'步数用完':'没有可放的位置'):'';return true;
    }
    hint(){if(this.hintsLeft<=0||this.status!=='playing')return null;const choice=bestMove(this);if(choice){this.hintsLeft--;this.actions.push(['h']);}return choice;}
  }
  function bestMove(game,noise=0){let best=null;const saved=game.snapshot();for(let i=0;i<3;i++){const shape=game.getShape(i);if(!shape)continue;for(const spot of B.locations(game.board,shape)){
      const sim=new Game({state:saved});const e=sim.place(i,spot.row,spot.col);let potential=0;for(let n=0;n<8;n++){let row=0,col=0,ur=0,uc=0;for(let j=0;j<8;j++){row+=!!sim.board[n][j];col+=!!sim.board[j][n];ur+=!sim.repaired[n][j];uc+=!sim.repaired[j][n];}potential+=row*row*(.4+ur/8)+col*col*(.4+uc/8);}
      let isolated=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(!sim.board[r][c]&&[[1,0],[-1,0],[0,1],[0,-1]].every(([dr,dc])=>r+dr<0||r+dr>=8||c+dc<0||c+dc>=8||sim.board[r+dr][c+dc]))isolated++;
      let targetPotential=0;for(const[r,c]of sim.marks)if(!sim.repaired[r][c]){const row=sim.board[r].filter(Boolean).length,col=sim.board.reduce((n,line)=>n+!!line[c],0);targetPotential+=Math.max(row,col)**2;}
      const value=(sim.status==='won'?100000:sim.status==='over'?-10000:0)+e.restored.length*18+(sim.stamps-game.stamps)*150+e.broken.length*90+e.count*18+potential*.7+targetPotential*2-isolated*10-sim.board.flat().filter(Boolean).length*.7+noise*((hash(`${game.moves}-${i}-${spot.row}-${spot.col}`)%100)/100-.5);
      if(!best||value>best.value)best={index:i,...spot,value};
    }}return best;
  }
  function progressKey(c){return `${c.theme||'retro'}:${c.art}:${c.level}:${c.difficulty}`;}
  function endlessConfig(theme='retro',seed=Date.now()>>>0){if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('Invalid seed');return{...config(0,0,2,null,theme),mode:'endless',seed,budget:null,goal:64,undo:0,hints:0,name:'无尽模式'};}
  function record(book,game){const out=clone(book||{});if(game.status!=='won')return out;const key=progressKey(game.c),old=out[key]||{};out[key]={stars:Math.max(old.stars||0,game.stars),score:Math.max(old.score||0,game.score),moves:Math.min(old.moves??Infinity,game.moves)};return out;}
  function unlocked(book,art,level,theme='retro'){return level===0||DIFFICULTIES.some((_,d)=>book[`${theme}:${art}:${level-1}:${d}`]);}
  return{Game,ARTS,THEMES:T.THEMES,theme:T.get,art,DIFFICULTIES,STAGES,config,endlessConfig,initial,hash,random,chinaDate,seasonal,daily,bestMove,record,progressKey,unlocked};
});
