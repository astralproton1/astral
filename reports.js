(function(){
  // Try multiple sources for the API base URL
  let BASE = (typeof API !== 'undefined' ? API : (window.API || ''));
  if(!BASE && typeof window !== 'undefined' && window.location) {
    BASE = window.location.origin;
  }
  console.log('[reports] BASE URL:', BASE);
  
  function getToken(){
    // Check multiple token storage locations
    let token = localStorage.getItem('astralToken') || 
               localStorage.getItem('astral_token') || 
               localStorage.getItem('token') || 
               window.__astral_token || 
               sessionStorage.getItem('astralToken') ||
               sessionStorage.getItem('token') ||
               null;
    
    // If still no token, check if there's auth data
    if (!token && localStorage.getItem('authData')) {
      try {
        const authData = JSON.parse(localStorage.getItem('authData'));
        token = authData.token || authData.astralToken || null;
      } catch (e) {
        console.warn('[reports.getToken] Error parsing authData:', e);
      }
    }
    
    console.log('[reports.getToken] Token found:', !!token, 'Token value preview:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
  }

  function showToast(msg){
    const toast = document.getElementById('astral-toast');
    if(!toast) return alert(msg);
    toast.textContent = msg; 
    toast.classList.remove('hidden');
    setTimeout(()=>toast.classList.add('hidden'),3000);
  }

  function createButton(id, text){
    const btn = document.createElement('button');
    btn.id = id; 
    btn.className = 'background-button'; 
    btn.textContent = text;
    return btn;
  }

  function createModal(id, titleHtml, innerHtml){
    const overlay = document.createElement('div');
    overlay.className = 'settings-modal'; 
    overlay.id = id;
    overlay.style.display='none';
    
    const card = document.createElement('div'); 
    card.className='settings-card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0">${titleHtml}</h3>
        <button aria-label="Cerrar" style="background:none;border:none;color:#fff;font-size:20px;" class="modal-close">&times;</button>
      </div>
      <div class="modal-body">${innerHtml}</div>
    `;
    
    overlay.appendChild(card);
    overlay.querySelector('.modal-close').addEventListener('click', ()=>overlay.style.display='none');
    overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.style.display='none'; });
    document.body.appendChild(overlay);
    return overlay;
  }

  async function postReport(data){
    try{
      const token = getToken();
      const resp = await fetch(`${BASE}/report-user`,{
        method:'POST', 
        headers: Object.assign(
          {'Content-Type':'application/json'}, 
          token ? {Authorization:'Bearer '+token} : {}
        ), 
        body: JSON.stringify(data)
      });
      console.log('[reports.postReport] Response status:', resp.status);
      if(!resp.ok){
        const errText = await resp.text();
        console.error('[reports.postReport] Error response:', errText);
      }
      return resp.ok;
    }catch(e){
      console.error('[reports.postReport] Error:', e);
      return false;
    }
  }

  function buildReportModal(){
    const initialHtml = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <label style="display:block;margin-bottom:4px;font-weight:700">Usuario a reportar (ID)</label>
          <input id="report-reported" placeholder="ID del usuario a reportar" style="width:100%;padding:8px;margin-bottom:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);border-radius:4px;color:#e7f7ff" />
        </div>
        
        <div>
          <label style="display:block;margin-bottom:4px;font-weight:700">Motivo</label>
          <input id="report-reason" placeholder="Motivo breve (requerido)" style="width:100%;padding:8px;margin-bottom:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);border-radius:4px;color:#e7f7ff" />
        </div>
        
        <div>
          <label style="display:block;margin-bottom:4px;font-weight:700">Detalles (opcional)</label>
          <textarea id="report-details" placeholder="Detalles adicionales..." style="width:100%;padding:8px;margin-bottom:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);border-radius:4px;color:#e7f7ff;min-height:80px;resize:vertical;font-family:inherit"></textarea>
        </div>
        
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button id="send-report" class="background-button">Enviar reporte</button>
        </div>
      </div>
    `;
    return createModal('reportModal','Reportar usuario', initialHtml);
  }

  function openReport(){
    const modal = document.getElementById('reportModal') || buildReportModal();
    modal.style.display='flex';
    
    const sendBtn = modal.querySelector('#send-report');
    sendBtn.onclick = async ()=>{
      const reported = modal.querySelector('#report-reported').value.trim();
      const reason = modal.querySelector('#report-reason').value.trim();
      const details = modal.querySelector('#report-details').value.trim();
      
      if(!reported || !reason){ 
        showToast('Rellena ID del usuario y motivo'); 
        return; 
      }
      
      const payload = { reportedId: reported, reason, details: details || null };
      console.log('[reports] Sending report:', payload);
      
      sendBtn.disabled = true;
      const ok = await postReport(payload);
      sendBtn.disabled = false;
      
      if(ok){ 
        showToast('Reporte enviado correctamente'); 
        modal.style.display='none';
        // Clear inputs
        modal.querySelector('#report-reported').value = '';
        modal.querySelector('#report-reason').value = '';
        modal.querySelector('#report-details').value = '';
      }
      else showToast('Error al enviar reporte (comprueba los datos)');
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Try to attach to existing header button
    const reportBtn = document.getElementById('btn-bugs') || 
                     document.getElementById('btn-report') || 
                     document.querySelector('#header .header-btn[title^="Report"]') ||
                     document.querySelector('#header .header-btn[title*="bug" i]');
    
    if(reportBtn){
      try{ 
        reportBtn.addEventListener('click', openReport);
        console.log('[reports] Attached to existing report button');
      }catch(e){
        console.error('[reports] Error attaching to button:', e);
      }
    }

    // Fallback: if no existing button found, create one
    if(!reportBtn){
      const headerRight = document.querySelector('#header .header-right');
      if(headerRight && !document.getElementById('btn-report')){
        const b = createButton('btn-report','Reportar');
        b.style.marginRight='8px';
        b.addEventListener('click', openReport);
        headerRight.appendChild(b);
        console.log('[reports] Created new report button');
      }
    }
  });
})();
