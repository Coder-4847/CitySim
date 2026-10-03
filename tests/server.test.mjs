import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../tools/server.mjs';

test('local server serves game assets with correct types and keeps project internals private',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/CitySim/);
    const module=await fetch(base+'/src/ui/app.js');assert.match(module.headers.get('content-type'),/javascript/);assert.equal(module.headers.get('x-content-type-options'),'nosniff');
    for(const url of ['/package.json','/tools/server.mjs','/.git/config','/src/%2e%2e%2fpackage.json','/src/%00.js'])assert.equal((await fetch(base+url)).status,404);
    const head=await fetch(base+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
