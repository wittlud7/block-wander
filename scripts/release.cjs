const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output','release'),name='block-wander-v9',dest=path.join(out,name);
const themes=require('../shared/themes.js').THEMES;
const roots=['.github','index.html','package.json','.gitignore','LICENSE','NOTICE.md','README.md','game.js','game.json','project.config.json','web','shared','server','tests','docs','scripts','sites-app'];
const skipped=new Set(['node_modules','dist','.git','.data','.wrangler','.sites-runtime','.vinext','.next','.playwright-cli','output','outputs']);
const files=[];function collect(relative){const absolute=path.join(root,relative),stat=fs.statSync(absolute);if(stat.isDirectory()){for(const entry of fs.readdirSync(absolute))if(!skipped.has(entry)&&!entry.startsWith('.env')&&!entry.startsWith('.dev.vars')&&!entry.endsWith('.tsbuildinfo'))collect(relative+'/'+entry);}else files.push(relative);}
roots.forEach(collect);files.push('assets/museum/manifest.json','assets/museum/LICENSES.md',...themes.flatMap(t=>t.arts.map(a=>a.file)));
const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(data){let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
// Include only current source and museum assets; exclude historical artwork and local state.
const entries=files.map(file=>{const data=fs.readFileSync(path.join(root,file));if(!data.length)throw new Error('Empty file: '+file);return{file,data};});
fs.mkdirSync(dest,{recursive:true});const chunks=[],directory=[];let offset=0;
for(const{file,data}of entries){const filename=Buffer.from(`${name}/${file}`),crc=crc32(data),local=Buffer.alloc(30),central=Buffer.alloc(46);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x0800,6);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);
 central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x0800,8);central.writeUInt16LE(33,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(filename.length,28);central.writeUInt32LE(offset,42);chunks.push(local,filename,data);directory.push(central,filename);offset+=local.length+filename.length+data.length;
 const target=path.join(dest,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);
}
const size=directory.reduce((n,b)=>n+b.length,0),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(size,12);end.writeUInt32LE(offset,16);fs.writeFileSync(path.join(out,name+'.zip'),Buffer.concat([...chunks,...directory,end]));
console.log(JSON.stringify({directory:dest,zip:path.join(out,name+'.zip'),files:entries.length,bytes:offset+size+22}));
