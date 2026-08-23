import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require=createRequire(import.meta.url);
const bodyHandler=require('../api/body.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg'};

function adapter(res){
  res.status=(code)=>{res.statusCode=code;return res};
  res.send=(body)=>{res.end(body);return res};
  return res;
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/',`http://${req.headers.host||'127.0.0.1'}`);
    if(url.pathname==='/api/body')return await bodyHandler(req,adapter(res));
    if(url.pathname==='/api/transcribe'||url.pathname==='/api/chat'||url.pathname==='/api/tts'){
      res.statusCode=501;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:false,ciStub:true}));
    }
    const rel=url.pathname==='/'?'forge/conversation-recovery.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const target=path.resolve(root,rel);
    if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){
      res.statusCode=404;return res.end('not found');
    }
    res.statusCode=200;res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    fs.createReadStream(target).pipe(res);
  }catch(error){res.statusCode=500;res.end(String(error?.stack||error));}
});

server.listen(port,'127.0.0.1',()=>console.log(`v12-ci-server http://127.0.0.1:${port}`));
