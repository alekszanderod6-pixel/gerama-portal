// ══════════════════════════════════════════════════════
// GERAMA Admin Gate — Netflix-style login overlay
// Uses direct fetch (no Supabase SDK dependency).
// Dashboard JS runs fully in background — overlay just gates access.
// ══════════════════════════════════════════════════════
(function(){
  'use strict';

  // Use centralized Supabase config from supabase-config.js
  var SUPA_URL    = window.__SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
  var SUPA_KEY    = window.__SUPABASE_KEY || '';
  var SESSION_KEY = 'gerama_admin_session';
  var MASTER_PASS = '2026GERAMA';
  var INVITE_CODE = 'admin2026';
  var SUPER_CODE  = '2026GERAMAadmin';
  var COLOURS = [
    'linear-gradient(135deg,#1B5E20,#2E7D32)',
    'linear-gradient(135deg,#4338ca,#6366f1)',
    'linear-gradient(135deg,#0369a1,#0ea5e9)',
    'linear-gradient(135deg,#b45309,#d97706)',
    'linear-gradient(135deg,#7c3aed,#a78bfa)'
  ];

  var _agProfile = null;

  function _bg(name){ return COLOURS[(name||'A').charCodeAt(0) % COLOURS.length]; }
  function _esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  async function _sha256(s){
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }

  function getSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); }catch(e){ return null; } }
  function setSession(s){ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }

  document.addEventListener('DOMContentLoaded', function(){
    var session = getSession();
    if(session && session.id){ _applySession(session); return; }
    _loadProfiles();
  });

  function _loadProfiles(){
    var grid = document.getElementById('agGrid');
    if(grid) grid.innerHTML = '<div style="color:rgba(255,255,255,0.35);text-align:center;padding:1.5rem 0;font-size:0.85rem;width:100%;"><i class="fas fa-circle-notch fa-spin" style="font-size:1.8rem;display:block;margin-bottom:0.6rem;opacity:0.5;"></i>Loading profiles\u2026</div>';

    fetch(SUPA_URL + '/rest/v1/admin_profiles?select=id,name,role,email,photo_url,password_hash&order=name.asc', {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
    })
    .then(function(r){ return r.json(); })
    .then(function(data){ _renderProfiles(Array.isArray(data) ? data : []); })
    .catch(function(){
      if(!grid) return;
      grid.innerHTML =
        '<div style="text-align:center;width:100%;padding:1rem;">' +
          '<div style="color:#f87171;font-size:0.85rem;margin-bottom:1rem;"><i class="fas fa-wifi" style="display:block;font-size:2rem;margin-bottom:0.5rem;opacity:0.5;"></i>No connection. Try again or use master password.</div>' +
          '<button onclick="_loadProfiles()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:white;padding:0.5rem 1.3rem;border-radius:20px;cursor:pointer;font-family:\'Inter\',sans-serif;font-size:0.83rem;font-weight:600;margin-right:0.6rem;"><i class="fas fa-redo"></i> Retry</button>' +
          '<button onclick="_agMasterBypass()" style="background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.35);color:#FFC107;padding:0.5rem 1.3rem;border-radius:20px;cursor:pointer;font-family:\'Inter\',sans-serif;font-size:0.83rem;font-weight:600;"><i class="fas fa-key"></i> Emergency Access</button>' +
        '</div>';
    });
  }
  window._loadProfiles = _loadProfiles;

  function _renderProfiles(profiles){
    var grid = document.getElementById('agGrid');
    if(!grid) return;
    var html = '';
    if(!profiles.length){
      html = '<div style="color:rgba(255,255,255,0.4);text-align:center;font-size:0.85rem;width:100%;padding-bottom:1rem;">No profiles yet. Create the first one.</div>';
    }
    profiles.forEach(function(p){
      var ava = p.photo_url
        ? '<img src="'+_esc(p.photo_url)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9px;">'
        : (p.name||'A').charAt(0).toUpperCase();
      var bg = p.photo_url ? '' : 'background:'+_bg(p.name)+';';
      html += '<div class="ag-card" data-pid="'+_esc(p.id||'')+'" data-pname="'+_esc(p.name||'')+'" data-prole="'+_esc(p.role||'')+'" data-pemail="'+_esc(p.email||'')+'" data-pphoto="'+_esc(p.photo_url||'')+'" data-phash="'+_esc(p.password_hash||'')+'">' +
        '<div class="ag-ava" style="'+bg+'">'+ava+'</div>' +
        '<div class="ag-name">'+_esc(p.name||'')+'</div>' +
        '<div class="ag-role">'+_esc(p.role||'Admin')+'</div>' +
      '</div>';
    });
    html += '<div class="ag-add" onclick="document.getElementById(\'agCreateModal\').classList.add(\'open\')">' +
      '<div class="ag-add-btn"><i class="fas fa-plus"></i></div>' +
      '<div class="ag-name" style="color:rgba(255,255,255,0.4);">Add Profile</div>' +
    '</div>';
    grid.innerHTML = html;
    grid.onclick = function(e){
      var card = e.target.closest('.ag-card');
      if(!card) return;
      _agProfile = { id:card.getAttribute('data-pid'), name:card.getAttribute('data-pname'),
        role:card.getAttribute('data-prole'), email:card.getAttribute('data-pemail'),
        photo:card.getAttribute('data-pphoto'), hash:card.getAttribute('data-phash') };
      _openPinModal(_agProfile);
    };
  }

  function _openPinModal(p){
    var modal = document.getElementById('agPinModal');
    var ava   = document.getElementById('agPinAva');
    var nameEl= document.getElementById('agPinName');
    var roleEl= document.getElementById('agPinRole');
    var inp   = document.getElementById('agPinInput');
    var err   = document.getElementById('agPinErr');
    if(!modal) return;
    if(nameEl) nameEl.textContent = p.name||'Admin';
    if(roleEl) roleEl.textContent = p.role||'GERAMA Admin';
    if(ava){
      if(p.photo){ ava.innerHTML='<img src="'+_esc(p.photo)+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">'; ava.style.background='none'; }
      else { ava.innerHTML=(p.name||'A').charAt(0).toUpperCase(); ava.style.background=_bg(p.name); }
    }
    if(inp){ inp.value=''; setTimeout(function(){inp.focus();},150); }
    if(err) err.textContent='';
    modal.classList.add('open');
  }

  window.agClosePinModal = function(){
    var m = document.getElementById('agPinModal');
    if(m) m.classList.remove('open');
    _agProfile = null;
  };

  window.agSubmitPin = async function(){
    var inp  = document.getElementById('agPinInput');
    var err  = document.getElementById('agPinErr');
    var btn  = document.getElementById('agPinBtn');
    var pass = (inp&&inp.value||'').trim();
    if(!pass){ if(err) err.textContent='Enter your password.'; return; }
    if(!_agProfile){ window.agClosePinModal(); return; }
    if(err) err.textContent='';
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Checking...'; }
    var reset = function(){ if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-unlock-alt"></i> Enter Dashboard';} };

    if(pass === MASTER_PASS){
      var ms = {id:_agProfile.id||'master',name:_agProfile.name,role:_agProfile.role,email:_agProfile.email,photo:_agProfile.photo};
      setSession(ms); window.agClosePinModal(); _applySession(ms); reset(); return;
    }

    try {
      var inputHash = await _sha256(pass);
      var storedHash = (_agProfile.hash||'').trim();

      if(!storedHash || storedHash.length < 10){
        await fetch(SUPA_URL+'/rest/v1/admin_profiles?id=eq.'+encodeURIComponent(_agProfile.id), {
          method:'PATCH', headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
          body: JSON.stringify({password_hash:inputHash})
        }).catch(function(){});
        var s2={id:_agProfile.id,name:_agProfile.name,role:_agProfile.role,email:_agProfile.email,photo:_agProfile.photo};
        setSession(s2); window.agClosePinModal(); _applySession(s2);
        _loadProfiles();
        reset(); return;
      }

      if(inputHash !== storedHash){
        if(err) err.textContent='Wrong password. Try again.';
        if(inp){inp.value='';inp.focus();}
        reset(); return;
      }

      var s3={id:_agProfile.id,name:_agProfile.name,role:_agProfile.role,email:_agProfile.email,photo:_agProfile.photo};
      setSession(s3); window.agClosePinModal(); _applySession(s3);
      fetch(SUPA_URL+'/rest/v1/admin_audit_log',{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({admin_id:s3.id,admin_name:s3.name,action:'login',details:'Signed in',created_at:new Date().toISOString()})}).catch(function(){});
    } catch(ex){ if(err) err.textContent='Error: '+(ex.message||'Unknown'); }
    reset();
  };

  function _applySession(session){
    var gate = document.getElementById('geramaAdminGate');
    if(gate) gate.style.display = 'none';
    var bar  = document.getElementById('agActiveBar');
    var ava  = document.getElementById('agActiveAva');
    var nm   = document.getElementById('agActiveName');
    var rl   = document.getElementById('agActiveRole');
    if(bar)  bar.style.display = 'flex';
    if(nm)   nm.textContent = session.name||'Admin';
    if(rl)   rl.textContent = session.role||'Admin';
    if(ava){
      if(session.photo){ ava.innerHTML='<img src="'+_esc(session.photo)+'" style="width:100%;height:100%;object-fit:cover;" alt="">'; }
      else { ava.textContent=(session.name||'A').charAt(0).toUpperCase(); ava.style.background=_bg(session.name); }
    }
    var apn=document.getElementById('apName'),apr=document.getElementById('apRole'),ape=document.getElementById('apEmail');
    if(apn&&!apn.value) apn.value=session.name||'';
    if(apr&&!apr.value) apr.value=session.role||'';
    if(ape) ape.value=session.email||'';
    window._activeAdminSession = session;
    var origLog = window.logActivity;
    if(origLog) window.logActivity = function(msg){ origLog('['+(session.name||'Admin')+'] '+msg); };

    // ── Reload all dashboard data now that the gate is removed ──
    // DOMContentLoaded fired before login, so Supabase may not have
    // been ready. Force a fresh load with a reliable retry.
    var _reloadAttempts = 0;
    function _reloadData(){
      _reloadAttempts++;
      if(window.geramaSupabase){
        // loadData handles materials + announcements + stats
        if(typeof window.loadData === 'function') window.loadData();
        // loadOverviewStats exposes itself on window on first call inside loadData
        // so give it 1 second then call it again for the stat boxes
        setTimeout(function(){
          if(typeof window.loadOverviewStats === 'function') window.loadOverviewStats();
          // Also pre-load assignments and grades so they're ready when admin navigates there
          if(typeof window.loadAsgList === 'function') window.loadAsgList();
          if(typeof window.loadGradesPanel === 'function') window.loadGradesPanel();
        }, 1000);
      } else if(_reloadAttempts < 30){
        setTimeout(_reloadData, 400); // retry every 400ms up to 12 seconds
      }
    }
    setTimeout(_reloadData, 200);
  }

  window.agLogout = function(){
    localStorage.removeItem(SESSION_KEY);
    var gate = document.getElementById('geramaAdminGate');
    if(gate) gate.style.display = 'flex';
    var bar = document.getElementById('agActiveBar');
    if(bar) bar.style.display = 'none';
    _agProfile = null;
    _loadProfiles();
  };

  window._agMasterBypass = function(){
    var code = prompt('Enter master access code:');
    if(!code) return;
    if(code === MASTER_PASS || code === SUPER_CODE || code === INVITE_CODE){
      var ms={id:'master',name:'GERAMA Admin',role:'Super Admin',email:'gerama.uenr@gmail.com',photo:null};
      setSession(ms); _applySession(ms);
    } else { alert('Wrong code.'); }
  };

  window.agSubmitCreate = async function(){
    var code  = (document.getElementById('agCpCode').value||'').trim();
    var name  = (document.getElementById('agCpName').value||'').trim();
    var role  = (document.getElementById('agCpRole').value||'').trim();
    var email = (document.getElementById('agCpEmail').value||'').trim().toLowerCase();
    var pass  = (document.getElementById('agCpPass').value||'').trim();
    var msg   = document.getElementById('agCpMsg');
    function showMsg(t,ok){ if(msg){msg.textContent=t;msg.style.color=ok?'#4ade80':'#f87171';} }

    if(code !== INVITE_CODE){ showMsg('Wrong invite code. Ask Alexander.',false); return; }
    if(!name||!role){ showMsg('Fill in Name and Role.',false); return; }
    if(!email||!email.includes('@')){ showMsg('Enter a valid email.',false); return; }
    if(!pass||pass.length<6){ showMsg('Password must be at least 6 characters.',false); return; }
    showMsg('Saving\u2026',true);
    try {
      var hash = await _sha256(pass);
      var res = await fetch(SUPA_URL+'/rest/v1/admin_profiles', {
        method:'POST',
        headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify({name:name,role:role,email:email,password_hash:hash,updated_at:new Date().toISOString()})
      });
      if(!res.ok){ var t=await res.text(); throw new Error(t.substring(0,120)); }
      showMsg('\u2705 Profile saved! Tap your name to sign in.',true);
      setTimeout(function(){
        document.getElementById('agCreateModal').classList.remove('open');
        ['agCpCode','agCpName','agCpRole','agCpEmail','agCpPass'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
        if(msg) msg.textContent='';
        _loadProfiles();
      }, 1500);
    } catch(e){ showMsg('\u274c '+e.message,false); }
  };

  window.deleteAdminProfile = async function(id, name){
    var code = prompt('Remove "'+name+'"? Enter super-admin code:');
    if(!code) return;
    if(code !== SUPER_CODE){ alert('Wrong code.'); return; }
    await fetch(SUPA_URL+'/rest/v1/admin_profiles?id=eq.'+encodeURIComponent(id), {
      method:'DELETE', headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}
    });
    alert('\u2705 '+name+' removed.');
    if(window.loadAdminProfiles) window.loadAdminProfiles();
    _loadProfiles();
  };

  window.pushPlannerSuggestion = async function(){
    var text=(document.getElementById('suggText')||{value:''}).value.trim();
    var emoji=(document.getElementById('suggEmoji')||{value:'\ud83d\udca1'}).value.trim()||'\ud83d\udca1';
    if(!text){window.showStatus('suggStatus','Please type a suggestion.','err');return;}
    var sb=window.geramaSupabase;if(!sb){window.showStatus('suggStatus','Not connected.','err');return;}
    var session=getSession();
    try{
      var res=await sb.from('planner_suggestions').insert({text:text,emoji:emoji,active:true,created_by:session?session.name:'Admin',created_at:new Date().toISOString()});
      if(res.error) throw new Error(res.error.message);
      document.getElementById('suggText').value='';
      window.showStatus('suggStatus','\u2705 Pushed to students!','ok');
    }catch(e){window.showStatus('suggStatus','\u274c '+e.message,'err');}
  };

  window.getAdminSession = getSession;

  // Mall order tracking helpers
  window.mallToggleOrder = async function(id, field, val){
    var body = {}; body[field] = val;
    var KEY = window.__SUPABASE_KEY || '';
    try{
      await fetch(SUPA_URL+'/rest/v1/mall_orders?id=eq.'+encodeURIComponent(id),{
        method:'PATCH',
        headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify(body)
      });
      if(window.logActivity) window.logActivity('Order '+id+': '+field+'='+val);
    }catch(e){ alert('Update failed: '+e.message); }
  };

  window.mallDeleteOrder = async function(id){
    if(!confirm('Delete this order?')) return;
    var KEY = window.__SUPABASE_KEY || '';
    await fetch(SUPA_URL+'/rest/v1/mall_orders?id=eq.'+encodeURIComponent(id),{
      method:'DELETE', headers:{'apikey':KEY,'Authorization':'Bearer '+KEY}
    });
    if(window.loadMallAdmin) window.loadMallAdmin();
  };

  window.adminToggleMallColorFields = function(){
    var cat = (document.getElementById('mallProdCat')||{value:''}).value;
    var needsColor = cat === 'fashion' || cat === 'accessories';
    var cf  = document.getElementById('mallColourField');
    var cnf = document.getElementById('mallColourNameField');
    var sf  = document.getElementById('mallSizeField');
    if(cf)  cf.style.display  = needsColor ? 'block' : 'none';
    if(cnf) cnf.style.display = needsColor ? 'block' : 'none';
    if(sf)  sf.style.display  = cat === 'fashion' ? 'block' : 'none';
  };

})();
