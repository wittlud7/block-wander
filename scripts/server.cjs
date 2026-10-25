const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createAPI}=require('../server/api.cjs'),{fileStore}=require('../server/file-store.cjs');
const root=path.resolve(__dirname,'..'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};
function createServer(options={}){const api=createAPI(options.store||fileStore(path.join(root,'.data/rankings.json')));return http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,'http://'+(req.headers.host||'127.0.0.1:4186'));}catch{res.writeHead(400).end();return;}
 if(url.pathname.startsWith('/api/')){try{const parts=[];let length=0;for await(const part of req){length+=part.length;if(length>32768){res.writeHead(413,{'Content-Type':'application/json'}).end(JSON.stringify({error:'记录过长'}));return;}parts.push(part);}const request=new Request(url,{method:req.method,headers:req.headers,...(parts.length?{body:Buffer.concat(parts)}:{})}),response=await api(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:'服务暂不可用'}));}return;}
 let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}if(pathname.startsWith('/.data')||pathname.startsWith('/sites-app')||pathname.includes('/.git')){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);});
 });}
if(require.main===module)createServer().listen(4186,'127.0.0.1',()=>console.log('方块漫游 → http://127.0.0.1:4186'));module.exports={createServer};
