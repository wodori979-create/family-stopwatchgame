import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild-wasm';
const built=await build({entryPoints:['./public/solo.mjs'],bundle:true,format:'iife',platform:'browser',write:false,tsconfigRaw:{}});
const source=built.outputFiles[0].text;
function play(elapsed,reduced=false){
 const elements=new Map(),values=new Map();let time=0;
 const element=id=>{if(!elements.has(id))elements.set(id,{value:id==='solo-target'?'5.0':'',hidden:id==='celebration',children:[],style:{setProperty(){}},classList:{toggle(){}},replaceChildren(...children){this.children=children;},append(child){this.children.push(child);}});return elements.get(id);};
 const document={getElementById:element,createElement:()=>element('particle-'+Math.random()),querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){}};
 runInNewContext(source,{document,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},performance:{now:()=>time},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},matchMedia:()=>({matches:reduced}),Event:class{},Math});
 element('solo-go').onclick();time=elapsed;element('solo-stop').onclick();
 return {elements,values};
}
test('솔로 5.0초 성공은 축하 메시지, 폭죽, 0.1초 기록을 함께 생성',()=>{const {elements,values}=play(5049);assert.equal(elements.get('solo-timer').textContent,'5.0');assert.match(elements.get('solo-outcome').textContent,/축하해요/);assert.equal(elements.get('celebration').hidden,false);assert.equal(elements.get('celebration').children.length,73);assert.equal(JSON.parse(values.get('practice'))[0].elapsedMs,5000);});
test('5.1초로 표시되는 실패에는 폭죽이 없음',()=>{const {elements}=play(5050);assert.equal(elements.get('solo-timer').textContent,'5.1');assert.doesNotMatch(elements.get('solo-outcome').textContent,/축하해요/);assert.equal(elements.get('celebration')?.children.length||0,0);});
test('동작 줄이기 설정에서도 성공 축하 메시지는 표시',()=>{const {elements}=play(5000,true);assert.equal(elements.get('celebration').children.length,1);assert.match(elements.get('celebration').children[0].textContent,/축하해요/);});
