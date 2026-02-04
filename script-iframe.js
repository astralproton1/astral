// script-iframe.js
// Maneja abrir juegos en un iframe fullscreen y la barra lateral derecha
(function(){
  const overlay = document.getElementById('game-iframe-overlay');
  const iframe = document.getElementById('game-iframe');
  const toggleArrow = document.getElementById('iframe-toggle-arrow');
  const sidebar = document.getElementById('iframe-sidebar');
  const sidebarClose = document.getElementById('iframe-close-sidebar');
  const sidebarExitBtn = document.getElementById('sidebar-exit-btn');
  const helpEl = document.getElementById('iframe-help');
  const helpCheckbox = document.getElementById('help-hide-checkbox');
  const helpDismissBtn = document.getElementById('help-dismiss');
  let previouslyPlaying = [];
  // Instructions modal elements (appears before actually loading a game)
  const instrModal = document.getElementById('game-instructions-modal');
  const instrAudio = document.getElementById('instructions-audio');
  const instrVideo = document.getElementById('instr-video');
  const instrLogo = document.getElementById('instr-logo');
  const instrTitle = document.getElementById('instr-game-title');
  const instrTopText = document.getElementById('instr-top-text');
  const instrBottomText = document.getElementById('instr-bottom-text');
  const instrTimerEl = document.getElementById('instr-timer');
  const instrStartBtn = document.getElementById('instr-start-btn');
  const instrCancelBtn = document.getElementById('instr-cancel-btn');
  let _instrCountdown = null;
  // Bandera para indicar si la pantalla de instrucciones está abierta
  window.__astral_instructionsOpen = false;
  // storage for per-game instruction overrides
  window.__astral_gameInstructions = window.__astral_gameInstructions || new Map();
  // helper to register per-game instructions by URL or key
  window.setGameInstructions = function(key, data){
    try{ window.__astral_gameInstructions.set(String(key), Object.assign({}, data));
      try{ console.info('setGameInstructions', String(key), data && (data.title || data.video ? 'hasData' : 'noData')); }catch(e){}
    }catch(e){ console.error('setGameInstructions failed', e); }
  }
  // flush any pending registrations made before this script loaded
  try{
    if(Array.isArray(window.__pendingGameInstructions) && window.__pendingGameInstructions.length){
      window.__pendingGameInstructions.forEach(item=>{ try{ const [k,d]=item; window.setGameInstructions(k,d); }catch(e){} });
      window.__pendingGameInstructions = [];
    }
  }catch(e){}

  function pauseAllAudio(){
    document.querySelectorAll('audio').forEach(a=>{try{a.pause()}catch(e){}});
  }

  window.openGameInIframe = function(url){
    if(!url) return;
    // allow relative paths: resolve relative to current location
    try{ url = new URL(url, location.href).href }catch(e){}
    // record playing audio, then pause all; instructions audio will be started separately
    try{
      // Capture which audio elements were playing before opening iframe, but
      // exclude the instructions audio since it is only for the modal and
      // should not be resumed when exiting the game.
      previouslyPlaying = Array.from(document.querySelectorAll('audio'))
        .filter(a=>!a.paused)
        .map(a=>a.id)
        .filter(Boolean)
        .filter(id=> id !== 'instructions-audio');
    }catch(e){ previouslyPlaying = []; }
    pauseAllAudio();
    // If caller provided instructions data via second arg, show modal first
    const options = (arguments && arguments[1]) ? arguments[1] : {};
    // prefer explicit passed data, but if it's missing fields try to merge with registry data (by url, basename, or gameId)
    let passed = options.instructionsData ? Object.assign({}, options.instructionsData) : null;
    let registryData = null;
    try{
      // Attempt lookup using several candidate keys, prefer most-specific first
      const candidates = [];
      const fullUrlKey = String(url);
      candidates.push(fullUrlKey);
      try{
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        const dirKey = parts.length >= 2 ? parts.slice(-2).join('/') : parts.join('/');
        if(dirKey) candidates.push(dirKey);
        // file basename (but avoid plain 'index.html' unless it's the only option)
        const file = parts.length ? parts[parts.length-1] : '';
        if(file) candidates.push(file);
        // also include last-two as 'folder/file' if longer paths
        if(parts.length >= 3) candidates.push(parts.slice(-3).join('/'));
      }catch(e){}

      // include optional hint keys from options (gameId or id) - añadir al PRINCIPIO para priorizar
      if(options && (options.gameId || options.id)) {
        const gid = String(options.gameId || options.id);
        candidates.unshift(gid); // Añadir al principio para priorizar
        candidates.unshift('game-' + gid); // También probar con prefijo
      }

      // normalize and dedupe candidates
      const seen = new Set();
      const cleanCandidates = candidates.map(String).filter(Boolean).map(s=>s.trim()).filter(s=>{ if(seen.has(s)) return false; seen.add(s); return true; });

      let matchedKey = null;
      for(const k of cleanCandidates){
        try{
          if(window.__astral_gameInstructions && window.__astral_gameInstructions.get(k)){
            registryData = window.__astral_gameInstructions.get(k);
            matchedKey = k;
            break;
          }
        }catch(e){}
      }

      try{ console.info('instruction lookup candidates', cleanCandidates, 'matchedKey', matchedKey); }catch(e){}
    }catch(e){}
    // Fallback: try lookup by provided gameId (registered via game-instructions-list.js)
    if(!registryData && options && (options.gameId || options.id)){
      try{
        const k = String(options.gameId || options.id);
        if(window.__astral_gameInstructions && window.__astral_gameInstructions.get(k)) registryData = window.__astral_gameInstructions.get(k);
      }catch(e){}
    }

    // merge: prefer explicit passed values but don't let empty strings overwrite registry
    let instrData = null;
    if(passed && registryData){
      // clean passed: remove keys that are empty strings or undefined so registry values remain
      const cleaned = {};
      Object.keys(passed).forEach(k=>{
        const v = passed[k];
        if(v === null || v === undefined) return;
        // keep numbers (including 0), non-empty strings, and booleans
        if(typeof v === 'number' || typeof v === 'boolean') { cleaned[k]=v; return; }
        if(typeof v === 'string' && v.trim() !== '') { cleaned[k]=v; }
      });
      instrData = Object.assign({}, registryData, cleaned);
    } else if(passed) instrData = passed;
    else if(registryData) instrData = registryData;
      try{ if(registryData) console.info('using registered instructions for', (options && options.gameId) ? options.gameId : (url || 'unknown')); }catch(e){}
    const skipInstructions = options.skipInstructions === true;

    const proceedToOpen = async ()=>{
      iframe.src = url;
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      // default: sidebar closed
      sidebar.classList.remove('open');
      toggleArrow.classList.remove('open');
      // show help dialog unless user opted out
      try{
        const hideKey = 'Astral_hide_game_help';
        const hide = localStorage.getItem(hideKey) === '1';
        if(helpEl && !hide){
          helpEl.style.display = 'block';
          if(toggleArrow){ toggleArrow.classList.add('attention'); setTimeout(()=>{ toggleArrow.classList.remove('attention'); }, 4200); }
        }
      }catch(e){}
    };

    (async ()=>{
      try{
        if(!skipInstructions && instrData){
          const res = await showGameInstructions(instrData);
          if(res === 'cancel'){
            // user cancelled; resume previous audio and abort
            try{ previouslyPlaying.forEach(id=>{ const a = document.getElementById(id); if(a) a.play().catch(()=>{}); }); }catch(e){}
            return;
          }
          // if result is 'start' or 'timeout' proceed
        }
      }catch(e){ console.error('instructions error', e); }
      proceedToOpen();
    })();
  }

  // Renderiza controles como HTML simple
  function renderControlsHTML(controls) {
    if (!controls || !Array.isArray(controls) || controls.length === 0) return '';
    
    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    
    controls.forEach(ctrl => {
      html += '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">';
      
      if (ctrl.mouse) {
        // Mouse: texto simple en recuadro
        const mouseText = ctrl.mouse === 'left' ? 'Click Izq' : 
                          ctrl.mouse === 'right' ? 'Click Der' : 
                          ctrl.mouse === 'wheel' ? 'Rueda' : 'Mouse';
        html += '<span style="display: inline-block; background: linear-gradient(180deg, #7b5bff, #5b3bff); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.9em; font-weight: 700; border: 1px solid #888; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 0.5px;">' + mouseText + '</span>';
      } else if (ctrl.keys && Array.isArray(ctrl.keys)) {
        // Multiples teclas
        html += '<span style="display: inline-flex; gap: 2px;">';
        ctrl.keys.forEach(k => {
          html += '<span style="display: inline-block; background: linear-gradient(180deg, #0f6cff, #0a4cff); color: #fff; padding: 4px 8px; border-radius: 4px; font-family: Oswald, Arial, sans-serif; font-size: 0.9em; font-weight: 700; border: 1px solid #666; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 0.5px;">' + k + '</span>';
        });
        html += '</span>';
      } else if (ctrl.key) {
        // Tecla simple
        const wideStyle = ctrl.wide ? 'padding: 4px 16px; min-width: 60px; text-align: center;' : '';
        html += '<span style="display: inline-block; background: linear-gradient(180deg, #0f6cff, #0a4cff); color: #fff; padding: 4px 8px; border-radius: 4px; font-family: Oswald, Arial, sans-serif; font-size: 0.9em; font-weight: 700; border: 1px solid #666; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 0.5px; ' + wideStyle + '">' + ctrl.key + '</span>';
      }
      
      html += '<span style="color: #fff; font-size: 1em; line-height: 1.4;">' + (ctrl.desc || '') + '</span>';
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }

  // Show the instructions modal. {logo, title, instructions, instructions2, video, timerSecs}
  function showGameInstructions(data){
    return new Promise((resolve)=>{
      if(!instrModal) return resolve('start');
      try{ console.info('showGameInstructions called with data:', data); }catch(e){}
      // populate fields
      // Always show the site's logo file (literal logo.png)
      try{ instrLogo && (instrLogo.src = 'logo.png'); }catch(e){}
      try{ instrTitle && (instrTitle.textContent = data.title || data.name || document.title || 'Juego'); }catch(e){}
      try{
        if (instrTopText) {
          if (data.controls && Array.isArray(data.controls) && data.controls.length > 0) {
            instrTopText.innerHTML = renderControlsHTML(data.controls);
          } else {
            instrTopText.textContent = data.instructions || data.topText || '';
          }
        }
      }catch(e){}
      try{ instrBottomText && (instrBottomText.textContent = data.instructions || data.bottomText || ''); }catch(e){}
      // set video src or show placeholder. Ensure muted before attempting autoplay (browsers require it)
      const placeholder = document.getElementById('instr-video-placeholder');
      const overlayPlay = document.getElementById('instr-overlay-play');
      const playBtn = document.getElementById('instr-play-btn');
      const muteBtn = document.getElementById('instr-mute-btn');
      const skipBtn = document.getElementById('instr-skip-btn');
      const countdownFill = document.getElementById('instr-countdown-fill');
      let userPaused = false;
      let totalSecs = (typeof data.timerSecs === 'number') ? data.timerSecs : (parseInt(data.timerSecs) || 150);
      // helper to update progress fill
      function updateFill(remaining){ try{ if(countdownFill && totalSecs>0){ const pct = Math.max(0, Math.min(100, Math.round(((totalSecs - remaining)/totalSecs)*100))); countdownFill.style.width = pct + '%'; } }catch(e){} }

      if(data.video){
        try{
          if(placeholder) placeholder.style.display = 'none';
          if(instrVideo){
            instrVideo.style.display = 'block';
            instrVideo.src = data.video;
            instrVideo.alt = data.title || 'Vista previa del juego';
            // Image (WebP) shows immediately
            if(overlayPlay) overlayPlay.style.display = 'none';
          }
        }catch(e){}
      } else {
        try{ if(placeholder) placeholder.style.display = 'flex'; if(instrVideo){ instrVideo.removeAttribute('src'); instrVideo.style.display = 'none'; } }catch(e){}
      }
      // timer
      let remaining = (typeof data.timerSecs === 'number') ? data.timerSecs : (parseInt(data.timerSecs) || 150);
      // Show remaining time as seconds only (e.g. "120s")
      function fmt(s){ return `${s}s`; }
      try{ instrTimerEl && (instrTimerEl.textContent = fmt(remaining)); }catch(e){}

      // show with a short fade-to-black transition (1-3s) before revealing modal
      const fadeSecs = (typeof data.fadeSecs === 'number') ? Math.max(0.4, Math.min(3, data.fadeSecs)) : 1.5;
      const overlayFade = document.createElement('div');
      overlayFade.id = 'instr-fade-overlay';
      overlayFade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:100004;transition:opacity ' + (fadeSecs/2) + 's ease;pointer-events:none';
      document.body.appendChild(overlayFade);
      // trigger fade in
      requestAnimationFrame(()=>{ overlayFade.style.opacity = '1'; });
      // show modal shortly after fade starts so user sees a smooth transition
      setTimeout(()=>{
        instrModal.classList.remove('hidden');
        instrModal.classList.add('show');
        instrModal.setAttribute('aria-hidden','false');
        document.body.classList.add('instr-open');
        window.__astral_instructionsOpen = true;
      }, Math.round(fadeSecs * 400));
      // remove overlay after full fadeSecs
      const removeOverlay = ()=>{ try{ overlayFade.style.opacity = '0'; setTimeout(()=>{ try{ if(overlayFade && overlayFade.parentNode) overlayFade.parentNode.removeChild(overlayFade); }catch(e){} }, Math.round((fadeSecs/2)*1000)); }catch(e){} };
      setTimeout(removeOverlay, Math.round(fadeSecs * 1000));

      // play instructions audio (allow play to fail silently)
      try{ if(instrAudio){ instrAudio.currentTime = 0; instrAudio.play().catch(()=>{}); } }catch(e){}

      // start countdown (pausable if user pauses the video)
      if(_instrCountdown) clearInterval(_instrCountdown);
      updateFill(remaining);
      function startCountdown(){ if(_instrCountdown) clearInterval(_instrCountdown); _instrCountdown = setInterval(()=>{ if(!userPaused){ remaining--; try{ instrTimerEl && (instrTimerEl.textContent = fmt(remaining)); }catch(e){} updateFill(remaining); if(remaining <= 0){ clearInterval(_instrCountdown); _instrCountdown = null; closeAndResolve('timeout'); } } }, 1000); }
      startCountdown();

      // Closing helper (animate hide and wait for transition end)
      function closeAndResolve(result){
        // Helper that performs the actual hide/cleanup and resolves
        const doCloseCleanup = ()=>{
          instrModal.classList.remove('show');
          instrModal.setAttribute('aria-hidden','true');
          window.__astral_instructionsOpen = false;
          // after transition ends, add hidden to remove from flow
          const onEnd = (e)=>{ if(e && e.target !== instrModal) return; instrModal.removeEventListener('transitionend', onEnd); instrModal.classList.add('hidden'); document.body.classList.remove('instr-open'); };
          instrModal.addEventListener('transitionend', onEnd);
          // stop media
          try{ if(instrAudio){ instrAudio.pause(); instrAudio.currentTime = 0; } }catch(e){}
          try{
            if(instrVideo){ instrVideo.removeAttribute('src'); instrVideo.style.display = 'none'; }
            if(typeof overlayPlay !== 'undefined' && overlayPlay) overlayPlay.style.display = 'none';
            // remove any transition overlay if still present
            try{ const of = document.getElementById('instr-fade-overlay'); if(of && of.parentNode){ of.parentNode.removeChild(of); } }catch(e){}
            try{ if(typeof playBtn !== 'undefined' && playBtn && playBtnHandler) playBtn.removeEventListener('click', playBtnHandler); }catch(e){}
            try{ if(typeof overlayPlay !== 'undefined' && overlayPlay && overlayPlayHandler) overlayPlay.removeEventListener('click', overlayPlayHandler); }catch(e){}
            try{ if(typeof muteBtn !== 'undefined' && muteBtn && muteHandler) muteBtn.removeEventListener('click', muteHandler); }catch(e){}
            try{ if(typeof skipBtn !== 'undefined' && skipBtn && skipHandler) skipBtn.removeEventListener('click', skipHandler); }catch(e){}
            try{ if(instrVideo && videoPauseHandler) instrVideo.removeEventListener('pause', videoPauseHandler); }catch(e){}
            try{ if(instrVideo && videoPlayHandler) instrVideo.removeEventListener('play', videoPlayHandler); }catch(e){}
          }catch(e){}
          if(_instrCountdown){ clearInterval(_instrCountdown); _instrCountdown = null; }
          // detach handlers
          instrModal.removeEventListener('click', modalClickHandler);
          document.removeEventListener('keydown', modalKeyHandler);
          resolve(result);
        };

        // If we're proceeding into the game (start or timeout), perform a fade-to-black
        // so the transition is smooth. If an overlay already exists reuse it, otherwise create one.
        if(result === 'start' || result === 'timeout'){
          try{
            const existing = document.getElementById('instr-fade-overlay');
            const outFade = existing || (function(){ const d = document.createElement('div'); d.id = 'instr-fade-overlay'; d.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;z-index:100004;transition:opacity ' + (fadeSecs/2) + 's ease;pointer-events:none'; document.body.appendChild(d); return d; })();
            // trigger fade to black
            requestAnimationFrame(()=>{ outFade.style.opacity = '1'; });
            // wait full fadeSecs before closing so the user sees the transition
            setTimeout(()=>{
              // cleanup modal and listeners, then fade the overlay away and resolve
              doCloseCleanup();
              try{ outFade.style.opacity = '0'; setTimeout(()=>{ try{ if(outFade && outFade.parentNode) outFade.parentNode.removeChild(outFade); }catch(e){} }, Math.round((fadeSecs/2)*1000)); }catch(e){}
            }, Math.round(fadeSecs * 1000));
            return;
          }catch(e){ /* fallthrough to immediate close */ }
        }

        // Default: close immediately without extra transition
        doCloseCleanup();
      }

      // Delegated click handler so buttons work even if elements are re-rendered
      const modalClickHandler = (ev)=>{
        const t = ev.target;
        if(!t) return;
        if(t.closest && t.closest('#instr-start-btn')){ closeAndResolve('start'); }
        else if(t.closest && t.closest('#instr-cancel-btn')){ closeAndResolve('cancel'); }
      };
      // Keyboard shortcuts
      const modalKeyHandler = (ev)=>{
        if(ev.key === 'Escape') { ev.preventDefault(); closeAndResolve('cancel'); }
        if(ev.key === 'Enter') { ev.preventDefault(); closeAndResolve('start'); }
      };

      // Attach delegated handlers (safe add/remove across multiple calls)
      instrModal.addEventListener('click', modalClickHandler);
      document.addEventListener('keydown', modalKeyHandler);

      // Play / Pause control (not needed for images, but keep handlers simple)
      function togglePlay(){ try{ if(!instrVideo) return; if(instrVideo.src){ userPaused = !userPaused; if(userPaused){ startCountdown(); } } }catch(e){} }
      // Attach named handlers so we can detach them on close
      const playBtnHandler = (e)=>{ e.stopPropagation(); togglePlay(); };
      const overlayPlayHandler = (e)=>{ e.stopPropagation(); togglePlay(); };
      const muteHandler = (e)=>{ e.stopPropagation(); };
      const skipHandler = (e)=>{ e.stopPropagation(); closeAndResolve('start'); };
      const videoPauseHandler = ()=>{ userPaused = true; };
      const videoPlayHandler = ()=>{ userPaused = false; startCountdown(); };

      if(playBtn) playBtn.addEventListener('click', playBtnHandler);
      if(overlayPlay) overlayPlay.addEventListener('click', overlayPlayHandler);
      if(muteBtn) muteBtn.addEventListener('click', muteHandler);
      if(skipBtn) skipBtn.addEventListener('click', skipHandler);
      // Images don't have pause/play events, so no need to attach them

      // If buttons exist, give them basic focus handling for accessibility
      try{ if(instrStartBtn) instrStartBtn.setAttribute('aria-pressed','false'); }catch(e){}
      try{ if(instrCancelBtn) instrCancelBtn.setAttribute('aria-pressed','false'); }catch(e){}

    });
  }
  // expose API for external use
  window.showGameInstructions = showGameInstructions;

  window.closeGameIframe = function(){
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    // stop iframe
    try{ iframe.src = 'about:blank'; }catch(e){}
    sidebar.classList.remove('open');
    toggleArrow.classList.remove('open');
    // resume previously playing audio
    try{
      // Defensive: make sure instructions audio is stopped in case it wasn't paused earlier
      try{ const ia = document.getElementById('instructions-audio'); if(ia){ ia.pause(); ia.currentTime = 0; } }catch(e){}
      // also ensure instruction preview image is cleared (defensive)
      try{ const iv = document.getElementById('instr-video'); if(iv){ if(iv.getAttribute('src')){ iv.removeAttribute('src'); iv.style.display='none'; } } }catch(e){}

      if(Array.isArray(previouslyPlaying) && previouslyPlaying.length){
        // Ensure we don't accidentally resume modal-only audio
        previouslyPlaying = previouslyPlaying.filter(id => id !== 'instructions-audio');
        previouslyPlaying.forEach(id=>{
          try{ const a = document.getElementById(id); if(a && a.pause !== undefined){ a.play().catch(()=>{}); } }catch(e){}
        });
      } else {
        // fallback: try to play title-music or bg-music if present
        try{ const t = document.getElementById('title-music'); if(t) t.play().catch(()=>{}); }catch(e){}
        try{ const b = document.getElementById('bg-music'); if(b) b.play().catch(()=>{}); }catch(e){}
      }
    }catch(e){}
    previouslyPlaying = [];
    if(helpEl) helpEl.style.display = 'none';
  }

  function toggleIframeSidebar(){
    const open = sidebar.classList.toggle('open');
    toggleArrow.classList.toggle('open', open);
    sidebar.setAttribute('aria-hidden', open? 'false' : 'true');
  }

  // Event listeners
  sidebarExitBtn && sidebarExitBtn.addEventListener('click', ()=>{ window.closeGameIframe(); });
  toggleArrow && toggleArrow.addEventListener('click', (e)=>{ e.stopPropagation(); toggleIframeSidebar(); });
  sidebarClose && sidebarClose.addEventListener('click', ()=>{ sidebar.classList.remove('open'); toggleArrow.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); });

  // Fullscreen controls: attempt to put the actual iframe in fullscreen
  // Note: when an element (the iframe) is fullscreen, only that element and its
  // descendants are visible in fullscreen. That means controls outside the iframe
  // (like the arrow or sidebar) will NOT be visible while the iframe is fullscreen.
  // If you need the arrow/sidebar visible while the game is fullscreen, we must
  // fullscreen the overlay/wrapper instead (previous behavior). Here we try iframe
  // fullscreen first, with a fallback to overlay fullscreen.
  const fsEnterBtn = document.getElementById('sidebar-fullscreen-btn');
  const fsExitBtn = document.getElementById('sidebar-exit-fullscreen-btn');

  async function enterIframeFullscreen(){
    // Determine preference (some users may want overlay-first to keep UI visible)
    const pref = (window.__ASTRAL_SETTINGS && window.__ASTRAL_SETTINGS.iframeFs) ? window.__ASTRAL_SETTINGS.iframeFs : 'iframe';
    // If overlay preferred, try overlay first
    if(pref === 'overlay'){
      try{
        const el = overlay || document.documentElement;
        if(el.requestFullscreen) await el.requestFullscreen();
        else if(el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if(el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if(el.msRequestFullscreen) await el.msRequestFullscreen();
        return 'overlay';
      }catch(e){ console.warn('overlay fullscreen failed, will try iframe fullscreen', e); }
    }
    // Default: try to fullscreen the iframe itself first (preferred for true fullscreen of the game).
    try{
      if(iframe && iframe.requestFullscreen){
        await iframe.requestFullscreen();
        return 'iframe';
      } else if(iframe && iframe.webkitRequestFullscreen){
        await iframe.webkitRequestFullscreen();
        return 'iframe';
      }
    }catch(e){
      console.warn('iframe.requestFullscreen failed, will fallback to overlay fullscreen', e);
    }
    // fallback: fullscreen the overlay so controls stay visible
    try{
      const el = overlay || document.documentElement;
      if(el.requestFullscreen) await el.requestFullscreen();
      else if(el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if(el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if(el.msRequestFullscreen) await el.msRequestFullscreen();
      return 'overlay';
    }catch(e){ console.error('enterOverlayFullscreen failed', e); }
    return null;
  }

  async function exitAnyFullscreen(){
    try{
      if(document.exitFullscreen) await document.exitFullscreen();
      else if(document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if(document.mozCancelFullScreen) await document.mozCancelFullScreen();
      else if(document.msExitFullscreen) await document.msExitFullscreen();
    }catch(e){ console.error('exitFullscreen failed', e); }
  }

  // Wire buttons if present
  if(fsEnterBtn) fsEnterBtn.addEventListener('click', (e)=>{ e.stopPropagation(); enterIframeFullscreen(); });
  if(fsExitBtn) fsExitBtn.addEventListener('click', (e)=>{ e.stopPropagation(); exitAnyFullscreen(); });

  // Keep sidebar button states in sync with fullscreen changes
  document.addEventListener('fullscreenchange', ()=>{
    const elFs = document.fullscreenElement;
    try{
      const isIframeFs = elFs === iframe;
      const isOverlayFs = elFs === overlay;
      const isAnyFs = !!elFs;
      if(isAnyFs){
        if(fsExitBtn) fsExitBtn.style.display = 'inline-block';
        if(fsEnterBtn) fsEnterBtn.style.display = 'none';
      } else {
        if(fsExitBtn) fsExitBtn.style.display = 'none';
        if(fsEnterBtn) fsEnterBtn.style.display = 'inline-block';
      }
      // Informational: if iframe is fullscreen, controls outside iframe won't be visible
      if(isIframeFs){
        console.info('Iframe is fullscreen. Sidebar/arrow outside iframe will not be visible while in this state.');
      }
    }catch(e){console.error(e)}
  });

  // Note: don't allow ESC to close — exit only via menu

  // Click delegation for games grid: intercept links or elements with data-game-url inside #games-grid
  document.addEventListener('click', (e)=>{
    const withinGames = e.target.closest('#games-grid');
    if(!withinGames) return;
    const el = e.target.closest('[data-game-url], a');
    if(!el) return;
    // find url: prefer dataset
    let url = el.dataset && el.dataset.gameUrl ? el.dataset.gameUrl : el.getAttribute('href');
    if(!url) return;
    // ignore anchors and fragment links
    if(url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('javascript:')) return;
    e.preventDefault();
    // collect optional instruction metadata from the element's dataset
    const instr = {
      logo: el.dataset && el.dataset.gameLogo ? el.dataset.gameLogo : (el.querySelector('img') ? (el.querySelector('img').src || '') : ''),
      title: el.dataset && (el.dataset.gameTitle || el.dataset.gameName) ? (el.dataset.gameTitle || el.dataset.gameName) : (el.getAttribute('title') || el.textContent.trim().slice(0,120)),
      instructions: el.dataset && el.dataset.gameInstructions ? el.dataset.gameInstructions : '',
      instructions2: el.dataset && el.dataset.gameInstructions2 ? el.dataset.gameInstructions2 : '',
      video: el.dataset && el.dataset.gameVideo ? el.dataset.gameVideo : '',
      timerSecs: el.dataset && el.dataset.gameTimer ? parseInt(el.dataset.gameTimer) : undefined
    };
    window.openGameInIframe(url, { instructionsData: instr });
  });

  // Help dialog listeners
  if(helpDismissBtn){
    helpDismissBtn.addEventListener('click', ()=>{
      try{
        const hideKey = 'Astral_hide_game_help';
        if(helpCheckbox && helpCheckbox.checked){ localStorage.setItem(hideKey, '1'); }
      }catch(e){}
      if(helpEl) helpEl.style.display = 'none';
      if(toggleArrow) toggleArrow.classList.remove('attention');
    });
  }
})();
