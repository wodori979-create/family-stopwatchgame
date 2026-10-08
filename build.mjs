import { build } from 'esbuild-wasm';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await build({entryPoints:['./public/app.js'],tsconfigRaw:{compilerOptions:{}},bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:'public/app.bundle.js',minify:true,legalComments:'eof'});
const hash=createHash('sha256').update(await readFile('public/app.bundle.js')).digest('hex').slice(0,12);
const html=await readFile('public/index.html','utf8');
await writeFile('public/index.html',html.replace(/src="app\.bundle\.js(?:\?v=[^"]*)?"/,`src="app.bundle.js?v=${hash}"`));
console.log('Firebase SDK를 포함한 브라우저 번들을 생성했습니다.');
