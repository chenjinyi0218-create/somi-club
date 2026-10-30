(()=>{
'use strict';
let serial=0;
const speed=140;
const wheelData=[
 {x:372,y:1405,r:98,outer:130,color:'#9b9b9b',occlude:'M 379 1292 L 410 1300 L 375 1433 L 344 1426 Z',part:'front'},
 {x:986,y:1405,r:96,outer:128,color:'#9a9a9a',occlude:'M 795 1330 H 1150 V 1452 H 795 Z',part:'front'},
 {x:1840,y:1485,r:50,outer:76,color:'#57595b',occlude:'M 1828 1375 L 1870 1378 L 1930 1515 L 1894 1540 Z',hiddenBy:[1900,1513,85],part:'rear'},
 {x:1900,y:1513,r:58,outer:81,color:'#595a5b',occlude:'M 1828 1375 L 1870 1378 L 1930 1515 L 1894 1540 Z',part:'rear'},
 {x:2556,y:1479,r:58,outer:82,color:'#555759',occlude:'M 2538 1380 H 2588 L 2583 1493 L 2538 1498 Z',part:'rear'},
 {x:2720,y:1503,r:61,outer:87,color:'#555759',occlude:'M 2647 1380 L 2693 1376 L 2752 1517 L 2717 1538 Z',part:'rear'}
];
function wheelMarkup(w,i,id){
 const uid=id+'-wheel-'+i;
 const hidden=w.hiddenBy?`<circle cx="${w.hiddenBy[0]}" cy="${w.hiddenBy[1]}" r="${w.hiddenBy[2]}" fill="black"/>`:'';
 const r=w.r,ink=w.part==='front'?'#414140':'#303233';
 return `<defs><mask id="${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="3200" height="1600"><circle cx="${w.x}" cy="${w.y}" r="${r}" fill="white"/><path d="${w.occlude}" fill="black"/>${hidden}</mask></defs><g mask="url(#${uid})"><circle cx="${w.x}" cy="${w.y}" r="${r}" fill="${w.color}"/><g data-wheel-index="${i}" transform="rotate(0 ${w.x} ${w.y})"><g transform="translate(${w.x} ${w.y})" fill="none" stroke="${ink}" stroke-width="${w.part==='front'?7:6}" stroke-linecap="round" opacity=".76"><path d="M ${-.43*r} ${-.30*r} Q ${-.63*r} 0 ${-.43*r} ${.25*r}"/><path d="M ${.39*r} ${-.22*r} Q ${.55*r} ${.03*r} ${.36*r} ${.31*r}"/><path d="M ${-.12*r} ${-.66*r} L ${.10*r} ${-.72*r}"/></g></g></g>`;
}
window.createSomiRoadArt=side=>{
 const id='road-scene-'+(++serial),ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.classList.add('story-road');
 svg.setAttribute('viewBox',(side==='right'?1600:0)+' 0 1600 1600');
 svg.setAttribute('role','img');svg.setAttribute('aria-label','앞차가 뒤의 작은 차를 끌고 바퀴가 돌아가며 풍경이 흐르는 여행');
 const vehicle='assets/road-vehicles-20261030.webp',scenery='assets/road-scenery-20261030.webp';
 svg.innerHTML=`<defs>
  <filter id="${id}-text-shadow" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="edge"/><feFlood flood-color="#304b58" flood-opacity=".65" result="ink"/><feComposite in="ink" in2="edge" operator="in" result="stroke"/><feMerge><feMergeNode in="stroke"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <pattern id="${id}-panorama" data-road-panorama="true" patternUnits="userSpaceOnUse" width="6400" height="1600"><image href="${scenery}" width="3200" height="1600"/><image href="${scenery}" width="3200" height="1600" transform="matrix(-1 0 0 1 6400 0)"/></pattern>
  <clipPath id="${id}-front"><rect width="1165" height="1600"/></clipPath>
  <clipPath id="${id}-rear"><rect x="1750" width="1450" height="1600"/></clipPath>
  <clipPath id="${id}-bars"><rect x="1158" y="1120" width="605" height="305"/></clipPath>
 </defs>
 <rect width="3200" height="1600" fill="url(#${id}-panorama)"/>
 <g data-road-front="true"><image href="${vehicle}" width="3200" height="1600" clip-path="url(#${id}-front)"/>${wheelData.slice(0,2).map((w,i)=>wheelMarkup(w,i,id)).join('')}</g>
 <g data-road-bars="true"><image href="${vehicle}" width="3200" height="1600" clip-path="url(#${id}-bars)"/></g>
 <g data-road-rear="true"><image href="${vehicle}" width="3200" height="1600" clip-path="url(#${id}-rear)"/>${wheelData.slice(2).map((w,i)=>wheelMarkup(w,i+2,id)).join('')}</g>
 <image href="assets/road-narration-20261030.svg" width="3200" height="1600" filter="url(#${id}-text-shadow)"/>
 `;
 return svg;
};
window.updateSomiRoadArt=(root,milliseconds,reduce=false)=>{
 const time=reduce?0:milliseconds/1000;
 const travel=(time*speed)%6400;
 const frontY=reduce?0:4*Math.sin(time*9)+1.5*Math.sin(time*17);
 const rearY=reduce?0:5*Math.sin(time*9-.55)+Math.sin(time*20);
 const dx=reduce?0:-8*Math.sin(time*.8);
 root.querySelectorAll('.story-road').forEach(scene=>{
  scene.querySelector('[data-road-panorama]').setAttribute('patternTransform',`translate(${travel} 0)`);
  scene.querySelector('[data-road-front]').setAttribute('transform',`translate(${dx} ${frontY})`);
  scene.querySelector('[data-road-rear]').setAttribute('transform',`translate(${dx} ${rearY})`);
  const shear=(rearY-frontY)/605;
  scene.querySelector('[data-road-bars]').setAttribute('transform',`matrix(1 ${shear} 0 1 ${dx} ${frontY-1158*shear})`);
  scene.querySelectorAll('[data-wheel-index]').forEach(wheel=>{
   const w=wheelData[Number(wheel.dataset.wheelIndex)],angle=-time*speed/w.outer*180/Math.PI;
   wheel.setAttribute('transform',`rotate(${angle} ${w.x} ${w.y})`);
  });
 });
};
})();
