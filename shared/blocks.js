(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Blocks=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const N=8;
  const definitions=[['dot',['1'],.25],['two',['11'],1],['two-v',['1','1'],1],['three',['111'],1.3],['three-v',['1','1','1'],1.3],['square',['11','11'],1.5],['four',['1111'],1],['four-v',['1','1','1','1'],1],['five',['11111'],.5],['five-v',['1','1','1','1','1'],.5],['corner',['10','11'],1.2],['corner-r',['01','11'],1.2],['corner-u',['11','10'],1.2],['corner-l',['11','01'],1.2],['el',['10','10','11'],1],['el-r',['01','01','11'],1],['el-wide',['100','111'],1],['el-wide-r',['001','111'],1],['tee',['111','010'],1],['tee-u',['010','111'],1],['zig',['110','011'],.8],['zig-r',['011','110'],.8],['six',['111','111'],.65],['six-v',['11','11','11'],.65],['nine',['111','111','111'],.35],['angle',['100','100','111'],.7],['angle-r',['001','001','111'],.7]];
  const SHAPES=definitions.map(([id,rows,weight])=>({id,w:rows[0].length,h:rows.length,weight,cells:rows.flatMap((row,y)=>[...row].flatMap((v,x)=>v==='1'?[[x,y]]:[]))}));
  const BY_ID=Object.fromEntries(SHAPES.map(s=>[s.id,s]));
  const empty=()=>Array.from({length:N},()=>Array(N).fill(0));
  const copyBoard=board=>board.map(r=>r.slice());
  function fits(board,shape,row,col){return Boolean(Number.isInteger(row)&&Number.isInteger(col)&&shape&&shape.cells.every(([x,y])=>row+y>=0&&row+y<N&&col+x>=0&&col+x<N&&!board[row+y][col+x]));}
  function locations(board,shape){const out=[];for(let row=0;row<=N-shape.h;row++)for(let col=0;col<=N-shape.w;col++)if(fits(board,shape,row,col))out.push({row,col});return out;}
  function lines(board){const rows=[],cols=[];for(let i=0;i<N;i++){if(board[i].every(Boolean))rows.push(i);if(board.every(r=>r[i]))cols.push(i);}return{rows,cols};}
  function clear(board){const full=lines(board),removed=[];for(let row=0;row<N;row++)for(let col=0;col<N;col++)if((full.rows.includes(row)||full.cols.includes(col))&&board[row][col]){removed.push({row,col,color:board[row][col]});board[row][col]=0;}return{...full,removed};}
  const finiteInt=v=>Number.isSafeInteger(v)&&v>=0;
  function validState(s){return s&&s.version===3&&Array.isArray(s.board)&&s.board.length===N&&s.board.every(r=>Array.isArray(r)&&r.length===N&&r.every(v=>Number.isInteger(v)&&v>=0&&v<=6))&&Array.isArray(s.tray)&&s.tray.length===3&&s.tray.some(Boolean)&&s.tray.every(p=>p===null||(p&&BY_ID[p.shape]&&Number.isInteger(p.color)&&p.color>=1&&p.color<=6))&&['score','combo','moves','cleared'].every(key=>finiteInt(s[key]))&&lines(s.board).rows.length===0&&lines(s.board).cols.length===0;}
  function starter(){const b=empty();for(const x of [0,1])for(const y of [2,3])b[y][x]=2;for(const x of [6,7])for(const y of [3,4])b[y][x]=4;for(const y of [6,7])for(const x of [0,1,2,5,6,7])b[y][x]=x<3?3:1;return b;}
  class Game{
    constructor(options={}){this.random=options.random||Math.random;this.onEvent=options.onEvent||(()=>{});this.reset();if(options.state)this.restore(options.state);}
    reset(){this.board=starter();this.tray=[{shape:'square',color:1},{shape:'el-wide',color:2},{shape:'three-v',color:3}];this.score=0;this.combo=0;this.moves=0;this.cleared=0;this.undoLeft=3;this.history=[];this.status='playing';}
    get canUndo(){return this.undoLeft>0&&this.history.length>0;}
    getShape(index){return this.tray[index]?BY_ID[this.tray[index].shape]:null;}
    canPlace(index,row,col){return this.status==='playing'&&fits(this.board,this.getShape(index),row,col);}
    hasMoves(){return this.tray.some(p=>p&&locations(this.board,BY_ID[p.shape]).length>0);}
    refill(){
      const virtual=copyBoard(this.board),tray=[];
      for(let i=0;i<3;i++){
        const candidates=SHAPES.map(shape=>({shape,spots:locations(virtual,shape)})).filter(c=>c.spots.length);
        const total=candidates.reduce((n,c)=>n+c.shape.weight,0);let pick=this.random()*total,selected=candidates[candidates.length-1];
        for(const c of candidates){pick-=c.shape.weight;if(pick<0){selected=c;break;}}
        if(!selected){this.status='over';return;}
        const color=1+Math.floor(this.random()*6),spot=selected.spots[Math.floor(this.random()*selected.spots.length)];tray.push({shape:selected.shape.id,color});
        selected.shape.cells.forEach(([x,y])=>virtual[spot.row+y][spot.col+x]=color);clear(virtual);
      }
      this.tray=tray;
    }
    place(index,row,col){
      if(!this.canPlace(index,row,col))return false;
      this.history.push(this.snapshot(false));if(this.history.length>3)this.history.shift();
      const piece=this.tray[index],shape=BY_ID[piece.shape];shape.cells.forEach(([x,y])=>this.board[row+y][col+x]=piece.color);
      this.tray[index]=null;this.moves++;const result=clear(this.board),count=result.rows.length+result.cols.length;
      this.combo=count?this.combo+1:0;this.cleared+=count;
      const allClear=count>0&&this.board.every(r=>r.every(v=>!v));
      const earned=shape.cells.length+count*count*20+Math.max(0,this.combo-1)*10+(allClear?100:0);this.score+=earned;
      if(this.tray.every(p=>!p))this.refill();if(!this.hasMoves())this.status='over';
      const event={type:'place',row,col,index,color:piece.color,cells:shape.cells.map(([x,y])=>({row:row+y,col:col+x})),...result,count,earned,combo:this.combo,allClear,over:this.status==='over'};
      this.onEvent(event);return event;
    }
    undo(){if(!this.canUndo)return false;const h=this.history.pop();this.board=copyBoard(h.board);this.tray=h.tray.map(p=>p?{...p}:null);this.score=h.score;this.combo=h.combo;this.moves=h.moves;this.cleared=h.cleared;this.undoLeft--;this.status='playing';this.onEvent({type:'undo'});return true;}
    snapshot(includeHistory=true){return{version:3,board:copyBoard(this.board),tray:this.tray.map(p=>p?{...p}:null),score:this.score,combo:this.combo,moves:this.moves,cleared:this.cleared,undoLeft:this.undoLeft,status:this.status,...(includeHistory?{history:JSON.parse(JSON.stringify(this.history))}:{})};}
    restore(s){if(!validState(s))return false;this.board=copyBoard(s.board);this.tray=s.tray.map(p=>p?{...p}:null);this.score=s.score;this.combo=s.combo;this.moves=s.moves;this.cleared=s.cleared;this.undoLeft=Number.isInteger(s.undoLeft)?Math.max(0,Math.min(3,s.undoLeft)):0;this.history=Array.isArray(s.history)?JSON.parse(JSON.stringify(s.history.filter(validState).slice(-3))):[];this.status=this.hasMoves()?'playing':'over';return true;}
  }
  return{Game,SHAPES,BY_ID,N,fits,locations,lines,clear,empty,validState};
});
