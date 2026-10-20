import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document={getElementById:()=>null};
const {setupArcadeMusic}=await import('../public/arcade-music.mjs');
delete globalThis.document;
function environment(saved=false,blocked=false){
 const handlers={},attrs={},store=new Map([['arcade-muted',String(saved)]]),intervals=new Set(),notes=[];let context;
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
 class Audio{constructor(){context=this;this.currentTime=0;this.state='suspended';this.destination={};}createGain(){return{gain:param(),connect(){},disconnect(){}};}createOscillator(){return{frequency:param(),connect(){},disconnect(){},start:t=>notes.push(t),stop(){}};}async resume(){if(blocked)throw Error('autoplay');this.state='running';}async suspend(){this.state='suspended';}}
 const button={setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,cb)=>handlers['button:'+k]=cb,contains:target=>target===button};
 const page={hidden:false,addEventListener:(k,cb)=>handlers[k]=cb};
 setupArcadeMusic({button,page,host:{AudioContext:Audio,setInterval:cb=>{intervals.add(cb);return cb;},clearInterval:cb=>intervals.delete(cb)},storage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
 return{button,page,attrs,store,intervals,notes,context:()=>context,unblock:()=>blocked=false,fire:(name,target={})=>handlers[name]({target,stopPropagation(){}})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('음소거 즉시 정지하고 선택을 저장하며 재개해도 루프가 중복되지 않음',async()=>{
 const e=environment();await flush();assert.equal(e.intervals.size,1);assert.ok(e.notes.length>0);
 e.fire('button:click');assert.equal(e.attrs['aria-pressed'],'true');assert.equal(e.store.get('arcade-muted'),'true');assert.equal(e.intervals.size,0);assert.equal(e.context().state,'suspended');
 e.fire('button:click');e.fire('pointerdown');await flush();assert.equal(e.intervals.size,1);assert.equal(e.attrs['aria-pressed'],'false');
 e.page.hidden=true;e.fire('visibilitychange');assert.equal(e.intervals.size,0);
 e.page.hidden=false;e.fire('visibilitychange');await flush();assert.equal(e.intervals.size,1);
});
test('이전 음소거 설정은 첫 터치와 새로고침에도 유지',async()=>{
 const e=environment(true);e.fire('pointerdown');await flush();assert.equal(e.context(),undefined);assert.equal(e.intervals.size,0);assert.equal(e.attrs['aria-pressed'],'true');
});
test('자동 재생이 거절되면 첫 터치로 다시 시작',async()=>{
 const e=environment(false,true);await flush();assert.equal(e.intervals.size,0);e.unblock();e.fire('pointerdown');await flush();assert.equal(e.intervals.size,1);
});
