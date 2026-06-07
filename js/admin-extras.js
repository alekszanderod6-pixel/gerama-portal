// ═══════════════════════════════════════════════════════════════
// GERAMA Admin Extras — Team Management, Multi-image, Attendance cleanup,
// Sensitive operation codes, and brilliant new features
// ═══════════════════════════════════════════════════════════════

(function(){
  'use strict';

  var SUPA_URL = 'https://hdrnnvvrtbwjsxtrxzfj.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkcm5udnZydGJ3anN4dHJ4emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ3MTgsImV4cCI6MjA5MjEwMDcxOH0.rEHkz3HOoXArRkasGSaxK6JQZrQHI2LAJ7c6Dj8DaQI';
  var SENSITIVE_CODE = '2026GERAMA';
  var SUPER_ADMIN_CODE = 'adminGERAMA2026';
  var BUCKET = 'gerama-materials';

  // ── REST helper ─────────────────────────────────────────────────
  function supa(path, opts){
    var headers = Object.assign({
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY
    }, opts && opts.headers || {});
    return fetch(SUPA_URL + '/rest/v1/' + path, Object.assign({}, opts, { headers: headers }));
  }

  function getSB(){ return window.geramaSupabase || null; }

  // ── Require sensitive code before destructive actions ────────────
  function requireCode(action, callback){
    var code = prompt('⚠️ ' + action + '\n\nEnter admin security code to confirm:');
    if(!code) return;
    if(code !== SENSITIVE_CODE){
      alert('❌ Wrong code. Action cancelled.');
      return;
    }
    callback();
  }

  // ── Wire switchPanel for team panel ─────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    var origSwitch = window.switchPanel;
    window.switchPanel = function(name){
      if(origSwitch) origSwitch(name);
      if(name === 'team') setTimeout(function(){ loadTeamList('all'); }, 150);
    };

    // Team photo drop zone
    var zone  = document.getElementById('tmPhotoZone');
    var input = document.getElementById('tmPhotoFile');
    if(zone && input){
      zone.addEventListener('dragover', function(e){ e.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', function(){ zone.classList.remove('drag-over'); });
      zone.addEventListener('drop', function(e){
        e.preventDefault(); zone.classList.remove('drag-over');
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if(f){ _previewTeamPhoto(f); }
      });
      input.addEventListener('change', function(){
        var f = this.files && this.files[0]; if(f) _previewTeamPhoto(f);
      });
    }

    // Mall multi-image drop zone upgrade
    upgradeMallImageZone();

    // Attendance — add delete session button to filter
    upgradeAttendanceFilter();

    // Override deleteHistoryEntry and deleteAnn to require code
    upgradeDeleteButtons();
  });

  function _previewTeamPhoto(file){
    window._tmPhotoFile = file;
    document.getElementById('tmPhotoChosen').textContent = '✅ ' + file.name;
    var reader = new FileReader();
    reader.onload = function(e){
      var prev = document.getElementById('tmPhotoPreview');
      if(prev){ prev.src = e.target.result; prev.style.display = 'block'; }
    };
    reader.readAsDataURL(file);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEAM MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  window.saveTeamMember = async function(){
    var name  = (document.getElementById('tmName').value||'').trim();
    var role  = (document.getElementById('tmRole').value||'').trim();
    var group = document.getElementById('tmGroup').value||'founding';
    var badge = (document.getElementById('tmBadge').value||'').trim();
    var emoji = (document.getElementById('tmEmoji').value||'👤').trim();
    var order = parseInt(document.getElementById('tmOrder').value||'99');

    if(!name || !role){
      window.showStatus('tmStatus','Please fill in Name and Role.','err');
      return;
    }

    var btn = document.getElementById('tmSaveBtn');
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...'; }
    window.showStatus('tmStatus','Saving...','info');

    try {
      var photoUrl = null;
      var photoFile = window._tmPhotoFile;

      if(photoFile){
        if(photoFile.size > 5 * 1024 * 1024){
          throw new Error('Photo too large. Max 5 MB.');
        }
        var sb = getSB();
        if(sb){
          var ext = photoFile.name.split('.').pop().toLowerCase();
          var path = 'team-members/' + name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + Date.now() + '.' + ext;
          var upRes = await sb.storage.from(BUCKET).upload(path, photoFile, { upsert: true });
          if(!upRes.error){
            photoUrl = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          }
        }
      }

      var resp = await supa('team_members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          name: name, role: role, group: group,
          badge_label: badge || null, emoji: emoji || '👤',
          photo_url: photoUrl, sort_order: order,
          active: true, created_at: new Date().toISOString()
        })
      });

      if(!resp.ok){
        var t = await resp.text();
        throw new Error(t.substring(0,120));
      }

      if(window.logActivity) window.logActivity('Added team member: ' + name + ' (' + group + ')');
      window.showStatus('tmStatus', '✅ ' + name + ' added! They now appear on the About page.', 'ok');

      // Reset form
      ['tmName','tmRole','tmBadge','tmEmoji'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.value = '';
      });
      document.getElementById('tmOrder').value = '99';
      document.getElementById('tmPhotoChosen').textContent = '';
      var prev = document.getElementById('tmPhotoPreview');
      if(prev){ prev.src=''; prev.style.display='none'; }
      var inp = document.getElementById('tmPhotoFile');
      if(inp) inp.value='';
      window._tmPhotoFile = null;

      loadTeamList('all');

    } catch(e){
      window.showStatus('tmStatus', '❌ ' + e.message, 'err');
    }

    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Add to About Page'; }
  };

  window.loadTeamList = async function(filter){
    var el = document.getElementById('tmList');
    if(!el) return;
    el.innerHTML = '<p style="color:#9ca3af;font-size:0.88rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    try {
      var path = 'team_members?select=*&order=group.asc&order=sort_order.asc&order=created_at.asc';
      if(filter && filter !== 'all') path += '&group=eq.' + encodeURIComponent(filter);

      var resp = await supa(path);
      if(!resp.ok) throw new Error('HTTP ' + resp.status);
      var data = await resp.json();

      if(!data || !data.length){
        el.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;"><i class="fas fa-users" style="font-size:2.5rem;display:block;margin-bottom:0.8rem;opacity:0.3;"></i><p style="font-weight:600;">No members added yet</p><small>Use the form above to add your first member</small></div>';
        return;
      }

      var groupLabels = {
        founding: 'Founding Team & Core Leads',
        gerama25: 'GERAMA/25 Tutors',
        gerama26: 'GERAMA/26 Tutors & Leadership',
        media: 'Media Team'
      };

      var groupColors = {
        founding: '#1B5E20', gerama25: '#2E7D32',
        gerama26: '#6366f1', media: '#0ea5e9'
      };

      el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;">' +
        data.map(function(m){
          var col = groupColors[m.group] || '#1B5E20';
          var avatarHtml = m.photo_url
            ? '<img src="'+window.escAttr(m.photo_url)+'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2.5px solid '+col+';flex-shrink:0;" alt="">'
            : '<div style="width:52px;height:52px;border-radius:50%;background:'+col+';display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">'+(m.emoji||'👤')+'</div>';

          return '<div style="background:white;border-radius:14px;padding:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e8f0e8;border-top:3px solid '+col+';display:flex;gap:0.8rem;align-items:flex-start;">'+
            avatarHtml+
            '<div style="flex:1;min-width:0;">'+
              '<div style="font-weight:700;color:#1e2a3e;font-size:0.9rem;margin-bottom:0.15rem;">'+window.escHtml(m.name)+'</div>'+
              '<div style="font-size:0.75rem;color:'+col+';font-weight:700;margin-bottom:0.2rem;">'+window.escHtml(m.role||'')+'</div>'+
              '<span style="background:'+col+'22;color:'+col+';font-size:0.68rem;font-weight:700;padding:0.1rem 0.5rem;border-radius:20px;">'+window.escHtml(groupLabels[m.group]||m.group)+'</span>'+
            '</div>'+
            '<button onclick="removeTeamMember(\''+window.escAttr(m.id)+'\',\''+window.escAttr(m.name)+'\');event.stopPropagation();" class="btn-danger" style="padding:0.25rem 0.5rem;font-size:0.75rem;flex-shrink:0;"><i class="fas fa-trash"></i></button>'+
          '</div>';
        }).join('') +
      '</div>';

    } catch(e){
      el.innerHTML = '<p style="color:#dc2626;padding:1rem;">Error: ' + window.escHtml(e.message) + '</p>';
    }
  };

  window.removeTeamMember = function(id, name){
    requireCode('Remove "' + name + '" from the About page?', async function(){
      var resp = await supa('team_members?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      if(!resp.ok){ alert('Error deleting member.'); return; }
      if(window.logActivity) window.logActivity('Removed team member: ' + name);
      loadTeamList('all');
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // MALL MULTI-IMAGE UPGRADE (3–5 images)
  // ═══════════════════════════════════════════════════════════════

  function upgradeMallImageZone(){
    var zone  = document.getElementById('mallImgZone');
    var input = document.getElementById('mallProdFile');
    if(!zone || !input) return;

    // Upgrade to accept multiple images
    input.setAttribute('accept', 'image/*');
    input.setAttribute('multiple', 'multiple');

    // Update label
    var p = zone.querySelector('p');
    if(p) p.textContent = 'Click to upload 1–5 product images (max 5 per listing)';

    input.addEventListener('change', function(){
      var files = Array.from(this.files||[]).slice(0,5);
      window._mallProductFiles = files;
      var chosen = document.getElementById('mallProdFileChosen');
      if(chosen) chosen.textContent = '✅ ' + files.length + ' image' + (files.length!==1?'s':'') + ' selected';
      var preview = document.getElementById('mallProdPreview');
      if(preview){
        preview.style.display = 'flex';
        preview.style.gap = '0.5rem';
        preview.style.flexWrap = 'wrap';
        preview.innerHTML = '';
        files.forEach(function(f, i){
          var reader = new FileReader();
          reader.onload = function(e){
            var img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:80px;height:80px;border-radius:10px;object-fit:cover;border:2px solid #e5e7eb;';
            if(i === 0) img.title = 'Main photo';
            preview.appendChild(img);
          };
          reader.readAsDataURL(f);
        });
      }
    });
  }

  // Override adminPostProduct to handle multiple images
  var _origPostProduct = window.adminPostProduct;
  window.adminPostProduct = async function(){
    // If multi-files are selected, handle upload here and inject into the original function
    var files = window._mallProductFiles || [];
    if(files.length === 0){
      // Fall back to original behaviour
      if(_origPostProduct) return _origPostProduct();
      return;
    }

    var name = (document.getElementById('mallProdName').value||'').trim();
    var cat  = document.getElementById('mallProdCat').value;
    var price = parseFloat(document.getElementById('mallProdPrice').value);
    var origPrice = parseFloat(document.getElementById('mallProdOrigPrice').value)||null;
    var seller = (document.getElementById('mallProdSeller').value||'').trim();
    var wa = (document.getElementById('mallProdWA').value||'').trim();
    var desc = (document.getElementById('mallProdDesc').value||'').trim();
    var coloursRaw = (document.getElementById('mallProdColours') ? document.getElementById('mallProdColours').value||'' : '').trim();
    var colourNamesRaw = (document.getElementById('mallProdColourNames') ? document.getElementById('mallProdColourNames').value||'' : '').trim();
    var sizesRaw = (document.getElementById('mallProdSizes') ? document.getElementById('mallProdSizes').value||'' : '').trim();
    var stock = parseInt((document.getElementById('mallProdStock')||{value:'0'}).value)||0;
    var badge = (document.getElementById('mallProdBadge')||{value:''}).value;

    if(!name||!cat||isNaN(price)||!seller||!wa||!desc){
      window.showStatus('mallPostStatus','Please fill in all required fields.','err'); return;
    }

    var btn = document.querySelector('[onclick="adminPostProduct()"]');
    if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Uploading '+files.length+' images...'; }
    window.showStatus('mallPostStatus','Uploading images...','info');

    var imgUrls = [];
    var sb = getSB();
    if(sb){
      for(var fi=0; fi<files.length; fi++){
        var f = files[fi];
        try{
          var ext = f.name.split('.').pop().toLowerCase();
          var path = 'mall/' + Date.now() + '-' + fi + '-' + name.toLowerCase().replace(/[^a-z0-9]/g,'-').substring(0,15) + '.' + ext;
          var up = await sb.storage.from(BUCKET).upload(path, f, {upsert:true, contentType:f.type});
          if(!up.error) imgUrls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
        }catch(e){ console.warn('Image upload '+fi+' failed:', e); }
      }
    }

    var sellerId = 'GUM-' + String(Date.now()).slice(-4);
    var colours = coloursRaw ? JSON.stringify(coloursRaw.split(',').map(function(s){return s.trim();})) : '[]';
    var colourNames = colourNamesRaw ? JSON.stringify(colourNamesRaw.split(',').map(function(s){return s.trim();})) : '[]';
    var sizes = sizesRaw ? JSON.stringify(sizesRaw.split(',').map(function(s){return s.trim();})) : '[]';

    try{
      var mallUrl = SUPA_URL + '/rest/v1/mall_products';
      var r = await fetch(mallUrl, {
        method:'POST',
        headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({
          name:name, category:cat, price:price, original_price:origPrice,
          description:desc, image_url:imgUrls[0]||null,
          extra_images: imgUrls.length > 1 ? JSON.stringify(imgUrls.slice(1)) : null,
          seller_name:seller, seller_whatsapp:wa||'0555749497',
          seller_id:sellerId, status:'approved',
          colours:colours, colour_names:colourNames, sizes:sizes,
          stock:stock, verified:true, featured:true, badge:badge||null,
          created_at:new Date().toISOString()
        })
      });
      if(!r.ok) throw new Error('HTTP '+r.status);
      window.showStatus('mallPostStatus','✅ Product posted with '+imgUrls.length+' image(s)! Seller ID: '+sellerId,'ok');
      if(window.logActivity) window.logActivity('Posted mall product: '+name+' ('+imgUrls.length+' images, '+sellerId+')');
      ['mallProdName','mallProdPrice','mallProdOrigPrice','mallProdSeller','mallProdWA','mallProdDesc'].forEach(function(id){
        var e=document.getElementById(id); if(e) e.value='';
      });
      document.getElementById('mallProdCat').value='';
      document.getElementById('mallProdBadge').value='';
      document.getElementById('mallProdFileChosen').textContent='';
      document.getElementById('mallProdPreview').style.display='none';
      document.getElementById('mallProdPreview').innerHTML='';
      document.getElementById('mallProdFile').value='';
      window._mallProductFiles = [];
      if(window.loadMallAdmin) window.loadMallAdmin();
    }catch(e){
      window.showStatus('mallPostStatus','❌ '+e.message,'err');
    }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Post to Mall'; }
  };

  // ═══════════════════════════════════════════════════════════════
  // ATTENDANCE — Add delete session button to filter dropdown
  // ═══════════════════════════════════════════════════════════════

  function upgradeAttendanceFilter(){
    // Wrap loadAttSessions to add a "Delete Selected Session" button
    var origLoadSessions = window.loadAttSessions;
    window.loadAttSessions = async function(){
      if(origLoadSessions) await origLoadSessions();
      // Add delete button next to filter if not already there
      var sel = document.getElementById('attSessionFilter');
      if(!sel) return;
      var parent = sel.parentElement;
      if(parent && !document.getElementById('deleteSessionBtn')){
        var delBtn = document.createElement('button');
        delBtn.id = 'deleteSessionBtn';
        delBtn.className = 'btn-danger';
        delBtn.style.cssText = 'font-size:0.8rem;padding:0.4rem 0.8rem;white-space:nowrap;';
        delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Selected Session';
        delBtn.onclick = function(){
          var sel = document.getElementById('attSessionFilter');
          if(!sel || !sel.value){
            alert('Please select a session to delete.');
            return;
          }
          var title = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : sel.value;
          if(window.deleteEntireSession) window.deleteEntireSession(sel.value, title);
        };
        parent.appendChild(delBtn);
      }
    };
  }

  // Override deleteEntireSession to use the correct code
  var _origDeleteSession = window.deleteEntireSession;
  window.deleteEntireSession = async function(sessionId, sessionTitle){
    var secret = prompt('⚠️ Delete session "'+sessionTitle+'" and ALL its attendance records?\n\nEnter admin code to confirm:');
    if(!secret) return;
    if(secret !== SENSITIVE_CODE && secret !== '2026GERAMAadmin'){
      alert('❌ Wrong code. Action cancelled.');
      return;
    }
    var sb = getSB(); if(!sb){ alert('Not connected.'); return; }
    try{
      if(sessionId){
        var {error:r1} = await sb.from('attendance_records').delete().eq('session_id', sessionId);
        if(r1) throw new Error('Records: '+r1.message);
        var {error:r2} = await sb.from('attendance_sessions').delete().eq('id', sessionId);
        if(r2) throw new Error('Session: '+r2.message);
      }
      alert('✅ Session "'+sessionTitle+'" deleted completely.');
      if(window.logActivity) window.logActivity('Deleted attendance session: "'+sessionTitle+'"');
      if(window.loadAttRecords) window.loadAttRecords();
      if(window.loadAttSessions) window.loadAttSessions();
    }catch(e){ alert('❌ Error: '+e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // SENSITIVE DELETE OPERATIONS — require code 2026GERAMA
  // ═══════════════════════════════════════════════════════════════

  function upgradeDeleteButtons(){
    // Wrap deleteHistoryEntry to require code
    var origDeleteHistory = window.deleteHistoryEntry;
    window.deleteHistoryEntry = function(idx, supabaseId){
      requireCode('Delete this material from history?', function(){
        if(origDeleteHistory) origDeleteHistory(idx, supabaseId);
      });
    };

    // Wrap deleteAnn to require code
    var origDeleteAnn = window.deleteAnn;
    window.deleteAnn = function(idx){
      requireCode('Delete this announcement?', function(){
        if(origDeleteAnn) origDeleteAnn(idx);
      });
    };

    // Wrap rejectSubmission
    var origReject = window.rejectSubmission;
    window.rejectSubmission = function(idx){
      requireCode('Reject and delete this submission?', function(){
        if(origReject) origReject(idx);
      });
    };

    // Wrap deleteMallProduct
    var origDeleteProd = window.deleteMallProduct;
    window.deleteMallProduct = function(id){
      requireCode('Remove this product from the mall?', function(){
        if(origDeleteProd) origDeleteProd(id);
      });
    };

    // Wrap deleteClass
    var origDeleteClass = window.deleteClass;
    window.deleteClass = function(id){
      requireCode('Delete this class?', function(){
        if(origDeleteClass) origDeleteClass(id);
      });
    };

    // Super-admin: delete another admin (code: adminGERAMA2026)
    var origDeleteAdmin = window.deleteAdminProfile;
    window.deleteAdminProfile = async function(id, name){
      var code = prompt('🔐 Remove "'+name+'" from admin access?\n\nEnter SUPER-ADMIN code to confirm:');
      if(!code) return;
      if(code !== SUPER_ADMIN_CODE){
        alert('❌ Wrong super-admin code. Action blocked.');
        return;
      }
      var resp = await fetch(SUPA_URL+'/rest/v1/admin_profiles?id=eq.'+encodeURIComponent(id), {
        method:'DELETE',
        headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}
      });
      if(!resp.ok){ alert('Error deleting admin profile.'); return; }
      alert('✅ ' + name + ' has been removed from admin access.');
      if(window.logActivity) window.logActivity('Super-admin removed admin: ' + name);
      if(window.loadAdminProfiles) window.loadAdminProfiles();
      if(window._loadProfiles) window._loadProfiles();
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // BRILLIANT NEW FEATURES
  // ═══════════════════════════════════════════════════════════════

  // 1. Admin Dashboard Activity Log Export
  window.exportActivityLog = function(){
    var log = JSON.parse(localStorage.getItem('gerama_activity_log')||'[]');
    if(!log.length){ alert('No activity log found.'); return; }
    var csv = 'Time,Action\n' + log.map(function(l){
      return '"'+new Date(l.time).toLocaleString('en-GB')+'",' +
             '"'+String(l.msg||'').replace(/"/g,'""')+'"';
    }).join('\n');
    var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href=url; a.download='gerama-activity-'+new Date().toISOString().split('T')[0]+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Quick Stats Refresh button in header
  window.quickRefreshStats = function(){
    if(window.loadData) window.loadData();
    if(window.loadOverviewStats) window.loadOverviewStats();
    if(window.showToast) window.showToast('Dashboard refreshed ✅');
  };

  // 3. Broadcast notification to all users
  window.broadcastNotification = async function(title, message){
    var sb = getSB(); if(!sb){ alert('Not connected.'); return; }
    if(!title || !message){ alert('Please provide title and message.'); return; }
    try{
      var {error} = await sb.from('announcements').insert({
        title: title, message: message, priority: 'important',
        created_at: new Date().toISOString()
      });
      if(error) throw new Error(error.message);
      if(window.logActivity) window.logActivity('Broadcast notification: ' + title);
      if(window.loadData) window.loadData();
      return true;
    }catch(e){ alert('Error: '+e.message); return false; }
  };

  // 4. Student count by level
  window.loadStudentBreakdown = async function(){
    var sb = getSB(); if(!sb) return;
    try{
      var {data} = await sb.from('user_profiles').select('level').order('level');
      if(!data) return;
      var counts = {};
      data.forEach(function(u){ var l=u.level||'Unknown'; counts[l]=(counts[l]||0)+1; });
      return counts;
    }catch(e){ return {}; }
  };

  // 5. Auto-generate attendance report
  window.generateAttReport = async function(){
    var sb = getSB(); if(!sb){ alert('Not connected.'); return; }
    try{
      var {data} = await sb.from('attendance_records').select('student_name,student_email,class_title,marked_at').order('marked_at',{ascending:false});
      if(!data||!data.length){ alert('No attendance records found.'); return; }
      var csv = 'Student Name,Email,Class,Date & Time\n' +
        data.map(function(r){
          return '"'+String(r.student_name||'').replace(/"/g,'""')+'",'+
                 '"'+String(r.student_email||'').replace(/"/g,'""')+'",'+
                 '"'+String(r.class_title||'').replace(/"/g,'""')+'",'+
                 '"'+new Date(r.marked_at).toLocaleString('en-GB')+'"';
        }).join('\n');
      var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href=url; a.download='attendance-report-'+new Date().toISOString().split('T')[0]+'.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if(window.logActivity) window.logActivity('Exported attendance report ('+data.length+' records)');
    }catch(e){ alert('Export failed: '+e.message); }
  };

  // ═══════════════════════════════════════════════════════════════
  // EXPOSE requireCode for use in admin-dashboard.js wrapped functions
  // ═══════════════════════════════════════════════════════════════
  window.requireAdminCode = requireCode;

})();
