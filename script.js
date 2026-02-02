
//❗Alerta, este codigo es una bazofia total
// que compila cuando quiere, esta madre 
// esta construida a base de sueños, 
// esperanzas y fé. //
// No intentes entenderlo, solo funciona así.
// Si lo tocas, lo jodes. No me culpes a mi. //
// Omar Galaviz //


function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Nunca';
  const now = new Date();
  const diff = now - new Date(lastSeen);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} días`;
}

document.addEventListener('DOMContentLoaded', () => {
  try{
    if(window.location && window.location.search && window.location.search.indexOf('demo_instructions=1') !== -1){
      // aqui guardamos los datos por primera vez
      if(typeof window.demoGameInstructions === 'function') window.demoGameInstructions();
      // esperamos a que populateGamesSection renderice para abrir instrucciones
      setTimeout(()=>{
        try{
          const games = window.games || window._gamesList || [];
          if(!games || !games.length) return;
          const g = games[0];
          const url = g.url || g.path || '';
          if(!url) return;
          // preferir instrucciones registradas si es que existen
          let instr = null;
          try{ instr = (window.__astral_gameInstructions && window.__astral_gameInstructions.get(String(url))) || null; }catch(e){}
          if(typeof window.openGameInIframe === 'function') window.openGameInIframe(url, { instructionsData: instr });
        }catch(e){ console.error('demo open failed', e); }
      }, 220);
    }
  }catch(e){/* ignorame esta */}

  // Heartbeat polling: cada 5 segundos verificar token si hay sesión
  setInterval(() => {
    const token = localStorage.getItem('astralToken');
    console.log('Heartbeat check, token:', !!token);
    if (token) {
      console.log('Sending heartbeat');
      fetch(`${API}/verify-token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => console.log('Heartbeat success')).catch(e => console.log('Heartbeat failed', e));
    }
  }, 5000);
});

document.addEventListener("DOMContentLoaded", () => {
  // Mostrar nombre en header
  const username = localStorage.getItem('username') || 'Player';
  const headerUsername = document.getElementById('header-username');
  if (headerUsername) headerUsername.textContent = username;
  if (typeof startCoinsPolling === 'function') {
    startCoinsPolling();
  } else {
    // Si la función aún no está definida, esperar un momento
    setTimeout(() => {
      if (typeof startCoinsPolling === 'function') startCoinsPolling();
    }, 500);
  }
  // Música de fondo en title screen
  const bgMusic = document.getElementById('bg-music');
  const titleMusic = document.getElementById('title-music');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('title-screen').classList.contains('active')) {
      if (bgMusic) bgMusic.pause();
      if (titleMusic) titleMusic.play();
    }
  });

  // Scroll en comunidad

    /* --- BAN WATCHER: comprueba periódicamente si hay usuarios baneados --- */
    (function(){
      const BAN_POLL_INTERVAL = 10 * 1000; // 10 segundos, comprobación más frecuente
      console.log('[ban-check] watcher initializing');

      // Removed in-page visible debug panel to keep the UI clean; use console logs instead.

      // Request notification permission early (best-effort)
      try{ if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(p => console.log('[ban-check] Notification permission: '+p)).catch(()=>{}); }catch(e){}
      const STORAGE_KEY = 'Astral_banned_state_v1';

      function loadState(){
        try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }catch(e){ return {} }
      }
      function saveState(obj){
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }catch(e){}
      }

      function ensureAudio(){
        let a = document.getElementById('ban-audio');
        if(!a){
          a = document.createElement('audio');
          a.id = 'ban-audio';
          a.src = 'ban.mp3';
          a.preload = 'auto';
          document.body.appendChild(a);
        }
        return a;
      }

      function showBanToast(user, isOwnBan){
        let cont = document.getElementById('ban-toast-container');
        if(!cont){
          cont = document.createElement('div');
          cont.id = 'ban-toast-container';
          cont.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:200000;display:flex;flex-direction:column;gap:10px;align-items:flex-start;';
          document.body.appendChild(cont);
        }
        const el = document.createElement('div');
        el.style.cssText = 'background:rgba(20,6,6,0.98);border:1px solid rgba(255,0,0,0.12);color:#ff4d4d;padding:10px 14px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.6);font-weight:700;font-size:0.95rem;';

        // Determinar número de jugador (preferir campos numéricos / campos explícitos)
        let playerNumber = null;
        const idField = user && user.id;
        if (typeof idField === 'number') playerNumber = idField;
        // campos alternativos comunes
        const altNumFields = ['numero','numeroJugador','playerNumber','player_id','id_num'];
        for (const k of altNumFields){ if (!playerNumber && user && user[k]) playerNumber = user[k]; }
        if (!playerNumber){
          // intentar extraer dígitos del id o nombre
          const s = String(idField || user && (user.nombre || user.name || user.username) || '');
          const m = s.match(/\d+/);
          if (m) playerNumber = m[0];
        }
        if (!playerNumber) playerNumber = 'N/A';

        // Construir nombre y datos adicionales
        const nameParts = [];
        if (user){
          if (user.nombre) nameParts.push(user.nombre);
          if (user.apellido) nameParts.push(user.apellido);
          if (user.name && !user.nombre) nameParts.push(user.name);
          if (user.username && !user.nombre && !user.name) nameParts.push(user.username);
        }
        let displayName = nameParts.join(' ').trim();
        // Si no hay nombre, usar idField cuando no sea puramente numérico
        if (!displayName){
          if (typeof idField === 'string' && !/^\d+$/.test(idField)) displayName = idField;
          else displayName = '';
        }

        // Evitar duplicar número dentro del nombre (por si idField contenía ya el número)
        if (displayName){
          displayName = displayName.replace(/^#?\s*\d+\s*-?\s*/,'');
        }

        // Texto final: "Jugador #{Numero} {id} {nombre} eliminado"
        const idText = (typeof idField !== 'undefined' && idField !== null) ? String(idField) : '';
        const nameText = displayName ? (' ' + displayName) : '';
        el.textContent = `Jugador #${playerNumber} ${idText}${nameText} eliminado`;
        cont.appendChild(el);

        // Seleccionar audio según si el jugador baneado eres TÚ (usuario actual)
        const audio = ensureAudio();
        try{
          const me = getCurrentUserId();
          const isYouBanned = (me !== null && typeof user !== 'undefined' && String(me) === String(user.id));
          if (isYouBanned) audio.src = 'baneadotu.mp3'; else audio.src = 'ban.mp3';
          audio.currentTime = 0;
          audio.play().catch(()=>{});
        }catch(e){}

        // También generar una notificación del navegador si está permitida
        try{
          if ('Notification' in window && Notification.permission === 'granted'){
            const title = 'Jugador eliminado';
            const body = `Jugador #${playerNumber} ${idText}${nameText} eliminado`;
            new Notification(title, { body });
            try{ console.log('[ban-check] notification shown: '+body); }catch(e){}
          }
        }catch(e){ console.warn('[ban-check] notification failed', e); }

        // Si EL JUGADOR QUE FUE BANEADO eres TÚ, mostrar gif central (ban.gif)
        if (typeof user !== 'undefined'){
          const me = getCurrentUserId();
          const isYouBanned = (me !== null && String(me) === String(user.id));
          if (isYouBanned){
            try{
              let ov = document.getElementById('ban-gif-overlay');
              if (!ov){
                ov = document.createElement('div');
                ov.id = 'ban-gif-overlay';
                ov.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);z-index:300000;';
                const img = document.createElement('img');
                img.src = 'ban.gif';
                img.alt = 'Baneo';
                img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.6);';
                ov.appendChild(img);
                document.body.appendChild(ov);
                // eliminar después de 6s
                setTimeout(()=>{ try{ ov.remove(); }catch(e){} }, 6000);
              }
                // Recargar la página automáticamente después de mostrar la animación
                try{
                  setTimeout(()=>{
                    try{ console.log('[ban-check] you were banned — reloading page'); }catch(e){}
                    try{ location.reload(); }catch(e){}
                  }, 4000);
                }catch(e){ console.error('[ban-check] failed to schedule reload', e); }
            }catch(e){ console.error('Error showing ban gif', e); }
          }
        }

        // Auto-eliminar después de 8s con transición
        setTimeout(()=>{
          try{
            el.style.transition = 'opacity .35s, transform .35s';
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            setTimeout(()=>{ el.remove(); }, 380);
          }catch(e){}
        }, 8000);
      }

      async function fetchBannedAndNotify(){
        try{
          console.log('[ban-check] starting fetchBannedAndNotify');
          try{ console.log('[ban-check] starting fetchBannedAndNotify'); }catch(e){}
          const res = await fetch(`${API}/usuarios`);
          if(!res.ok){
            console.warn('[ban-check] fetch returned non-ok', res.status);
            return;
          }
          const users = await res.json();
          console.log('[ban-check] fetched users count=', Array.isArray(users)?users.length:typeof users, users && users.slice?users.slice(0,3):undefined);
          try{ console.log('[ban-check] fetched users count= '+(Array.isArray(users)?users.length:String(typeof users))); }catch(e){}
          if(!Array.isArray(users)) return;
          const state = loadState();
          let changed = false;

          for(const u of users){
            if(!u || typeof u.id === 'undefined') continue;
            const isBanned = (u.baneado === true || u.baneado === 'true' || u.baneado == 1);
            const prev = state[u.id] && state[u.id].banned === true;

              if(isBanned && !prev){
                // transición: no estaba baneado (o desconocido) -> ahora baneado
                // detectar si el baneo fue realizado por el usuario actual
                const me = getCurrentUserId();
                const banActorFields = ['baneado_por','baneado_por_id','ban_by','banned_by','ban_by_id','ban_actor','baneador'];
                let banActor = null;
                for (const k of banActorFields){ if (!banActor && (u[k] || u[k] === 0)) banActor = u[k]; }
                const isOwnBan = (banActor && String(banActor) === String(me));
                showBanToast(u, !!isOwnBan);
                state[u.id] = { banned: true, lastNotified: Date.now(), bannedBy: banActor };
                changed = true;
              } else if(!isBanned && prev){
              // transición: estaba baneado -> ahora desbaneado, actualizar para permitir re-notificar en el futuro
              state[u.id] = { banned: false };
              changed = true;
            } else {
              // mantener o inicializar estado
              if(!state[u.id]) state[u.id] = { banned: !!isBanned };
            }
          }

          if(changed) saveState(state);
        }catch(e){
          console.error('[ban-check] Error checking banned users', e);
        }
      }

      // Exponer trigger manual para probar desde la consola: `window.triggerBanCheck()`
      try{ window.triggerBanCheck = fetchBannedAndNotify; }catch(e){}
      // Exponer helper de test para mostrar notificación manualmente
      try{ window.testShowBan = function(user, isOwn){ try{ fetchBannedAndNotify(); /* keep behavior consistent */ }catch(e){}; try{ showBanToast(user, !!isOwn); }catch(e){ console.error(e); } }; }catch(e){}

    // --- SITE NOTICES: polling and UI for info/warning/critical notices (bottom-left) ---
    (function(){
      const containerId = 'site-notices-container';
      const LOCAL_KEY = 'Astral_seen_notices_v1';
      // Load seen IDs from localStorage so notices don't reappear after being seen
      const seen = new Set();
      try{
        const raw = localStorage.getItem(LOCAL_KEY);
        if(raw){
          const arr = JSON.parse(raw);
          if(Array.isArray(arr)) arr.forEach(id=>seen.add(id));
        }
      }catch(e){ /* ignore parse errors */ }

      function persistSeen(){
        try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(seen))); }catch(e){}
      }

      function ensureContainer(){
        let c = document.getElementById(containerId);
        if(!c){
          c = document.createElement('div');
          c.id = containerId;
          c.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:200000;display:flex;flex-direction:column;gap:10px;align-items:flex-start;';
          document.body.appendChild(c);
        }
        return c;
      }

      function ensureAudio(){
        if(window.__astral_notice_audio) return window.__astral_notice_audio;
        try{
          const a = new Audio('info.mp3');
          a.preload = 'auto';
          window.__astral_notice_audio = a;
          return a;
        }catch(e){ return null; }
      }

      function playNoticeSound(){
        try{
          const a = ensureAudio();
          if(!a) return;
          try{ a.currentTime = 0; }catch(e){}
          a.play().catch(()=>{});
        }catch(e){}
      }

      function showSiteNotice(n){
        try{
          const c = ensureContainer();
          if(!n || !n.id || seen.has(n.id)) return; // avoid duplicates / already-seen
          // mark as seen immediately so it won't re-show on next poll
          seen.add(n.id);
          persistSeen();

          console.log('[site-notices] show', n.id, n.type, n.message);

          // Play sound for every new visible notice
          try{ playNoticeSound(); }catch(e){ console.error('[site-notices] play sound failed', e); }

          const el = document.createElement('div');
          el.className = 'astral-site-notice astral-site-notice-' + (n.type || 'info');
          el.textContent = n.message || '';
          el.style.opacity = '0';
          el.style.transform = 'translateY(8px)';
          el.style.transition = 'opacity .28s, transform .28s';
          c.appendChild(el);
          // animate in
          requestAnimationFrame(()=>{ el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });

          // Auto dismiss after 8s unless expires_at is later
          const ttl = 8000;
          const timeout = setTimeout(()=>{
            try{ el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(()=>el.remove(), 300); }catch(e){}
          }, ttl);

          // Allow click to dismiss early
          el.addEventListener('click', ()=>{ clearTimeout(timeout); el.remove(); });
        }catch(e){ console.error('showSiteNotice failed', e); }
      }

      async function fetchNotices(){
        console.log('[site-notices] fetchNotices', new Date());
        try{
          const res = await fetch(`${API}/api/anuncios`);
          if(!res.ok){ console.log('[site-notices] fetch failed', res.status); return; }
          const list = await res.json();
          if(!Array.isArray(list)) return;
          console.log('[site-notices] fetched list length=', list.length);
          list.reverse(); // show oldest-first so they stack naturally
          for(const n of list){
            try{
              if(!n || !n.id) continue;
              if(seen.has(n.id)) continue; // skip notices already seen by this client
              console.log('[site-notices] new notice', n.id, n.type, n.message);
              showSiteNotice(n);
            }catch(e){ console.error('[site-notices] show loop error', e); }
          }
        }catch(e){ console.error('[site-notices] fetch error', e); }
      }

      // Expose helper for dev
      try{ window.testShowSiteNotice = function(msg,type){ const id = 'test-'+Date.now(); showSiteNotice({ id, message: msg||'Mensaje de prueba', type: type||'info' }); }; }catch(e){}

      function startSiteNoticesPolling(){
        try{
          if(window.__astral_site_notices_interval) return; // already running
          // initial fetch now
          try{ fetchNotices(); }catch(e){ console.error('[site-notices] initial fetch failed', e); }
          window.__astral_site_notices_interval = setInterval(()=>{
            try{ fetchNotices(); }catch(e){ console.error('[site-notices] poll error', e); }
          }, 5 * 1000);
          console.log('[site-notices] polling started (interval 5s)');
        }catch(e){ console.error('[site-notices] start error', e); }
      }

      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', startSiteNoticesPolling);
      } else {
        // Start ASAP but guard in case of synchronous errors
        try{ startSiteNoticesPolling(); }catch(e){ console.error('[site-notices] start failed', e); }
      }

      // Debug helper: inspect site notices runtime state
      try{ window.__astral_site_notices_state = ()=>({
        seenCount: seen.size,
        pollingIntervalId: window.__astral_site_notices_interval || null,
      }); }catch(e){};
    })();

    /* === ADVERTENCIAS (modal) === */
    (function(){
      const LOCAL_PREFIX = 'Astral_seen_advertencia_v1_';
      let _open = false;
      let _currentUser = null;

      function getSeenKey(userId){ return LOCAL_PREFIX + String(userId); }
      function getSeen(userId){ try{ return localStorage.getItem(getSeenKey(userId)); }catch(e){ return null; } }
      function persistSeen(userId, value){ try{ localStorage.setItem(getSeenKey(userId), String(value || '')); }catch(e){} }

      // helper to ensure adv audio (out.mp3)
      function ensureAdvAudio(){
        if(window.__astral_adv_audio) return window.__astral_adv_audio;
        try{
          const a = new Audio('out.mp3');
          a.preload = 'auto';
          window.__astral_adv_audio = a;
          return a;
        }catch(e){ return null; }
      }

      function playAdvSound(){
        try{ const a = ensureAdvAudio(); if(!a) return; try{ a.currentTime = 0; }catch(e){} a.play().catch(()=>{}); }catch(e){}
      }

      function ensureModal(){
        let ov = document.getElementById('advertencia-overlay');
        if(ov) return ov;
        ov = document.createElement('div');
        ov.id = 'advertencia-overlay';
        ov.className = 'advertencia-overlay';
        ov.setAttribute('aria-hidden','true');
        ov.innerHTML = `
          <div class="advertencia-card" role="dialog" aria-modal="true" aria-labelledby="advertencia-title" aria-describedby="advertencia-msg">
            <div class="advertencia-inner">
              <div class="advertencia-header">
                <div id="advertencia-title" class="advertencia-title">Advertencia</div>
              </div>
              <div class="advertencia-content">
                <div id="advertencia-msg" class="adv-message"></div>
              </div>
              <div class="adv-buttons-row">
                <button id="adv-ok" class="adv-ok" aria-label="OK">OK</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(ov);

        // Event wiring: OK clears advertencia on server and marks as seen
        const ok = ov.querySelector('#adv-ok');

        async function chooseAndClose(choice){
          try{
            const userId = _currentUser || getCurrentUserId();
            const msg = document.getElementById('advertencia-msg') ? document.getElementById('advertencia-msg').innerHTML : '';
            console.log('[advertencia] choice=', choice);
            try{
              const token = localStorage.getItem('astralToken') || '';
              if(userId){ await fetch(`${API}/usuarios/${userId}/limpiar-advertencia`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }); }
            }catch(e){ console.error('[advertencia] clear on server failed', e); }
            if(userId) persistSeen(userId, msg);
          }catch(e){ console.error(e); }
          hideModal();
        }

        ok.addEventListener('click', async (e)=>{ e.preventDefault(); await chooseAndClose('ok'); });


        // IMPORTANT: Do NOT allow overlay click or Esc to close — only buttons close the modal
        ov.addEventListener('click', (e)=>{ /* do nothing */ });
        document.addEventListener('keydown', (e)=>{ if(!_open) return; if(e.key === 'Escape'){ /* ignore */ } });

        return ov;
      }

      function showModal(message, userId){
        try{
          if(_open) return;
          _currentUser = userId || getCurrentUserId();
          const ov = ensureModal();
          const msgEl = document.getElementById('advertencia-msg');
          if(msgEl) msgEl.innerHTML = message || '';
          ov.setAttribute('aria-hidden','false');
          requestAnimationFrame(()=>{
            ov.classList.add('show');
            try{ playAdvSound(); }catch(e){}
            const btn = ov.querySelector('#adv-ok'); if(btn) try{ btn.focus(); }catch(e){}
          });
          _open = true;
        }catch(e){ console.error('[advertencia] showModal failed', e); }
      }

      function hideModal(){
        try{
          const ov = document.getElementById('advertencia-overlay');
          if(!ov) return; ov.classList.remove('show'); ov.setAttribute('aria-hidden','true'); _open = false; _currentUser = null;
        }catch(e){ console.error('[advertencia] hideModal failed', e); }
      }

      async function fetchAdvertencia(){
        try{
          const userId = getCurrentUserId();
          if(!userId) return;
          // fetch user record
          const res = await fetch(`${API}/usuarios/${userId}`);
          if(!res.ok) return;
          const data = await res.json();
          const adv = data && data.advertencia ? String(data.advertencia).trim() : null;
          if(!adv) return;
          const seen = getSeen(userId);
          if(seen === adv) return; // already seen
          // show modal
          showModal(adv, userId);
        }catch(e){ console.error('[advertencia] fetch error', e); }
      }

      function startPolling(){
        try{
          if(window.__astral_advertencia_interval) return;
          fetchAdvertencia();
          window.__astral_advertencia_interval = setInterval(()=>{ try{ fetchAdvertencia(); }catch(e){ console.error('[advertencia] poll error', e); } }, 5000);
          console.log('[advertencia] polling started (every 5s)');
        }catch(e){ console.error('[advertencia] startPolling failed', e); }
      }

      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startPolling); else startPolling();

      // debug helper
      try{ window.testShowAdvertencia = function(msg){ showModal(msg || 'Advertencia de prueba', getCurrentUserId() || 'test'); }; }catch(e){}

/* Global button press animation helper. Adds a brief tactile animation on pointer interactions
   to every button-like control: uses .is-pressing while pointer is down and .btn-press on release */
(function(){
  const PRESS_CLASS = 'is-pressing';
  const ANIM_CLASS = 'btn-press';
  const selector = 'button, input[type="button"], input[type="submit"], [role="button"], .background-button, .adv-ok, .chat-send-btn, .chat-reload-btn, .adv-option, .adv-cancel';

  function findButton(el){ return el && el.closest ? el.closest(selector) : null; }

  document.addEventListener('pointerdown', (e)=>{
    try{ const b = findButton(e.target); if(!b) return; b.classList.add(PRESS_CLASS); }catch(e){}
  }, {passive:true});

  ['pointerup','pointercancel','pointerleave'].forEach(evtName => {
    document.addEventListener(evtName, (e)=>{
      try{
        const b = findButton(e.target);
        if(!b) return;
        if(b.classList.contains(PRESS_CLASS)) b.classList.remove(PRESS_CLASS);
        // play a quick press animation on release
        b.classList.add(ANIM_CLASS);
        const cleanup = ()=>{ b.classList.remove(ANIM_CLASS); b.removeEventListener('animationend', cleanup); };
        b.addEventListener('animationend', cleanup);
      }catch(e){}
    }, {passive:true});
  });

  // Keyboard activation (space/enter) should also show the animation briefly
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Enter' && e.key !== ' ') return;
    try{
      const b = findButton(e.target) || findButton(document.activeElement);
      if(!b) return;
      b.classList.add(ANIM_CLASS);
      setTimeout(()=> b.classList.remove(ANIM_CLASS), 220);
    }catch(e){}
  });
})();
    })();

      document.addEventListener('DOMContentLoaded', ()=>{
        // comprobación inicial inmediata y luego intervalo
        fetchBannedAndNotify();
        setInterval(fetchBannedAndNotify, BAN_POLL_INTERVAL);
        // Forzar comprobación cada 5s usando trigger (user requested frequent checks)
        try{
          console.log('[ban-check] setting trigger interval every 5s');
          setInterval(() => {
            try{
              if (typeof window.triggerBanCheck === 'function') window.triggerBanCheck();
              else fetchBannedAndNotify();
            }catch(e){ console.error('[ban-check] trigger interval error', e); }
          }, 5000);
        }catch(e){ console.error('[ban-check] could not set trigger interval', e); }
      });
    })();
  const communityList = document.querySelector('.community-users-list');
  if (communityList) {
    communityList.style.overflowY = 'auto';
    communityList.style.maxHeight = '60vh';
  }
});
// Renderiza la sección de comunidad (usuarios)

// Wire setup/register tabs (CREAR CUENTA / YA TENGO CUENTA)
document.addEventListener('DOMContentLoaded', () => {
  try {
    initSetupTabs();
  } catch (e) {
    console.error('Error wiring setup tabs', e);
  }
});

// --- COMUNIDAD: SISTEMA DE USUARIOS Y AMIGOS (importado de basevieja.js) ---
const API = "https://astral-ban-api.onrender.com"

async function fetchAllUsers() {
  try {
    const res = await fetch(`${API}/usuarios`)
    if (!res.ok) throw new Error("Error al obtener usuarios")
    return await res.json()
  } catch (e) {
    console.error("[Astral] Error fetching users:", e)
    return []
  }
}

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("astralUser") || "{}")
    return user.id || null
  } catch (e) {
    return null
  }
}

// === SISTEMA DE MONEDAS ===
let _userCoinsCache = 0;

async function fetchUserCoins() {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            console.log('[coins] No userId found');
            return 0;
        }
        
        const res = await fetch(`${API}/api/user/coins?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
            console.warn('[coins] fetch failed', res.status);
            return _userCoinsCache;
        }
        
        const data = await res.json();
        const coins = data.coins || 0;
        
        // Actualizar UI si cambió
        if (coins !== _userCoinsCache) {
            updateCoinsDisplay(coins, true);
        } else {
            updateCoinsDisplay(coins, false);
        }
        
        _userCoinsCache = coins;
        return coins;
    } catch (e) {
        console.error('[coins] Error fetching coins:', e);
        return _userCoinsCache;
    }
}

function updateCoinsDisplay(coins, animate = false) {
    const countEl = document.getElementById('header-coins-count');
    const containerEl = document.getElementById('header-coins-container');
    
    if (countEl) {
        countEl.textContent = formatCoins(coins);
    }
    
    if (animate && containerEl) {
        containerEl.classList.remove('pulse');
        void containerEl.offsetWidth;
        containerEl.classList.add('pulse');
        setTimeout(() => containerEl.classList.remove('pulse'), 350);
    }
}

function formatCoins(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return String(num);
}

function startCoinsPolling() {
  fetchUserCoins();
  setInterval(() => {
  fetchUserCoins();
  }, 5000);
}

window.fetchUserCoins = fetchUserCoins;
window.updateCoinsDisplay = updateCoinsDisplay;
// === FIN SISTEMA DE MONEDAS ===

async function renderCommunity(users) {
    const list = document.querySelector('.community-users-list');
    const loading = document.querySelector('.community-loading');
    const empty = document.querySelector('.community-empty');
    const error = document.querySelector('.community-error');
    if (!list) return;
    list.innerHTML = '';
    if (!users) {
        error.style.display = 'block';
        loading.style.display = empty.style.display = 'none';
        return;
    }
    if (users.length === 0) {
        empty.style.display = 'block';
        loading.style.display = error.style.display = 'none';
        return;
    }
    loading.style.display = error.style.display = empty.style.display = 'none';
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'community-user-card';
        card.innerHTML = `
          <div class="community-user-avatar">
            <img src="${user.avatar || 'logo.png'}" alt="Avatar" class="community-user-img" />
          </div>
          <div class="community-user-info">
            <span class="community-user-name">${user.nombre || user.id}</span>
            <span class="community-user-id">${user.id}</span>
            <span class="community-user-status">Última conexión: ${formatLastSeen(user.last_seen)}</span>
          </div>
          <div style="margin-top:8px;text-align:center;">
            <button class="background-button profile-view-btn" onclick="openUserProfileModal('${user.id}')">Ver perfil</button>
          </div>
        `;
        list.appendChild(card);
    });
}

// --- PERFIL COMPLETO (MODAL): Mostrar relaciones sociales ---
window.openUserProfileModal = async (userId) => {
  const modal = document.getElementById("userProfileModal")
  const content = document.getElementById("userProfileModalContent")

  if (!modal || !content) {
    console.error("[Astral] User profile modal elements not found")
    return
  }

  content.innerHTML = '<div style="text-align:center;padding:2em 0;">Cargando perfil...</div>'
  modal.style.display = "flex"

  try {
    // Trae los datos del usuario desde la API
    const resUser = await fetch(`${API}/usuarios/${userId}`)
    const user = await resUser.json()

    // Trae las relaciones aceptadas de ese usuario
    let relacionesHtml = ""
    try {
      const resRel = await fetch(`${API}/relaciones/${userId}`)
      const relaciones = await resRel.json()
      relaciones.forEach((rel) => {
        if (rel.estado !== "aceptada") return
        const otro = rel.de === userId ? rel.para : rel.de
        let frase = ""
        if (rel.tipo === "romantica") frase = `En una relación romántica con <b>@${otro}</b>`
        if (rel.tipo === "mejor_amigo") frase = `Mejor amigo de <b>@${otro}</b>`
        if (rel.tipo === "hermano") frase = `Hermano/a de <b>@${otro}</b>`
        if (rel.tipo === "enemigo") frase = `Enemigo jurado de <b>@${otro}</b>`
        if (rel.tipo === "compañero") frase = `Compañero de aventuras de <b>@${otro}</b>`
        relacionesHtml += `<div style="margin-bottom:0.3em;font-size:1em;opacity:0.85;">${frase}</div>`
      })
    } catch (e) {
      console.error("[Astral] Error fetching user relations:", e)
    }

    // Renderiza el perfil completo
    content.innerHTML = `
            <div style="position:relative;">
              ${user.titular ? `<div style="position:absolute;top:0;left:0;background:linear-gradient(135deg,#0052cc,#003d99);color:#fff;padding:8px 14px;border-radius:8px;font-weight:700;font-size:0.9rem;">Titular: ${user.titular}</div>` : ""}
              <div class="profile-modal-avatar" style="text-align:center;margin-bottom:1.2em;">
                  ${user.avatar ? `<img src="${user.avatar}" alt="Avatar" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:4px solid var(--accent-color);background:#222;">` : `<i class="fas fa-user" style="font-size:5em;"></i>`}
              </div>
              <div class="profile-modal-name" style="font-weight:700;font-size:1.6em;text-align:center;">
                  ${user.nombre || user.id}
                  ${user.rol === "owner" ? '<span style="color:#d1002f;font-weight:bold;margin-left:0.5em;">(Dueño)</span>' : ""}
                  ${user.rol === "admin_senior" ? '<span style="color:#0d47a1;font-weight:bold;margin-left:0.5em;">(Admin Senior)</span>' : ""}
                  ${user.rol === "admin_bajo_custodia" ? '<span style="color:#ff9800;font-weight:bold;margin-left:0.5em;">(Administrador Bajo Custodia)</span>' : ""}
                  ${user.rol === "admin" ? '<span style="color:#2196f3;font-weight:bold;margin-left:0.5em;">(Admin)</span>' : ""}
                  ${user.rol === "candidate" ? '<span style="color:#b400ff;font-weight:bold;margin-left:0.5em;">(Candidato a Admin)</span>' : ""}
                  ${user.baneado ? '<span style="color:#ff3333;font-weight:bold;margin-left:0.5em;">(BANEADO)</span>' : ""}
              </div>
              <div class="profile-modal-id" style="opacity:0.7;text-align:center;">@${user.id}</div>
              <div class="profile-modal-status" style="margin-top:0.2em;text-align:center;opacity:0.8;">Última conexión: ${formatLastSeen(user.last_seen)}</div>
              ${user.genero ? `<div class="profile-modal-gender" style="margin-top:0.2em;text-align:center;"><i class="fas fa-${user.genero === "male" ? "mars" : "venus"}"></i> ${user.genero === "male" ? "Masculino" : "Femenino"}</div>` : ""}
              ${user.edad ? `<div class="profile-modal-age" style="margin-top:0.2em;text-align:center;"><i class="fas fa-birthday-cake"></i> ${user.edad} años</div>` : ""}
              ${user.bio ? `<div class="profile-modal-bio" style="margin-top:0.7em;opacity:0.85;text-align:center;">${user.bio}</div>` : ""}
              ${relacionesHtml ? `<div class="profile-modal-relations" style="margin-top:1em;text-align:center;">${relacionesHtml}</div>` : ""}
              ${user.baneado && user.motivo_ban ? `<div class="profile-modal-ban-reason" style="color:#ff3333;margin-top:1em;text-align:center;"><b>Motivo de baneo:</b> ${user.motivo_ban}</div>` : ""}
              <div style="text-align:center;margin-top:1.2em;display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;">
                <button id="addFriendBtnProfile" class="background-button">Agregar amigo</button>
                <button class="background-button" onclick="closeUserProfileModal()">Cerrar</button>
              </div>
            </div>
        `
    // attach click handler to the add-friend button (use fetched user info)
    try {
      const profileAddBtn = document.getElementById('addFriendBtnProfile');
      if (profileAddBtn) {
        profileAddBtn.addEventListener('click', () => {
          openFriendRequestModal(user.id, user.nombre || user.id);
        });
      }
    } catch (e) { console.error('attach add friend handler failed', e); }
  } catch (e) {
    console.error("[Astral] Error loading user profile:", e)
    content.innerHTML = '<div style="color:#ff3333;text-align:center;padding:2em 0;">Error al cargar el perfil.</div>'
  }
}

window.closeUserProfileModal = () => {
  const modal = document.getElementById("userProfileModal")
  if (modal) {
    modal.style.display = "none"
  }
}

window.openFriendRequestModal = (paraId, paraName) => {
  const modal = document.getElementById("friendRequestModal")
  const content = document.getElementById("friendRequestModalContent")

  if (!modal || !content) {
    console.error("[Astral] Friend request modal elements not found")
    return
  }

  content.innerHTML = `
        <p style="margin-bottom:0.6em;text-align:center;font-weight:700;">Enviar solicitud de amistad a <b>${paraName || paraId}</b></p>
        <textarea id="friendRequestMessage" placeholder="Mensaje opcional..." rows="5" style="width:100%;padding:0.75rem;border-radius:8px;border:2px solid var(--accent-color,#4169e1);background:rgba(255,255,255,0.03);color:#fff;font-size:1rem;margin-bottom:0.9em;box-sizing:border-box;min-height:110px;"> </textarea>
        <div style="display:flex;gap:0.6em;justify-content:center;flex-wrap:wrap;">
            <button class="background-button" id="friendRequestSendBtn">Enviar</button>
            <button class="background-button" id="friendRequestCancelBtn" style="background:linear-gradient(45deg,#888,#666);">Cancelar</button>
        </div>
    `
  modal.style.display = "flex"

  // attach handlers for the new buttons
  try {
    const sendBtn = document.getElementById('friendRequestSendBtn');
    const cancelBtn = document.getElementById('friendRequestCancelBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => sendFriendRequest(paraId));
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => closeFriendRequestModal());
    }
  } catch (e) { console.error('attach friend request modal handlers failed', e); }
}

window.closeFriendRequestModal = () => {
  const modal = document.getElementById("friendRequestModal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Update header friends icon indicator when there are pending requests
async function updateFriendRequestIndicator() {
  try {
    const btn = document.getElementById('btn-friends');
    const indicator = document.getElementById('friend-requests-indicator');
    if (!btn || !indicator) return;
    const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
    if (!user.id) {
      btn.classList.remove('has-pending');
      indicator.style.display = 'none';
      return;
    }
    const res = await fetch(`${API}/amigos/solicitudes/${encodeURIComponent(user.id)}`);
    if (!res.ok) {
      btn.classList.remove('has-pending');
      indicator.style.display = 'none';
      return;
    }
    const list = await res.json();
    if (Array.isArray(list) && list.length > 0) {
      btn.classList.add('has-pending');
      indicator.style.display = 'inline-block';
    } else {
      btn.classList.remove('has-pending');
      indicator.style.display = 'none';
    }
  } catch (e) {
    console.error('updateFriendRequestIndicator failed', e);
  }
}

// Run indicator check on load and whenever friends panel opens
document.addEventListener('DOMContentLoaded', () => {
  try { updateFriendRequestIndicator(); } catch(e){}
  const btn = document.getElementById('btn-friends');
  if (btn) btn.addEventListener('click', () => setTimeout(updateFriendRequestIndicator, 300));
});

/* === FRIEND REQUEST NOTIFICATIONS: poll and notify (in-page + system, play out.mp3) === */
(function(){
  const LOCAL_KEY = 'Astral_seen_friend_requests_v1';
  const seen = new Set();
  try{
    const raw = localStorage.getItem(LOCAL_KEY);
    if(raw){ const arr = JSON.parse(raw); if(Array.isArray(arr)) arr.forEach(id=>seen.add(String(id))); }
  }catch(e){}
  function persist(){ try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(seen))); }catch(e){} }

  function ensureFriendAudio(){
    if(window.__astral_friend_audio) return window.__astral_friend_audio;
    try{ const a = new Audio('out.mp3'); a.preload = 'auto'; window.__astral_friend_audio = a; return a; }catch(e){ return null; }
  }
  function playFriendSound(){ try{ const a = ensureFriendAudio(); if(!a) return; try{ a.currentTime = 0; }catch(e){} a.play().catch(()=>{}); }catch(e){}
  }

  function ensureNoticesContainer(){
    let c = document.getElementById('site-notices-container');
    if(!c){ c = document.createElement('div'); c.id = 'site-notices-container'; c.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:200000;display:flex;flex-direction:column;gap:10px;align-items:flex-start;'; document.body.appendChild(c); }
    return c;
  }

  function showFriendNotice(req){
    try{
      const c = ensureNoticesContainer();
      const id = 'friend-'+String(req.id)+'-'+Date.now();
      const el = document.createElement('div');
      el.className = 'astral-site-notice astral-site-notice-info';
      el.textContent = (req.de ? String(req.de) : 'Alguien') + ' te ha enviado una solicitud de amistad';
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = 'opacity .28s, transform .28s';
      c.appendChild(el);
      requestAnimationFrame(()=>{ el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
      const ttl = 8000;
      const timeout = setTimeout(()=>{ try{ el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(()=>el.remove(), 300); }catch(e){} }, ttl);
      el.addEventListener('click', ()=>{ clearTimeout(timeout); el.remove(); try{ const btn = document.getElementById('btn-friends'); if(btn) btn.click(); else cargarSolicitudesAmistad(); }catch(e){} });
    }catch(e){ console.error('[friend-notify] showFriendNotice failed', e); }
  }

  async function notifySystem(req){
    try{
      if(!('Notification' in window)) return;
      if(Notification.permission === 'granted'){
        const n = new Notification(`${req.de || 'Usuario'} te ha enviado una solicitud de amistad`, { body: req.mensaje || '', icon: req.avatar || 'logo.png', tag: 'friend-'+String(req.id) });
        n.onclick = ()=>{ try{ window.focus(); const btn = document.getElementById('btn-friends'); if(btn) btn.click(); else cargarSolicitudesAmistad(); n.close(); }catch(e){} };
      } else if(Notification.permission !== 'denied'){
        try{ const p = await Notification.requestPermission(); if(p === 'granted'){ notifySystem(req); } }catch(e){}
      }
    }catch(e){ console.error('[friend-notify] system notify failed', e); }
  }

  async function fetchFriendRequests(){
    try{
      const userId = getCurrentUserId();
      if(!userId) return;
      const res = await fetch(`${API}/amigos/solicitudes/${encodeURIComponent(userId)}`);
      if(!res.ok) return;
      const list = await res.json();
      if(!Array.isArray(list)) return;
      for(const r of list){
        if(!r || r.id == null) continue;
        const key = String(r.id);
        if(seen.has(key)) continue;
        // New incoming request
        seen.add(key); persist();
        playFriendSound();
        showFriendNotice(r);
        notifySystem(r);
        try{ updateFriendRequestIndicator(); }catch(e){}
      }
    }catch(e){ console.error('[friend-notify] fetch error', e); }
  }

  function startFriendNotifications(){
    try{
      if(window.__astral_friend_interval) return;
      fetchFriendRequests();
      window.__astral_friend_interval = setInterval(()=>{ try{ fetchFriendRequests(); }catch(e){ console.error('[friend-notify] poll error', e); } }, 5 * 1000);
      console.log('[friend-notify] polling started (every 5s)');
    }catch(e){ console.error('[friend-notify] start failed', e); }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startFriendNotifications); else startFriendNotifications();
})();

window.sendFriendRequest = async (paraId) => {
  const mensaje = document.getElementById("friendRequestMessage")?.value || ""
  const userId = getCurrentUserId()

  if (!userId) {
    alert("Debes iniciar sesión para enviar solicitudes de amistad")
    return
  }

  try {
    const res = await fetch(`${API}/amigos/solicitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ de: userId, para: paraId, mensaje }),
    })
    const data = await res.json()

    if (data.success) {
      alert("Solicitud de amistad enviada!")
      closeFriendRequestModal()
    } else {
      alert(data.error || "Error al enviar solicitud")
    }
  } catch (e) {
    console.error("[Astral] Error sending friend request:", e)
    alert("Error al enviar solicitud de amistad")
  }
}

window.showCommunitySection = async () => {
  console.log("[Astral] Loading community section...")
  // Ensure section is visible
  // Activate the community section using centralized function
  if (window.activateSection) {
    window.activateSection('community')
  } else {
    const mainContent = document.getElementById("main-content")
    if (mainContent) {
      mainContent.querySelectorAll(".content-section").forEach((sec) => sec.classList.remove("active"))
      const sec = document.getElementById("section-community")
      if (sec) sec.classList.add("active")
    }
  }
  // Fetch and render data
  const users = await fetchAllUsers()
  await renderCommunity(users)
}

// --- EVENTO: Cargar comunidad al hacer clic en el botón ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Astral] Community system loaded")

  // Buscar el botón de comunidad en el sidebar
  const communityBtn = document.querySelector('.sidebar-item[data-section="community"]')
  if (communityBtn) {
    communityBtn.addEventListener("click", async () => {
      await window.showCommunitySection()
    })
  }

  const altCommunityBtn = document.querySelector('[data-section="community"]:not(.sidebar-item)')
  if (altCommunityBtn) {
    altCommunityBtn.addEventListener("click", async () => {
      await window.showCommunitySection()
    })
  }
  // Música de pantalla de título
  const bgMusic = document.getElementById('bg-music');
  const titleScreen = document.getElementById('title-screen');
  let titleMusicStarted = false;

  function showTitleScreen() {
    document.querySelectorAll('.screen-container').forEach(s => s.classList.add('hidden'));
    titleScreen.classList.remove('hidden');
    if (bgMusic) {
      bgMusic.currentTime = 0;
      bgMusic.pause();
    }
    titleMusicStarted = false;
  }

  // Detecta interacción para iniciar música
  window.addEventListener('keydown', (e) => {
    if (!titleMusicStarted && !titleScreen.classList.contains('hidden')) {
      if (e.key === 'Enter') {
        if (bgMusic) {
          bgMusic.currentTime = 0;
          bgMusic.play();
        }
        titleMusicStarted = true;
      }
    }
  });
  window.addEventListener('click', () => {
    if (!titleMusicStarted && !titleScreen.classList.contains('hidden')) {
      if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play();
      }
      titleMusicStarted = true;
    }
  });

  // Si tienes una función que muestra la pantalla de título, llama a showTitleScreen()
  // Ejemplo: showTitleScreen();
})



// --- NUEVA SECCIÓN: Renderizado de tarjetas anchas para `section-games` ---
// Centralized helpers for section activation and cleanup
window.hideCommunityUI = () => {
  const sec = document.getElementById('section-community')
  if (sec) sec.classList.remove('active')
  const list = document.querySelector('.community-users-list')
  if (list) list.innerHTML = ''
  const modals = document.querySelectorAll('#userProfileModal, #friendRequestModal, .community-panel, .community-overlay')
  modals.forEach((m) => {
    try {
      if (m.style) m.style.display = 'none'
      m.classList.remove('active')
    } catch (e) {}
  })
}

window.activateSection = (sectionName) => {
  // Hide all sections globally (works even if some sections are outside #main-content)
  document.querySelectorAll('.content-section').forEach((sec) => sec.classList.remove('active'))
  const target = document.getElementById(`section-${sectionName}`)
  if (target) target.classList.add('active')

  document.querySelectorAll('.sidebar-item, .drawer-item').forEach((btn) => {
    try {
      btn.classList.toggle('active', btn.dataset && btn.dataset.section === sectionName)
    } catch (e) {}
  })

  if (sectionName !== 'community') window.hideCommunityUI()
  // If opening Ayuda section, sync the checkbox with localStorage
  if (sectionName === 'ayuda') {
    try{
      if (typeof window.showHelpSection === 'function') window.showHelpSection();
    }catch(e){}
  }
  // If opening profile section, initialize profile UI
  if (sectionName === 'profile') {
    try { initProfileUI(); } catch (e) { console.error('activateSection initProfileUI error', e); }
  }

  // If opening admin section, initialize admin UI (only allowed roles should be able to see this)
  if (sectionName === 'admin') {
    try {
      if (!userHasAdminRole()) {
        console.warn('Usuario sin permisos para abrir Admin');
        window.activateSection('home');
        return;
      }
      if (typeof window.initAdminSection === 'function') window.initAdminSection();
    } catch (e) { console.error('activateSection initAdminSection error', e); }
  }
}

// Global click handler to route drawer/sidebar actions through activateSection
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.drawer-item, .sidebar-item')
  if (!btn) return
  const section = btn.dataset && btn.dataset.section
  if (!section) return
  if (section === 'community') {
    // ensure UI updates immediately and let existing handler load data
    window.activateSection('community')
    return
  }
  window.activateSection(section)
})
/**
 * populateGamesSection
 *
 * Per-game instruction fields (place in your `window.games` objects):
 * - url: string (required)  -- path to the game's index.html
 * - title / name / game: string -- title shown in the instructions modal
 * - logo / thumbnail / thumb: string -- image URL for the small logo at top-left
 * - instructions: string -- main (large) instructions text shown in left panel
 * - instructions2: string -- secondary instructions text shown at bottom
 * - previewVideo / video / preview: string -- MP4 preview URL shown on the right (autoplay muted loop)
 * - timerSecs / timer: number -- seconds to countdown before auto-entering
 *
 * The UI also supports data-* attributes on game elements (click targets):
 * - data-game-url
 * - data-game-title
 * - data-game-logo
 * - data-game-instructions
 * - data-game-instructions2
 * - data-game-video
 * - data-game-timer
 */
// Example game object (add to `window.games` array or your games list):
// {
//   url: 'Juegos/mariovsluigi/index.html',
//   title: 'Mario vs Luigi',
//   logo: 'Juegos/mariovsluigi/logo.png',
//   thumbnail: 'Juegos/mariovsluigi/thumb.jpg',
//   instructions: 'Usa las flechas para moverte. Pulsa A para saltar.',
//   instructions2: 'Tienes 2:30 para leer estas instrucciones y empezar.',
//   previewVideo: 'Juegos/mariovsluigi/preview.mp4',
//   timerSecs: 150
// }

// --- Welcome hero actions: wire CTA buttons ---
document.addEventListener('DOMContentLoaded', () => {
  const viewBtn = document.getElementById('btn-view-games');
  const learnBtn = document.getElementById('btn-learn-more');
  if(viewBtn) viewBtn.addEventListener('click', (e) => { e.stopPropagation(); if(window.activateSection) window.activateSection('section-games'); });
  if(learnBtn) learnBtn.addEventListener('click', (e) => { e.stopPropagation(); if(window.showHelpSection) window.showHelpSection(); });
});
function populateGamesSection() {
  const container = document.getElementById('games-grid');
  const searchInput = document.getElementById('games-search');
  const emptyEl = document.getElementById('games-empty');
  if (!container) return;

  // Helper to create a single card
  function makeCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('tabindex', '0');
    const thumb = document.createElement('div');
    thumb.className = 'game-thumb';
    const img = game.thumbnail || game.thumb || game.image || '';
    if (img) thumb.style.backgroundImage = `url(${img})`;
    else thumb.style.background = 'linear-gradient(135deg,var(--accent-cyan),var(--accent-purple))';

    const info = document.createElement('div');
    info.className = 'game-info';
    const title = document.createElement('div');
    title.className = 'game-title';
    title.textContent = game.title || game.name || game.game || 'Untitled';
    const artist = document.createElement('div');
    artist.className = 'game-artist';
    artist.textContent = game.artist || game.author || game.dev || '';

    const openBtn = document.createElement('button');
    openBtn.className = 'background-button primary';
    openBtn.style.marginTop = '8px';
    openBtn.textContent = 'JUGAR';
    // prepare instructions data to pass when opening the game
    const instrData = {
      logo: game.logo || game.thumb || game.thumbnail || '',
      title: game.title || game.name || game.game || '',
      instructions: game.instructions || game.instruction || game.desc || game.description || '',
      instructions2: game.instructions2 || game.instruction2 || game.more || '',
      video: game.previewVideo || game.video || game.preview || '',
      timerSecs: (typeof game.timerSecs === 'number') ? game.timerSecs : (game.timer ? parseInt(game.timer) : undefined)
    };
    // attach dataset for click-delegation compatibility
    try{
      if(card.dataset){
        if(game.url) card.dataset.gameUrl = game.url;
        if(instrData.logo) card.dataset.gameLogo = instrData.logo;
        if(instrData.title) card.dataset.gameTitle = instrData.title;
        if(instrData.instructions) card.dataset.gameInstructions = instrData.instructions;
        if(instrData.instructions2) card.dataset.gameInstructions2 = instrData.instructions2;
        if(instrData.video) card.dataset.gameVideo = instrData.video;
        if(instrData.timerSecs) card.dataset.gameTimer = instrData.timerSecs;
      }
    }catch(e){}

    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (game.url) {
        if (typeof window.openGameInIframe === 'function') {
            window.openGameInIframe(game.url, { instructionsData: instrData, gameId: game.id });
            // <CHANGE> Sumar 5 monedas al abrir juego
            if (typeof window.addGameRewardCoins === 'function') window.addGameRewardCoins();
        }
        else window.open(game.url, '_blank');
      }
    });

    info.appendChild(title);
    if (artist && artist.textContent) info.appendChild(artist);
    info.appendChild(openBtn);

    card.appendChild(thumb);
    card.appendChild(info);

    // allow clicking the card to open game too (use iframe if available)
    card.addEventListener('click', () => {
      if (!game.url) return;
      if (typeof window.openGameInIframe === 'function') {
          window.openGameInIframe(game.url, { instructionsData: instrData, gameId: game.id });
          // <CHANGE> Sumar 5 monedas al abrir juego
          if (typeof window.addGameRewardCoins === 'function') window.addGameRewardCoins();
      }
      else window.open(game.url, '_blank');
    });
    return card;
  }

  // Source of games: try window.games or an inline list
  const games = window.games && Array.isArray(window.games) ? window.games : (window._gamesList || []);

  function renderList(list) {
    container.innerHTML = '';
    if (!list || list.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    list.forEach(g => container.appendChild(makeCard(g)));
  }

  // Initial render
  renderList(games);

  // Register per-game instructions if present in the games list
  try{
    if(Array.isArray(games)){
      games.forEach(g => {
        const key = g.url || (g.path || '');
        if(!key) return;
        const data = {
          logo: g.logo || g.thumbnail || g.thumb || '',
          title: g.title || g.name || '',
          instructions: g.instructions || g.instruction || g.desc || g.description || '',
          instructions2: g.instructions2 || g.instruction2 || g.more || '',
          video: g.previewVideo || g.video || g.preview || '',
          timerSecs: (typeof g.timerSecs === 'number') ? g.timerSecs : (g.timer ? parseInt(g.timer) : undefined)
        };
        // only register if there is meaningful data
        if(data.instructions || data.instructions2 || data.video || data.logo || data.timerSecs){
          try{
            if(typeof window.setGameInstructions === 'function') window.setGameInstructions(key, data);
            else {
              window.__pendingGameInstructions = window.__pendingGameInstructions || [];
              window.__pendingGameInstructions.push([key, data]);
            }
          }catch(e){}
        }
      });
    }
  }catch(e){}

  // Search filtering
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) return renderList(games);
      const filtered = games.filter(g => {
        const name = (g.title || g.name || g.game || '').toString().toLowerCase();
        const author = (g.artist || g.author || g.dev || '').toString().toLowerCase();
        return name.includes(q) || author.includes(q);
      });
      renderList(filtered);
    });
  }
}

// Initialize Ayuda section controls
window.showHelpSection = function(){
  try{
    const chk = document.getElementById('help-section-hide-checkbox');
    if(!chk) return;
    const key = 'Astral_hide_game_help';
    chk.checked = localStorage.getItem(key) === '1';
    chk.addEventListener('change', ()=>{
      try{ localStorage.setItem(key, chk.checked ? '1' : '0'); }catch(e){}
    });
  }catch(e){}
}

// DEV helper: call in console to register a demo instruction set for the first game
window.demoGameInstructions = function(){
  try{
    const games = window.games || window._gamesList || [];
    if(!games || !games.length) return console.warn('No games available to demo');
    const g = games[0];
    const key = g.url || g.path || '';
    if(!key) return console.warn('First game has no url/path');
    const data = { title: g.title || 'Demo Game', instructions: 'Usa WASD o flechas para moverte. Evita los enemigos.', instructions2: 'Tienes 2:30 para leer estas instrucciones.', timerSecs: 150 };
    if(typeof window.setGameInstructions === 'function') window.setGameInstructions(key, data);
    console.info('Demo instructions registered for', key);
  }catch(e){ console.error(e); }
}

// Populate games section once DOM is ready. If `window.games` is filled later, you can call populateGamesSection() manually.
document.addEventListener('DOMContentLoaded', () => {
  // slight delay to let any earlier script populate `window.games`
  setTimeout(populateGamesSection, 120);
});

// --- SISTEMA DE AMIGOS: funciones importadas/adaptadas de basevieja.js ---
async function enviarSolicitudAmistad(paraId, mensaje = "") {
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) return;
  const res = await fetch(`${API}/amigos/solicitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ de: user.id, para: paraId, mensaje })
  });
  const data = await res.json();
  if (data.success) return true;
  throw new Error(data.error || 'Error al enviar solicitud');
}

async function cargarSolicitudesAmistad() {
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) return;
  try {
    const res = await fetch(`${API}/amigos/solicitudes/${user.id}`);
    const solicitudes = await res.json();
    renderSolicitudesAmistad(solicitudes || []);
  } catch (e) {
    console.error('Error cargando solicitudes de amistad', e);
  }
}

async function cargarAmigos() {
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) return;
  try {
    const res = await fetch(`${API}/amigos/lista/${user.id}`);
    const amigos = await res.json();
    renderListaAmigos(amigos || []);
  } catch (e) {
    console.error('Error cargando lista de amigos', e);
  }
}

async function responderSolicitudAmistad(id, aceptar) {
  try {
    const res = await fetch(`${API}/amigos/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, aceptar })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof showAlert === 'function') showAlert('Solicitud actualizada', aceptar ? '¡Ahora son amigos!' : 'Solicitud rechazada.');
      cargarSolicitudesAmistad();
      cargarAmigos();
    } else {
      if (typeof showAlert === 'function') showAlert('Error', data.error || 'No se pudo actualizar la solicitud.');
    }
  } catch (e) {
    console.error('Error respondiendo solicitud', e);
  }
}

async function eliminarAmigo(amigoId) {
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) return;
  try {
    const res = await fetch(`${API}/amigos/eliminar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, amigoId })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof showAlert === 'function') showAlert('Amigo eliminado', 'Ya no tienes a este usuario como amigo.');
      cargarAmigos();
    } else {
      if (typeof showAlert === 'function') showAlert('Error', data.error || 'No se pudo eliminar al amigo.');
    }
  } catch (e) {
    console.error('Error eliminando amigo', e);
  }
}

function renderSolicitudesAmistad(solicitudes) {
  const lista = document.getElementById('friendRequestsList');
  if (!lista) return;
  lista.innerHTML = '';
  if (!solicitudes || solicitudes.length === 0) {
    lista.innerHTML = '<li style="opacity:0.7;">No tienes solicitudes pendientes.</li>';
    return;
  }
  solicitudes.forEach(sol => {
    const li = document.createElement('li');
    li.className = 'friend-request-item';
    li.style = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);';
    li.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#333,#111);display:flex;align-items:center;justify-content:center;color:#fff;"> <i class="fas fa-user"></i> </div>
        <div style="display:flex;flex-direction:column;">
          <strong style="font-size:0.95rem">${sol.de}</strong>
          <small style="opacity:0.7">ID: ${sol.de}</small>
          ${sol.mensaje && sol.mensaje.trim() ? `<div class='friend-msg' style='margin-top:4px;'>${sol.mensaje.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="background-button" onclick="responderSolicitudAmistad(${sol.id}, true)">Aceptar</button>
        <button class="background-button" onclick="responderSolicitudAmistad(${sol.id}, false)" style="background:linear-gradient(45deg,#666,#444);">Rechazar</button>
      </div>
    `;
    lista.appendChild(li);
  });
}

function renderListaAmigos(amigos) {
  const lista = document.getElementById('friendList');
  if (!lista) return;
  lista.innerHTML = '';
  if (!amigos || amigos.length === 0) {
    lista.innerHTML = '<li style="opacity:0.7;">No tienes amigos aún.</li>';
    return;
  }
  const myId = getCurrentUserId();
  amigos.forEach(am => {
    const amigoId = am.de === myId ? am.para : am.de;
    const li = document.createElement('li');
    li.className = 'friend-item';
    li.style = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);';
    li.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#333,#111);display:flex;align-items:center;justify-content:center;color:#fff;"> <i class="fas fa-user"></i> </div>
        <div style="display:flex;flex-direction:column;">
          <strong style="font-size:0.95rem">${amigoId}</strong>
          <small style="opacity:0.7">ID: ${amigoId}</small>
        </div>
      </div>
      <div>
        <button class="background-button" onclick="eliminarAmigo('${amigoId}')">Eliminar</button>
      </div>
    `;
    lista.appendChild(li);
  });
}

// Funciones para abrir/cerrar el panel de mensajes (usadas desde HTML)
window.closeMessagesPanel = function(){
  try{
    const panel = document.getElementById('messagesPanel');
    if(panel) panel.style.display = 'none';
    // hide the monthly reset warning when closing
    try{ const warn = document.getElementById('chatWarning'); if(warn){ warn.classList.remove('visible'); warn.setAttribute('aria-hidden','true'); } }catch(e){}
  }catch(e){ console.error('closeMessagesPanel error', e); }
}

window.openMessagesPanel = function(){
  try{
    const panel = document.getElementById('messagesPanel');
    if(!panel) return;
    panel.style.display = 'flex';
    // Si quieres cargar mensajes aquí, podemos llamar a una función como cargarChat(myId, amigoId)
  }catch(e){ console.error('openMessagesPanel error', e); }
}

// --- Mensajería: frontend funcional (conversaciones, carga, envío y polling) ---
window.__astral_currentConversation = null;
window.__astral_messagesPoll = null;

async function loadConversationsList() {
  const listEl = document.getElementById('conversationsList');
  if (!listEl) return;
  listEl.innerHTML = '<div style="opacity:0.7">Cargando conversaciones...</div>';
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) { listEl.innerHTML = '<div style="opacity:0.7">Inicia sesión para usar Mensajes.</div>'; return; }

  try {
    // Obtener lista de amigos y para cada uno intentar leer el último mensaje
    const res = await fetch(`${API}/amigos/lista/${user.id}`);
    const amigos = await res.json();
    if (!amigos || amigos.length === 0) { listEl.innerHTML = '<div style="opacity:0.7">No hay conversaciones aún.</div>'; return; }

    // Construir elementos
    listEl.innerHTML = '';
    for (const am of amigos) {
      const friendId = (am.de === user.id) ? am.para : am.de;
      let friend = null;
      try {
        const friendRes = await fetch(`${API}/usuarios/${friendId}`);
        friend = await friendRes.json();
      } catch (e) { /* ignore */ }
      // try to get last messages (non fatal)
      let lastText = '';
      let lastTs = null;
        try {
          const r2 = await fetch(`${API}/amigos/mensajes/${friendId}?user=${encodeURIComponent(user.id)}`);
          const msgs = await r2.json();
        if (Array.isArray(msgs) && msgs.length) {
            const last = msgs[msgs.length - 1];
            lastText = last.texto || last.mensaje || last.message || '';
            lastTs = last.fecha || last.created_at || last.ts || null;
        }
      } catch (e) { /* ignore per-friend errors */ }

      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.dataset.friendId = friendId;

      const avatar = document.createElement('div');
      avatar.className = 'conv-avatar';
      avatar.textContent = String(friendId).charAt(0).toUpperCase();

      const meta = document.createElement('div');
      meta.className = 'conv-meta';

      const top = document.createElement('div');
      top.className = 'conv-top';

      const nameEl = document.createElement('strong');
      nameEl.className = 'conv-name';
      nameEl.textContent = friendId;

      const tsEl = document.createElement('small');
      tsEl.className = 'conv-ts';
      tsEl.textContent = lastTs ? new Date(lastTs).toLocaleString() : '';

      top.appendChild(nameEl);
      top.appendChild(tsEl);

      const snippet = document.createElement('div');
      snippet.className = 'conv-snippet';
      snippet.textContent = (lastText || '').slice(0,80);

      meta.appendChild(top);
      meta.appendChild(snippet);
      if (friend) {
        const statusEl = document.createElement('div');
        statusEl.className = 'conv-status';
        statusEl.textContent = `Última: ${formatLastSeen(friend.last_seen)}`;
        meta.appendChild(statusEl);
      }

      item.appendChild(avatar);
      item.appendChild(meta);
      item.addEventListener('click', () => selectConversation(friendId));
      listEl.appendChild(item);
    }
  } catch (e) {
    console.error('Error cargando conversaciones', e);
    listEl.innerHTML = '<div style="opacity:0.7">Error al cargar conversaciones.</div>';
  }
}

async function selectConversation(friendId) {
  window.__astral_currentConversation = friendId;
  const header = document.getElementById('chatHeaderTitle');
  if (header){
    // Set the visible title element (keeps warning badge in place)
    const titleText = document.getElementById('chatTitleText');
    if(titleText) titleText.textContent = `Conversación — ${friendId}`;
    // Show the monthly-reset warning when a conversation is selected
    const warn = document.getElementById('chatWarning');
    if(warn) { warn.setAttribute('aria-hidden','false'); warn.classList.add('visible'); }
  }
  // mark active in conversations list
  try{
    document.querySelectorAll('#conversationsList .conversation-item').forEach(it => {
      try{ it.classList.toggle('active', it.dataset.friendId === String(friendId)); }catch(e){}
    });
  }catch(e){}
  await loadConversationMessages(friendId, true);
}

async function loadConversationMessages(friendId, scrollToBottom = true) {
  const msgsEl = document.getElementById('chatMessages');
  if (!msgsEl) return;
  msgsEl.innerHTML = '<div style="opacity:0.7">Cargando mensajes...</div>';
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) { msgsEl.innerHTML = '<div style="opacity:0.7">Inicia sesión para ver mensajes.</div>'; return; }

  try {
    const res = await fetch(`${API}/amigos/mensajes/${friendId}?user=${encodeURIComponent(user.id)}`);
    const mensajes = await res.json();
    msgsEl.innerHTML = '';
    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      msgsEl.innerHTML = '<div style="opacity:0.7">No hay mensajes en esta conversación.</div>';
      return;
    }

    for (const m of mensajes) {
      const row = document.createElement('div');
      const from = (m.de || m.from || m.sender || '');
      const text = m.texto || m.mensaje || m.message || '';
      const isMine = String(from) === String(user.id);
      row.className = 'msg-row ' + (isMine ? 'msg-mine' : 'msg-other');

      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble' + (isMine ? ' msg-mine' : '');

      const wrap = document.createElement('div');
      wrap.style.whiteSpace = 'pre-wrap';
      wrap.textContent = String(text);

      // timestamp + optional "Visto" indicator
      const meta = document.createElement('div');
      meta.className = 'msg-meta';

      const ts = document.createElement('div');
      ts.className = 'msg-ts';
      ts.textContent = m.fecha ? new Date(m.fecha).toLocaleString() : (m.created_at ? new Date(m.created_at).toLocaleString() : '');
      meta.appendChild(ts);

      // If this is our message and it has been read by the other user, show seen
      try{
        if (isMine && (m.leido === true || m.leido === 't' || m.leido === 1)) {
          const seen = document.createElement('span');
          seen.className = 'msg-seen';
          seen.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:11px;opacity:0.9;margin-left:4px">Visto</span>';
          meta.appendChild(seen);
        }
      }catch(e){}

      bubble.appendChild(wrap);
      bubble.appendChild(meta);
      row.appendChild(bubble);
      msgsEl.appendChild(row);
    }
    if (scrollToBottom) try { msgsEl.scrollTop = msgsEl.scrollHeight; } catch(e){}
  } catch (e) {
    console.error('Error cargando mensajes de', friendId, e);
    msgsEl.innerHTML = '<div style="opacity:0.7">Error al cargar mensajes.</div>';
  }
}

async function sendMessageToCurrentConversation() {
  const friendId = window.__astral_currentConversation;
  if (!friendId) return alert('Selecciona una conversación primero');
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const user = JSON.parse(localStorage.getItem('astralUser') || '{}');
  if (!user.id) return alert('Debes iniciar sesión para enviar mensajes');

  try {
    const token = localStorage.getItem('astralToken') || '';
    const res = await fetch(`${API}/amigos/mensaje`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ de: user.id, para: friendId, texto: text, token })
    });
    const data = await res.json();
    if (data && data.success) {
      input.value = '';
      await loadConversationMessages(friendId, true);
    } else {
      throw new Error(data && data.error ? data.error : 'Error enviando mensaje');
    }
  } catch (e) {
    console.error('Error enviando mensaje', e);
    alert(e.message || 'No se pudo enviar el mensaje');
  }
}

function startMessagesPolling() {
  stopMessagesPolling();
  // Poll every 6 seconds
  window.__astral_messagesPoll = setInterval(async () => {
    try {
      await loadConversationsList();
      if (window.__astral_currentConversation) await loadConversationMessages(window.__astral_currentConversation, false);
    } catch (e) { console.error('polling error', e); }
  }, 6000);
}

function stopMessagesPolling() {
  if (window.__astral_messagesPoll) { clearInterval(window.__astral_messagesPoll); window.__astral_messagesPoll = null; }
}

// Wire panel open/close to start/stop polling and attach send handler
document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('messagesPanel');
  const sendBtn = document.getElementById('chatSendBtn');
  const input = document.getElementById('chatInput');
  const reloadBtn = document.getElementById('chatReloadBtn');

  if (panel) {
    // when opened programmatically, ensure we load conversations and start polling
    const obs = new MutationObserver((mut) => {
      mut.forEach(m => {
        if (m.attributeName === 'style') {
          const disp = panel.style.display;
          if (disp && disp !== 'none') {
            loadConversationsList();
            startMessagesPolling();
          } else {
            stopMessagesPolling();
          }
        }
      });
    });
    obs.observe(panel, { attributes: true });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessageToCurrentConversation);
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessageToCurrentConversation(); } });
  if (reloadBtn) reloadBtn.addEventListener('click', async () => { if (window.__astral_currentConversation) await loadConversationMessages(window.__astral_currentConversation, true); });
});

// Wire header friends button and panel controls
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-friends');
  if (btn) btn.addEventListener('click', () => {
    const panel = document.getElementById('friendsPanel');
    if (!panel) return;
    panel.style.display = 'flex';
    cargarAmigos();
    cargarSolicitudesAmistad();
  });

  const addBtn = document.getElementById('addFriendBtn');
  const addInput = document.getElementById('addFriendInput');
  if (addBtn && addInput) addBtn.addEventListener('click', async () => {
    const id = addInput.value.trim();
    if (!id) return alert('Ingresa un ID de usuario válido');
    try {
      await enviarSolicitudAmistad(id, '¡Hola! Te envío una solicitud desde Astral');
      alert('Solicitud enviada');
      addInput.value = '';
    } catch (e) {
      console.error('Error enviando solicitud', e);
      alert(e.message || 'Error al enviar solicitud');
    }
  });
  // Wire messages button to open messages panel
  const msgBtn = document.getElementById('btn-messages');
  if (msgBtn) msgBtn.addEventListener('click', () => {
    try{
      const panel = document.getElementById('messagesPanel');
      if (!panel) return;
      panel.style.display = 'flex';
      // Optionally, focus an input inside the panel if exists
      const input = panel.querySelector('textarea, input[type="text"]');
      if (input) try{ input.focus(); }catch(e){}
    }catch(e){ console.error('btn-messages click error', e); }
  });
});

// Sidebar: initial active section (clicks handled globally by activateSection)
document.addEventListener("DOMContentLoaded", () => {
  const homeSection = document.getElementById("section-home");
  if (homeSection) homeSection.classList.add("active");
  // If there are pre-rendered sidebar/drawer items, ensure the 'home' one is active
  document.querySelectorAll('.sidebar-item, .drawer-item').forEach((btn) => {
    try { btn.classList.toggle('active', btn.dataset && btn.dataset.section === 'home') } catch (e) {}
  })
});

// Sidebar: initial active section (clicks handled globally by activateSection)
document.addEventListener("DOMContentLoaded", () => {
  const homeSection = document.getElementById("section-home");
  if (homeSection) homeSection.classList.add("active");
  // If there are pre-rendered sidebar/drawer items, ensure the 'home' one is active
  document.querySelectorAll('.sidebar-item, .drawer-item').forEach((btn) => {
    try { btn.classList.toggle('active', btn.dataset && btn.dataset.section === 'home') } catch (e) {}
  })
});
// Definir la lista de juegos aquí, solo en el script, no en el HTML
// Lista de juegos importada de lista.txt, formato multilínea y detallado
window.games = [
    {
      id: 90,
      title: "Declaracion de San Valentin",
      artist: "omargalav & reycorajr",
      thumbnail: "imgjuegos/valentin.png",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/valentin/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 89,
      title: "Papa's Pizzeria",
      artist: "No sé",
      thumbnail: "imgjuegos/papaspizza.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/papaspizzeria/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 88,
      title: "Buscaminas",
      artist: "nodefinido",
      thumbnail: "imgjuegos/buscaminas.png",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/buscaminas/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 87,
      title: "Dino",
      artist: "nodefinido",
      thumbnail: "imgjuegos/dino.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/dino/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 86,
      title: "Rooftop Snipers",
      artist: "nodefinido",
      thumbnail: "imgjuegos/rooftop.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/rooftopsnipers/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
        }
    },
    {
      id: 85,
      title: "Sandtrix",
      artist: "nodefinido",
      thumbnail: "imgjuegos/sandtrix.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/sandtrix/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 84,
      title: "Fluid Simulator",
      artist: "nodefinido",
      thumbnail: "imgjuegos/fuidsim.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/fluidsim/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 83,
      title: "We become what we behold",
      artist: "nodefinido",
      thumbnail: "imgjuegos/wbw.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/wbwwb/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
      id: 82,
      title: "Run",
      artist: "Ahora SI SIRVE DIOS MIO",
      thumbnail: "imgjuegos/run.jpeg",
      song: "juegosmusica/run3.mp3",
      url: "Juegos/run/index.html",
      categories: ["retro"],
      isNew: false,
      isUpdate: true,
      alert: {
          type: "loading",
          message: "No sirve jaja",
          redirect: "Juegos/run3fix2/index.html"
      }
    },
    {
        id: 81,
        title: "Run2",
        artist: "Ahora SI SIRVE DIOS MIO",
        thumbnail: "imgjuegos/run2.jpeg",
        song: "juegosmusica/run3.mp3",
        url: "Juegos/run2/index.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: true,
        alert: {
            type: "loading",
            message: "No sirve jaja",
            redirect: "Juegos/run3fix2/index.html"
        }
    },
    {
        id: 80,
        title: "Run3",
        artist: "Ahora SI SIRVE DIOS MIO",
        thumbnail: "imgjuegos/run3.jpeg",
        song: "juegosmusica/run3.mp3",
        url: "Juegos/run3/index.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: true,
        alert: {
            type: "loading",
            message: "No sirve jaja",
            redirect: "Juegos/run3fix2/index.html"
        }
    },

    

    {
        id: 79,
        title: "FNAF 4",
        artist: "?",
        thumbnail: "imgjuegos/fnaf4.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/fnaf4/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 78,
        title: "FNAF 3",
        artist: "?",
        thumbnail: "imgjuegos/fnaf3.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/fnaf3/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 77,
        title: "FNAF 2",
        artist: "?",
        thumbnail: "imgjuegos/fnaf2.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/fnaf2/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 76,
        title: "Fireboy and Watergirl 4",
        artist: "?",
        thumbnail: "imgjuegos/firewater4.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/fireboywatergirl4/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 75,
        title: "Fireboy and Watergirl 3",
        artist: "?",
        thumbnail: "imgjuegos/firewater3.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/fireboywatergirl3/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 74,
        title: "Fireboy and Watergirl 2",
        artist: "?",
        thumbnail: "imgjuegos/firewater2.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/fireboywatergirl2/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 73,
        title: "Subway Surfers",
        artist: "SYBO Games",
        thumbnail: "imgjuegos/SBS.jpeg",
        song: "juegosmusica/sbs.mp3",
        url: "Juegos/subway/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Superaras mi bellisimo record de 28765? :o",
            redirect: "Juegos/subwaysurferssanfrancisco/index.html"
        }
    },

    

    {
        id: 72,
        title: "Bad Piggies",
        artist: "Rovio Entertainment",
        thumbnail: "imgjuegos/badpiggies.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/badpiggies/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 71,
        title: "There is no game",
        artist: "Ahi esta en el juego",
        thumbnail: "imgjuegos/ting.png",
        song: "titulonuevo.mp3",
        url: "Juegos/there-is-no-game/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 70,
        title: "Stack",
        artist: "Vamos a apilar",
        thumbnail: "imgjuegos/stack.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/stack/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 69,
        title: "Hacker typer",
        artist: "Vamos a hackear",
        thumbnail: "imgjuegos/hacker.png",
        song: "titulonuevo.mp3",
        url: "Juegos/hackertype/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 68,
        title: "FNF fixed",
        artist: "ninjamuffin99",
        thumbnail: "imgjuegos/fnfviejo.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/fnffixed/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 67,
        title: "FNF: vs Sonic.exe",
        artist: "No sabemos quien hizo el port...",
        thumbnail: "imgjuegos/fnfsonicexe.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/fnfsonic-exe/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 66,
        title: "FNF: vs Among Us",
        artist: "No sabemos quien hizo el port...",
        thumbnail: "imgjuegos/fnfsus.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/fnfsus/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 65,
        title: "FNF: vs Doki Doki Literature Club",
        artist: "No sabemos quien hizo el port...",
        thumbnail: "imgjuegos/fnfdoki.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/fnfdoki/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 64,
        title: "Fruit Ninja",
        artist: "HalfBrick Studios",
        thumbnail: "imgjuegos/FN.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/fruitninja/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Te sirvio la pagina?",
            redirect: "tube.html"
        }
    },

    

    {
        id: 63,
        title: "Plantas Vs Zombies",
        artist: "EA",
        thumbnail: "imgjuegos/pvz.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/pvz/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¿Cual es tu musica favorita de la pagina?",
            redirect: "musica.html"
        }
    },

    

    {
        id: 62,
        title: "Roblox",
        artist: "Roblox Corporation",
        thumbnail: "imgjuegos/roblox.jpeg",
        song: "titulonuevo.mp3",
        url: "robloxad.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Esto ya ni visible es en la pagina para que seguir poniendo frases?",
            redirect: "robloxad.html"
        }
    },

    

    {
        id: 61,
        title: "Mario VS Luigi ONLINE",
        artist: "ipodtouch",
        thumbnail: "imgjuegos/MVLO.gif",
        song: "titulonuevo.mp3",
        url: "Juegos/mariovsluigi/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Esto ya ni visible es en la pagina para que seguir poniendo frases?",
            redirect: "robloxad.html"
        }
    },

    

    {
        id: 60,
        title: "Color Switch",
        artist: "David Reichelt",
        thumbnail: "imgjuegos/colorswitch.png",
        song: "Juegosmusica/minecraft.mp3",
        url: "Juegos/colorswitch/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/colorswitch/index.html"
        }
    },

    

    {
        id: 59,
        title: "Google Gravity",
        artist: "Gugul",
        thumbnail: "imgjuegos/googlegravity.jpeg",
        song: "Juegosmusica/minecraft.mp3",
        url: "Juegos/googlegravity-main/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/googlegravity-main/index.html"
        }
    },

    

    {
        id: 58,
        title: "Paper IO 2",
        artist: "Paper IO Team",
        thumbnail: "imgjuegos/paperio2.jpeg",
        song: "Juegosmusica/minecraft.mp3",
        url: "Juegos/paperio2/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/paperio/index.html"
        }
    },

    

    {
        id: 57,
        title: "Friday Night Funkin: Undertale",
        artist: "ninjamuffin69, PhantomArcade, evilsk8r, Kawai Sprite, AstralTeam",
        thumbnail: "imgjuegos/fnfunder.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/fnfundertale/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/fnfundertale/index.html"
        }
    },

    

    {
        id: 56,
        title: "Block Blast",
        artist: "Hungry Studio",
        thumbnail: "imgjuegos/blockblast.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/blockblast/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/blockblast/index.html"
        }
    },

    

    {
        id: 55,
        title: "Death Run 3D",
        artist: "Y8",
        thumbnail: "imgjuegos/deathrun3d.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/death-run-3d/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/death-run-3d/index.html"
        }
    },

    

    {
        id: 54,
        title: "Unfair Mario",
        artist: "Ni idea mijo",
        thumbnail: "imgjuegos/unfairmario.jpg",
        song: "juegosmusica/unfairmario.mp3",
        url: "Juegos/ita13/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/ita13/index.html"
        }
    },

    

    {
        id: 53,
        title: "Tunnel Rush",
        artist: "Deer Cat Games",
        thumbnail: "imgjuegos/tunnel.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/tunnel-rush/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Superate mi record de 1000 puntos.",
            redirect: "Juegos/tunnel-rush/index.html"
        }
    },

    

    {
        id: 52,
        title: "DON'T YOU LECTURE ME WITH YOUR THIRTY DOLLAR WEBSITE",
        artist: "GD COLON",
        thumbnail: "imgjuegos/30dollar.png",
        song: "titulonuevo.mp3",
        url: "Juegos/30dollarwebsite/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Crea la mejor musica.",
            redirect: "Juegos/30dollarwebsite/index.html"
        }
    },

    

    {
        id: 51,
        title: "2048",
        artist: "Poki",
        thumbnail: "imgjuegos/2014.png",
        song: "titulonuevo.mp3",
        url: "Juegos/2048/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡Sé INTELIGENTE y haz 2048!",
            redirect: "Juegos/2048/index.html"
        }
    },

    

    {
        id: 50,
        title: "Slopi",
        artist: "Y8",
        thumbnail: "imgjuegos/slope2.jpeg",
        song: "juegosmusica/slope.mp3",
        url: "Juegos/slope-2/index.html",
        categories: ["action"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡Es hora de esquivar los obstaculos! Pero ahora con tu pana.",
            redirect: "Juegos/slope-2/index.html"
        }
    },

    

    {
        id: 49,
        title: "Highway Racer",
        artist: "Bonecracker Games",
        thumbnail: "imgjuegos/highway.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/hwy-rcer/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Un juego en donde debes de correr a toda velocidad y evitar los demas carros.",
            redirect: "Juegos/hwy-rcer/index.html"
        }
    },

    

    {
        id: 48,
        title: "Stick Duel Battle",
        artist: "undefined",
        thumbnail: "imgjuegos/stick2.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/stick-duel-battle/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Un juego en donde debes de pelear contra tu compa o contra un bot con pistolas o a puño.",
            redirect: "Juegos/stick-duel-battle/index.html"
        }
    },

    

    {
        id: 47,
        title: "The World's Hardest Game",
        artist: "undefined",
        thumbnail: "imgjuegos/hard.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/ita10/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "El juego mas dificil del mundo, no te enojes si no puedes pasar el primer nivel. Esta demasiado dificil.",
            redirect: "Juegos/ita10/index.html"
        }
    },

    

    {
        id: 46,
        title: "Stickman Hook",
        artist: "?",
        thumbnail: "imgjuegos/stick.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/stickman-hook/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Un juego de balancearse como un loco, pero no te caigas.",
            redirect: "Juegos/stickman-hook/index.html"
        }
    },

    

    {
        id: 45,
        title: "PolyTrack",
        artist: "PolyTrack",
        thumbnail: "imgjuegos/poly.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/polytrack/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Un juego de carreras donde debes evitar los obstaculos y llegar a la meta.",
            redirect: "Juegos/polytrack/index.html"
        }
    },

    

    {
        id: 44,
        title: "Tertis Chafa",
        artist: "NotArtistAvailable",
        thumbnail: "imgjuegos/tetris.jpg",
        song: "titulonuevo.mp3",
        url: "Juegos/ita11/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Crea una linea de 4 bloques para eliminarla, pero no dejes que se llene la pantalla.",
            redirect: "Juegos/ita11/index.html"
        }
    },

    

    {
        id: 43,
        title: "A Dance of Fire and Ice",
        artist: "Ni idea crack",
        thumbnail: "imgjuegos/adofai.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/a-dance-of-fire-and-ice/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Music-rhythm game, donde debes seguir el ritmo de la musica, es un juego muy bueno.",
            redirect: "Juegos/a-dance-of-fire-and-ice/index.html"
        }
    },

    

    {
        id: 42,
        title: "Google Snake",
        artist: "Google",
        thumbnail: "imgjuegos/snake.jpeg",
        song: "titulonuevo.mp3",
        url: "Juegos/google-snake/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Comete esta manzana, pero no te comas a ti mismo. Poetico.",
            redirect: "Juegos/google-snake/index.html"
        }
    },

    

    {
        id: 41,
        title: "Super Mario Combat",
        artist: "Sun-studios",
        thumbnail: "imgjuegos/mariocombat.jpeg",
        song: "juegosmusica/mariocombat.mp3",
        url: "Juegos/ita9/index.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Un juego de combate bien chidoris, muevete con las flechas y ataca con la letra a",
            redirect: "Juegos/ita9/index.html"
        }
    },

    

    {
        id: 40,
        title: "BitLife",
        artist: "Ni idea crack",
        thumbnail: "imgjuegos/bitlife.png",
        song: "titulonuevo.mp3",
        url: "Juegos/bitlife/index.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: true,
        alert: {
            type: "loading",
            message: "No seas abogado, te arruinara la vida, creeme.",
            redirect: "Juegos/bitlife/index.html"
        }
    },

    

    {
        id: 39,
        title: "Angry Birds",
        artist: "ROVIO",
        thumbnail: "imgjuegos/angry.jpeg",
        song: "juegosmusica/angry.mp3",
        url: "Juegos/angrybirds/index.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: true,
        alert: {
            type: "loading",
            message: "Nunca uses el pajaro azul >:l",
            redirect: "Juegos/angrybirds/index.html"
        }
    },

    

    {
        id: 38,
        title: "Cat Tenis",
        artist: "?",
        thumbnail: "imgjuegos/cattenis.png",
        song: "juegosmusica/cattenis.mp3",
        url: "Juegos/cattenis/index.html",
        categories: ["puzzle"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Ganale en el tenis al gatito.",
            redirect: "Juegos/cattenis/index.html"
        }
    },

    

    {
        id: 37,
        title: "Slowroads",
        artist: "slowroads.io",
        thumbnail: "imgjuegos/slowroad.jpeg",
        song: "juegosmusica/cattenis.mp3",
        url: "Juegos/slowroads/index.html",
        categories: ["puzzle"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "Ganale en el tenis al gatito.",
            redirect: "Juegos/slowroads/index.html"
        }
    },

    

    {
        id: 36,
        title: "8 Ball Pool",
        artist: "?",
        thumbnail: "imgjuegos/8ballpool.jpeg",
        song: "titulo.mp3",
        url: "Juegos/8ball/index.html",
        categories: ["puzzle"],
        isNew: false,
        isUpdate: true,
        alert: {
            type: "loading",
            message: "¿Alguien realmente lee esto?",
            redirect: "Juegos/8ball/index.html"
        }
    },

    

    {
        id: 35,
        title: "Juego no disponible 10",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 34,
        title: "Juego no disponible 9",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 33,
        title: "Wii Simulation",
        artist: "The Onliine Project",
        thumbnail: "imgjuegos/Wii.png",
        song: "juegosmusica/wii.mp3",
        url: "Juegos/vwii/index.html",
        categories: ["retro"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Nintendo no me demandes aaaa",
            redirect: "Juegos/vwii/index.html"
        }
    },

    

    {
        id: 32,
        title: "Minecraft Precision Client",
        artist: "Mojang/Precision Client",
        thumbnail: "imgjuegos/minecraft.jpg",
        song: "juegosmusica/mc.mp3",
        url: "Juegos/minecraft/index.html",
        categories: ["action"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡Si quieres jugar con tus amigos abre el mundo a LAN!",
            redirect: "Juegos/minecraft/index.html"
        }
    },

    

    {
        id: 31,
        title: "Juego no disponible 8",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 30,
        title: "Geometry Dash (Unity WebGL)",
        artist: "Not Avaible",
        thumbnail: "imgjuegos/gds.jpeg",
        song: "juegosmusica/gd.mp3",
        url: "Juegos/geometry-dash-lite/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Pasate time machine en 1 intento",
            redirect: "Juegos/geometry-dash-lite/index.html"
        }
    },

    

    {
        id: 29,
        title: "Geometry Dash (Scratch)",
        artist: "Robert Nicholas Christian Topala",
        thumbnail: "imgjuegos/gds.jpeg",
        song: "juegosmusica/gd.mp3",
        url: "Juegos/geometrydash/index.html",
        categories: ["all"],
        isNew: true,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Pasate time machine en 1 intento",
            redirect: "Juegos/geometrydash/index.html"
        }
    },

    

    {
        id: 28,
        title: "Tetris pirata",
        artist: "NA",
        thumbnail: "imgjuegos/tetris.jpg",
        song: "",
        url: "Juegos/tetris/index.html",
        categories: ["all"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "info",
            message: "¡Bienvenido a Astral!",
            redirect: "mensaje.html"
        }
    },

    

    {
        id: 27,
        title: "Juego no disponible 7",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 26,
        title: "Juego no disponible 6",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 25,
        title: "Juego no disponible 5",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },


    

    {
        id: 24,
        title: "8 Ball Pool (OLD)",
        artist: "?",
        thumbnail: "imgjuegos/8ballpool.jpeg",
        song: "titulo.mp3",
        url: "Juegos/8ball/index.html",
        categories: ["puzzle"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Alguien realmente lee esto?",
            redirect: "Juegos/ita8/index.html"
        }
    },

    

    {
        id: 23,
        title: "Fireboy & Watergirl",
        artist: "?",
        thumbnail: "imgjuegos/FYW.jpeg",
        song: "titulo.mp3",
        url: "Juegos/firewater/index.html",
        categories: ["puzzle"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Cual personaje prefieres ser?",
            redirect: "Juegos/firewater/index.html"
        }
    },

    

    {
        id: 22,
        title: "Cut the Rope",
        artist: "Zeptolabs",
        thumbnail: "imgjuegos/ctr.jpg",
        song: "juegosmusica/ctr.mp3",
        url: "Juegos/ctr/index.html",
        categories: ["puzzle"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡La araña se llevara tu caramelo pronto!",
            redirect: "Juegos/ctr/index.html"
        }
    },

    

    {
        id: 21,
        title: "DOOM",
        artist: "NA",
        thumbnail: "imgjuegos/doom.jpeg",
        song: "juegosmusica/doom.mp3",
        url: "Juegos/doom/index.html",
        categories: ["action"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡No ejecutes esto en un cactus!",
            redirect: "Juegos/doom/index.html"
        }
    },

    

    {
        id: 20,
        title: "Windows XP",
        artist: "Open Source Docker",
        thumbnail: "imgjuegos/winxp.jpeg",
        song: "titulo.mp3",
        url: "Juegos/winxp/VirtualXP.htm",
        categories: ["all"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Tan siquiera alguien usa esto?",
            redirect: "Juegos/winxp/VirtualXP.htm"
        }
    },

    

    {
        id: 19,
        title: "FNF Garcello Mod",
        artist: "NA",
        thumbnail: "imgjuegos/fnfg.jpeg",
        song: "juegosmusica/fnfv.mp3",
        url: "Juegos/fnfg/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        folder: "fnf",
        alert: {
            type: "loading",
            message: "¡No vayas a matar a Garcello!",
            redirect: "Juegos/fnfg/index.html"
        }
    },

    

    {
        id: 18,
        title: "Slope",
        artist: "Y8",
        thumbnail: "imgjuegos/slope.jpg",
        song: "juegosmusica/slope.mp3",
        url: "Juegos/slope/index.html",
        categories: ["action"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡Es hora de esquivar los obstaculos!",
            redirect: "Juegos/slope/index.html"
        }
    },


    

    {
        id: 17,
        title: "FNF Vs Shaggy",
        artist: "NA",
        thumbnail: "imgjuegos/fnfvsshaggy.jpeg",
        song: "juegosmusica/fnfv.mp3",
        url: "Juegos/fnfshaggy/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        folder: "fnf",
        alert: {
            type: "loading",
            message: "¡Valiste Churro!",
            redirect: "Juegos/fnfshaggy/index.html"
        }
    },

    

    {
        id: 16,
        title: "Juego no disponible 4",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    {
        id: 15,
        title: "FNFOriginal",
        artist: "ninjamuffin",
        thumbnail: "imgjuegos/fnfviejo.jpeg",
        song: "juegosmusica/fnfv.mp3",
        url: "Juegos/fnfviejo/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        folder: "fnf",
        alert: {
            type: "loading",
            message: "¡No pierdas!",
            redirect: "Juegos/fnfviejo/index.html"
        }
    },
    

    {
        id: 14,
        title: "Juego no disponible 3",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },
    

    {
        id: 13,
        title: "FNAF 1",
        artist: "Scott",
        thumbnail: "imgjuegos/fnafbg.jpeg",
        song: "juegosmusica/fnaf.mp3",
        url: "Juegos/FNAF1/index.html",
        categories: ["action"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "undefined",
            redirect: "Juegos/FNAF1/index.html"
        }
    },

    

    {
        id: 12,
        title: "Juego no disponible 2",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 11,
        title: "Juego no disponible 1",
        artist: "<no definido>",
        thumbnail: "",
        song: "",
        url: "Juegos/no.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        folder: "mario",
        alert: {
            type: "loading",
            message: "¡No olvides tirar al pinguino por el vacio!",
            redirect: "Juegos/SM64/index.html"
        }
    },

    

    {
        id: 10,
        title: "Sonic Mania",
        artist: "SEGA",
        thumbnail: "imgjuegos/mania.jpg",
        song: "juegosmusica/mania.mp3",
        url: "Juegos/mania/index.html",
        categories: ["retro"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Cuando inicie el juego presiona ESC (Escape) en tu teclado para iniciar un mod menu, ahi elije el nivel porque el menu no sirve.",
            redirect: "Juegos/mania/RSDKv5.html"
        }
    },

    

    {
        id: 9,
        title: "Tomb of The Mask",
        artist: "NA",
        thumbnail: "imgjuegos/totm.jpg",
        song: "titulo.mp3",
        url: "Juegos/totm/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡Veremos quien es el mejor!",
            redirect: "Juegos/totm/index.html"
        }
    },

    

    {
        id: 8,
        title: "Henry Stickmin: BTB",
        artist: "Puffballs United & Newgrounds",
        thumbnail: "imgjuegos/btb.jpeg",
        song: "juegosmusica/hsita.mp3",
        url: "Juegos/ita3/index.html",
        categories: ["strategy"],
        isNew: false,
        isUpdate: false,
        folder: "henry",
        alert: {
            type: "info",
            message: "Recomendamos pantalla completa.",
            redirect: "Juegos/ita3/index.html"
        }
    },

    

    {
        id: 7,
        title: "Henry Stickmin: ETP",
        artist: "Puffballs United & Newgrounds",
        thumbnail: "imgjuegos/etp.jpeg",
        song: "juegosmusica/hsita.mp3",
        url: "Juegos/ita4/index.html",
        categories: ["strategy"],
        isNew: false,
        isUpdate: false,
        folder: "henry",
        alert: {
            type: "info",
            message: "Recomendamos pantalla completa.",
            redirect: "Juegos/ita4/index.html"
        }
    },

    

    {
        id: 6,
        title: "Henry Stickmin: STD",
        artist: "Puffballs United & Newgrounds",
        thumbnail: "imgjuegos/std.jpeg",
        song: "juegosmusica/hsita.mp3",
        url: "Juegos/ita5/index.html",
        categories: ["strategy"],
        isNew: false,
        isUpdate: false,
        folder: "henry",
        alert: {
            type: "info",
            message: "Recomendamos pantalla completa.",
            redirect: "Juegos/ita5/index.html"
        }
    },

    

    {
        id: 5,
        title: "Henry Stickmin: ITA",
        artist: "Puffballs United & Newgrounds",
        thumbnail: "imgjuegos/ita.jpg",
        song: "juegosmusica/hsita.mp3",
        url: "Juegos/ita/index.html",
        categories: ["strategy"],
        isNew: false,
        isUpdate: false,
        folder: "henry",
        alert: {
            type: "info",
            message: "Recomendamos pantalla completa.",
            redirect: "Juegos/ita/index.html"
        }
    },

    

    {
        id: 4,
        title: "Henry Stickmin: FTC",
        artist: "Puffballs United & Newgrounds",
        thumbnail: "imgjuegos/ftc.jpeg",
        song: "juegosmusica/hsita.mp3",
        url: "Juegos/ita6/index.html",
        categories: ["strategy"],
        isNew: false,
        isUpdate: false,
        folder: "henry",
        alert: {
            type: "info",
            message: "Recomendamos pantalla completa.",
            redirect: "Juegos/ita6/index.html"
        }
    },

    

    {
        id: 3,
        title: "The Binding Of Isaac - FL",
        artist: "Edmund McMillen, Florian Himsl",
        thumbnail: "imgjuegos/isaacico.jpg",
        song: "juegosmusica/isaac.mp3",
        url: "Juegos/ita2/index.html",
        categories: ["action"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "info",
            message: "Recomendamos pantalla completa.",
            redirect: "Juegos/ita2/index.html"
        }
    },

    

    {
        id: 2,
        title: "Crossy Road",
        artist: "Hipster Whale",
        thumbnail: "imgjuegos/crossy.jpg",
        song: "juegosmusica/tloi.mp3",
        url: "Juegos/crossyroad/index.html",
        categories: ["arcade"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¡Mira 2 veces antes de cruzar la calle!",
            redirect: "Juegos/crossyroad/index.html"
        }
    },

    

    {
        id: 1,
        title: "Bad Ice Cream 1",
        artist: "NA",
        thumbnail: "Juegos/badicecream/bad-ice-cream.png",
        song: "titulo.mp3",
        url: "Juegos/badicecream/index.html",
        categories: ["puzzle"],
        isNew: false,
        isUpdate: false,
        alert: {
            type: "loading",
            message: "¿Realmente alguien juega esto? Ya ni sé porque lo meti.",
            redirect: "Juegos/badicecream/index.html"
        }
    }


];

// IDs are permanently normalized. See tools/normalize_ids.py for details.


const API_URL = "https://astral-ban-api.onrender.com"

document.addEventListener("DOMContentLoaded", () => {
    // Sidebar: navegación de secciones
    const sidebar = document.getElementById("main-sidebar")
    const mainContent = document.getElementById("main-content")
    if (sidebar && mainContent) {
      sidebar.addEventListener("click", (e) => {
        const btn = e.target.closest(".sidebar-item")
        if (!btn) return
        // Cambiar activo
        sidebar.querySelectorAll(".sidebar-item").forEach(b => b.classList.remove("active"))
        btn.classList.add("active")
        // Mostrar sección
        const section = btn.dataset.section
        mainContent.querySelectorAll(".content-section").forEach(sec => {
          sec.classList.remove("active")
          if (sec.id === `section-${section}`) {
            sec.classList.add("active")
          }
        })
      })
    }
  // Referencias al DOM
  const loaderScreen = document.getElementById("loader-screen")
  const titleScreen = document.getElementById("title-screen")
  const setupScreen = document.getElementById("setup-screen")
  const appScreen = document.getElementById("app-screen")
  const bgMusic = document.getElementById("bg-music")

  // Configuración
  const LOADING_TIME = 3000 // Tiempo de carga simulada (ms)
  let isTitleScreenActive = false


  // Ensure playMusic exists (safe no-op if audio not available)
  function playMusic(){
    try{
      const bg = document.getElementById('bg-music');
      if(bg && typeof bg.play === 'function'){
        bg.play().catch(()=>{});
      }
    }catch(e){/* ignore */}
  }

  // Paso 1: Simular Carga y actualizar barra
  const RANDOM_LOADING_TIME = Math.floor(Math.random() * 3000) + 3000; // 3000-6000ms
  simulateLoadingProgress(RANDOM_LOADING_TIME);

  function simulateLoadingProgress(totalMs){
      const start = Date.now();
      const light = document.getElementById('loading-light');
      const status = document.getElementById('loading-status');
      const percent = document.getElementById('loading-percent');
      
      if(!light) {
          setTimeout(transitionToPretitle, totalMs);
          return;
      }

      // Mensajes de carga que cambiarán durante el proceso
      const loadingMessages = [
          "Preparando recursos del sistema...",
          "Inicializando módulos...",
          "Cargando componentes gráficos...",
          "Verificando conexión...",
          "Preparando interfaz...",
          "Casi listo..."
      ];

      function updateProgress(){
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / totalMs, 1);
          const pct = Math.floor(progress * 100);
          
          // Actualizar barra
          light.style.width = pct + '%';
          
          // Actualizar porcentaje
          if(percent) percent.textContent = pct + '%';
          
          // Actualizar mensaje según el progreso
          if(status) {
              if(pct < 15) {
                  status.textContent = loadingMessages[0];
              } else if(pct < 30) {
                  status.textContent = loadingMessages[1];
              } else if(pct < 50) {
                  status.textContent = loadingMessages[2];
              } else if(pct < 70) {
                  status.textContent = loadingMessages[3];
              } else if(pct < 90) {
                  status.textContent = loadingMessages[4];
              } else {
                  status.textContent = loadingMessages[5];
              }
          }
          
          if(progress < 1){
              requestAnimationFrame(updateProgress);
          } else {
              // Carga completa, transicionar
              setTimeout(transitionToPretitle, 200);
          }
      }
      
      requestAnimationFrame(updateProgress);
  }
  function simulateLoadingProgress(totalMs){
    const start = Date.now();
    const light = document.getElementById('loading-light');
    const status = document.getElementById('loading-status');
    const percent = document.getElementById('loading-percent');
    if(!light) {
      setTimeout(transitionToTitle, totalMs);
      return;
    }
    const tick = ()=>{
      const elapsed = Math.min(Date.now() - start, totalMs);
      const p = Math.round((elapsed / totalMs) * 100);
      light.style.width = p + "%";
      if(percent) percent.textContent = p + "%";
      if(status) status.textContent = (p < 100) ? "CARGANDO RECURSOS..." : "FINALIZADO";
      if(elapsed < totalMs) requestAnimationFrame(tick);
      else setTimeout(transitionToPretitle, 420);
    };
    requestAnimationFrame(tick);
  }

  // --- PRETITLE: show a one-time screen for N seconds before showing title ---
  const PRETITLE_TIME = 20000;
  let _pretitleTimeout = null;
  let _pretitleInterval = null;

  function transitionToPretitle(){
    // hide loader visual
    loaderScreen.classList.add('fade-out');
    setTimeout(()=>{
      loaderScreen.classList.add('hidden');
      loaderScreen.classList.remove('active');

      // show pretitle
      const pre = document.getElementById('pretitle-screen');
      const fill = document.getElementById('pretitle-fill');
      const timerEl = document.querySelector('.pretitle-timer');
      if(!pre) return transitionToTitle();
      pre.classList.remove('hidden');
      pre.classList.add('fade-in');

      // countdown
      let remaining = Math.ceil(PRETITLE_TIME / 1000);
      if(timerEl) timerEl.textContent = remaining + 's';
      let start = Date.now();
      const tick = ()=>{
        const elapsed = Math.min(Date.now() - start, PRETITLE_TIME);
        const p = Math.round((elapsed / PRETITLE_TIME) * 100);
        if(fill) fill.style.width = p + '%';
        const secsLeft = Math.ceil((PRETITLE_TIME - elapsed)/1000);
        if(timerEl) timerEl.textContent = (secsLeft > 0 ? secsLeft + 's' : '0s');
      };
      tick();
      _pretitleInterval && clearInterval(_pretitleInterval);
      _pretitleInterval = setInterval(tick, 250);

      // After PRETITLE_TIME, go to title
      _pretitleTimeout = setTimeout(()=>{
        clearInterval(_pretitleInterval);
        _pretitleInterval = null;
        pre.classList.add('fade-out');
        setTimeout(()=>{
          pre.classList.add('hidden');
          pre.classList.remove('fade-in');
          pre.classList.remove('fade-out');
          transitionToTitle();
        }, 420);
      }, PRETITLE_TIME);

      // clicking or pressing Enter/Esc/Space will skip pretitle
      const skipHandler = (ev)=>{ if(ev.type === 'keydown'){ if(!(ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape')) return; } ev.preventDefault();
          if(_pretitleTimeout) clearTimeout(_pretitleTimeout);
          if(_pretitleInterval) clearInterval(_pretitleInterval);
          _pretitleTimeout = null; _pretitleInterval = null;
          pre.classList.add('fade-out');
          setTimeout(()=>{
            pre.classList.add('hidden');
            pre.classList.remove('fade-in');
            pre.classList.remove('fade-out');
            transitionToTitle();
          }, 200);
      };
      pre.addEventListener('click', skipHandler, { once: true });
      document.addEventListener('keydown', skipHandler, { once: true });

    }, 420);
  }

  function transitionToTitle() {
    // Show Title Screen
    const titleScreen = document.getElementById('title-screen');
    if(!titleScreen) return showApp();
    titleScreen.classList.remove('hidden');
    titleScreen.classList.add('fade-in');
    isTitleScreenActive = true;

    // Try to play title music
    try{ if(!window.__astral_instructionsOpen){ const titleMusic = document.getElementById('title-music'); if(titleMusic) titleMusic.play().catch(()=>{}); } }catch(e){}
    // Start audio-reactive visuals for the title screen (if possible)
    try{ if(window.startTitleReactive) window.startTitleReactive(); }catch(e){}
  }

  // Click / keyboard handlers to start from title (allow clicking anywhere on the screen)
  const titleStartEl = document.getElementById('title-start');
  const titleScreenEl = document.getElementById('title-screen');
  if(titleStartEl){
    titleStartEl.addEventListener('click', (e)=>{ if(isTitleScreenActive) transitionToApp(); });
    titleStartEl.addEventListener('keydown', (e)=>{ if((e.key === 'Enter' || e.key === ' ') && isTitleScreenActive) { e.preventDefault(); transitionToApp(); } });
  }
  if(titleScreenEl){
    // click anywhere on the title screen starts the app
    titleScreenEl.addEventListener('click', (e)=>{ if(isTitleScreenActive) transitionToApp(); });
    titleScreenEl.addEventListener('keydown', (e)=>{ if((e.key === 'Enter' || e.key === ' ') && isTitleScreenActive) { e.preventDefault(); transitionToApp(); } });
  }

  // Allow user to click or press Enter/Space on loader to skip to title immediately
  const loaderScreenEl = document.getElementById('loader-screen');
  if(loaderScreenEl){
    loaderScreenEl.addEventListener('click', (e)=>{ transitionToPretitle(); });
    loaderScreenEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); transitionToPretitle(); } });
  }

  // If user presses Enter on the keyboard while title is visible, start app and play music (global fallback)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('title-screen').classList.contains('active')) {
      if (bgMusic) bgMusic.pause();
      const titleMusic = document.getElementById('title-music');
      if (titleMusic) titleMusic.play().catch(()=>{});
      if(isTitleScreenActive) transitionToApp();
    }
  });

  /* === Title audio-reactive helper === */
  (function(){
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let rafId = null;
    const pressEl = document.getElementById('press-start');
    const bgEl = document.getElementById('bg-music') || document.getElementById('title-music');

    window.startTitleReactive = function(){
      if(!pressEl || !bgEl) return;
      if(rafId) return; // already running
      try{
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        // Create analyser only once, connecting media element source to destination via analyser
        if(!analyser){
          try{
            const src = audioCtx.createMediaElementSource(bgEl);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyser.connect(audioCtx.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
          }catch(e){ console.warn('Title reactive: media element source failed', e); analyser = null; }
        }

        const resumeAndAnimate = ()=>{
          if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
          pressEl.classList.add('reactive');
          const tick = ()=>{
            try{
              if(!analyser) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for(let i=0;i<dataArray.length;i++) sum += dataArray[i];
              const avg = sum / dataArray.length / 255; // 0..1
              // amplify a little and clamp for a pleasing effect
              const beat = Math.min(0.6, Math.pow(avg,0.9) * 1.6);
              pressEl.style.setProperty('--beat', String(beat));
            }catch(e){ console.warn('Title reactive tick failed', e); }
            rafId = requestAnimationFrame(tick);
          };
          if(!rafId) tick();
        };

        // Start when audio plays or on next user interaction
        if(bgEl.paused) bgEl.addEventListener('play', resumeAndAnimate, { once: true });
        else resumeAndAnimate();
        document.addEventListener('click', resumeAndAnimate, { once: true });
      }catch(e){ console.warn('startTitleReactive failed', e); }
    };

    window.stopTitleReactive = function(){
      try{ if(rafId) cancelAnimationFrame(rafId); rafId = null; }catch(e){}
      try{ if(pressEl){ pressEl.style.removeProperty('--beat'); pressEl.classList.remove('reactive'); } }catch(e){}
    };
  })();

  // NOTE: the unified `transitionToTitle` is defined earlier (used by pretitle flow). Removed older duplicate implementation.

  async function showApp() {
    // Stop any title-screen specific visuals before leaving
    try{ if(window.stopTitleReactive) window.stopTitleReactive(); }catch(e){}

    appScreen.classList.remove("hidden");
    appScreen.classList.add("fade-in");
    createFooterDrawer();

    // Mejorar sección de inicio con info y logo
    renderHomeSection();
    // Renderizar juegos
    renderGamesSection();

    // Mostrar nombre y avatar reales en el header, intentando varias fuentes
    try {
      let user = null;
      let avatarUrl = null;
      let username = null;
      // 1. Primero intenta localStorage
      const userStr = localStorage.getItem("astralUser");
      if (userStr) {
        user = JSON.parse(userStr);
        avatarUrl = user.avatar;
        username = user.username || user.name || user.id || "Player";
      }
      // 2. Si no hay avatar o es local, intenta obtenerlo de la API
      if (!avatarUrl || avatarUrl.startsWith("data:image") || avatarUrl.trim() === "") {
        // Intenta obtener por ID o username
        /* Lines 129-144 omitted */
      }
      // 3. Si sigue sin avatar, busca en /usuarios y filtra por username
      if ((!avatarUrl || avatarUrl.startsWith("data:image") || avatarUrl.trim() === "") && username) {/* Lines 147-155 omitted */}
      // 4. Si aún no hay avatar, usa generador externo
      if (!avatarUrl || avatarUrl.trim() === "" || avatarUrl.startsWith("data:image")) {/* Lines 158-159 omitted */}
      // Actualiza header
      const avatarImg = document.getElementById("header-avatar");
      const usernameSpan = document.getElementById("header-username");
      if (avatarImg) {
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function() {
          avatarImg.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username || "Player");
        };
      }
      if (usernameSpan) usernameSpan.textContent = username || "Player";
    } catch (e) {
      console.error("Error loading user data for header", e);
    }

    // Pausar música anterior y reproducir title.mp3
    try {
      const bgMusic = document.getElementById("bg-music");
      if (bgMusic && !bgMusic.paused) {/* Lines 178-180 omitted */}
      const titleMusic = document.getElementById("title-music");
      if (titleMusic) {/* Lines 183-213 omitted */}
    } catch (e) {
      console.error("Error loading user data for header", e);
    }
  }

  // Renderiza la sección de inicio mejorada
  function renderHomeSection() {
    const homeSection = document.getElementById("section-home");
    if (!homeSection) return;
    homeSection.innerHTML = `
      <img src="logo.png" alt="Astral Logo" class="home-logo" style="width:120px;filter:drop-shadow(0 0 16px var(--accent-cyan));margin-bottom:18px;">
      <h1 class="section-title" style="font-size:2.8rem;">Bienvenido a <span style="color:var(--accent-purple)">Astral</span></h1>
      <p class="welcome-message" style="font-size:1.3rem;max-width:600px;margin:0 auto 18px auto;">Explora el universo de Astral: una plataforma de juegos, comunidad y novedades. ¡Disfruta de tus juegos favoritos, descubre nuevos lanzamientos y mantente al día con las actualizaciones!</p>
      <div class="home-info" style="background:rgba(0,242,255,0.07);border-radius:16px;padding:18px 24px;max-width:600px;margin:0 auto 0 auto;box-shadow:0 2px 16px rgba(0,242,255,0.08);">
        <b>¿Qué es Astral?</b><br>
        Astral es una plataforma web donde puedes jugar, compartir y descubrir juegos clásicos y nuevos, todo en un solo lugar.<br>
        <b>Características:</b> Juegos retro y modernos, comunidad, perfiles personalizados, y más.<br>
      </div>
    `;
  }

  // Renderiza la sección de juegos con la lista


  async function showApp() {

    appScreen.classList.remove("hidden");
    appScreen.classList.add("fade-in");
    createFooterDrawer();

    // Mostrar nombre y avatar reales en el header, intentando varias fuentes
    try {
      let user = null;
      let avatarUrl = null;
      let username = null;
      // 1. Primero intenta localStorage
      const userStr = localStorage.getItem("astralUser");
      if (userStr) {
        user = JSON.parse(userStr);
        avatarUrl = user.avatar;
        username = user.username || user.name || user.id || "Player";
      }
      // 2. Si no hay avatar o es local, intenta obtenerlo de la API
      if (!avatarUrl || avatarUrl.startsWith("data:image") || avatarUrl.trim() === "") {
        // Intenta obtener por ID o username
        let userId = user && (user.id || user.username);
        if (!userId && user && user.email) userId = user.email;
        if (userId) {
          try {
            // Buscar por ID
            let res = await fetch(`${API_URL}/usuarios/${encodeURIComponent(userId)}`);
            if (res.ok) {
              const apiUser = await res.json();
              if (apiUser && apiUser.avatar) {
                avatarUrl = apiUser.avatar;
                if (apiUser.username) username = apiUser.username;
              }
            }
          } catch {}
        }
      }
      // 3. Si sigue sin avatar, busca en /usuarios y filtra por username
      if ((!avatarUrl || avatarUrl.startsWith("data:image") || avatarUrl.trim() === "") && username) {
        try {
          let res = await fetch(`${API_URL}/usuarios`);
          if (res.ok) {
            const users = await res.json();
            const found = users.find(u => u.username === username || u.id === username);
            if (found && found.avatar) avatarUrl = found.avatar;
          }
        } catch {}
      }
      // 4. Si aún no hay avatar, usa generador externo
      if (!avatarUrl || avatarUrl.trim() === "" || avatarUrl.startsWith("data:image")) {
        avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username || "Player");
      }
      // Actualiza header
      const avatarImg = document.getElementById("header-avatar");
      const usernameSpan = document.getElementById("header-username");
      if (avatarImg) {
        avatarImg.src = avatarUrl;
        avatarImg.onerror = function() {
          avatarImg.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username || "Player");
        };
      }
      if (usernameSpan) usernameSpan.textContent = username || "Player";
    } catch (e) {
      console.error("Error loading user data for header", e);
    }

    // Pausar música anterior y reproducir title.mp3
    try {
      const bgMusic = document.getElementById("bg-music");
      if (bgMusic && !bgMusic.paused) {
        fadeOutAudio(bgMusic, 1000);
        setTimeout(() => { bgMusic.pause(); bgMusic.currentTime = 0 }, 1000);
      }
      const titleMusic = document.getElementById("title-music");
      if (titleMusic) {
        titleMusic.volume = 0;
        const fadeIn = () => {
          let v = 0;
          const fade = setInterval(() => {
            v += 0.05;
            titleMusic.volume = Math.min(v, 1);
            if (v >= 1) clearInterval(fade);
          }, 50);
        };
        const tryPlay = () => {
          titleMusic.play().then(fadeIn).catch(() => {
            // Autoplay bloqueado, esperar interacción
            const startAudio = () => {
              titleMusic.play().then(fadeIn);
              document.removeEventListener("click", startAudio);
              document.removeEventListener("keydown", startAudio);
            };
            document.addEventListener("click", startAudio);
            document.addEventListener("keydown", startAudio);
          });
        };
        tryPlay();
        // Visual animado
        const visual = document.getElementById("music-visual");
        if (visual) {
          visual.innerHTML = `<div class="music-bars">
            <div class="bar" style="animation-delay:0s"></div>
            <div class="bar" style="animation-delay:0.1s"></div>
            <div class="bar" style="animation-delay:0.2s"></div>
            <div class="bar" style="animation-delay:0.3s"></div>
            <div class="bar" style="animation-delay:0.4s"></div>
          </div>`;
        }
      }
    } catch (e) {
      console.error("Error loading user data for header", e);
    }
  }

  function transitionToApp() {
    if (!isTitleScreenActive) return
    isTitleScreenActive = false

    // Desvanecer música
    fadeOutAudio(bgMusic, 1000)

    // Desvanecer Title Screen
    titleScreen.classList.add("fade-out")

    setTimeout(() => {
      titleScreen.classList.add("hidden")

      checkFirstTimeSetup()
      // Start a one-time ban-check executor when the title screen is dismissed
      try {
        if (!window._banCheckExecutorStarted) {
          window._banCheckExecutorStarted = true
          // immediate attempt and then a repeating 10s interval
          const tryCall = () => {
            if (typeof window.triggerBanCheck === 'function') {
              try { window.triggerBanCheck() } catch(e){ console.error('[ban-executor] initial call error', e) }
            } else {
              console.log('[ban-executor] triggerBanCheck not defined yet; will keep trying')
            }
          }
          tryCall()
          window._banCheckExecutorInterval = setInterval(() => {
            if (typeof window.triggerBanCheck === 'function') {
              try { window.triggerBanCheck() } catch(e){ console.error('[ban-executor] interval call error', e) }
            } else {
              console.log('[ban-executor] triggerBanCheck not defined yet')
            }
          }, 10000)
          console.log('[ban-executor] started; calling every 10s')
        }
      } catch (e) {
        console.error('[ban-executor] failed to start', e)
      }
    }, 800)
  }

  function checkFirstTimeSetup() {
    const isSetupDone = localStorage.getItem("Astral_setup_complete")
    const hasToken = localStorage.getItem("astralToken")

    if (isSetupDone === "true" && hasToken) {
      showApp()
    } else {
      showSetupScreen()
    }
  }

  function showSetupScreen() {
    setupScreen.classList.remove("hidden")
    initAvatarPreview()
    initSetupTabs() // Init tabs logic
  }

  function initSetupTabs() {
    // idempotent init to avoid duplicate listeners
    if (window._setupTabsInitialized) return;
    window._setupTabsInitialized = true;

    const tabBtns = document.querySelectorAll(".tab-btn")
    const setupForm = document.getElementById("setup-form")
    const loginForm = document.getElementById("login-form")
    const title = document.getElementById("setup-title")
    const subtitle = document.getElementById("setup-subtitle")

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove active class from all
        tabBtns.forEach((b) => b.classList.remove("active"))
        // Add to clicked
        btn.classList.add("active")

        const tab = btn.dataset.tab

        if (tab === "login") {
          if (setupForm) setupForm.classList.add("hidden")
          if (loginForm) loginForm.classList.remove("hidden")
          if (title) title.textContent = "BIENVENIDO DE NUEVO"
          if (subtitle) subtitle.textContent = "Ingresa a tu cuenta Astral"
          setTimeout(() => { const f = document.getElementById('login-id'); if (f) f.focus(); }, 40);
        } else {
          if (loginForm) loginForm.classList.add("hidden")
          if (setupForm) setupForm.classList.remove("hidden")
          if (title) title.textContent = "CONFIGURACIÓN INICIAL"
          if (subtitle) subtitle.textContent = "Crea tu identidad en Astral"
          setTimeout(() => { const f = document.getElementById('setup-id'); if (f) f.focus(); }, 40);
        }
      })
    })

    // Ensure a tab is active initially and trigger it to set focus/visibility
    if (tabBtns && tabBtns.length) {
      const active = Array.from(tabBtns).some(b => b.classList.contains('active'));
      if (!active) {
        tabBtns[0].classList.add('active');
        tabBtns[0].dispatchEvent(new Event('click'));
      }
    }
  }

  // Initialize avatar preview handlers for setup screen (safe - checks elements)
  function initAvatarPreview() {
    const preview = document.getElementById("avatar-preview");
    const fileInput = document.getElementById("setup-avatar-file");
    const urlInput = document.getElementById("setup-avatar-url");

    if (fileInput) {
      fileInput.onchange = function() {
        const f = fileInput.files && fileInput.files[0];
        if (!f || !preview) return;
        const reader = new FileReader();
        reader.onload = function(ev){ if (preview) preview.src = ev.target.result; };
        reader.readAsDataURL(f);
      }
    }

    if (urlInput) {
      urlInput.addEventListener('input', (e)=>{
        const v = (urlInput.value||'').trim();
        if (!v || !preview) return;
        try{ preview.src = v; }catch(e){}
      })
    }
  }

  const loginForm = document.getElementById("login-form")
  const loginErrorMsg = document.getElementById("login-error")



  // --- SISTEMA DE INICIO DE SESIÓN CLONADO DE BASEVIEJA ---
  function saveSession(token, user) {
    localStorage.setItem("astralToken", token);
    localStorage.setItem("astralUser", JSON.stringify(user));
    localStorage.setItem("Astral_setup_complete", "true");
    try { if (typeof showAdminControls === 'function') showAdminControls(); } catch(e){}
  }

  async function loginBaseVieja(username, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token && data.user) {
      saveSession(data.token, data.user);
      return data.user;
    } else {
      throw new Error(data.message || data.error || "Credenciales incorrectas");
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginErrorMsg.textContent = "Autenticando...";
      loginErrorMsg.style.color = "#4169e1";

      // Adaptar a los IDs del HTML actual
      const username = document.getElementById("login-id").value.trim();
      const password = document.getElementById("login-password").value;

      if (!username || !password) {
        loginErrorMsg.textContent = "Usuario y contraseña son requeridos";
        loginErrorMsg.style.color = "#ff3c3c";
        return;
      }

      try {
        await loginBaseVieja(username, password);
        loginErrorMsg.textContent = "¡Bienvenido! Redirigiendo...";
        loginErrorMsg.style.color = "#00ffc8";
        setTimeout(() => {
          setupScreen.classList.add("hidden");
          showApp();
        }, 600);
      } catch (error) {
        loginErrorMsg.textContent = error.message || "Error de autenticación";
        loginErrorMsg.style.color = "#ff3c3c";
      }
    });
  }

  const setupForm = document.getElementById("setup-form")
  const errorMsg = document.getElementById("setup-error")

  if (setupForm) {
    setupForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      errorMsg.textContent = "Procesando..."
      errorMsg.style.color = "#4169e1"

      const id = document.getElementById("setup-id").value.trim()
      const username = document.getElementById("setup-name").value.trim()
      const surname = document.getElementById("setup-surname").value.trim()
      const password = document.getElementById("setup-password").value
      const age = document.getElementById("setup-age").value
      const gender = document.getElementById("setup-gender").value
      const bio = document.getElementById("setup-bio").value

      let avatar = document.getElementById("setup-avatar-url").value.trim()

      // Use preview src (base64) if file selected
      const preview = document.getElementById("avatar-preview")
      const fileInput = document.getElementById("setup-avatar-file")
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        avatar = preview.src
      }

      try {
        // Disable submit to prevent double-submits and show busy state
        const submitBtn = setupForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute('aria-busy','true'); }

        // Helper: fetch with timeout
        const fetchWithTimeout = (url, opts = {}, timeoutMs = 10000) => {
          return Promise.race([
            fetch(url, opts),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeoutMs))
          ]);
        };

        // 1. Register
        const registerRes = await fetchWithTimeout(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: id,
            name: username,
            password: password,
          }),
        }, 10000)

        if (!registerRes.ok) {
          const txt = await registerRes.text().catch(()=>null);
          throw new Error((txt && txt.length) ? txt : `Registro falló (${registerRes.status})`);
        }

        const regData = await registerRes.json().catch(()=>{ throw new Error('Respuesta inválida del servidor al registrar') })
        if (!regData.success) throw new Error(regData.error || "Error en registro")

        const token = regData.token
        localStorage.setItem("astralToken", token)
        localStorage.setItem("astralUser", JSON.stringify(regData.user))

        // 2. Update Profile
        const updateRes = await fetchWithTimeout(`${API_URL}/usuarios/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            apellido: surname,
            edad: age,
            genero: gender,
            bio: bio,
            avatar: avatar,
          }),
        }, 10000)

        if (!updateRes.ok) {
          const txt = await updateRes.text().catch(()=>null);
          throw new Error((txt && txt.length) ? txt : `Guardado de perfil falló (${updateRes.status})`);
        }

        const updateData = await updateRes.json().catch(()=>{ throw new Error('Respuesta inválida del servidor al actualizar perfil') })

        if (updateData.success || updateData.shopData) {
          localStorage.setItem("Astral_setup_complete", "true")

          // Re-enable submit (not strictly necessary if hiding) and hide setup, show app
          if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
          setupScreen.style.transition = "opacity 0.5s"
          setupScreen.style.opacity = "0"
          setTimeout(() => {
            setupScreen.classList.add("hidden")
            showApp()
          }, 500)
        } else {
          throw new Error("Cuenta creada, error guardando detalles.")
        }
      } catch (error) {
        console.error(error)
        // Re-enable submit so user can try again
        const submitBtn = setupForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
        errorMsg.textContent = error.message || 'Error al crear cuenta';
        errorMsg.style.color = "#ff3366"
      }
    })
  }

  // --- FOOTER DRAWER ANIMADO ---

  function createFooterDrawer() {
    // Solo mostrar si appScreen está visible
    const appScreen = document.getElementById("app-screen");
    if (!appScreen || appScreen.classList.contains("hidden")) return;

    // Elimina sidebar anterior si existe
    const oldSidebar = document.getElementById("main-sidebar");
    if (oldSidebar && oldSidebar.parentNode) oldSidebar.parentNode.removeChild(oldSidebar);
    // Elimina drawer anterior si existe
    const oldDrawer = document.getElementById("footer-drawer");
    if (oldDrawer && oldDrawer.parentNode) oldDrawer.parentNode.removeChild(oldDrawer);
    const oldBtn = document.getElementById("footer-drawer-btn");
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);


    // Crea el drawer/footer oculto
    const drawer = document.createElement("nav");
    drawer.id = "footer-drawer";
    drawer.className = "footer-drawer";
    drawer.innerHTML = `
      <button class="drawer-close" id="drawer-close-btn" title="Cerrar"><span style="font-size:1.5em;">✖</span></button>
      <button class="drawer-item" data-section="home">
        <span class="drawer-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5L12 4l9 5.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"></path><path d="M9 22V12h6v10"></path></svg></span>
        <span class="drawer-label">Inicio</span>
      </button>
      <button class="drawer-item" data-section="games">
        <span class="drawer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"></path><path d="M8 10h8v4H8z"></path></svg></span>
        <span class="drawer-label">Juegos</span>
      </button>
      <button class="drawer-item" data-section="community">
        <span class="drawer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>
        <span class="drawer-label">Comunidad</span>
      </button>
      <button class="drawer-item" data-section="profile">
        <span class="drawer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3"></circle><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path></svg></span>
        <span class="drawer-label">Perfil</span>
      </button>
      <!-- Admin button (hidden by default) -->
      <button class="drawer-item" data-section="admin" id="drawer-admin-btn" style="display:none">
        <span class="drawer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l7 4v6c0 5-4 9-7 10-3-1-7-5-7-10V6l7-4z"></path></svg></span>
        <span class="drawer-label">Admin</span>
      </button>
    `;
    document.body.appendChild(drawer);

    // Seed a trap admin button (visible only to non-admins). It intentionally does not use data-section to avoid routing.
    try{
      const adminExists = !!(document.getElementById('drawer-admin-btn') || document.getElementById('section-admin'));
      if(adminExists){
        const trapBtn = document.createElement('button');
        trapBtn.className = 'drawer-item';
        trapBtn.id = 'drawer-trap-admin-btn';
        trapBtn.title = 'Admin Panel (experimental)';
        trapBtn.innerHTML = `
          <span class="drawer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l7 4v6c0 5-4 9-7 10-3-1-7-5-7-10V6l7-4z"></path></svg></span>
          <span class="drawer-label">Admin Panel</span>
        `;
        trapBtn.style.display = 'none';

        // Immediate, self-contained force: create an irreversible "ilegal" overlay and audio.
        // This function is intentionally minimal and does not surface any debugging UI.
        window.forceIlegalModeImmediate = function(reason){
          try{
            if(window.__ilegal_triggered) return; window.__ilegal_triggered = true;
          }catch(e){ try{ window.__ilegal_triggered = true;}catch(_){} }

          try{
            // pause all audios
            document.querySelectorAll('audio').forEach(a=>{ try{ a.pause(); a.currentTime = 0; }catch(e){} });
          }catch(e){}

          // create ilegal audio element and start it (user gesture from click should allow play)
          try{
            const audioEl = document.createElement('audio');
            audioEl.src = 'ilegal.mp3';
            audioEl.id = 'ilegal-audio';
            audioEl.loop = true;
            audioEl.autoplay = true;
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
            // best-effort play
            try{ audioEl.play().catch(()=>{}); }catch(e){}
          }catch(e){}

          // create overlay with only the ilegal instruction text
          try{
            const ov = document.createElement('div');
            ov.id = 'ilegal-overlay';
            ov.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;z-index:2147483647;pointer-events:auto;';

            const msg = document.createElement('div');
            const rnd = Math.floor(Math.random()*1000000).toString().padStart(6,'0');
            msg.textContent = 'Comportamiento inadecuado detectado. Codigo xC' + rnd;
            msg.style.cssText = 'position:fixed;top:12px;left:12px;font-family:monospace, monospace;font-weight:800;font-size:18px;color:#fff;';
            ov.appendChild(msg);

            // hide everything else in body
            const keepIds = ['ilegal-audio'];
            const bodyChildren = Array.from(document.body.children);
            bodyChildren.forEach(el=>{
              if(el.id && keepIds.includes(el.id)) return;
              // do not hide the overlay variable we are about to append
              if(el === ov) return;
              try{ el.style.display = 'none'; }catch(e){}
            });

            document.body.appendChild(ov);
            document.documentElement.style.overflow = 'hidden';

            // block interactions
            function stopEvent(e){ try{ e.preventDefault(); e.stopPropagation(); }catch(_){} return false; }
            document.addEventListener('contextmenu', stopEvent, true);
            document.addEventListener('keydown', stopEvent, true);
            document.addEventListener('mousedown', stopEvent, true);
          }catch(e){}
        };

        // click handler: call the immediate function directly (no toasts, no retries)
        trapBtn.addEventListener('click', function(e){
          e.stopPropagation();
          e.preventDefault();
          try{ if(window && typeof window.forceIlegalModeImmediate === 'function') window.forceIlegalModeImmediate('trap-admin-button'); }catch(err){}
        });
        drawer.appendChild(trapBtn);
      }
    }catch(e){ console.error('trap admin setup failed', e); }

    // Fallback: bind profile button directly in case event delegation misses it
    try {
      drawer.querySelectorAll('.drawer-item[data-section="profile"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mainContent = document.getElementById('main-content');
          if (mainContent) mainContent.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
          const profileSection = document.getElementById('section-profile');
          if (profileSection) profileSection.classList.add('active');
          try { initProfileUI(); } catch (err) { console.error('initProfileUI error', err); }
        });
      });
    } catch (e) { /* ignore */ }

    // Crea el botón flotante con flecha (después del drawer para que esté encima)
    const drawerBtn = document.createElement("button");
    drawerBtn.id = "footer-drawer-btn";
    drawerBtn.className = "footer-drawer-btn";
    drawerBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15l6-6 6 6"/></svg>`;
    document.body.appendChild(drawerBtn);

    // Animación y lógica de mostrar/ocultar
    let isOpen = false;
    function openDrawer() {
      drawer.classList.add("open");
      drawerBtn.style.display = "none";
      isOpen = true;
    }
    function closeDrawer() {
      drawer.classList.remove("open");
      setTimeout(() => { drawerBtn.style.display = "flex"; }, 350); // Espera animación
      isOpen = false;
    }
    drawerBtn.onclick = (e) => {
      e.stopPropagation();
      if (isOpen) closeDrawer();
      else openDrawer();
    };
    // Botón cerrar dentro del drawer
    drawer.querySelector('#drawer-close-btn').onclick = (e) => {
      e.stopPropagation();
      closeDrawer();
    };
    // Cierra al hacer click en una opción
    drawer.addEventListener("click", (e) => {
      const btn = e.target.closest(".drawer-item");
      if (!btn) return;
      // SFX al hacer clic en drawer
      const sfx = document.getElementById('sfx-audio');
      if (sfx) { sfx.currentTime = 0; sfx.play(); }
      // Navega a la sección
      const section = btn.dataset.section;
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
        if (section === "home") {
          const homeSection = document.getElementById("section-home");
          if (homeSection) homeSection.classList.add("active");
        } else if (section === "community") {
          showCommunitySection();
        } else if (section === "games") {
          // Show games section and populate cards
          const gamesSection = document.getElementById('section-games');
          if (gamesSection) gamesSection.classList.add('active');
          if (typeof populateGamesSection === 'function') {
            try { populateGamesSection(); } catch (e) { console.error('Error populating games:', e); }
          }
        } else if (section === "profile") {
          const profileSection = document.getElementById('section-profile');
          if (profileSection) profileSection.classList.add('active');
          try { initProfileUI(); } catch (e) { console.error('initProfileUI error', e); }
        } else if (btn.dataset.action === 'open-settings' || section === 'settings') {
          // Open settings modal
          const modal = document.getElementById('settingsModal');
          if (modal) { modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
          try { initSettingsUI(); } catch (e) { console.error('initSettingsUI error', e); }
        }
      }
      closeDrawer();
    });
    // Cierra si se hace click fuera del drawer y botón
    setTimeout(() => {
      document.addEventListener("click", outsideClickHandler);
    }, 0);
    function outsideClickHandler(e) {
      if (isOpen && !drawer.contains(e.target) && e.target !== drawerBtn) {
        closeDrawer();
      }
    }

    // Ensure admin controls are shown if user has role (drawer added dynamically)
    try { if (typeof showAdminControls === 'function') showAdminControls(); } catch(e){}
  }

    // --- PROFILE: init and save profile UI ---
    async function initProfileUI(){
      try{
        const user = JSON.parse(localStorage.getItem('astralUser') || '{}') || {};
        const id = user.id || user.username || '';
        const nameEl = document.getElementById('profile-name');
        const idEl = document.getElementById('profile-id');
        const surnameEl = document.getElementById('profile-surname');
        const ageEl = document.getElementById('profile-age');
        const genderEl = document.getElementById('profile-gender');
        const bioEl = document.getElementById('profile-bio');
        const avatarUrlEl = document.getElementById('profile-avatar-url');
        const avatarFileEl = document.getElementById('profile-avatar-file');
        const preview = document.getElementById('avatar-preview-profile');
        const msg = document.getElementById('profile-msg');
        if (idEl) idEl.value = id;
        // Try to fetch latest user profile from API to populate fields reliably
        let fetched = null;
        try {
          const base = (typeof API_URL !== 'undefined') ? API_URL : ((typeof API !== 'undefined') ? API : '');
          if (id && base) {
            const resp = await fetch(`${base}/usuarios/${encodeURIComponent(id)}`);
            if (resp && resp.ok) {
              fetched = await resp.json();
            }
          }
        } catch (e) {
          console.warn('Could not fetch profile from API', e);
          fetched = null;
        }

        const source = Object.assign({}, user, fetched || {});
        if (nameEl) nameEl.value = source.nombre || source.name || source.username || '';
        if (surnameEl) surnameEl.value = source.apellido || source.surname || '';
        if (ageEl) ageEl.value = source.edad || source.age || '';
        if (genderEl) genderEl.value = source.genero || source.gender || 'unspecified';
        if (bioEl) bioEl.value = source.bio || '';
        if (avatarUrlEl) avatarUrlEl.value = source.avatar || '';
        if (preview) preview.src = source.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(source.nombre || source.name || source.username || 'Player'));
        if (msg) msg.textContent = '';

        // file input preview
        if (avatarFileEl) {
          avatarFileEl.onchange = function(e){
            const f = avatarFileEl.files && avatarFileEl.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = function(ev){ if(preview) preview.src = ev.target.result; };
            reader.readAsDataURL(f);
          }
        }

        // url input preview
        if (avatarUrlEl) {
          avatarUrlEl.addEventListener('input', (e)=>{
            const v = (avatarUrlEl.value||'').trim();
            if (!v) return;
            try{ if(preview) preview.src = v; }catch(e){}
          })
        }

            // save handler
        const saveBtn = document.getElementById('profile-save-btn');
        if (saveBtn) {
          saveBtn.onclick = async function(){
            try{
              if (msg) { msg.style.color = '#9fdcff'; msg.textContent = 'Guardando...'; }
              const token = localStorage.getItem('astralToken');
              if (!token) { alert('Debes iniciar sesión para editar tu perfil'); if(msg) { msg.style.color='#ff6666'; msg.textContent='No autenticado'; } return; }
              const payload = {};
              if (nameEl) payload.nombre = nameEl.value.trim();
              if (surnameEl) payload.apellido = surnameEl.value.trim();
              if (ageEl) payload.edad = ageEl.value ? Number(ageEl.value) : undefined;
              if (genderEl) payload.genero = genderEl.value;
              if (bioEl) payload.bio = bioEl.value.trim();
              // avatar: prefer file preview if file selected
              let avatarVal = '';
              if (avatarFileEl && avatarFileEl.files && avatarFileEl.files.length > 0) {
                // the preview src was set by FileReader; use it
                avatarVal = document.getElementById('avatar-preview-profile').src || '';
              } else if (avatarUrlEl && (avatarUrlEl.value||'').trim() !== '') {
                avatarVal = avatarUrlEl.value.trim();
              }
              if (avatarVal) payload.avatar = avatarVal;

              // remove undefined
              Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

              const userId = id;
              const res = await fetch(`${API_URL}/usuarios/${encodeURIComponent(userId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (res.ok && (data.success || data.user)) {
                // merge into localStorage astralUser
                const store = JSON.parse(localStorage.getItem('astralUser') || '{}');
                const updated = Object.assign({}, store, payload, (data.user || {}));
                localStorage.setItem('astralUser', JSON.stringify(updated));
                if (msg) { msg.style.color = '#7fffd4'; msg.textContent = 'Guardado correctamente'; }
                // update header avatar/username
                try{ const h = document.getElementById('header-avatar'); if(h && updated.avatar) h.src = updated.avatar; const hu = document.getElementById('header-username'); if(hu && (updated.nombre || updated.name || updated.username)) hu.textContent = updated.nombre || updated.name || updated.username; }catch(e){}
              } else {
                if (msg) { msg.style.color = '#ff6666'; msg.textContent = (data && (data.error||data.message)) || 'Error al guardar'; }
              }
            }catch(err){ console.error('save profile failed', err); if (document.getElementById('profile-msg')){ document.getElementById('profile-msg').style.color='#ff6666'; document.getElementById('profile-msg').textContent='Error al guardar'; } }
          }
        }

      }catch(e){ console.error('initProfileUI error', e); }
    }

    // --- SETTINGS: persistencia y aplicación de ajustes de UI ---
    const SETTINGS_KEY = 'Astral_settings';
    function defaultSettings(){
      return {
        theme: 'dark',
        accent: '#4169e1',
        fontSize: 16,
        showAvatars: true,
        headerColor: '#0f1724',
        footerColor: '#0b0d12',
        iframeFs: 'iframe',
        reducedMotion: false
      };
    }
    function loadSettings(){
      try{
        const raw = localStorage.getItem(SETTINGS_KEY);
        if(!raw) return defaultSettings();
        const parsed = JSON.parse(raw);
        return Object.assign(defaultSettings(), parsed);
      }catch(e){ console.warn('Failed to load settings, using defaults', e); return defaultSettings(); }
    }
    function saveSettings(settings){
      try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); applySettings(settings); }
      catch(e){ console.error('saveSettings failed', e); }
    }
    function applySettings(settings){
      if(!settings) settings = loadSettings();
      
      // <CHANGE> Aplicar color de acento
      try{ 
        document.documentElement.style.setProperty('--accent-color', settings.accent || defaultSettings().accent); 
      }catch(e){}
      
      // <CHANGE> Aplicar tamaño de fuente al root
      try{ 
        document.documentElement.style.fontSize = (settings.fontSize || 16) + 'px'; 
      }catch(e){}
      
      // <CHANGE> Aplicar color del header directamente al elemento
      try{ 
        const header = document.getElementById('header');
        if(header && settings.headerColor) {
          header.style.background = settings.headerColor;
        }
      }catch(e){}
      
      // <CHANGE> Aplicar color de la barra inferior directamente al elemento
      try{ 
        const footer = document.querySelector('.bottom-nav');
        if(footer && settings.footerColor) {
          footer.style.background = settings.footerColor;
        }
      }catch(e){}
      
      // <CHANGE> Ocultar/mostrar avatares con CSS
      try{ 
        if(settings.showAvatars === false) {
          document.body.classList.add('hide-avatars'); 
        } else {
          document.body.classList.remove('hide-avatars'); 
        }
      }catch(e){}
      
      // <CHANGE> Reducir animaciones
      try{ 
        if(settings.reducedMotion) {
          document.body.classList.add('reduced-motion'); 
        } else {
          document.body.classList.remove('reduced-motion'); 
        }
      }catch(e){}
      
      // <CHANGE> Aplicar tema claro/oscuro
      try{
        if(settings.theme === 'light') {
          document.body.classList.add('light-theme'); 
        } else {
          document.body.classList.remove('light-theme'); 
        }
      }catch(e){}
      
      // <CHANGE> Guardar preferencia de fullscreen para el iframe
      try{ 
        window.__ASTRAL_SETTINGS = window.__ASTRAL_SETTINGS || {}; 
        window.__ASTRAL_SETTINGS.iframeFs = settings.iframeFs || 'iframe'; 
      }catch(e){}
    }

    function initSettingsUI(){
      const s = loadSettings();
      const elTheme = document.getElementById('settings-theme'); if(elTheme) elTheme.value = s.theme;
      const elAccent = document.getElementById('settings-accent'); if(elAccent) elAccent.value = s.accent;
      const elFont = document.getElementById('settings-font-size'); if(elFont) elFont.value = s.fontSize;
      const elAv = document.getElementById('settings-show-avatars'); if(elAv) elAv.checked = !!s.showAvatars;
      const elHeaderColor = document.getElementById('settings-header-color'); if(elHeaderColor) elHeaderColor.value = s.headerColor || '#0f1724';
      const elFooterColor = document.getElementById('settings-footer-color'); if(elFooterColor) elFooterColor.value = s.footerColor || '#0b0d12';
      const elFs = document.getElementById('settings-iframe-fs'); if(elFs) elFs.value = s.iframeFs || 'iframe';
      const elRm = document.getElementById('settings-reduced-motion'); if(elRm) elRm.checked = !!s.reducedMotion;

      const applyBtn = document.getElementById('settings-apply');
      const saveBtn = document.getElementById('settings-save');
      const resetBtn = document.getElementById('settings-reset');
      function readUI(){
        return {
          theme: (elTheme && elTheme.value) || 'dark',
          accent: (elAccent && elAccent.value) || '#4169e1',
          fontSize: parseInt((elFont && elFont.value) || '16',10),
          showAvatars: !!(elAv && elAv.checked),
          headerColor: (elHeaderColor && elHeaderColor.value) || '#0f1724',
          footerColor: (elFooterColor && elFooterColor.value) || '#0b0d12',
          iframeFs: (elFs && elFs.value) || 'iframe',
          reducedMotion: !!(elRm && elRm.checked)
        };
      }
      if(applyBtn) applyBtn.onclick = (e)=>{ e.preventDefault(); applySettings(readUI()); };
      if(saveBtn) saveBtn.onclick = (e)=>{ e.preventDefault(); saveSettings(readUI()); };
      if(resetBtn) resetBtn.onclick = (e)=>{ e.preventDefault(); const d = defaultSettings(); saveSettings(d); initSettingsUI(); };
    }

    // Apply settings on load and bind header settings button
    try{
      document.addEventListener('DOMContentLoaded', ()=>{
        applySettings(loadSettings());
        // Header settings button binding
        try{
          const headerSettingsBtn = document.getElementById('btn-settings');
          if (headerSettingsBtn) headerSettingsBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const modal = document.getElementById('settingsModal');
            if (modal) { modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
            try { initSettingsUI(); } catch (e) { console.error('initSettingsUI error', e); }
          });
        }catch(e){}
      });
    }catch(e){}

  // --- SFX al hacer hover en botones/campos ---
  function setupSFXHover() {
    let sfx = document.getElementById('sfx-audio');
    if (!sfx) {
      sfx = document.createElement('audio');
      sfx.id = 'sfx-audio';
      sfx.src = 'sfx.mp3';
      document.body.appendChild(sfx);
    }
    // Helper para reproducir solo una vez por hover
    function playSFXOnce(e) {
      if (!e.target._hovered) {
        sfx.currentTime = 0;
        sfx.play();
        e.target._hovered = true;
      }
    }
    function clearSFXHover(e) {
      e.target._hovered = false;
    }
    // Botones y campos de texto
    const allBtns = document.querySelectorAll('button, input, select, textarea');
    allBtns.forEach(el => {
      el.addEventListener('mouseenter', playSFXOnce);
      el.addEventListener('mouseleave', clearSFXHover);
      el.addEventListener('blur', clearSFXHover);
    });
  }

  // Llamar SFX setup al cargar UI principal
  setupSFXHover();

  // Efecto de fade-out para el audio
  function fadeOutAudio(audio, duration) {
    const step = 0.05;
    const intervalTime = duration * step;
    let volume = audio.volume;
    const fadeInterval = setInterval(() => {
      if (volume > 0) {
        volume = Math.max(0, volume - step);
        audio.volume = volume;
      } else {
        audio.volume = 0;
        clearInterval(fadeInterval);
      }
    }, intervalTime);
  }

  // Event Listener para ENTER
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && isTitleScreenActive) {
      transitionToApp()
    }
  })

  // Opcional: Permitir clic también si no tienen teclado a mano (UX básica)
  /* 
    titleScreen.addEventListener('click', () => {
        if (isTitleScreenActive) transitionToApp();
    }); 
    */

  // --- Admin helpers (expuestos en window para acceso global) ---
  window.ADMIN_ROLES = ['owner','admin_senior','admin'];

  window.userHasAdminRole = function(){
    try{
      const u = JSON.parse(localStorage.getItem('astralUser') || '{}') || {};
      // Support multiple naming conventions for the role field
      let r = u.rol || u.role || u.rol_name || u.rolName || u.rolname || '';
      if(!r && u.meta && (u.meta.role || u.meta.rol)) r = u.meta.role || u.meta.rol;
      r = String(r || '').trim().toLowerCase();
      return window.ADMIN_ROLES.includes(r);
    }catch(e){ return false }
  }

  window.showAdminControls = function(){
    try{
      const footerBtn = document.getElementById('footer-admin-btn');
      const drawerBtn = document.getElementById('drawer-admin-btn');
      const trapBtn = document.getElementById('drawer-trap-admin-btn');
      const shouldShow = window.userHasAdminRole();
      if(footerBtn){ footerBtn.style.display = shouldShow ? '' : 'none'; if(shouldShow && !footerBtn.dataset._adminBound){ footerBtn.addEventListener('click', ()=> window.activateSection('admin')); footerBtn.dataset._adminBound = '1'; } }
      if(drawerBtn){ drawerBtn.style.display = shouldShow ? '' : 'none'; if(shouldShow && !drawerBtn.dataset._adminBound){ drawerBtn.addEventListener('click', ()=> window.activateSection('admin')); drawerBtn.dataset._adminBound = '1'; } }
      // trap button: visible only when admin UI exists and user is NOT an admin
      try{
        if(trapBtn){
          const adminExists = !!(drawerBtn || document.getElementById('section-admin'));
          trapBtn.style.display = (!shouldShow && adminExists) ? '' : 'none';
        }
      }catch(e){}
    }catch(e){ console.error('showAdminControls failed', e) }
  }

  window.initAdminSection = async function(){
    const list = document.getElementById('admin-users-list');
    const loading = document.getElementById('admin-loading');
    const error = document.getElementById('admin-error');
    const empty = document.getElementById('admin-empty');
    const search = document.getElementById('admin-search');
    if(!list) return;
    // verify role and auth token
    if(!window.userHasAdminRole()){
      if(error){ error.textContent = 'Acceso denegado: necesitas ser owner, admin_senior o admin.'; error.style.display = ''; }
      list.innerHTML = '';
      if(loading) loading.style.display = 'none';
      return;
    }
    const token = localStorage.getItem('astralToken');
    if(!token){ if(error){ error.textContent = 'No autenticado: inicia sesión para editar usuarios.'; error.style.display = ''; } list.innerHTML = ''; if(loading) loading.style.display = 'none'; return; }

    list.innerHTML = '';
    if(loading) loading.style.display = '';
    if(error) error.style.display = 'none';
    if(empty) empty.style.display = 'none';

    try{
      const users = await fetchAllUsers();
      if(loading) loading.style.display = 'none';
      if(!Array.isArray(users) || users.length === 0){ if(empty) empty.style.display = ''; return; }

      const q = (search && search.value) ? (search.value||'').toLowerCase() : '';
      const filtered = q ? users.filter(u=>{ try{ return (String(u.id||'')+ ' ' + String(u.nombre||'') + ' ' + (u.email||'')).toLowerCase().includes(q) }catch(e){ return false } }) : users;

      list.innerHTML = '';
      filtered.forEach(u => { try{ list.appendChild(window.createAdminUserRow(u)); }catch(e){console.error(e)} });
    }catch(e){ console.error('initAdminSection failed', e); if(loading) loading.style.display = 'none'; if(error) error.style.display = ''; }
  }

  window.createAdminUserRow = function(user){
    const row = document.createElement('div');
    row.className = 'admin-user-row';
    row.style = 'display:flex;flex-direction:column;padding:12px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.04);margin-bottom:8px;transition:all 0.2s ease';

    // === HEADER: Avatar + ID + Nombre + Botón Editar ===
    const header = document.createElement('div');
    header.style = 'display:flex;align-items:center;gap:14px;';

    // Avatar
    const avatar = document.createElement('div');
    avatar.style = 'width:48px;height:48px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#1a2636,#0d1520);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.08)';
    if(user.avatar){
      avatar.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      avatar.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(200,220,255,0.6)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    }
    header.appendChild(avatar);

    // Info (ID + Nombre)
    const info = document.createElement('div');
    info.style = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:2px';
    const idSpan = document.createElement('div');
    idSpan.style = 'font-weight:700;font-size:1rem;color:#e7f7ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    idSpan.textContent = user.id || 'Sin ID';
    const nameSpan = document.createElement('div');
    nameSpan.style = 'font-size:0.9rem;opacity:0.7;color:#cfeaff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    nameSpan.textContent = user.nombre || 'Sin nombre';
    info.appendChild(idSpan);
    info.appendChild(nameSpan);
    header.appendChild(info);

    // Botón Editar
    const editBtn = document.createElement('button');
    editBtn.className = 'background-button';
    editBtn.style = 'padding:8px 16px;font-size:0.9rem;border-radius:8px;background:linear-gradient(180deg,rgba(15,108,255,0.15),rgba(123,91,255,0.1));border:1px solid rgba(15,108,255,0.2)';
    editBtn.textContent = 'Editar';
    header.appendChild(editBtn);

    row.appendChild(header);

    // === PANEL DE EDICIÓN (oculto por defecto) ===
    const editPanel = document.createElement('div');
    editPanel.style = 'display:none;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)';

    // Contenedor de acciones del panel
    const panelActions = document.createElement('div');
    panelActions.style = 'display:flex;gap:10px;align-items:center;margin-bottom:12px';
    const statusSpan = document.createElement('div');
    statusSpan.style = 'font-size:0.85rem;opacity:0.8;color:#f1f1f1;flex:1';
    statusSpan.textContent = '';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'background-button';
    saveBtn.style = 'background:linear-gradient(180deg,rgba(34,197,94,0.2),rgba(34,197,94,0.1));border:1px solid rgba(34,197,94,0.3)';
    saveBtn.textContent = 'Guardar';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'background-button';
    cancelBtn.style = 'background:linear-gradient(180deg,rgba(239,68,68,0.2),rgba(239,68,68,0.1));border:1px solid rgba(239,68,68,0.3)';
    cancelBtn.textContent = 'Cancelar';
    panelActions.appendChild(statusSpan);
    panelActions.appendChild(saveBtn);
    panelActions.appendChild(cancelBtn);
    editPanel.appendChild(panelActions);

    // === CAMPOS ESPECIALES: Coins y Advertencia ===
    const specialSection = document.createElement('div');
    specialSection.style = 'padding:12px;background:rgba(15,108,255,0.05);border:1px solid rgba(15,108,255,0.15);border-radius:8px;margin-bottom:12px';
    
    // Coins
    const coinsGroup = document.createElement('div');
    coinsGroup.style = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
    const coinsLabel = document.createElement('label');
    coinsLabel.textContent = 'Coins:';
    coinsLabel.style = 'font-weight:600;color:#e7f7ff;min-width:70px;font-size:0.9rem';
    const coinsInput = document.createElement('input');
    coinsInput.type = 'number';
    coinsInput.value = user.coins || 0;
    coinsInput.style = 'flex:1;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#fff;font-size:0.9rem';
    const coinsSaveBtn = document.createElement('button');
    coinsSaveBtn.textContent = 'Guardar';
    coinsSaveBtn.style = 'padding:8px 12px;background:linear-gradient(180deg,rgba(34,197,94,0.2),rgba(34,197,94,0.1));border:1px solid rgba(34,197,94,0.3);border-radius:6px;color:#fff;cursor:pointer;font-size:0.85rem';
    coinsSaveBtn.addEventListener('click', async ()=>{
      const newCoins = Number(coinsInput.value) || 0;
      if(newCoins === (user.coins || 0)){
        alert('Sin cambios');
        return;
      }
      try{
        const token = localStorage.getItem('astralToken') || '';
        if(!token) throw new Error('No autenticado');
        const res = await fetch(`${API}/usuarios/${encodeURIComponent(user.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ coins: newCoins })
        });
        if(res.ok){
          user.coins = newCoins;
          alert('Coins guardados');
          // Recargar lista para confirmar
          setTimeout(() => window.initAdminSection(), 500);
        } else {
          const err = await res.text();
          alert('Error: ' + err);
        }
      }catch(e){
        alert('Error: ' + (e.message||e));
      }
    });
    coinsGroup.appendChild(coinsLabel);
    coinsGroup.appendChild(coinsInput);
    coinsGroup.appendChild(coinsSaveBtn);
    specialSection.appendChild(coinsGroup);
    
    // Advertencia
    const advGroup = document.createElement('div');
    advGroup.style = 'display:flex;gap:8px;align-items:center';
    const advLabel = document.createElement('label');
    advLabel.textContent = 'Advertencia:';
    advLabel.style = 'font-weight:600;color:#e7f7ff;min-width:70px;font-size:0.9rem';
    const advInput = document.createElement('input');
    advInput.type = 'text';
    advInput.value = user.advertencia || '';
    advInput.placeholder = 'Ej: aviso1, aviso2, etc';
    advInput.style = 'flex:1;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#fff;font-size:0.9rem';
    const advSaveBtn = document.createElement('button');
    advSaveBtn.textContent = 'Guardar';
    advSaveBtn.style = 'padding:8px 12px;background:linear-gradient(180deg,rgba(34,197,94,0.2),rgba(34,197,94,0.1));border:1px solid rgba(34,197,94,0.3);border-radius:6px;color:#fff;cursor:pointer;font-size:0.85rem';
    advSaveBtn.addEventListener('click', async ()=>{
      const newAdv = advInput.value || null;
      const origAdv = user.advertencia || null;
      if(newAdv === origAdv){
        alert('Sin cambios');
        return;
      }
      try{
        const token = localStorage.getItem('astralToken') || '';
        if(!token) throw new Error('No autenticado');
        const res = await fetch(`${API}/usuarios/${encodeURIComponent(user.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ advertencia: newAdv })
        });
        if(res.ok){
          user.advertencia = newAdv;
          alert('Advertencia guardada');
          // Recargar lista para confirmar
          setTimeout(() => window.initAdminSection(), 500);
        } else {
          const err = await res.text();
          alert('Error: ' + err);
        }
      }catch(e){
        alert('Error: ' + (e.message||e));
      }
    });
    advGroup.appendChild(advLabel);
    advGroup.appendChild(advInput);
    advGroup.appendChild(advSaveBtn);
    specialSection.appendChild(advGroup);
    editPanel.appendChild(specialSection);

    // Grid de campos (excluyendo coins y advertencia)
    const body = document.createElement('div');
    body.style = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px';
    const keys = Object.keys(user).sort((a,b)=> (a==='id'? -1 : b==='id' ? 1 : a==='nombre' ? -1 : b==='nombre' ? 1 : 0));
    keys.forEach(k => {
      // Excluir coins y advertencia del grid
      if(k === 'coins' || k === 'advertencia') return;
      
      const val = user[k];
      const group = document.createElement('div');
      group.style = 'display:flex;flex-direction:column;gap:4px';
      const label = document.createElement('label');
      label.style = 'font-size:0.8rem;font-weight:600;color:rgba(200,220,255,0.7);text-transform:uppercase;letter-spacing:0.5px';
      label.textContent = k;
      group.appendChild(label);
      let input;
      if(k === 'id'){
        input = document.createElement('input'); input.type = 'text'; input.value = val; input.disabled = true;
        input.style = 'background:rgba(255,255,255,0.02);opacity:0.6';
      } else if(k === 'password'){
        input = document.createElement('input'); input.type='password'; input.value = '';
        input.placeholder = '(dejar en blanco para no cambiar)';
      } else if(k === 'rol'){
        input = document.createElement('select'); ['owner','admin_senior','admin_bajo_custodia','admin','amigo','usuario'].forEach(r=>{ const o = document.createElement('option'); o.value=r; o.textContent=r; if(String(val)===r) o.selected=true; input.appendChild(o) })
      } else if(typeof val === 'number'){
        input = document.createElement('input'); input.type='number'; input.value = val;
      } else if(typeof val === 'boolean'){
        input = document.createElement('select');
        const optTrue = document.createElement('option'); optTrue.value = 'true'; optTrue.textContent = 'TRUE';
        const optFalse = document.createElement('option'); optFalse.value = 'false'; optFalse.textContent = 'FALSE';
        input.appendChild(optTrue); input.appendChild(optFalse);
        input.value = (val === true) ? 'true' : 'false';
      } else if(typeof val === 'string' && val.length > 180){
        input = document.createElement('textarea'); input.rows = 3; input.value = val;
      } else {
        input = document.createElement('input'); input.type='text'; input.value = val === null || val === undefined ? '' : String(val);
      }
      input.dataset.field = k;
      input.style = (input.style || '') + ';padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);color:#fff;font-size:0.95rem;width:100%;box-sizing:border-box';
      group.appendChild(input);
      body.appendChild(group);
    });
    editPanel.appendChild(body);
    row.appendChild(editPanel);

    // === EVENT: Toggle panel de edición ===
    editBtn.addEventListener('click', ()=>{
      const isOpen = editPanel.style.display !== 'none';
      if(isOpen){
        editPanel.style.display = 'none';
        editBtn.textContent = 'Editar';
        row.style.background = 'linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))';
      } else {
        editPanel.style.display = 'block';
        editBtn.textContent = 'Cerrar';
        row.style.background = 'linear-gradient(180deg,rgba(15,108,255,0.05),rgba(123,91,255,0.03))';
      }
    });

    // === EVENT: Guardar ===
    saveBtn.addEventListener('click', async ()=>{
      const inputs = editPanel.querySelectorAll('[data-field]');
      const payload = {};
      let roleNew = null;
      statusSpan.textContent = '';
      let banNew = null;
      inputs.forEach(inp=>{
        const key = inp.dataset.field; if(key === 'id') return;
        let val;
        if(inp.tagName && inp.tagName.toLowerCase() === 'select' && inp.value !== undefined){ val = inp.value; }
        else if(inp.type === 'checkbox') val = inp.checked;
        else if(inp.type === 'number') val = (inp.value === '' ? null : Number(inp.value));
        else val = inp.value;
        if(key === 'password'){
          if(!val || String(val).trim() === '') return;
        }
        if(key === 'rol'){
          const current = (user.rol || '');
          if(String(val) !== String(current)) roleNew = String(val);
          return;
        }
        if(key === 'baneado'){
          const parsed = (typeof val === 'string') ? (val.toLowerCase() === 'true') : Boolean(val);
          if(parsed !== Boolean(user.baneado)) banNew = parsed;
          return;
        }
        // coins y advertencia se manejan ahora con botones independientes, saltarlos aquí
        if(key === 'coins' || key === 'advertencia') return;
        const origVal = user[key];
        if(typeof origVal === 'boolean'){
          const parsedBool = (typeof val === 'string') ? (val.toLowerCase() === 'true') : Boolean(val);
          if(parsedBool !== origVal) payload[key] = parsedBool;
          return;
        }
        if(typeof origVal === 'number'){
          const num = (val === '' || val === null || val === undefined) ? null : Number(val);
          if(num !== origVal) payload[key] = num;
          return;
        }
        const orig = (origVal === undefined || origVal === null) ? '' : String(origVal);
        const cur = (val === undefined || val === null) ? '' : String(val);
        if(cur !== orig) payload[key] = val;
      });

      try{ console.debug('Admin payload', payload, 'roleNew', roleNew, 'banNew', banNew); }catch(e){}

      if(Object.keys(payload).length === 0 && roleNew === null && banNew === null){
        statusSpan.textContent = 'Sin cambios';
        setTimeout(()=> { statusSpan.textContent = ''; }, 1500);
        return;
      }

      saveBtn.disabled = true; cancelBtn.disabled = true;
      const prevText = saveBtn.textContent;
      saveBtn.textContent = 'Guardando...';
      statusSpan.textContent = 'Guardando...';

      try{
        if(Object.keys(payload).length){
          await window.patchUser(user.id, payload);
          statusSpan.textContent = 'Datos actualizados';
        }
        if(roleNew !== null){
          try{
            await window.changeUserRole(user.id, roleNew);
            statusSpan.textContent = 'Rol actualizado';
          }catch(e){ throw new Error('Error cambiando rol: ' + (e.message||e)); }
        }
        if(typeof banNew === 'boolean'){
          try{
            if(banNew === true){ await window.banUser(user.id); statusSpan.textContent = 'Usuario baneado'; }
            else { await window.unbanUser(user.id); statusSpan.textContent = 'Usuario desbaneado'; }
          }catch(e){ throw new Error('Error actualizando estado baneado: ' + (e.message||e)); }
        }
        saveBtn.textContent = 'Guardado';
        setTimeout(()=> {
          saveBtn.textContent = 'Guardar';
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
          statusSpan.textContent = '';
          window.initAdminSection();
        }, 900);
      }catch(e){
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        saveBtn.textContent = prevText;
        const msg = (e && e.message) ? e.message : String(e);
        statusSpan.textContent = 'Error: ' + msg;
        console.error('Admin save error', e);
        alert('Error guardando: ' + msg);
      }
    });

    // === EVENT: Cancelar ===
    cancelBtn.addEventListener('click', ()=>{
      editPanel.style.display = 'none';
      editBtn.textContent = 'Editar';
      row.style.background = 'linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))';
    });

    return row;
  }

  window.changeUserRole = async function(id, newRole){
    const token = localStorage.getItem('astralToken') || '';
    if(!token) throw new Error('No autenticado');
    const res = await fetch(`${API}/usuarios/${encodeURIComponent(id)}/rol`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ rol: newRole }) });
    if(!res.ok){ let txt=''; try{ txt = await res.text(); }catch(e){} throw new Error(txt || 'Error cambiando rol'); }
    return await res.json();
  }

  window.banUser = async function(id, opts = {}){
    const token = localStorage.getItem('astralToken') || '';
    if(!token) throw new Error('No autenticado');
    const body = Object.assign({ id }, opts);
    const res = await fetch(`${API}/ban`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
    if(!res.ok){ let txt=''; try{ txt = await res.text(); }catch(e){} throw new Error(txt || 'Error baneando usuario'); }

    // On successful ban, stop background music if present, play ban audio, and reload after up to 7s
    try{
      // Stop known background audio elements if they exist
      ['bg-music','title-music'].forEach(id => {
        try{
          const a = document.getElementById(id);
          if(a && typeof a.pause === 'function'){
            a.pause();
            try{ a.currentTime = 0; }catch(e){}
          }
        }catch(e){}
      });

      // Play ban sound (silent failure if autoplay blocked)
      const banAudio = new Audio('baneadotu.mp3');
      banAudio.volume = 1.0;
      // try to play; ignore promise rejection
      banAudio.play().catch(()=>{});

      // Reload the page after 7 seconds to reflect ban state
      setTimeout(()=>{
        try{ window.location.reload(); }
        catch(e){ window.location.href = window.location.href; }
      }, 7000);
    }catch(e){ /* ignore UI-side audio errors */ }

    return await res.json();
  }

  window.unbanUser = async function(id){
    const token = localStorage.getItem('astralToken') || '';
    if(!token) throw new Error('No autenticado');
    const res = await fetch(`${API}/unban`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id }) });
    if(!res.ok){ let txt=''; try{ txt = await res.text(); }catch(e){} throw new Error(txt || 'Error desbaneando usuario'); }
    return await res.json();
  }

  window.patchUser = async function(id, data){
    const token = localStorage.getItem('astralToken') || '';
    if(!token) throw new Error('No autenticado');
    const res = await fetch(`${API}/usuarios/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
    if(res.ok) return await res.json();
    // try to parse JSON error body, fallback to text
    let body = '';
    try{ body = await res.json(); }catch(e){ try{ body = await res.text(); }catch(e){} }
    const msg = (body && body.message) ? body.message : (typeof body === 'string' && body) ? body : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // wire initial show and search handlers (estamos dentro de DOMContentLoaded)
  try{ window.showAdminControls(); }catch(e){}
  const adminSearch = document.getElementById('admin-search');
  const adminRefresh = document.getElementById('admin-refresh-btn');
  if(adminSearch) adminSearch.addEventListener('input', ()=>{ const sec = document.getElementById('section-admin'); if(sec && sec.classList.contains('active')) window.initAdminSection(); });
  if(adminRefresh) adminRefresh.addEventListener('click', ()=> window.initAdminSection());

})

// <CHANGE> Función para sumar monedas al abrir un juego
async function addGameRewardCoins() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return;
        
        const res = await fetch(`${API}/api/user/coins/add-game-reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount: 5 })
        });
        
        if (res.ok) {
            // Actualizar el display de monedas inmediatamente
            fetchUserCoins();
        }
    } catch (e) {
        console.error('[coins] Error adding game reward:', e);
    }
}
window.addGameRewardCoins = addGameRewardCoins;

// --- ILEGAL MODE: detiene música, reproduce ilegal.mp3 y muestra texto superior-izquierda ---
(function(){
  let triggered = false;

  function triggerIlegalMode(reason){
    if(triggered) return; triggered = true;
    try{ document.querySelectorAll('audio').forEach(a=>{ try{ a.pause(); a.currentTime = 0; }catch(e){} }); }catch(e){}

    // reproducir ilegal.mp3 (loop)
    try{
      const audioEl = document.createElement('audio');
      audioEl.src = 'ilegal.mp3';
      audioEl.id = 'ilegal-audio';
      audioEl.loop = true;
      audioEl.autoplay = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      // intentar play, fallar silenciosamente si el navegador lo impide
      audioEl.play().catch(()=>{});
    }catch(e){ console.error('ilegalaudio error', e); }

    // crear overlay negro y mensaje superior-izquierda
    try{
      const ov = document.createElement('div');
      ov.id = 'ilegal-overlay';
      ov.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;z-index:2147483647;pointer-events:auto;';

      const msg = document.createElement('div');
      const rnd = Math.floor(Math.random()*1000000).toString().padStart(6,'0');
      msg.textContent = 'Comportamiento inadecuado detectado. Reiniciar la página es lo mejor.';
      msg.style.cssText = 'position:fixed;top:12px;left:12px;font-family:monospace, monospace;font-weight:800;font-size:18px;color:#fff;';

      ov.appendChild(msg);

      // ocultar todo lo demás para que no aparezca nada más
      // mantenemos el audio y el overlay
      const keepIds = ['ilegal-audio'];
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach(el=>{
        if(el.id && keepIds.includes(el.id)) return;
        // si el elemento es el overlay (todavía no está agregado) tampoco lo tocamos
        if(el === ov) return;
        try{ el.style.display = 'none'; }catch(e){}
      });

      document.body.appendChild(ov);
      document.documentElement.style.overflow = 'hidden';

      // prevenir cualquier interacción adicional
      function stopEvent(e){ try{ e.preventDefault(); e.stopPropagation(); }catch(_){} return false; }
      document.addEventListener('contextmenu', stopEvent, true);
      document.addEventListener('keydown', stopEvent, true);
      document.addEventListener('mousedown', stopEvent, true);

    }catch(e){ console.error('ilegal overlay error', e); }

    console.warn('Ilegal mode triggered', reason);
  }

  // detección: teclas de inspección/mostrar fuente (SOLO TECLAS, se permite clic derecho)
  // document.addEventListener('contextmenu', function(e){ e.preventDefault(); triggerIlegalMode('contextmenu'); }, { capture: true });

  document.addEventListener('keydown', function(e){
    const k = e.key || '';
    // F12, Ctrl+Shift+I/C/J/K, Ctrl+U, Meta+Alt+I (Mac)
    if(k === 'F12' || (e.ctrlKey && e.shiftKey && /[ICJK]/i.test(k)) || (e.ctrlKey && !e.shiftKey && k.toLowerCase() === 'u') || (e.metaKey && e.altKey && /i/i.test(k)) ){
      try{ e.preventDefault(); e.stopPropagation(); }catch(_){}
      triggerIlegalMode('inspector-key');
    }
  }, { capture: true });

  // exponer para pruebas manuales
  window.triggerIlegalMode = triggerIlegalMode;

  // Fallback: allow triggering ilegal mode by dispatching a CustomEvent
  // Example: document.dispatchEvent(new CustomEvent('astral:trigger-ilegal', { detail: { reason: 'manual' } }));
  document.addEventListener('astral:trigger-ilegal', function(ev){
    try{
      const r = ev && ev.detail && ev.detail.reason ? ev.detail.reason : 'event';
      console.info('astral:trigger-ilegal received', r);
      triggerIlegalMode(r);
    }catch(e){ console.error('astral:trigger-ilegal handler error', e); }
  }, { capture: false });

})();


