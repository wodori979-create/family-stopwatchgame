import test from 'node:test';
import assert from 'node:assert/strict';
import {setRoundCountdown} from '../public/game-focus.mjs';
test('확대 화면 카운트는 준비 구간을 숨기고 5부터 1까지 표시한 뒤 해제',()=>{
 const counter={textContent:''};let active=false;
 const timer={parentElement:{classList:{toggle:(name,on)=>active=on},querySelector:()=>counter}};
 setRoundCountdown(timer,7000);assert.equal(active,true);assert.equal(counter.textContent,'');
 for(const seconds of [5,4,3,2,1]){setRoundCountdown(timer,seconds*1000);assert.equal(counter.textContent,String(seconds));}
 setRoundCountdown(timer,0);assert.equal(active,false);assert.equal(counter.textContent,'');
});
