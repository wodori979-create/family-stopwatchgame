// Original looping chiptune, synthesized locally without audio downloads.
export function setupArcadeMusic({button,host=window,page=document,storage=localStorage}){
 let muted=false;try{muted=storage.getItem('arcade-muted')==='true';}catch{}
 let context,bus,timer,next=0,step=0;
 const beat=60/132/2;
 const melody=[76,0,79,83,81,79,76,74,72,0,76,79,78,76,74,71,69,0,72,76,74,72,69,67,71,74,78,81,79,78,74,0];
 const roots=[48,48,45,43];
 function render(){button.setAttribute('aria-pressed',String(muted));button.setAttribute('aria-label',muted?'배경음악 켜기':'배경음악 음소거');button.title=muted?'배경음악 켜기':'배경음악 음소거';button.innerHTML=muted?'<span aria-hidden="true">♪ ×</span><small>음악 OFF</small>':'<span aria-hidden="true">♫</span><small>음악 ON</small>';}
 function note(pitch,at,duration,type,volume){if(!pitch)return;const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.value=440*2**((pitch-69)/12);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.008);gain.gain.setValueAtTime(volume,at+duration*.65);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(bus);oscillator.start(at);oscillator.stop(at+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
 function schedule(){if(context.state!=='running'||muted||page.hidden)return;while(next<context.currentTime+.15){const index=step%32,root=roots[Math.floor(index/8)];note(melody[index],next,beat*.8,'square',.12);if(index%2===0)note(root,next,beat*1.4,'triangle',.2);if(index%4===2)note(root+19,next,beat*.3,'square',.035);next+=beat;step++;}}
 function stop(){if(timer!==undefined){host.clearInterval(timer);timer=undefined;}if(context){bus.gain.setValueAtTime(0,context.currentTime);context.suspend().catch(()=>{});}}
 async function start(){if(muted||page.hidden)return;const Audio=host.AudioContext||host.webkitAudioContext;if(!Audio){button.disabled=true;button.title='이 브라우저는 배경음악을 지원하지 않아요';return;}try{if(!context){context=new Audio();bus=context.createGain();bus.gain.value=0;bus.connect(context.destination);}await context.resume();if(muted||page.hidden){stop();return;}if(context.state!=='running')return;bus.gain.setTargetAtTime(.35,context.currentTime,.04);if(timer===undefined){next=context.currentTime+.04;schedule();timer=host.setInterval(schedule,50);}}catch{/* A user gesture will retry when autoplay is blocked. */}}
 button.addEventListener('click',event=>{event.stopPropagation();muted=!muted;try{storage.setItem('arcade-muted',String(muted));}catch{}render();if(muted)stop();else void start();});
 const unlock=event=>{if(!button.contains(event.target))void start();};
 page.addEventListener('pointerdown',unlock);page.addEventListener('keydown',unlock);
 page.addEventListener('visibilitychange',()=>{if(page.hidden)stop();else void start();});
 render();void start();
}
const button=document.getElementById('music-toggle');if(button)setupArcadeMusic({button});
