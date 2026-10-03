import {mkdir,cp,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),out=new URL('../dist/',import.meta.url);
await mkdir(out,{recursive:true});
await cp(new URL('index.html',root),new URL('index.html',out));
await cp(new URL('src/',root),new URL('src/',out),{recursive:true});
await writeFile(new URL('.nojekyll',out),'');
console.log(`Static game packaged at ${fileURLToPath(out)}`);
