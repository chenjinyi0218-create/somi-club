(() => {
  'use strict';
  const groups = window.SOMI_EMOJI_GROUPS;
  const nameImages = groups.map(group => ({src:'assets/names/' + group.role + '.svg'}));
  const images = groups.flatMap(group => [group.standing, ...group.stickers]);
  const backgrounds = ['lulu', 'heebong', 'chungman'].map(role => 'assets/emoji/background-' + role + '.png');
  backgrounds.push('assets/animation-stars.png');
  window.SOMI_PAGES.unshift({
    title: '세 친구의 표정', duration: 31.5, intro: true, emojiIntro: true,
    srcs: [...images.map(image => image.src), ...nameImages.map(image => image.src), ...backgrounds]
  });

  window.SOMI_PAGES.unshift({title:'开场',duration:.8,intro:true,splash:true,srcs:['assets/opening-cover.png']});

  const introState = new WeakMap();

  window.renderSomiEmojiIntro = () => {
    const root = document.createElement('div');
    root.className = 'spread emoji-intro';
    root.setAttribute('aria-label', '루루, 희봉, 충만');
    const backgrounds = document.createElement('div');
    backgrounds.className = 'emoji-backgrounds';
    ['lulu','heebong','chungman'].forEach(role => {
      const layer=document.createElement('div');
      layer.className='emoji-background';
      layer.style.backgroundImage='url("assets/emoji/background-'+role+'.png")';
      backgrounds.append(layer);
    });
    root.append(backgrounds);
    groups.forEach((group, groupIndex) => {
      const panel = document.createElement('section');
      panel.className = 'emoji-panel';
      panel.dataset.group = groupIndex;
      panel.setAttribute('aria-label', group.name);
      const left = document.createElement('div');
      const right = document.createElement('div');
      left.className = 'emoji-cloud';
      right.className = 'emoji-cloud';
      const stickerCount = Math.max(20, group.stickers.length);
      Array.from({length: stickerCount}, (_, i) => group.stickers[i % group.stickers.length]).forEach((asset, stickerIndex) => {
        const sticker = new Image();
        sticker.src = asset.src;
        sticker.alt = asset.alt;
        sticker.draggable = false;
        sticker.className = 'emoji-sticker';
        sticker.dataset.order = stickerIndex;
        (stickerIndex % 2 ? right : left).append(sticker);
      });
      const figure = new Image();
      figure.src = group.standing.src;
      figure.alt = group.name;
      figure.draggable = false;
      figure.className = 'emoji-figure';
      const center = document.createElement('div');
      center.className = 'emoji-center';
      const name = document.createElement('span');
      name.className = 'emoji-name';
      const nameArt = new Image();
      nameArt.src = 'assets/names/' + group.role + '.svg';
      nameArt.alt = group.name;
      nameArt.className = 'emoji-name-art';
      name.append(nameArt);
      center.append(figure, name);
      panel.append(left, center, right);
      root.append(panel);
    });
    const finale = document.createElement('div');
    finale.className = 'emoji-finale emoji-walk-finale';
    const video = document.createElement('video');
    video.className = 'emoji-walk-video';
    video.src = 'assets/characters-walk.webm';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-label', '루루, 희봉, 충만이 차례로 걸어 나오는 애니메이션');
    finale.append(video);
    root.append(finale);
    introState.set(root,{key:null,phase:-1,panels:[...root.querySelectorAll('.emoji-panel')].map(panel=>({panel,stickers:[...panel.querySelectorAll('.emoji-sticker')],center:panel.querySelector('.emoji-center'),figure:panel.querySelector('.emoji-figure')})),backgrounds:[...backgrounds.children],finale,video});
    return root;
  };

  window.updateSomiEmojiIntro = (milliseconds, playback = {playing: false, rate: 1}) => {
    const root = document.querySelector('#picture .emoji-intro');
    if (!root) return;
    const phase = Math.min(3, Math.floor(milliseconds / 7000));
    const local = milliseconds - phase * 7000;
    const state=introState.get(root);
    if(!state)return;
    const key=phase+':'+Math.min(20,Math.floor(local/140))+':'+(local>=3200);
    // Update reveal classes only when a visible step changes, rather than every frame.
    if(state.key!==key){
      state.panels.forEach(({panel,stickers,center,figure},groupIndex)=>{
        const active=phase===groupIndex;
        panel.classList.toggle('is-active',active);
        panel.inert=!active;
        panel.setAttribute('aria-hidden',String(!active));
        // Preserve the outgoing artwork during its fade instead of hiding it at once.
        if(active){
          stickers.forEach(sticker=>sticker.classList.toggle('is-visible',local>=Number(sticker.dataset.order)*140));
          center.classList.toggle('is-visible',local>=3200);
          figure.classList.toggle('is-visible',local>=3200);
        }
      });
      state.backgrounds.forEach((layer,i)=>layer.classList.toggle('is-active',i===(phase===3?0:phase)));
      state.finale.classList.toggle('is-active',phase===3);
      state.finale.setAttribute('aria-hidden',String(phase!==3));
      state.key=key;
    }
    const video=state.video;
    const target = phase === 3 ? Math.min(local / 1000, 8.95) : 0;
    if (video.readyState >= 1 && !video.seeking && (phase!==state.phase || (!playback.playing && Math.abs(video.currentTime-target)>.08) || Math.abs(video.currentTime-target)>.8)) video.currentTime=target;
    state.phase=phase;
    video.playbackRate = playback.rate;
    if (phase === 3 && playback.playing && local < 8950) {
      if (video.paused) video.play().catch(() => {});
    } else if (!video.paused) {
      video.pause();
    }
  };
})();
