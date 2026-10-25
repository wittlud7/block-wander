const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'output','wechat','block-wander'),themes=require('../shared/themes.js').THEMES;
const files=['game.js','game.json',...['blocks','themes','ink','retro','studio','studio-view','postcard'].map(n=>'shared/'+n+'.js'),'assets/museum/manifest.json','assets/museum/LICENSES.md',...themes.flatMap(t=>t.arts.map(a=>a.file))];
let bytes=0;for(const file of files){const data=fs.readFileSync(path.join(root,file)),target=path.join(dest,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);bytes+=data.length;}
const project=JSON.parse(fs.readFileSync(path.join(root,'project.config.json'),'utf8'));project.appid=process.env.WX_APPID||'touristappid';project.projectname='block-wander';project.packOptions={ignore:[]};
const config=Buffer.from(JSON.stringify(project,null,2)+'\n');fs.writeFileSync(path.join(dest,'project.config.json'),config);bytes+=config.length;
if(bytes>4*1024*1024)throw new Error('WeChat main-package budget exceeded; split assets before submission');
console.log(JSON.stringify({directory:dest,files:files.length+1,bytes,appIdConfigured:project.appid!=='touristappid',status:'development-preview',note:'Native chapter prototype; complete mode navigation, WeChat identity and ranking integration before release.'}));
