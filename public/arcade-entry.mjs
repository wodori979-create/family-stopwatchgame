import {invitationRoute} from './invitation-route.mjs';
const entry=document.getElementById('arcade-entry'),shell=document.getElementById('game-shell'),timer=document.getElementById('entry-timer'),start=document.getElementById('entry-start');
let menuShown=false;let frame,finished=false,titleTimer,menuTimer;
function dismiss(){cancelAnimationFrame(frame);clearTimeout(titleTimer);clearTimeout(menuTimer);entry.hidden=true;document.body.classList.remove('arcade-entry-active');shell.inert=false;}
function title(){entry.classList.add('entry-title-visible');start.disabled=false;}
function burst(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const layer=document.getElementById('entry-fireworks');for(let j=0;j<4;j++)for(let i=0;i<24;i++){const p=document.createElement('i');p.className='firework';const a=i/24*Math.PI*2,reach=65+Math.random()*90;p.style.setProperty('--x',Math.cos(a)*reach+'px');p.style.setProperty('--y',Math.sin(a)*reach+'px');p.style.left=[20,78,30,70][j]+'%';p.style.top=[28,30,52,56][j]+'%';p.style.background=['#ff75d4','#7df5ff','#fff395','#b493ff'][j];p.style.animationDelay=j*.13+'s';layer.append(p);}}
function finish(){if(finished)return;finished=true;timer.textContent='5.0';entry.classList.add('entry-hit');burst();titleTimer=setTimeout(title,650);}
if(invitationRoute(location.search)){dismiss();}else{document.body.dataset.entryMode='pending';shell.inert=true;const origin=performance.now();if(matchMedia('(prefers-reduced-motion: reduce)').matches){timer.textContent='5.0';finished=true;entry.classList.add('entry-hit');title();}else{function tick(){const ms=Math.min(5000,(performance.now()-origin)*5);timer.textContent=(Math.floor(ms/100)/10).toFixed(1);if(ms>=5000)finish();else frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);}}
function showModes(){if(menuShown||entry.hidden)return;menuShown=true;entry.hidden=false;entry.scrollTop=0;clearTimeout(menuTimer);document.getElementById('entry-opening').hidden=true;document.getElementById('entry-modes').hidden=false;entry.classList.add('entry-menu-visible');document.querySelector('#entry-modes button[data-entry-mode]').focus();}start.onclick=showModes;document.getElementById('entry-opening').onclick=()=>{if(!start.disabled)showModes();};
for(const button of document.querySelectorAll('#entry-modes button[data-entry-mode]'))button.onclick=()=>{document.body.dataset.entryMode=button.dataset.entryMode;dismiss();window.dispatchEvent(new CustomEvent('arcade-mode-selected',{detail:button.dataset.entryMode}));const target=document.querySelector('[data-tab="'+button.dataset.entryMode+'"]');target.click();document.getElementById('game-home').focus();window.scrollTo({top:0});};

export async function entryMode(){if(document.body.dataset.entryMode==='pending')return new Promise(resolve=>window.addEventListener('arcade-mode-selected',e=>resolve(e.detail),{once:true}));return document.body.dataset.entryMode||null;}

export function showHome(){
 cancelAnimationFrame(frame);clearTimeout(titleTimer);clearTimeout(menuTimer);
 for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
 entry.hidden=false;menuShown=false;shell.inert=true;
 document.body.classList.add('arcade-entry-active');
 window.dispatchEvent(new CustomEvent('arcade-home'));
 showModes();
}
document.getElementById('game-home').onclick=showHome;
