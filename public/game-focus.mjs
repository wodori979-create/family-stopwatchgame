// Presentation only: clocks and result submission continue in their existing modules.
export function setGameFocus(timer,active){
 const game=timer?.closest?.('.game');
 if(!game)return;
 if(game.classList.contains('focus-game')===active)return;
 game.classList.toggle('focus-game',active);
}

// Show an explicit five-count only after switching to the expanded console.
export function setRoundCountdown(timer,wait){
 const face=timer?.parentElement;
 if(!face)return;
 const active=wait>0;
 face.classList.toggle('round-counting',active);
 const counter=face.querySelector('.round-countdown');
 if(counter)counter.textContent=active&&wait<=5000?String(Math.ceil(wait/1000)):'';
}
