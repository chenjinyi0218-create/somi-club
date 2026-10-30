(()=>{
'use strict';
const pages=window.SOMI_PAGES.filter(page=>page.title!=='书脊'),picture=document.querySelector('#picture'),outgoing=document.querySelector('#outgoing'),counter=document.querySelector('#counter'),pause=document.querySelector('#pause'),bar=document.querySelector('#bar'),audio=document.querySelector('#music'),sound=document.querySelector('#sound'),stage=document.querySelector('#stage');
let index=0,elapsed=0,last=0,paused=false,loading=false,rate=1,request=0,audioEnabled=true,fade=null,turning=false,drag=null;
const imageCache=new Map();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let turnAnimations=[],suppressDragClick=false,transitionBackdrop=null;
const lightDetails={
 'assets/page-05.webp':[[28.6,15.8,.18,.36,'star'],[41.4,27.8,.18,.36,'star'],[51.3,18.4,.18,.36,'star']],
 'assets/page-07.webp':[[7.6,18.1,1.3,2.6,'lamp']],
 'assets/page-39.webp':[[30.1,8.4,.3,.3,'star'],[39.4,5.3,.3,.3,'star'],[46.7,10.5,.3,.3,'star'],[68.3,19,.3,.3,'star'],[19.2,50,1.6,2.5,'lamp'],[90,51,1.8,3,'lamp'],[7.5,50.5,4.2,13,'window']]
};
function addLights(container,src,side){
 if(!lightDetails[src])return;
 const layer=document.createElement('span');
 layer.className='illustration-lights';
 layer.setAttribute('aria-hidden','true');
 lightDetails[src].forEach(([x,y,w,h,kind],i)=>{
  if(side){x=x*2-(side==='right'?100:0);w*=2;if(x<0||x>=100)return;}
  const light=document.createElement('i');
  light.className='art-light '+kind;
  Object.assign(light.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%',animationDelay:(-i*1.7)+'s'});
  layer.append(light);
 });
 container.append(layer);
}
function isCover(page){return page.title==='封面'||page.title==='底面';}
function makeImage(src,alt){
 const image=new Image();
 image.src=src;
 image.alt=alt;
 image.draggable=false;
 return image;
}
function loadImage(src,title){
 const replacements={'assets/page-08.webp':'assets/page-08-white.png','assets/page-09.webp':'assets/page-09-white.png','assets/page-16.webp':'assets/page-16-restored.png','assets/page-20.webp':'assets/page-20-restored.png','assets/page-21.webp':'assets/page-21-restored.png','assets/page-29.webp':'assets/page-29-restored.png'};
 src=replacements[src]||src;
 if(!imageCache.has(src))imageCache.set(src,(async()=>{
  const image=makeImage(src,'SOMI.CLUB · '+title);
  try{await image.decode();return {src,image,ok:true};}
  catch{return {src,image:null,ok:false};}
 })());
 return imageCache.get(src);
}
async function loadPage(page){
 const loaded=await Promise.all(page.srcs.map(src=>loadImage(src,page.title)));
 // Decode the actual nodes that will be painted, not just the cached originals.
 return Promise.all(loaded.map(async item=>{
  const image=item.image?.cloneNode(true)||null;
  if(image){try{await image.decode();}catch{return {...item,image:null,ok:false};}}
  return {...item,image};
 }));
}
function paperTexture(){
 const texture=document.createElement('span');
 texture.className='paper-texture';
 texture.setAttribute('aria-hidden','true');
 return texture;
}
function blankPage(){
 const blank=document.createElement('div');
 blank.className='blank-page';
 blank.setAttribute('aria-label','blank page');
 blank.append(paperTexture());
 return blank;
}
function imagePage(item,side,page){
 const shell=document.createElement('div');
 shell.className='page-art page-art-'+side;
 if(!item||!item.ok){
  shell.classList.add('is-blank');
  shell.append(blankPage());
  return shell;
 }
 if(item.src==='assets/page-09-white.png'){
  shell.classList.add('clock-illustration');
  shell.innerHTML=`<svg class="story-clock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" role="img" aria-label="시간이 흐르는 그림 시계">
   <image href="${item.src}" width="1254" height="1254"/>
   <g fill="white">
    <rect x="608" y="318" width="41" height="231" rx="3"/>
    <rect x="576" y="545" width="112" height="145" rx="8"/>
    <path d="M 536 767 L 600 664 L 632 677 L 568 784 Z"/>
   </g>
   <g transform="translate(2.4648 -78.8817) scale(0.611267606)">
    <g class="clock-hour" data-clock-hand="hour" transform="rotate(0 1030 1135)"><image href="assets/clock-hour-20261030.webp" width="2048" height="2048"/></g>
    <g class="clock-minute" data-clock-hand="minute" transform="rotate(0 1030 1135)"><image href="assets/clock-minute-20261030.webp" width="2048" height="2048"/></g>
    <image href="assets/clock-center-20261030.webp" width="2048" height="2048"/>
   </g>
  </svg>`;
  return shell;
 }
 if(item.src==='assets/page-03.webp'){
  const reveal=document.createElement('div');
  reveal.className='question-reveal question-warm-reveal';
  const button=document.createElement('button');
  button.className='question-handwritten';
  button.type='button';
  button.setAttribute('aria-label','행복은 어디에 있을까? · 따뜻한 빛 다시 보기');
  ['question-ink','question-glow'].forEach(className=>{
   const layer=document.createElement('span');
   layer.className=className;
   layer.setAttribute('aria-hidden','true');
   if(className==='question-glow'){
    const ink=document.createElement('span');
    ink.className='question-warm-ink';
    layer.append(ink);
   }
   button.append(layer);
  });
  reveal.append(button);
  shell.append(reveal);
  return shell;
 }
 const image=item.image||makeImage(item.src,'SOMI.CLUB · '+page.title);
 shell.append(image);
 return shell;
}
function widePage(item,side){
 const shell=document.createElement('div');
 shell.className='page-art wide-art wide-art-'+side;
 if(item&&item.ok&&item.src==='assets/page-14.webp'&&window.createSomiRoadArt){
  shell.classList.add('road-art');
  shell.append(window.createSomiRoadArt(side));
  return shell;
 }
 if(item&&item.ok){
  shell.style.backgroundImage=`url("${item.src}")`;
 }else{
  shell.classList.add('is-blank');
  shell.append(blankPage());
 }
 return shell;
}
function bookPage(side,content,pageNumber){
 const page=document.createElement('section');
 page.className='book-page '+side;
 page.setAttribute('aria-label',side==='left'?'left page':'right page');
 page.append(content,paperTexture());
 const corner=document.createElement('span');
 corner.className='page-corner';
 corner.setAttribute('aria-hidden','true');
 page.append(corner);
 const num=document.createElement('span');
 num.className='page-number';
 num.textContent=String(pageNumber).padStart(2,'0');
 page.append(num);
 return page;
}
function renderInterior(page,items,pageNumber){
 const spread=document.createElement('div');
 spread.className='spread book-spread';
 const book=document.createElement('div');
 const isWide=page.srcs.length===1&&page.width&&page.height&&page.width/page.height>1.45;
 book.className='open-book'+(isWide?' continuous-spread':'');
 if(page.srcs.includes('assets/page-08.webp'))book.classList.add('white-paper');
 const leftContent=isWide?widePage(items[0],'left'):imagePage(items[0],'left',page);
 const rightContent=isWide?widePage(items[0],'right'):(page.srcs.length>1?imagePage(items[1],'right',page):blankPage());
 addLights(leftContent,items[0]?.src,isWide?'left':null);
 addLights(rightContent,(isWide?items[0]:items[1])?.src,isWide?'right':null);
 book.append(bookPage('left',leftContent,pageNumber*2-1),bookPage('right',rightContent,pageNumber*2));
 const gutter=document.createElement('span');
 gutter.className='book-gutter';
 gutter.setAttribute('aria-hidden','true');
 if(!isWide)book.append(gutter);
 spread.append(book);
 return spread;
}
function renderPage(page,items,pageNumber){
 if(page.emojiIntro)return window.renderSomiEmojiIntro();
 if(page.splash){
  const spread=document.createElement('div');
  spread.className='spread opening-splash';
  spread.append(items[0].image);
  return spread;
 }
 if(page.intro){
  const spread=document.createElement('div');
  spread.className='spread intro';
  items.forEach(item=>spread.append(item.ok?item.image:blankPage()));
  return spread;
 }
 if(isCover(page)){
  const backCover=page.title==='底面';
  const spread=document.createElement('div');
  spread.className='spread cover'+(backCover?' back-cover':'');
  const backdrop=document.createElement('div');
  backdrop.className='cover-backdrop';
  backdrop.style.backgroundImage=`url("${page.srcs[0]}")`;
  backdrop.setAttribute('aria-hidden','true');
  spread.append(backdrop);
  const art=items[0]&&items[0].ok?items[0].image:makeImage(page.srcs[0],'SOMI.CLUB · '+page.title);
  const book=document.createElement('button');
  book.className='hardcover';
  book.type='button';
  book.setAttribute('aria-label',backCover?'이전 페이지':'책 펼치기');
  const paper=document.createElement('span');
  paper.className='hardcover-paper';
  paper.setAttribute('aria-hidden','true');
  const spine=document.createElement('span');
  spine.className='hardcover-spine';
  spine.setAttribute('aria-hidden','true');
  const front=document.createElement('span');
  front.className='hardcover-front';
  front.append(art);
  if(page.motionSrc){
   if(reducedMotion.matches){art.src=page.stillSrc;}
   else{
    const video=document.createElement('video');
    video.className='cover-motion';
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.preload='auto';
    video.poster=page.srcs[0];
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.setAttribute('aria-hidden','true');
    video.disablePictureInPicture=true;
    const fallback=()=>{
     video.dataset.failed='true';
     video.hidden=true;
     art.src=page.stillSrc;
    };
    video.addEventListener('loadeddata',()=>video.classList.add('is-ready'),{once:true});
    video.addEventListener('error',fallback,{once:true});
    video.coverFallback=fallback;
    video.src=page.motionSrc;
    front.append(video);
   }
  }
  if(backCover)addLights(front,page.srcs[0]);
  book.append(paper,spine,front);
  spread.append(book);
  if(backCover){
   const restart=document.createElement('button');
   restart.className='restart-book';
   restart.type='button';
   restart.textContent='↻';
   restart.title='다시 읽기';
   restart.setAttribute('aria-label','다시 읽기');
   spread.append(restart);
  }
  return spread;
 }
 return renderInterior(page,items,pageNumber);
}
// Keep the five-second cover in step with the book controls and page turns.
function syncCoverMotion(){
 const video=picture.querySelector('video.cover-motion');
 if(!video||video.dataset.failed)return video;
 video.playbackRate=rate;
 const playing=!paused&&!loading&&!turning&&!document.hidden;
 if(!playing){if(!video.paused)video.pause();return video;}
 if(video.paused&&!video.ended&&!video.coverPlayPending){
  video.coverPlayPending=true;
  video.play().catch(error=>{
   if(error.name!=='AbortError')video.coverFallback?.();
  }).finally(()=>{video.coverPlayPending=false;});
 }
 return video;
}
function updateClockHands(milliseconds){
 const clock=picture.querySelector('.story-clock');
 if(!clock)return;
 const time=reducedMotion.matches?0:milliseconds;
 // Same centre, with the hour hand advancing twelve times more slowly.
 clock.querySelector('[data-clock-hand="minute"]').setAttribute('transform',`rotate(${time*.03} 1030 1135)`);
 clock.querySelector('[data-clock-hand="hour"]').setAttribute('transform',`rotate(${time*.0025} 1030 1135)`);
}
function updateQuestionWarm(milliseconds){
 const scene=picture.querySelector('.question-warm-reveal');
 if(!scene)return;
 const fraction=reducedMotion.matches?1:Math.max(0,Math.min(1,(milliseconds-1000)/3500));
 const amount=fraction*fraction*(3-2*fraction);
 const opacity=String(Math.round(amount*255)/255);
 if(scene.style.getPropertyValue('--warm-opacity')!==opacity)scene.style.setProperty('--warm-opacity',opacity);
}
function resetClock(){
 elapsed=0;
 last=0;
}
function clearTurn(){
 // Remove the old frame before releasing animation fill styles.
 outgoing.style.display='none';
 turnAnimations.forEach(animation=>{animation.onfinish=null;animation.cancel();});
 turnAnimations=[];
 fade=null;
 turning=false;
 stage.classList.remove('is-turning');
 last=0;
 outgoing.style.display='none';
 outgoing.replaceChildren();
 outgoing.classList.remove('cover-opening');
 if(transitionBackdrop){
  stage.append(outgoing);
  outgoing.removeAttribute('style');
  outgoing.style.display='none';
  transitionBackdrop.remove();
  transitionBackdrop=null;
 }
}
function trackTurn(element,keyframes,timing){
 const animation=element.animate(keyframes,timing);
 turnAnimations.push(animation);
 return animation;
}
function scrubTurn(gesture){
 if(!gesture.ready)return;
 const progress=Math.max(0,Math.min(1,gesture.distance/gesture.width));
 turnAnimations.forEach(animation=>animation.currentTime=progress*animation.effect.getTiming().duration);
}
function clearPageCorners(){
 picture.querySelectorAll('.corner-ready').forEach(page=>page.classList.remove('corner-ready'));
}
function releaseTurn(gesture){
 if(!gesture.ready)return;
 scrubTurn(gesture);
 const commit=gesture.released;
 turnAnimations.forEach(animation=>{animation.playbackRate=commit?1:-1;animation.play();});
 fade.onfinish=()=>{
  if(!commit){picture.innerHTML=gesture.old;index=gesture.previousIndex;counter.textContent=String(index+1).padStart(2,'0')+' / '+pages.length;resetClock();}
  clearTurn();
 };
}
async function show(target,gesture=null){
 if(turning||loading)return;
 const ticket=++request;
 loading=true;
 const nextIndex=(target+pages.length)%pages.length;
 const page=pages[nextIndex];
 const items=await loadPage(page);
 if(ticket!==request)return;
 if(fade){fade.cancel();fade=null;}
 outgoing.classList.remove('cover-opening');
 const previousPage=pages[index],backward=target<index;
 const oldBackdrop=getComputedStyle(document.body,'::before');
 const backdropStyle={background:oldBackdrop.background,filter:oldBackdrop.filter,opacity:oldBackdrop.opacity};
 const oldBodyColor=getComputedStyle(document.body).backgroundColor;
 const previousBook=picture.querySelector('.open-book');
 const frameBounds=picture.getBoundingClientRect();
 const pageBounds=previousBook?.querySelector('.book-page.left').getBoundingClientRect();
 const bookGeometry=pageBounds?{left:pageBounds.left-frameBounds.left,top:pageBounds.top-frameBounds.top,width:pageBounds.width*2,height:pageBounds.height}:null;
 clearPageCorners();
 // Keep the live outgoing artwork: serializing a GIF restarts its animation.
 picture.querySelectorAll('.question-reveal').forEach(node=>node.classList.add('is-revealed'));
 const old=picture.innerHTML;
 const oldNodes=[...picture.childNodes];
 // Hold the exact ensemble frame while its whole scene fades out.
 picture.querySelectorAll('video').forEach(video=>video.pause());
 const previousIndex=index;
 if(old){
  outgoing.replaceChildren(...oldNodes);
  outgoing.style.display='grid';
 }
 index=nextIndex;
 syncPageMusic(page);
 picture.replaceChildren(renderPage(page,items,index));
 resetClock();
 if(page.emojiIntro)window.updateSomiEmojiIntro(0);
 loading=false;
 counter.textContent=String(index+1).padStart(2,'0')+' / '+pages.length;
 if(old&&!reducedMotion.matches){
  turning=true;
  stage.classList.add('is-turning');
  const introTransition=page.intro||previousPage.intro;
  if(introTransition){
   // Preserve the outgoing viewport and backdrop while the next layout mounts.
   // This avoids a sudden background/position change between roles, logo and book.
   transitionBackdrop=document.createElement('div');
   transitionBackdrop.className='scene-transition';
   transitionBackdrop.style.backgroundColor=oldBodyColor;
   const background=document.createElement('div');
   background.className='scene-transition-background';
   Object.assign(background.style,backdropStyle);
   transitionBackdrop.append(background,outgoing);
   Object.assign(outgoing.style,{position:'absolute',inset:'auto',left:frameBounds.left+'px',top:frameBounds.top+'px',width:frameBounds.width+'px',height:frameBounds.height+'px'});
   document.body.append(transitionBackdrop);
   if(previousPage.splash||page.splash){
    // Keep the requested 0.8-second hold, followed by a short, gentle handoff.
    fade=trackTurn(transitionBackdrop,[{opacity:1},{opacity:0}],{duration:200,easing:'ease-in-out',fill:'both'});
   }else{
    const dissolve={duration:previousPage.emojiIntro?1600:1100,easing:'ease-in-out',fill:'both'};
    trackTurn(transitionBackdrop,[{opacity:1},{opacity:0,offset:.46},{opacity:0}],dissolve);
    fade=trackTurn(picture,[{opacity:0},{opacity:0,offset:.5},{opacity:1}],dissolve);
   }
  }else if(previousPage.title==='封面'&&!backward){
   outgoing.classList.add('cover-opening');
   const front=outgoing.querySelector('.hardcover-front');
   trackTurn(picture,[{opacity:0},{opacity:1,offset:.72},{opacity:1}],{duration:1000,easing:'ease-in-out',fill:'both'});
   trackTurn(outgoing,[{opacity:1},{opacity:1,offset:.8},{opacity:0}],{duration:1000,fill:'both'});
   fade=trackTurn(front,[
    {transform:'translateZ(8px) rotateY(0deg)',filter:'brightness(1)'},
    {transform:'translateZ(8px) rotateY(-82deg)',filter:'brightness(.86)',offset:.48},
    {transform:'translateZ(8px) rotateY(-176deg)',filter:'brightness(.68)'}
   ],{duration:1000,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  }else if(isCover(page)||isCover(previousPage)){
   const book=picture.querySelector('.hardcover')||outgoing.querySelector('.hardcover');
   const backCover=page.title==='底面';
   trackTurn(outgoing,[{opacity:1},{opacity:0}],{duration:420,fill:'forwards'});
   fade=trackTurn(book,[
    {transform:'rotateY('+(backCover?-78:72)+'deg) rotateZ(0deg) translateY(-8px)'},
    {transform:'rotateY('+(backCover?-28: -22)+'deg) rotateZ(0deg)',offset:.62},
    {transform:'rotateY('+(backCover?9:-9)+'deg) rotateZ('+(backCover?1:-1)+'deg)'}
   ],{duration:backCover?1100:620,easing:'cubic-bezier(.22,.65,.18,1)',fill:'forwards'});
  }else{
   const width=picture.clientWidth,height=picture.clientHeight;
   outgoing.innerHTML='';
   const stationary=document.createElement('div');
   stationary.className='book-stationary';
   stationary.replaceChildren(...oldNodes);
   stationary.style.clipPath=backward?'inset(0 0 0 50%)':'inset(0 50% 0 0)';
   const turnTiming={duration:950,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'};
   // The fixed half stays in place until the turning leaf has landed.
   // Removing it at the midpoint exposes the next spread too early.
   const leaf=document.createElement('div');
   leaf.className='book-leaf'+(backward?' reverse':'');
   const geometry=bookGeometry||{left:0,top:0,width,height};
   leaf.style.left=(geometry.left+(backward?0:geometry.width/2))+'px';
   leaf.style.top=geometry.top+'px';
   leaf.style.width=(geometry.width/2)+'px';
   leaf.style.height=geometry.height+'px';
   function face(markup,back){
    const side=document.createElement('div');
    side.className='book-face'+(back?' book-back':'');
    const content=document.createElement('div');
    content.className='book-content';
    content.style.width=width+'px';
    content.style.height=height+'px';
    content.style.top=(-geometry.top)+'px';
    const leftHalf=backward?!back:back;
    content.style.left=(-geometry.left-(leftHalf?0:geometry.width/2))+'px';
    content.innerHTML=markup;
    side.append(content);
    leaf.append(side);
    // Native backface culling keeps the two faces continuous at 90 degrees.
   }
   face(old,false);
   face(picture.innerHTML,true);
   outgoing.append(stationary,leaf);
   const shadow=document.createElement('span');
   shadow.className='turn-shadow';
   Object.assign(shadow.style,{left:geometry.left+'px',top:geometry.top+'px',width:geometry.width+'px',height:geometry.height+'px'});
   outgoing.prepend(shadow);
   trackTurn(shadow,[{opacity:0},{opacity:.55,offset:.5},{opacity:0}],turnTiming);
   if(backward)shadow.style.transform='scaleX(-1)';
   fade=trackTurn(leaf,[
    {transform:'rotateY(0deg)'},
    {transform:'rotateY('+(backward?180:-180)+'deg)'}
   ],turnTiming);
  }
  if(fade)fade.onfinish=clearTurn;
  if(gesture){
   gesture.old=old;gesture.previousIndex=previousIndex;gesture.ready=true;
   turnAnimations.forEach(animation=>animation.pause());
   scrubTurn(gesture);
   if(gesture.released!==null)releaseTurn(gesture);
  }
 }else{
  turning=false;
  outgoing.style.display='none';
  outgoing.replaceChildren();
 }
 for(const neighbor of [1,-1,2]){
  const upcoming=pages[(index+neighbor+pages.length)%pages.length];
  upcoming.srcs.forEach(src=>loadImage(src,upcoming.title));
 }
}
picture.addEventListener('click',event=>{
 if(event.target.closest('.restart-book')){
  paused=false;pause.textContent='Ⅱ';pause.setAttribute('aria-label','일시정지');pause.setAttribute('aria-pressed','false');
  show(0);return;
 }
 if(event.target.closest('.hardcover')){show(pages[index].title==='底面'?index-1:index+1);return;}
 const warmQuestion=event.target.closest('.question-handwritten');
 if(warmQuestion){resetClock();updateQuestionWarm(0);return;}
 const line=event.target.closest('.question-line');
 if(line){
  const region=line.parentElement;
  region.classList.add('replay');
  void region.offsetWidth;
  region.classList.remove('replay');
  resetClock();
  return;
 }
 if(event.target.closest('button,select'))return;
 const page=event.target.closest('.book-page');
 if(!page)return;
 show(page.classList.contains('right')?index+1:index-1);
});
function toggle(){paused=!paused;pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'재생':'일시정지');pause.setAttribute('aria-pressed',String(paused));syncCoverMotion();}
pause.onclick=toggle;
document.querySelector('#prev').onclick=()=>show(index-1);
document.querySelector('#next').onclick=()=>show(index+1);
document.querySelector('#speed').onchange=e=>{rate=Number(e.target.value);syncCoverMotion();};
function syncPageMusic(page){
 const source=page.intro?'assets/animation-music.wav':'story-music-v3.mp3';
 if(audio.getAttribute('src')===source){audio.volume=.6;return;}
 audio.pause();
 audio.autoplay=audioEnabled;
 audio.volume=.6;
 audio.src=source;
 audio.load();
 if(audioEnabled)startAudio();
}
async function startAudio(){if(!audioEnabled)return;audio.volume=.6;try{await audio.play();}catch{}}
audio.volume=.6;
function soundState(){sound.textContent=audio.paused?'♪':'♫';sound.setAttribute('aria-label',audio.paused?'음악 재생':'음악 일시정지');sound.setAttribute('aria-pressed',String(!audio.paused));}
audio.addEventListener('play',soundState);
audio.addEventListener('pause',soundState);
audio.addEventListener('canplay',()=>{if(audioEnabled&&audio.paused)startAudio();});
sound.onclick=()=>{audioEnabled=audio.paused;audio.autoplay=audioEnabled;audioEnabled?startAudio():audio.pause();};
function retryAudioOnInteraction(event){if(audioEnabled&&audio.paused&&event.target!==sound)startAudio();}
document.addEventListener('pointerdown',retryAudioOnInteraction,{passive:true});
document.addEventListener('keydown',retryAudioOnInteraction);
startAudio();
const full=document.querySelector('#full');
const root=document.documentElement;
const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
const enterFullscreen=root.requestFullscreen||root.webkitRequestFullscreen;
const leaveFullscreen=document.exitFullscreen||document.webkitExitFullscreen;
if(!enterFullscreen)full.hidden=true;
function fullscreenState(){
 const active=Boolean(fullscreenElement());
 full.setAttribute('aria-label',active?'전체 화면 종료':'전체 화면');
 full.setAttribute('aria-pressed',String(active));
 full.title=active?'전체 화면 종료 · Esc':'전체 화면';
}
full.onclick=async()=>{
 try{
  if(fullscreenElement()){if(leaveFullscreen)await leaveFullscreen.call(document);}
  else if(enterFullscreen)await enterFullscreen.call(root);
 }catch{full.title='브라우저 메뉴에서 전체 화면을 선택해 주세요';}
};
document.addEventListener('fullscreenchange',fullscreenState);
document.addEventListener('webkitfullscreenchange',fullscreenState);
fullscreenState();
let hideControlsTimer;
function revealControls(){
 document.body.classList.remove('ui-idle');
 clearTimeout(hideControlsTimer);
 hideControlsTimer=setTimeout(()=>{
  if(!document.querySelector('.controls:hover,.controls:focus-within'))document.body.classList.add('ui-idle');
 },3000);
}
document.addEventListener('pointermove',revealControls,{passive:true});
document.addEventListener('pointerdown',revealControls,{passive:true});
document.addEventListener('keydown',revealControls);
document.querySelector('.controls').addEventListener('pointerleave',revealControls);
document.querySelector('.controls').addEventListener('focusout',revealControls);
revealControls();
stage.addEventListener('click',event=>{
 if(!suppressDragClick||event.detail===0)return;
 suppressDragClick=false;
 event.preventDefault();event.stopPropagation();
},{capture:true});
stage.addEventListener('pointerdown',e=>{
 suppressDragClick=false;
 clearPageCorners();
 if(turning||loading||e.target.closest('button,select')||e.button>0)return;
 const page=e.target.closest('.book-page');
 if(!page)return;
 drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,active:false,distance:0,width:page.clientWidth,released:null,ready:false};
});
stage.addEventListener('pointermove',e=>{
 if(!drag){
  clearPageCorners();
  if(e.pointerType!=='mouse'||turning||loading||reducedMotion.matches)return;
  const page=e.target.closest('#picture .book-page');
  if(!page)return;
  const bounds=page.getBoundingClientRect();
  const edgeDistance=page.classList.contains('left')?e.clientX-bounds.left:bounds.right-e.clientX;
  if(edgeDistance>=0&&edgeDistance<Math.min(72,bounds.width*.25)&&bounds.bottom-e.clientY<72)page.classList.add('corner-ready');
  return;
 }
 if(!drag||drag.id!==e.pointerId)return;
 drag.lastX=e.clientX;
 const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
 if(!drag.active&&Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy)*1.2){
  drag.active=true;drag.direction=dx<0?1:-1;
  stage.setPointerCapture(e.pointerId);
  if(!reducedMotion.matches&&!isCover(pages[(index+drag.direction+pages.length)%pages.length]))show(index+drag.direction,drag);
 }
 if(drag.active){drag.distance=Math.max(0,-dx*drag.direction);scrubTurn(drag);}
});
stage.addEventListener('pointerleave',clearPageCorners);
stage.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const gesture=drag;
 const shouldTurn=drag.active&&drag.distance>Math.min(90,drag.width*.25);
 drag=null;
 if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
 if(gesture.active){
  suppressDragClick=true;
  gesture.released=shouldTurn;
  if(gesture.ready)releaseTurn(gesture);
  else if(!loading&&shouldTurn)show(index+gesture.direction);
 }
});
stage.addEventListener('pointercancel',()=>{if(drag){drag.released=false;if(drag.ready)releaseTurn(drag);}drag=null;});
document.addEventListener('keydown',e=>{if(e.target.closest('button,select'))return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.key==='ArrowRight')show(index+1);if(e.key==='ArrowLeft')show(index-1);});
document.addEventListener('visibilitychange',()=>{last=0;syncCoverMotion();});
function tick(now){
 const coverVideo=syncCoverMotion();
 const logo=pages[index].intro&&!pages[index].emojiIntro;
 const ending=pages[index].title==='底面';
 if(last&&!paused&&!loading&&(!turning||logo)&&!document.hidden){
  elapsed+=Math.min(now-last,250)*(logo?1:rate);
  if((logo||ending)&&!audio.paused)audio.volume=.6*Math.max(0,Math.min(1,(pages[index].duration*1000-elapsed)/(ending?3000:2000)));
  if(coverVideo&&!coverVideo.dataset.failed&&coverVideo.readyState>=2)elapsed=coverVideo.currentTime*1000;
  if(elapsed>=pages[index].duration*1000||coverVideo?.ended)show(index+1);
 }
 last=now;
 if(pages[index].srcs.includes('assets/page-14.webp'))window.updateSomiRoadArt?.(picture,elapsed,reducedMotion.matches);
 updateClockHands(elapsed);
 updateQuestionWarm(elapsed);
 if(pages[index].emojiIntro)window.updateSomiEmojiIntro(elapsed,{playing:!paused&&!loading&&!turning&&!document.hidden,rate});
 bar.style.transform=`scaleX(${Math.min(1,elapsed/(pages[index].duration*1000))})`;
 requestAnimationFrame(tick);
}
show(0);
requestAnimationFrame(tick);
})();

