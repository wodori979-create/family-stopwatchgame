import {rankBadge} from './medals.mjs';
import {targetValue,displayedMs,targetHit,rankResults,timingError,difficultyInfo,timeText} from './core.mjs';
import {celebrate} from './celebrate.mjs';
const $=id=>document.getElementById('solo-'+id);
const getDifficulty=()=>$('difficulty').value||'medium';
let running=false,origin=0,target=5000,frame;
function records(){try{return JSON.parse(localStorage.getItem('practice')||'[]');}catch{return [];}}
function render(){const data=rankResults(records().filter(r=>(r.difficulty||'medium')===getDifficulty())).slice(0,5);$('results').classList.toggle('empty',!data.length);$('results').innerHTML=data.length?data.map((r,i)=>`<div class="row">${rankBadge(i)}<div class="name">솔로 도전 · ${difficultyInfo(r.difficulty).label}<small>${timeText(r.elapsedMs,r.difficulty)}초 · 목표 ${timeText(r.targetMs,r.difficulty)}초</small></div><div class="score">${timeText(timingError(r),r.difficulty)}<small>초 오차</small></div></div>`).join(''):'이 난이도의 기록이 없어요. GO를 누르고 도전해보세요.';}
function controls(){['target','minus','plus','go','difficulty'].forEach(id=>$(id).disabled=running);$('stop').disabled=!running;document.querySelectorAll('[data-solo-time]').forEach(e=>e.disabled=running);$('round-label').textContent=running?'PLAYING':'READY';}
function change(value){try{target=targetValue(value,getDifficulty());$('outcome').textContent='같은 숫자에 멈추면 성공이에요!';}catch(e){$('outcome').textContent=e.message;}$('target').value=timeText(target,getDifficulty());document.querySelectorAll('[data-solo-time]').forEach(e=>e.classList.toggle('selected',Number(e.dataset.soloTime)*1000===target));}
function tick(){if(!running)return;const elapsed=performance.now()-origin;$('timer').textContent=timeText(elapsed,getDifficulty());if(elapsed>target+30000){stop();return;}frame=requestAnimationFrame(tick);}
function stop(){if(!running)return;const elapsedMs=displayedMs(performance.now()-origin,getDifficulty());running=false;cancelAnimationFrame(frame);controls();$('timer').textContent=timeText(elapsedMs,getDifficulty());const won=targetHit(elapsedMs,target,getDifficulty());$('hint').textContent=`목표와 ${timeText(Math.abs(elapsedMs-target),getDifficulty())}초 차이`;$('outcome').textContent=won?'축하해요! 목표 시간을 딱 맞췄어요! 🎉':elapsedMs<target?'조금 빨랐어요! 한 번 더 도전해볼까요?':'조금 늦었어요! 한 번 더 도전해볼까요?';const data=records();data.unshift({name:'나',elapsedMs,targetMs:target,difficulty:getDifficulty()});try{localStorage.setItem('practice',JSON.stringify(data.slice(0,30)));}catch{}render();if(won)celebrate('축하해요! 목표 시간을 딱 맞췄어요!');}
function cancel(){if(!running)return;running=false;cancelAnimationFrame(frame);controls();$('hint').textContent='도전이 취소됐어요. 다시 GO를 눌러주세요';}
$('target').onchange=e=>change(e.target.value);$('minus').onclick=()=>change((target-difficultyInfo(getDifficulty()).unit)/1000);$('plus').onclick=()=>change((target+difficultyInfo(getDifficulty()).unit)/1000);document.querySelectorAll('[data-solo-time]').forEach(e=>e.onclick=()=>change(e.dataset.soloTime));
$('go').onclick=()=>{try{target=targetValue($('target').value,getDifficulty());}catch(e){$('outcome').textContent=e.message;return;}document.dispatchEvent(new Event('solo-start'));running=true;origin=performance.now();$('hint').textContent='목표 시간에 STOP!';$('outcome').textContent='집중! 같은 숫자에 멈춰보세요.';controls();tick();};
$('stop').onpointerdown=e=>{if(e.isPrimary&&e.button===0){e.preventDefault();stop();}};$('stop').onclick=stop;
document.querySelectorAll('[data-tab]').forEach(e=>e.addEventListener('click',()=>{if(e.dataset.tab!=='solo')cancel();}));
document.addEventListener('family-round-start',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
render();controls();

$('difficulty').onchange=()=>{render();const info=difficultyInfo(getDifficulty());$('target').step=String(info.unit/1000);target=displayedMs(target,getDifficulty());change(target/1000);$('timer').textContent=timeText(0,getDifficulty());$('minus').setAttribute('aria-label',`목표 시간 ${info.unit/1000}초 줄이기`);$('plus').setAttribute('aria-label',`목표 시간 ${info.unit/1000}초 늘리기`);};
