// Explicit live smoke test; run manually, then delete the fixture listed in work/.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,signInAnonymously,deleteUser} from 'firebase/auth';
import * as api from 'firebase/firestore';
import {joinFamily,startFamilyRound,roundStartMs} from '../public/room.mjs';
const source=await readFile(new URL('../public/firebase.js',import.meta.url),'utf8');
const config=runInNewContext('('+source.match(/export const firebaseConfig = (\{[\s\S]*?\});/)[1]+')');
const clients=[];
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>alphabet[b%alphabet.length]).join('');
const cleanup={code,results:[]};
const manifest=new URL('../../../work/live-fixture.json',import.meta.url);
try{
 for(let i=0;i<2;i++){const app=initializeApp(config,`smoke-${code}-${i}`);const auth=getAuth(app);const uid=(await signInAnonymously(auth)).user.uid;clients.push({app,auth,uid,db:api.getFirestore(app)});}
 await writeFile(manifest,JSON.stringify(cleanup));
 const [host,guest]=clients;
 const batch=api.writeBatch(host.db);
 batch.set(api.doc(host.db,'rooms',code),{name:'자동 연결 점검',owner:host.uid,currentRound:'',createdAt:api.serverTimestamp()});
 batch.set(api.doc(host.db,'rooms',code,'members',host.uid),{name:'점검 방장',joinedAt:api.serverTimestamp()});
 await batch.commit();
 assert.equal(await joinFamily({api,...guest,code,name:'점검 참가자'}),'점검 참가자');
 assert.equal(await joinFamily({api,...guest,code,name:'다른 이름'}),'점검 참가자');
 assert.equal(await joinFamily({api,...host,code,name:'다른 이름'}),'점검 방장');
 assert.equal((await api.getDocs(api.collection(host.db,'rooms',code,'members'))).size,2);
 console.log('PASS: 방 생성, 신규 참여, 방장/참가자 재접속, 기존 별명 유지');
 await assert.rejects(api.setDoc(api.doc(guest.db,'rooms',code,'members',guest.uid),{name:'변조',joinedAt:api.serverTimestamp()}),e=>e.code==='permission-denied');
 console.log('PASS: 참가자 정보 덮어쓰기 차단');
 const serverCreated=(await api.getDocFromServer(api.doc(host.db,'rooms',code))).data().createdAt.toMillis();
 console.log('Clock offset (ms):',serverCreated-Date.now());
 const clockRef=api.doc(host.db,'rooms',code,'members',host.uid);
 const before=Date.now();await api.updateDoc(clockRef,{clockAt:api.serverTimestamp()});const after=Date.now();
 const offset=(await api.getDocFromServer(clockRef)).data().clockAt.toMillis()-(before+after)/2;
 const firstTarget=1123;const roundId=await startFamilyRound({api,...host,code,targetMs:firstTarget,difficulty:'expert'});
 const roundData=(await api.getDocFromServer(api.doc(guest.db,'rooms',code,'rounds',roundId))).data();
 assert.equal(roundData.targetMs,firstTarget);assert.equal(roundData.difficulty,'expert');assert.equal(roundData.countdownMs,5000);assert.equal(roundData.startAt.toMillis(),roundData.createdAt.toMillis());
 const start=roundStartMs(roundData);
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,start+firstTarget+100-(Date.now()+offset))));
 for(const client of clients){const name=client===host?'점검 방장':'점검 참가자';const id=`${code}_${roundId}_${client.uid}`;cleanup.results.push(id);await writeFile(manifest,JSON.stringify(cleanup));await api.setDoc(api.doc(client.db,'results',id),{uid:client.uid,familyId:code,familyName:'자동 연결 점검',roundId,name,targetMs:firstTarget,elapsedMs:firstTarget,difficulty:'expert',createdAt:api.serverTimestamp()});}
 const results=await api.getDocs(api.query(api.collection(guest.db,'results'),api.where('familyId','==',code),api.orderBy('createdAt','desc'),api.limit(50)));
 assert.equal(results.size,2);
 await assert.rejects(api.setDoc(api.doc(host.db,'results',cleanup.results[0]),results.docs.find(d=>d.id===cleanup.results[0]).data()),e=>e.code==='permission-denied');
 console.log('PASS: 라운드 생성, 다른 참가자 조회, 두 기록 서버 저장, 복합 인덱스 조회, 중복 제출 차단');
 await assert.rejects(startFamilyRound({api,...guest,code,targetMs:1000}),/방장만/);
 await assert.rejects(startFamilyRound({api,...host,code,targetMs:1000}),e=>e.code==='permission-denied');
 console.log('PASS: 참가자의 GO 및 진행 중 중복 라운드 차단');
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,start+firstTarget+30500-(Date.now()+offset))));
 const second=await startFamilyRound({api,...host,code,targetMs:5120,difficulty:'hard'});
 assert.equal((await api.getDocFromServer(api.doc(guest.db,'rooms',code,'rounds',second))).data().targetMs,5120);
 console.log('PASS: 대기 종료 후 두 번째 라운드 GO (상 난이도, 목표 5.12초)');
}finally{
 for(const client of clients){try{await deleteUser(client.auth.currentUser);}catch{}await api.terminate(client.db);await deleteApp(client.app);}
}
