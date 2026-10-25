const fs=require('node:fs'),path=require('node:path'),{compare}=require('../shared/ranking.js');
function fileStore(filename){let state={players:{},ranks:{}};if(fs.existsSync(filename))state=JSON.parse(fs.readFileSync(filename,'utf8'));const persist=()=>{fs.mkdirSync(path.dirname(filename),{recursive:true});const temp=filename+'.tmp';fs.writeFileSync(temp,JSON.stringify(state));fs.renameSync(temp,filename);};
  return{
    async player(id){return state.players[id]?{...state.players[id]}:null;},
    async savePlayer(p){state.players[p.id]={...p};persist();},
    async deletePlayer(id){delete state.players[id];for(const k of Object.keys(state.ranks))if(state.ranks[k].playerId===id)delete state.ranks[k];persist();},
    async saveRank(r){const key=r.date+':'+r.playerId,old=state.ranks[key];if(!old||compare(r,old)<0){state.ranks[key]={...r};persist();}},
    async standings(date,id){const all=Object.values(state.ranks).filter(r=>r.date===date).sort((a,b)=>compare(a,b)||a.playerId.localeCompare(b.playerId)).map((r,i)=>({...r,rank:i+1,name:state.players[r.playerId]?.name||'旅人'}));return{date,total:all.length,rows:all.slice(0,100),mine:all.find(r=>r.playerId===id)||null};}
  };
}
module.exports={fileStore};
