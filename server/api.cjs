const Ranking=require('../shared/ranking.js'),Ink=require('../shared/ink.js');
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
function createAPI(store,{trustSitesIdentity=false,now=()=>Date.now()}={}){
  return async function api(request){const url=new URL(request.url),path=url.pathname.replace(/^\/api\//,''),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    try{
      if(!['profile','rankings'].includes(path))return reply({error:'未找到此接口'},404);
      if(!['GET','POST','DELETE'].includes(request.method))return reply({error:'不支持的操作'},405);
      if(request.method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return reply({error:'请求来源无效'},403);
      const cookie=(request.headers.get('cookie')||'').match(/(?:^|;\s*)ink_guest=([a-f0-9-]{36})(?:;|$)/),sitesId=trustSitesIdentity?request.headers.get('oai-authenticated-user-id'):null;
      const token=cookie?.[1]||crypto.randomUUID(),id=await sha(sitesId?'sites:'+sitesId:'guest:'+token);
      if(!cookie&&!sitesId)headers['Set-Cookie']=`ink_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`;
      const player=async()=>{let p=await store.player(id);if(!p){p={id,name:'旅人'+id.slice(0,4),createdAt:new Date(now()).toISOString()};await store.savePlayer(p);}return p;};
      let input;
      if(request.method==='POST'){
        if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'仅接受JSON格式'},415);
        const reader=request.body?.getReader();if(!reader)return reply({error:'缺少请求内容'},400);const chunks=[];let size=0;for(;;){const{value,done}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return reply({error:'记录过长'},413);}chunks.push(value);}const body=new Uint8Array(size);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.length;}try{input=JSON.parse(new TextDecoder().decode(body));}catch{return reply({error:'JSON格式无效'},400);}
      }
      if(path==='profile'){
        if(request.method==='DELETE'){await store.deletePlayer(id);headers['Set-Cookie']='ink_guest=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';return reply({deleted:true});}
        const p=await player();if(request.method==='POST'){p.name=Ranking.nickname(input.name);await store.savePlayer(p);}return reply({id:p.id,name:p.name});
      }
      if(request.method==='DELETE')return reply({error:'请在玩家设置中删除排名资料'},405);
      if(request.method==='GET'){
        const date=url.searchParams.get('date')||Ink.chinaDate(now());if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>Ink.chinaDate(now())||date<Ink.chinaDate(now()-366*86400000))return reply({error:'日期不在可查询范围'},400);
        return reply(await store.standings(date,id));
      }
      const result=Ranking.verify(input,now());await player();await store.saveRank({...result,playerId:id});const board=await store.standings(result.date,id);return reply({accepted:true,rank:board.mine?.rank,record:board.mine});
    }catch(error){if(error instanceof TypeError)return reply({error:'请求内容无效'},400);if(/操作|落点|对局|今日|撤回|提示|昵称|主题|theme/i.test(error.message))return reply({error:error.message},400);console.error('Ranking API:',error.message);return reply({error:'排名服务暂不可用，请稍后重试'},503);}
  };
}
module.exports={createAPI};
