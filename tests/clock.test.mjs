import test from 'node:test';import assert from 'node:assert/strict';import {syncServerClock,roundStartMs} from '../public/room.mjs';
function mock(values){return {doc:()=>({}),serverTimestamp:()=>({}),updateDoc:async()=>{},getDocFromServer:async()=>({exists:()=>true,metadata:{hasPendingWrites:false},data:()=>({clockAt:values.shift()})})};}
test('확정되지 않은 서버 시간이 null이면 다시 읽는다',async()=>{const offset=await syncServerClock({api:mock([null,{toMillis:()=>2000}]),now:()=>1000});assert.equal(offset,1000);});
test('서버 시간 확인 실패는 안내 오류로 처리한다',async()=>{await assert.rejects(syncServerClock({api:mock([null,null,null]),now:()=>1000}),/서버 시간을/);});
test('시작 시각 없는 라운드는 시작하지 않는다',()=>{assert.equal(roundStartMs({startAt:null}),null);});

 test('commit 응답에서 캐시 없이 서버 시간을 계산한다',async()=>{const {syncCommittedClock}=await import('../public/room.mjs');const offset=await syncCommittedClock({projectId:'test',code:'ABCDEFGH',uid:'user',token:'test',now:()=>1000,fetcher:async()=>({ok:true,json:async()=>({writeResults:[{transformResults:[{timestampValue:'1970-01-01T00:00:02Z'}]}]})})});assert.equal(offset,1000);});
