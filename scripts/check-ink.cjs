const I=require('../shared/ink.js');
const results=[];const fs=require('node:fs'),path=require('node:path');
for(let art=0;art<3;art++)for(let d=0;d<3;d++)for(let level=0;level<6;level++){
 let solved=null,last;
 for(const noise of [0,12,45,75,250,-45]){const g=new I.Game({config:I.config(art,level,d)});let turns=0;const witness=[];
  while(g.status==='playing'&&turns++<65){const m=I.bestMove(g,noise);if(!m)break;witness.push([m.index,m.row,m.col]);g.place(m.index,m.row,m.col);}
  last={art,d,level,status:g.status,moves:g.moves,repair:g.repairedCount,stamps:g.stamps,goal:g.c.goal,budget:g.c.budget,noise,witness};
  if(g.status==='won'){solved=last;break;}
 }
 results.push(solved||last);console.log(JSON.stringify(solved||last));
}
console.log('TOTAL',results.filter(r=>r.status==='won').length,'/',results.length);

fs.mkdirSync(path.join(__dirname,'../docs'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../docs/level-witnesses.json'),JSON.stringify({version:5,levels:results},null,2));if(results.some(r=>r.status!=='won'))process.exitCode=1;
