export function confirmedMissing(snapshot){return !snapshot.exists()&&!snapshot.metadata?.fromCache&&!snapshot.metadata?.hasPendingWrites;}
