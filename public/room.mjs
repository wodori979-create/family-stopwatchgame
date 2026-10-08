// Joining again must preserve an existing member: rules allow creation, not overwrite.
export async function joinFamily({api,db,uid,code,name}) {
  const memberRef=api.doc(db,'rooms',code,'members',uid);
  let existingName=name;
  await api.runTransaction(db,async tx=>{
    const family=await tx.get(api.doc(db,'rooms',code));
    if(!family.exists())throw Error('초대 코드에 해당하는 가족방이 없어요.');
    const member=await tx.get(memberRef);
    if(member.exists())existingName=member.data().name;
    else tx.set(memberRef,{name,joinedAt:api.serverTimestamp()});
  });
  return existingName;
}

// New rounds use the server commit time, never a client-authored future timestamp.
export function roundStartMs(round) {
  const timestamp=round?.startAt;if(!timestamp || typeof timestamp.toMillis!=='function')return null;
  return timestamp.toMillis() + (round.countdownMs || 0);
}
export async function startFamilyRound({api,db,uid,code,targetMs,difficulty='medium'}) {
  const family=await api.getDocFromServer(api.doc(db,'rooms',code));
  if(!family.exists())throw Error('가족방을 찾을 수 없어요. 다시 참여해주세요.');
  if(family.data().owner!==uid)throw Error('방장만 GO로 게임을 시작할 수 있어요.');
  const snapshot=await api.getDocsFromServer(api.collection(db,'rooms',code,'members'));
  const participants=snapshot.docs.map(d=>d.id);
  if(!participants.includes(uid))throw Error('가족방에 다시 참여해주세요.');
  if(participants.length>30)throw Error('한 가족방은 최대 30명까지 플레이할 수 있어요.');
  const ref=api.doc(api.collection(db,'rooms',code,'rounds'));
  const batch=api.writeBatch(db);
  batch.set(ref,{targetMs,difficulty,startAt:api.serverTimestamp(),countdownMs:5000,participants,stopped:[],createdAt:api.serverTimestamp()});
  batch.update(api.doc(db,'rooms',code),{currentRound:ref.id});
  await batch.commit();
  return ref.id;
}

export async function syncServerClock({api,db,code,uid,now=Date.now}) {
 const ref=api.doc(db,'rooms',code,'members',uid);
 const before=now();await api.updateDoc(ref,{clockAt:api.serverTimestamp()});const after=now();
 for(let attempt=0;attempt<3;attempt++){
  const snapshot=await api.getDocFromServer(ref);
  if(!snapshot.exists())throw Error('가족방에 다시 참여해주세요.');
  const timestamp=snapshot.data().clockAt;
  if(!snapshot.metadata?.hasPendingWrites && timestamp && typeof timestamp.toMillis==='function')return timestamp.toMillis()-(before+after)/2;
 }
 throw Error('서버 시간을 아직 확인하지 못했어요. 잠시 후 다시 GO를 눌러주세요.');
}

// Read the committed server time directly, without local snapshot transforms.
export async function syncCommittedClock({projectId,code,uid,token,fetcher=fetch,now=Date.now}) {
 const database='projects/'+projectId+'/databases/(default)';
 const before=now();
 const response=await fetcher('https://firestore.googleapis.com/v1/'+database+'/documents:commit',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({writes:[{transform:{document:database+'/documents/rooms/'+code+'/members/'+uid,fieldTransforms:[{fieldPath:'clockAt',setToServerValue:'REQUEST_TIME'}]},currentDocument:{exists:true}}]})
 });
 const after=now();const body=await response.json();
 if(!response.ok){const error=Error(body.error?.message||'서버 연결에 실패했어요.');error.code=response.status===403?'permission-denied':'unavailable';throw error;}
 const committed=Date.parse(body.writeResults?.[0]?.transformResults?.[0]?.timestampValue||body.commitTime);
 if(!Number.isFinite(committed))throw Error('서버 응답에 시간이 없어요. 다시 시도해주세요.');
 return committed-(before+after)/2;
}
