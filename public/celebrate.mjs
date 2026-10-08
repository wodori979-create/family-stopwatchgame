export function celebrate(message) {
 const layer=document.getElementById('celebration');
 layer.replaceChildren();layer.hidden=false;
 const caption=document.createElement('div');caption.className='celebration-caption';caption.textContent=message;layer.append(caption);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const colors=['#d7ef75','#ffd15c','#fc7492','#68d8c4','#9aa6ff'];
  for(let burst=0;burst<3;burst++)for(let i=0;i<24;i++){
   const particle=document.createElement('i');particle.className='firework';
   const angle=i/24*Math.PI*2;const reach=75+Math.random()*70;
   particle.style.setProperty('--x',`${Math.cos(angle)*reach}px`);particle.style.setProperty('--y',`${Math.sin(angle)*reach}px`);
   particle.style.left=`${[24,50,76][burst]}%`;particle.style.top=`${[30,19,34][burst]}%`;
   particle.style.background=colors[i%colors.length];particle.style.animationDelay=`${burst*.22}s`;layer.append(particle);
  }
 }
 clearTimeout(celebrate.timer);celebrate.timer=setTimeout(()=>{layer.hidden=true;layer.replaceChildren();},2800);
}
