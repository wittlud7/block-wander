// Node 24's native recursive cpSync crashes on this Windows workspace.
// Use the ordinary file-copy APIs for build packaging; application code is unchanged.
const fs=require('node:fs'),path=require('node:path');
if(process.platform==='win32'){
  fs.cpSync=function copy(source,destination,options={}){
    if(options.filter&&!options.filter(source,destination))return;
    const stat=fs.lstatSync(source);
    if(stat.isSymbolicLink())throw new Error('Packaging rejects symbolic links: '+source);
    if(stat.isDirectory()){
      if(!options.recursive)throw new Error('Recursive copy requires recursive:true');
      fs.mkdirSync(destination,{recursive:true});for(const name of fs.readdirSync(source))copy(path.join(source,name),path.join(destination,name),options);
    }else{
      if(fs.existsSync(destination)&&options.force===false){if(options.errorOnExist)throw new Error('Destination exists: '+destination);return;}
      fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination);
      if(options.preserveTimestamps)fs.utimesSync(destination,stat.atime,stat.mtime);
    }
  };
  require('node:module').syncBuiltinESMExports();
}
