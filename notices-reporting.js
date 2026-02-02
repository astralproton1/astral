(function(){
  // Try multiple sources for the API base URL
  let BASE = (typeof API !== 'undefined' ? API : (window.API || ''));
  if(!BASE && typeof window !== 'undefined' && window.location) {
    // Fallback: try to construct from current page location
    BASE = window.location.origin;
  }
  console.log('[notices-reporting] BASE URL:', BASE);
  
  function getToken(){
    const token = localStorage.getItem('astralToken') || localStorage.getItem('astral_token') || localStorage.getItem('token') || window.__astral_token || null;
    console.log('[getToken] Token found:', !!token, 'Token value preview:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
  }
  function getUserId(){
    if (typeof getCurrentUserId === 'function') try{ return getCurrentUserId(); }catch(e){}
    return localStorage.getItem('astral_user') || localStorage.getItem('userId') || null;
  }
  function showToast(msg){
    const toast = document.getElementById('astral-toast');
    if(!toast) return alert(msg);
    toast.textContent = msg; toast.classList.remove('hidden');
    setTimeout(()=>toast.classList.add('hidden'),3000);
  }

  function createButton(id, text){
    const btn = document.createElement('button');
    btn.id = id; btn.className = 'background-button'; btn.textContent = text;
    return btn;
  }

  function createModal(id, titleHtml, innerHtml){
    const overlay = document.createElement('div');
    overlay.className = 'settings-modal'; overlay.id = id;
    overlay.style.display='none';
    const card = document.createElement('div'); card.className='settings-card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><h3 style="margin:0">${titleHtml}</h3><button aria-label="Cerrar" style="background:none;border:none;color:#fff;font-size:20px;" class="modal-close">&times;</button></div><div class="modal-body">${innerHtml}</div>`;
    overlay.appendChild(card);
    overlay.querySelector('.modal-close').addEventListener('click', ()=>overlay.style.display='none');
    overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.style.display='none'; });
    document.body.appendChild(overlay);
    return overlay;
  }

  async function fetchNotices(){
    try{
      const resp = await fetch(`${BASE}/api/anuncios`);
      if(!resp.ok) throw new Error('Error fetching');
      return await resp.json();
    }catch(e){ console.error(e); return []; }
  }

  async function postNotice(data){
    try{
      const token = getToken();
      const resp = await fetch(`${BASE}/api/anuncios`,{
        method:'POST', headers: Object.assign({'Content-Type':'application/json'}, token?{Authorization:'Bearer '+token}:{}) , body: JSON.stringify(data)
      });
      return resp.ok;
    }catch(e){console.error(e);return false}
  }

  // Try to verify token and return user info (or null)
  async function getUserInfo(){
    const token = getToken();
    if(!token) { 
      console.log('[getUserInfo] No token found in localStorage or window'); 
      return null; 
    }
    try{
      const endpoint = (BASE||'') + '/verify-token';
      console.log('[getUserInfo] Attempting fetch to:', endpoint);
      const resp = await fetch(endpoint, { 
        headers: { Authorization: 'Bearer '+token } 
      });
      console.log('[getUserInfo] Response status:', resp.status);
      if(!resp.ok) { 
        console.warn('[getUserInfo] verify-token returned error:', resp.status, resp.statusText); 
        // Try to parse error response
        const errText = await resp.text();
        console.warn('[getUserInfo] Error body:', errText);
        return null; 
      }
      const j = await resp.json();
      console.log('[getUserInfo] Received user data:', j);
      return j.user || null;
    }catch(e){ 
      console.error('[getUserInfo] Error:', e.message, e); 
      return null; 
    }
  }

  function buildNoticesModal(){
    const initial = `<div id="notices-list" style="max-height:50vh;overflow:auto;margin-bottom:12px">Cargando avisos...</div>
    <div id="notice-create-area">
      <h4 style="margin:6px 0">Crear aviso (admins/owner)</h4>
      <input id="notice-title" placeholder="Título" style="width:100%;padding:8px;margin-bottom:6px" />
      <textarea id="notice-msg" placeholder="Mensaje" style="width:100%;padding:8px;margin-bottom:6px"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button id="create-notice" class="background-button">Crear</button></div>
    </div>`;
    return createModal('noticesModal','Anuncios', initial);
  }

  async function openNotices(){
    const modal = document.getElementById('noticesModal') || buildNoticesModal();
    modal.style.display='flex';
    const list = modal.querySelector('#notices-list');
    list.textContent = 'Cargando...';
    const items = await fetchNotices();
    if(!items || items.length === 0) list.innerHTML = '<div style="opacity:0.8">No hay anuncios activos</div>';
    else{
      list.innerHTML = items.map(n=>{
        const t = new Date(n.created_at||n.createdAt||n.created).toLocaleString();
        return `<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${n.title||n.titulo}</strong><div style="font-size:0.95rem;opacity:0.9">${n.message||n.mensaje||n.msg||''}</div><div style="font-size:0.8rem;opacity:0.6;margin-top:6px">${t}</div></div>`;
      }).join('');
    }

    // Wire create button only if the user has permission (server requires auth+role)
    const createArea = modal.querySelector('#notice-create-area');
    const createBtn = modal.querySelector('#create-notice');
    if(createBtn){
      // Default: hide create area until we verify role
      if(createArea) createArea.style.display = 'none';
      const user = await getUserInfo();
      console.log('[openNotices] User object:', user);
      const allowedRoles = ['owner','admin_senior','admin'];
      const roleRaw = (user && (user.rol || user.role || '')) || '';
      const role = roleRaw.toString().toLowerCase().trim();
      console.log('[openNotices] Extracted role:', role, '| Allowed roles:', allowedRoles);
      const canCreate = role && allowedRoles.map(r=>r.toLowerCase()).includes(role);
      console.log('[openNotices] Can create notices:', canCreate);
      if(canCreate){
        if(createArea) createArea.style.display = '';
        createBtn.onclick = async ()=>{
          const title = modal.querySelector('#notice-title').value.trim();
          const msg = modal.querySelector('#notice-msg').value.trim();
          if(!title || !msg){ showToast('Rellena título y mensaje'); return; }
          createBtn.disabled = true;
          const ok = await postNotice({ title, message: msg, type: 'info' });
          createBtn.disabled = false;
          if(ok){ showToast('Aviso creado'); modal.style.display='none'; }
          else showToast('Error creando aviso (comprueba permisos)');
        }
      }else{
        // Show explanatory message for non-admins
        if(createArea){
          createArea.style.display = '';
          createArea.innerHTML = '<div style="opacity:0.9;padding:8px;border-radius:8px;background:rgba(255,255,255,0.02)">Necesitas ser administrador para crear anuncios. Inicia sesión con una cuenta con permisos. <br><small style="opacity:0.7">(Tu rol: ' + (role||'ninguno') + ')</small></div>';
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Prefer wiring existing header buttons instead of creating duplicates.
    const headerRight = document.querySelector('#header .header-right');

    // Try to attach to known existing header button ids first
    const adsBtn = document.getElementById('btn-ads') || document.querySelector('#header .header-btn[title="Anuncios"]');
    if(adsBtn){
      try{ adsBtn.addEventListener('click', openNotices); }catch(e){}
    }

    // Fallback: if no existing button is present, create a new one
    if(!adsBtn && headerRight && !document.getElementById('btn-notices')){
      const b1 = createButton('btn-notices','Anuncios');
      b1.style.marginRight='8px';
      b1.addEventListener('click', openNotices);
      headerRight.appendChild(b1);
    }
  });
})();
