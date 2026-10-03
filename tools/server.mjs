import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
export function createServer(){return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const relative=pathname==='/'?'index.html':pathname.slice(1);
    if(relative!=='index.html'&&!relative.startsWith('src/'))throw new Error('Not a game asset');
    if(relative.split(/[\\/]/).some(s=>s.startsWith('.'))||relative.includes('\0'))throw new Error('Invalid path');
    const file=await realpath(path.resolve(root,relative));
    if(!file.startsWith(root+path.sep)||!types[path.extname(file)])throw new Error('Invalid asset');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)],'Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404);res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||4173);
  const server=createServer();server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Use the existing CitySim server or choose a different PORT.`:error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`CitySim is running at http://127.0.0.1:${port}`));
}
