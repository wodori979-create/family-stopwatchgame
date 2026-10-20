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
 batch.set(api.doc(host.db,'rooms',code),{name:'자동 연결 점검',owner:host.uid,currentRound:'',kind:'battle',teams:{a:'첫 가족',b:'둘째 가족'},assignments:{},pairings:{},createdAt:api.serverTimestamp()});
 batch.set(api.doc(host.db,'rooms',code,'members',host.uid),{name:'점검 방장',joinedAt:api.serverTimestamp()});
 await batch.commit();
 assert.equal(await joinFamily({api,...guest,code,name:'점검 참가자'}),'점검 참가자');
 assert.equal(await joinFamily({api,...guest,code,name:'다른 이름'}),'점검 참가자');
 assert.equal(await joinFamily({api,...host,code,name:'다른 이름'}),'점검 방장');
 assert.equal((await api.getDocs(api.collection(host.db,'rooms',code,'members'))).size,2);
 console.log('PASS: 방 생성, 신규 참여, 방장/참가자 재접속, 기존 별명 유지');
 await assert.rejects(api.setDoc(api.doc(guest.db,'rooms',code,'members',guest.uid),{name:'변조',joinedAt:api.serverTimestamp()}),e=>e.code==='permission-denied');
 console.log('PASS: 참가자 정보 덮어쓰기 차단');
await api.updateDoc(api.doc(guest.db,'rooms',code,'members',guest.uid),{team:'b'});assert.equal((await api.getDocFromServer(api.doc(host.db,'rooms',code,'members',guest.uid))).data().team,'b');await assert.rejects(api.updateDoc(api.doc(guest.db,'rooms',code,'members',host.uid),{team:'b'}),e=>e.code==='permission-denied');await api.updateDoc(api.doc(host.db,'rooms',code,'members',guest.uid),{team:'a'});assert.equal((await api.getDocFromServer(api.doc(guest.db,'rooms',code,'members',guest.uid))).data().team,'a');console.log('PASS: 참가자 소속 가족 선택, 방장 배정 수정, 타인 팀 변조 차단');
}finally{
 for(const client of clients){try{await deleteUser(client.auth.currentUser);}catch{}await api.terminate(client.db);await deleteApp(client.app);}
}
