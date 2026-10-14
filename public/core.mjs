export const difficulties={expert:{label:'최상',digits:3,unit:1},hard:{label:'상',digits:2,unit:10},medium:{label:'중',digits:1,unit:100},easy:{label:'하',digits:0,unit:1000}};
export function difficultyInfo(d='medium'){return difficulties[d]||difficulties.medium;}
export function targetValue(value,d='medium'){const n=Number(value),unit=difficultyInfo(d).unit;if(!Number.isFinite(n)||n<1||n>60||Math.abs(n*1000/unit-Math.round(n*1000/unit))>1e-7)throw Error(`목표 시간은 1~60초, ${(unit/1000).toFixed(difficultyInfo(d).digits)}초 단위로 입력해주세요.`);return Math.round(n*1000/unit)*unit;}
export function displayedMs(ms,d='medium'){const unit=difficultyInfo(d).unit;return Math.round(ms/unit)*unit;}
export function timeText(ms,d='medium'){return (displayedMs(ms,d)/1000).toFixed(difficultyInfo(d).digits);}
export function targetHit(elapsedMs,targetMs,d='medium'){return displayedMs(elapsedMs,d)===targetMs;}
export function timingError(r){return Math.abs(displayedMs(r.elapsedMs,r.difficulty)-r.targetMs);}
export function rankResults(rows){return [...rows].sort((a,b)=>timingError(a)-timingError(b));}
