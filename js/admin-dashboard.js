/* GERAMA Admin Dashboard — extracted JS — v2026.06.20 */

(function(){
  'use strict';

  // XSS prevention helpers (used in some render functions)
  window.escHtml = window.escHtml || function(s){
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'<')
      .replace(/>/g,'>')
      .replace(/"/g,'"')
      .replace(/'/g,'&#x27;');
  };

  window.escAttr = window.escAttr || function(s){
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/"/g,'"')
      .replace(/'/g,'&#x27;')
      .replace(/</g,'<')
      .replace(/>/g,'>');
  };

  // --- Globals used across the dashboard ---
  window.BUCKET = window.BUCKET || 'gerama-materials';

  var materialsHistory = [];
  var announcements    = [];
  var selectedMatFile  = null;
  var selectedAnnImage = null;
  var selectedSwFile   = null;

  // --- UI helpers ---
  window.closeSidebar = function(){
    var sidebar  = document.getElementById('dashSidebar');
    var overlay  = document.getElementById('sidebarOverlay');
    var closeBtn = document.getElementById('sidebarClose');
    if(sidebar) sidebar.classList.remove('open');
    if(overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    if(closeBtn) closeBtn.style.display = 'none';
  };

  window.switchPanel = function(name){
    console.log('[switchPanel] Switching to panel:', name);
    var items = document.querySelectorAll('.nav-item');
    for(var i=0;i<items.length;i++) items[i].classList.remove('active');

    var panels = document.querySelectorAll('.panel');
    for(var j=0;j<panels.length;j++) panels[j].classList.remove('active');

    var navEl = document.querySelector('.nav-item[data-panel="'+name+'"]');
    if(navEl) navEl.classList.add('active');

    var panelEl = document.getElementById('panel-'+name);
    console.log('[switchPanel] Panel element found:', panelEl ? 'YES' : 'NO', 'ID: panel-'+name);
    if(panelEl) panelEl.classList.add('active');
    else console.warn('[switchPanel] Panel not found: panel-'+name);

    var bnavItems = document.querySelectorAll('.bnav-item');
    for(var k=0;k<bnavItems.length;k++){
      if(bnavItems[k].getAttribute('data-panel')===name) bnavItems[k].classList.add('active');
      else bnavItems[k].classList.remove('active');
    }

    window.closeSidebar();
    window.scrollTo(0,0);

    if(name === 'software') setTimeout(window.loadSwList, 150);
    if(name === 'assignments') setTimeout(function(){
      if(window.loadAsgList) window.loadAsgList();
    }, 150);
    if(name === 'grades') setTimeout(function(){ if(window.loadGradesPanel) window.loadGradesPanel(); else if(window.loadSubmissionsTable) window.loadSubmissionsTable(); }, 150);
    if(name === 'quizzes' && window.loadQzList) setTimeout(function(){ window.loadQzList(); window.loadQzAttempts && window.loadQzAttempts(); }, 150);
    if(name === 'quizrequests' && window.loadQuizRequests) setTimeout(window.loadQuizRequests, 150);
    if(name === 'classes' && window.loadClsList) setTimeout(window.loadClsList, 150);
    if(name === 'attendance') setTimeout(function(){ if(window.loadAttSessions) window.loadAttSessions(); if(window.loadAttRecords) window.loadAttRecords(); }, 150);
    if(name === 'classrequests' && window.loadClassRequests) setTimeout(window.loadClassRequests, 150);
    if(name === 'visitors' && window.loadVisitorStats) setTimeout(window.loadVisitorStats, 150);
    if(name === 'messages' && window.loadContactMessages) setTimeout(function(){ window.loadContactMessages('all'); }, 150);
    if(name === 'users') setTimeout(function(){ if(window.loadUsers) window.loadUsers(); }, 150);
    if(name === 'groups') setTimeout(function(){ if(window.loadGroups) window.loadGroups(); }, 150);
    if(name === 'potw' && window.loadPotwList) setTimeout(window.loadPotwList, 150);
    if(name === 'reels' && window.loadAdminReels) setTimeout(window.loadAdminReels, 150);
    if(name === 'connect') setTimeout(function(){ if(window.loadConnectStats) window.loadConnectStats(); }, 150);
    if(name === 'opportunities') setTimeout(function(){ if(window.loadAdminOpportunities) window.loadAdminOpportunities(); }, 150);
    if(name === 'diyk') setTimeout(function(){ if(window.loadDiykAdmin) window.loadDiykAdmin(); }, 150);
    if(name === 'mall') setTimeout(function(){ if(window.loadMallAdmin) window.loadMallAdmin(); }, 150);
    if(name === 'review') setTimeout(function(){ if(typeof window.renderSubmissions === 'function') window.renderSubmissions(); }, 150);
    if(name === 'history') setTimeout(function(){ if(window.loadData) window.loadData(); }, 150);
  };

  window.showStatus = function(id, msg, type){
    var el = document.getElementById(id);
    if(!el) return;
    el.textContent = msg;
    el.className = 'status-msg status-' + (type || 'info');
    el.style.display = 'block';
    if(type==='ok') setTimeout(function(){ el.style.display='none'; }, 5000);
  };

  window.logActivity = function(msg){
    var log = JSON.parse(localStorage.getItem('gerama_activity_log')||'[]');
    log.unshift({ msg: msg, time: new Date().toISOString() });
    if(log.length > 20) log = log.slice(0,20);
    localStorage.setItem('gerama_activity_log', JSON.stringify(log));
    renderRecentActivity();
  };

  function renderRecentActivity(){
    var el = document.getElementById('recentActivity');
    if(!el) return;
    var log = JSON.parse(localStorage.getItem('gerama_activity_log')||'[]');
    if(!log.length){
      el.innerHTML='<p style="color:#9ca3af;font-size:0.9rem;">No recent activity.</p>';
      return;
    }
    el.innerHTML = log.slice(0,8).map(function(l){
      var t = new Date(l.time).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      return '<div style="display:flex;align-items:center;gap:0.8rem;padding:0.6rem 0;border-bottom:1px solid #f1f5f9;">' +
        '<i class="fas fa-circle" style="color:#1B5E20;font-size:0.5rem;flex-shrink:0;"></i>' +
        '<span style="font-size:0.88rem;color:#374151;flex:1;">'+window.escHtml(l.msg)+'</span>' +
        '<span style="font-size:0.78rem;color:#9ca3af;white-space:nowrap;">'+window.escHtml(t)+'</span>' +
        '</div>';
    }).join('');
  }

  // --- Drop zone helper ---
  function setupDropZone(zoneId, inputId, onFile){
    var zone  = document.getElementById(zoneId);
    var input = document.getElementById(inputId);
    if(!zone || !input) return;

    zone.addEventListener('click', function(){ input.click(); });
    input.addEventListener('change', function(){
      if(this.files && this.files[0]) onFile(this.files[0]);
    });

    zone.addEventListener('dragover', function(e){
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function(){
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function(e){
      e.preventDefault();
      zone.classList.remove('drag-over');
      if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
    });
  }

  // --- Materials history / admin reviews (minimal port to keep site working) ---
  function updateStats(){
    var subs     = JSON.parse(localStorage.getItem('gerama_uploads')||'[]');
    var approved = JSON.parse(localStorage.getItem('gerama_approved_subs')||'[]');

    var el1 = document.getElementById('statMaterials');
    if(el1) el1.textContent = materialsHistory.length;

    var el2 = document.getElementById('statPending');
    if(el2) el2.textContent = subs.length;

    var el3 = document.getElementById('statAnn');
    if(el3) el3.textContent = announcements.length;

    var el4 = document.getElementById('statApproved');
    if(el4) el4.textContent = approved.length;

    var badge = document.getElementById('subBadge');
    if(badge){
      if(subs.length > 0){
        badge.textContent = subs.length;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function renderHistory(){
    var tbody = document.getElementById('historyTbody');
    if(!tbody) return;

    if(!materialsHistory.length){
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:2rem;">' +
        '<i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>' +
        'No materials uploaded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = materialsHistory.map(function(m,i){
      var d = m.date ? new Date(m.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
      var statusBadge = m.status === 'approved'
        ? '<span class="badge badge-approved">live</span>'
        : '<span class="badge badge-pending">'+window.escHtml(m.status||'pending')+'</span>';

      return '<tr>' +
        '<td style="font-size:0.8rem;color:#9ca3af;white-space:nowrap;">'+window.escHtml(d)+'</td>' +
        '<td><span class="badge badge-slides" style="background:#e8f5e9;color:#1B5E20;">'+window.escHtml(m.level)+'</span></td>' +
        '<td style="font-size:0.85rem;">Sem '+window.escHtml(m.sem)+'</td>' +
        '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+window.escAttr(m.course)+'">'+window.escHtml(m.course)+'</td>' +
        '<td><span class="badge badge-'+window.escAttr(m.type)+'">'+window.escHtml(m.type)+'</span></td>' +
        '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+window.escAttr(m.name)+'">'+window.escHtml(m.name)+'</td>' +
        '<td>'+statusBadge+'</td>' +
        '<td style="white-space:nowrap;">' +
          '<a href="'+window.escAttr(m.url||'#')+'" target="_blank" style="color:#1B5E20;font-size:0.8rem;margin-right:0.5rem;">'+
            '<i class="fas fa-external-link-alt"></i> View</a>' +
          '<button class="btn-danger" onclick="deleteHistoryEntry('+i+',\''+(m.id||'')+'\')" style="font-size:0.75rem;padding:0.25rem 0.6rem;">' +
            '<i class="fas fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  window.deleteHistoryEntry = function(idx, supabaseId){
    if(!confirm('Remove this material from history?')) return;

    if(supabaseId && supabaseId !== 'undefined'){
      try{
        var sb = window.geramaSupabase;
        if(sb) sb.from('materials').delete().eq('id', supabaseId);
      }catch(e){}
    }

    materialsHistory.splice(idx,1);
    localStorage.setItem('gerama_mat_history', JSON.stringify(materialsHistory));
    renderHistory();
    updateStats();
  };

  function renderSubmissions(){
    var list = document.getElementById('submissionsList');
    if(!list) return;

    var subs = JSON.parse(localStorage.getItem('gerama_uploads')||'[]');
    if(!subs.length){
      list.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:2rem;">' +
        '<i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.4;"></i>' +
        'No pending submissions.</p>';
      return;
    }

    list.innerHTML = subs.map(function(s,i){
      return '<div class="sub-card">' +
        '<div class="sub-info">' +
        '<strong><i class="fas fa-file" style="color:#1B5E20;margin-right:0.4rem;"></i>'+window.escHtml(s.fileName||'')+'</strong>' +
        '<div class="sub-meta">' +
          '<b>From:</b> '+window.escHtml(s.name)+' <'+window.escHtml(s.email||'')+'><br>' +
          '<b>Level:</b> '+window.escHtml(s.level||'')+' &nbsp;|&nbsp; <b>Course:</b> '+window.escHtml(s.course||'')+' &nbsp;|&nbsp; <b>Type:</b> ' +
            '<span class="badge badge-'+window.escAttr(s.type||'slides')+'">'+window.escHtml(s.type||'slides')+'</span><br>' +
          '<b>Submitted:</b> '+ new Date(s.submittedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) +
        '</div>' +
        '</div>' +
        '<div class="sub-actions">' +
          '<button class="btn-success" onclick="approveSubmission('+i+')"><i class="fas fa-check"></i> Approve</button>' +
          '<button class="btn-danger" onclick="rejectSubmission('+i+')"><i class="fas fa-times"></i> Reject</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  window.approveSubmission = function(idx){
    var subs = JSON.parse(localStorage.getItem('gerama_uploads')||'[]');
    var s = subs[idx];
    if(!s) return;

    // For now, keep original behavior: if student file URL exists in localStorage, try to insert.
    // Otherwise move it into approved local queue.
    var fileUrl = s.fileUrl || s.file_url || null;

    if(fileUrl){
      try{
        var sb = window.geramaSupabase;
        if(sb){
          sb.from('materials').insert({
            level: s.level||'L100',
            semester: parseInt(s.semester||s.sem||1),
            course: s.course||'',
            type: s.type||'slides',
            name: s.fileName||s.name||'Submitted Material',
            description: 'Submitted by '+(s.name||'student'),
            file_url: fileUrl,
            storage_path: s.storagePath||s.storage_path||'',
            uploaded_by: s.email||'student',
            status: 'approved',
            created_at: new Date().toISOString()
          }).then(function(){
            // Success handled below
          });
        }
      }catch(e){}
    }

    // Always reflect in UI/local history
    var approved = JSON.parse(localStorage.getItem('gerama_approved_subs')||'[]');
    approved.unshift(Object.assign({}, s, { approvedAt: new Date().toISOString() }));
    localStorage.setItem('gerama_approved_subs', JSON.stringify(approved));

    subs.splice(idx,1);
    localStorage.setItem('gerama_uploads', JSON.stringify(subs));

    materialsHistory.unshift({
      level: s.level||'L100',
      sem: s.semester||s.sem||1,
      course: s.course||'',
      type: s.type||'slides',
      name: s.fileName||s.name||'Submitted Material',
      url: fileUrl,
      date: new Date().toISOString(),
      status: 'approved'
    });
    localStorage.setItem('gerama_mat_history', JSON.stringify(materialsHistory));

    window.logActivity('Approved & published: '+(s.fileName||s.name));
    renderSubmissions();
    renderHistory();
    updateStats();

    alert('✅ Approved! '+(s.fileName||s.name)+' is now live (or queued).');
  };

  window.rejectSubmission = function(idx){
    if(!confirm('Reject and delete this submission?')) return;
    var subs = JSON.parse(localStorage.getItem('gerama_uploads')||'[]');
    if(subs[idx]) window.logActivity('Rejected: '+(subs[idx].fileName||'file')+' from '+(subs[idx].name||''));
    subs.splice(idx,1);
    localStorage.setItem('gerama_uploads', JSON.stringify(subs));
    renderSubmissions();
    updateStats();
  };

  window.removeAnnImg = function(idx){
    if(!window._annImages) return;
    window._annImages.splice(idx,1);
    // Re-trigger preview render
    var prevEl = document.getElementById('annImgPreviews');
    var chosenEl = document.getElementById('annFileChosen');
    if(prevEl) prevEl.innerHTML='';
    if(!window._annImages.length){ if(chosenEl) chosenEl.textContent=''; return; }
    window._annImages.forEach(function(img,i){
      var reader=new FileReader();
      reader.onload=function(e){
        var div=document.createElement('div'); div.style.cssText='position:relative;display:inline-block;';
        div.innerHTML='<img src="'+e.target.result+'" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid #e5e7eb;">'+
          '<button onclick="removeAnnImg('+i+')" style="position:absolute;top:-6px;right:-6px;background:#dc2626;color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:0.65rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>';
        if(prevEl) prevEl.appendChild(div);
      };
      reader.readAsDataURL(img);
    });
    if(chosenEl) chosenEl.textContent='✅ '+window._annImages.length+' image'+(window._annImages.length!==1?'s':'')+' selected';
  };

  // --- Announcements ---
  window.publishAnnouncement = async function(){
    var title = document.getElementById('annTitle').value.trim();
    var msg   = document.getElementById('annMessage').value.trim();
    var pri   = document.getElementById('annPriority').value;

    if(!title || !msg){ window.showStatus('annStatus','Please fill in title and message.','err'); return; }

    var btn = document.getElementById('publishAnnBtn');
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Publishing...';

    // Upload multiple images
    var imageUrls = [];
    var annImages = window._annImages || [];
    if(annImages.length > 0){
      try{
        var sb0 = window.geramaSupabase;
        if(sb0){
          for(var i=0;i<Math.min(annImages.length,5);i++){
            var f = annImages[i];
            var ext = f.name.split('.').pop();
            var imgPath = 'announcements/'+Date.now()+'-'+i+'.'+ext;
            var up = await sb0.storage.from(window.BUCKET).upload(imgPath, f, {upsert:true});
            if(!up.error){
              var url = sb0.storage.from(window.BUCKET).getPublicUrl(imgPath).data.publicUrl;
              imageUrls.push(url);
            }
          }
        }
      }catch(e){ /* ignore upload errors */ }
    }

    var ann = {
      id: Date.now(),
      title: title,
      message: msg,
      priority: pri,
      image: imageUrls[0] || null,        // first image for backward compat
      images: imageUrls,                   // all images
      date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
    };

    announcements.unshift(ann);
    localStorage.setItem('gerama_announcements', JSON.stringify(announcements));

    try{
      var sb2 = window.geramaSupabase;
      if(sb2) await sb2.from('announcements').insert({
        title: ann.title, message: ann.message, priority: ann.priority,
        image_url: ann.image,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        created_at: new Date().toISOString()
      });
    }catch(e){}

    window.logActivity('Published announcement: '+title+(imageUrls.length?' ('+imageUrls.length+' image'+(imageUrls.length!==1?'s':'')+')':''));
    renderAnnouncements();
    updateStats();

    document.getElementById('annTitle').value='';
    document.getElementById('annMessage').value='';
    document.getElementById('annFileChosen').textContent='';
    var prevEl = document.getElementById('annImgPreviews');
    if(prevEl) prevEl.innerHTML='';
    window._annImages = [];

    window.showStatus('annStatus','✅ Announcement published! It is now live on the home page.','ok');
    btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Publish to Site';
  };

  window.deleteAnn = function(idx){
    if(!confirm('Delete this announcement?')) return;

    var ann = announcements[idx];
    if(ann && ann.id){
      try{
        var sb = window.geramaSupabase;
        if(sb) sb.from('announcements').delete().eq('id', ann.id);
      }catch(e){}
    }

    announcements.splice(idx,1);
    localStorage.setItem('gerama_announcements', JSON.stringify(announcements));
    renderAnnouncements();
    updateStats();
  };

  function renderAnnouncements(){
    var list = document.getElementById('annList');
    if(!list) return;

    if(!announcements.length){
      list.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">No announcements yet.</p>';
      return;
    }

    var c={urgent:'#fee2e2',important:'#fef3c7',normal:'#f0fdf4'};
    var b={urgent:'#dc2626',important:'#f59e0b',normal:'#16a34a'};

    list.innerHTML = announcements.map(function(a,i){
      var imgHtml = a.image
        ? '<img src="'+window.escAttr(a.image)+'" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;" alt="">'
        : '';

      return '<div class="ann-card" style="background:'+(c[a.priority]||'#f8fafc')+';border-left:4px solid '+(b[a.priority]||'#1B5E20')+';gap:0.8rem;">' +
        imgHtml +
        '<div style="flex:1;">' +
          '<strong style="display:block;margin-bottom:0.2rem;">'+window.escHtml(a.title)+'</strong>' +
          '<span style="font-size:0.85rem;color:#4b5563;">'+window.escHtml(a.message)+'</span><br>' +
          '<small style="color:#9ca3af;">'+window.escHtml(a.date)+' · '+window.escHtml(a.priority)+'</small>' +
        '</div>' +
        '<button class="btn-danger" onclick="deleteAnn('+i+')"><i class="fas fa-trash"></i></button>' +
        '</div>';
    }).join('');
  }

  // --- Admin software list ---
  window.toggleSwSource = function(){
    var isTelegram = document.getElementById('swTypeTelegram').checked;
    document.getElementById('swFileField').style.display     = isTelegram ? 'none' : 'block';
    document.getElementById('swTelegramField').style.display = isTelegram ? 'block' : 'none';
  };

  window.uploadSoftware = async function(){
    var name       = document.getElementById('swName').value.trim();
    var category   = document.getElementById('swCategory').value.trim();
    var desc       = document.getElementById('swDesc').value.trim();
    var why        = document.getElementById('swWhy').value.trim();
    var size       = document.getElementById('swSize').value.trim();
    var isZipped   = document.getElementById('swZipped').value === 'true';

    var isTelegram = document.getElementById('swTypeTelegram').checked;
    var tgUrl      = document.getElementById('swTelegramUrl').value.trim();

    if(!name || !category || !desc){ window.showStatus('swStatus','Please fill in Name, Category and Description.','err'); return; }

    var btn = document.getElementById('uploadSwBtn');
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...';

    try{
      var sb = window.geramaSupabase;
      if(!sb) throw new Error('Supabase not connected. Check Settings.');

      var record = {
        name: name,
        category: category,
        description: desc,
        why: why || null,
        file_size: size || null,
        is_zipped: isZipped,
        type: isTelegram ? 'telegram' : 'file',
        status: 'active',
        created_at: new Date().toISOString()
      };

      if(isTelegram){
        if(!tgUrl) throw new Error('Please enter the Telegram link.');
        record.telegram_url = tgUrl;
        record.file_url = tgUrl;
      } else {
        if(!selectedSwFile) throw new Error('Please select a file to upload.');
        if(selectedSwFile.size > 50*1024*1024) throw new Error('File too large. Max 50 MB.');

        var ext = selectedSwFile.name.split('.').pop();
        var safeName = name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '.' + ext;
        var storagePath = 'software/' + safeName;

        var upErr = await sb.storage.from(window.BUCKET).upload(storagePath, selectedSwFile, { upsert:true });
        if(upErr && upErr.error) throw new Error('Upload failed: '+upErr.error.message);

        var urlData = sb.storage.from(window.BUCKET).getPublicUrl(storagePath).data;
        record.file_url = urlData.publicUrl;
        record.storage_path = storagePath;
      }

      var { error: dbErr } = await sb.from('software').insert(record);
      if(dbErr) throw new Error('Database error: '+dbErr.message);

      window.logActivity('Added software: '+name);
      window.showStatus('swStatus','✅ "'+name+'" is now live on the Resources page!','ok');

      ['swName','swCategory','swDesc','swWhy','swSize','swTelegramUrl'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.value='';
      });
      document.getElementById('swFileChosen').textContent='';
      selectedSwFile = null;

      window.loadSwList();
    }catch(err){
      window.showStatus('swStatus','❌ '+err.message,'err');
    }

    btn.disabled=false;
    btn.innerHTML='<i class="fas fa-plus-circle"></i> Add Software &amp; Go Live';
  };

  window.loadSwList = async function(){
    var el = document.getElementById('swList');
    if(!el) return;

    try{
      var sb = window.geramaSupabase;
      if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Supabase not connected.</p>'; return; }

      var { data, error } = await sb.from('software').select('*').order('created_at',{ascending:false});
      if(error || !data || !data.length){
        el.innerHTML='<p style="color:#9ca3af;font-size:0.88rem;text-align:center;padding:1.5rem;">No software added yet.</p>';
        return;
      }

      el.innerHTML = data.map(function(sw){
        var typeTag = sw.type === 'telegram'
          ? '<span style="background:#e0f2fe;color:#0369a1;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.4rem;"><i class="fab fa-telegram"></i> Telegram</span>'
          : '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.4rem;"><i class="fas fa-file"></i> File</span>';

        var zipTag = sw.is_zipped
          ? '<span style="background:#fef3c7;color:#92400e;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.3rem;"><i class="fas fa-file-archive"></i> ZIP</span>'
          : '';

        return '<div class="sub-card">' +
          '<div class="sub-info">' +
            '<strong>' + window.escHtml(sw.name||'Software') + typeTag + zipTag + '</strong>' +
            '<div class="sub-meta">' +
              '<b>Category:</b> ' + window.escHtml(sw.category||'—') +
              (sw.file_size ? ' &nbsp;|&nbsp; <b>Size:</b> ' + window.escHtml(sw.file_size) : '') + '<br>' +
              '<a href="' + window.escAttr(sw.file_url||'#') + '" target="_blank" style="color:#1B5E20;font-size:0.8rem;">' +
                '<i class="fas fa-external-link-alt"></i> View / Test Link</a>' +
            '</div>' +
          '</div>' +
          '<div class="sub-actions">' +
            '<button class="btn-danger" onclick="deleteSoftware(\'' + window.escAttr(sw.id) + '\')"><i class="fas fa-trash"></i> Remove</button>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch(e){
      el.innerHTML='<p style="color:#9ca3af;">Could not load software list.</p>';
    }
  };

  window.deleteSoftware = async function(id){
    if(!confirm('Remove this software from the site?')) return;
    var sb = window.geramaSupabase;
    if(!sb) return;
    await sb.from('software').delete().eq('id', id);
    window.logActivity('Removed software: '+id);
    window.loadSwList();
  };

  // --- Visitors ---
  window.loadVisitorStats = async function(){
    var sb = window.geramaSupabase; if(!sb) return;

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    var weekStart  = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    try{
      // Use count queries (accurate, no row limit issues)
      var safe = async function(fn){ try{ return await fn(); }catch(e){ return {count:0}; } };
      var todayRes  = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',todayStart); });
      var weekRes   = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',weekStart); });
      var monthRes  = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',monthStart); });
      var totalRes  = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}); });

      var setEl = function(id,val){ var e=document.getElementById(id); if(e) e.textContent=val||0; };
      // Only update the visitor-panel specific elements (NOT the overview stat boxes — those are handled by loadOverviewStats)
      setEl('vsToday',  todayRes.count||0);
      setEl('vsWeek',   weekRes.count||0);
      setEl('vsMonth',  monthRes.count||0);
      setEl('vsTotal',  totalRes.count||0);

      // Page breakdown — fetch limited rows for display only
      var {data:all} = await sb.from('page_views').select('page').limit(1000);
      var pageCounts = {};
      (all||[]).forEach(function(v){
        var p = v.page || 'unknown';
        pageCounts[p] = (pageCounts[p]||0)+1;
      });

      var sorted = Object.keys(pageCounts).sort(function(a,b){ return pageCounts[b]-pageCounts[a]; });
      var listEl = document.getElementById('vsPagesList');
      if(listEl){
        if(!sorted.length){
          listEl.innerHTML='<p style="color:#9ca3af;font-size:0.88rem;">No visits recorded yet.</p>';
          return;
        }
        listEl.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Page</th><th>Visits</th></tr></thead><tbody>'+
          sorted.slice(0,15).map(function(p){
            return '<tr><td>'+window.escHtml(p)+'</td><td><strong>'+pageCounts[p]+'</strong></td></tr>';
          }).join('')+
          '</tbody></table></div>';
      }
    }catch(e){
      console.warn('Visitor stats error:', e);
    }
  };

  function renderRecent(){ renderRecentActivity(); }

  // --- Load dashboard data (history + announcements) ---
  window.loadData = async function(){
    console.log('[loadData] Starting to load data...');
    materialsHistory = JSON.parse(localStorage.getItem('gerama_mat_history')||'[]');
    announcements    = JSON.parse(localStorage.getItem('gerama_announcements')||'[]');

    // Supabase source of truth (best effort)
    try{
      var sb = window.geramaSupabase;
      console.log('[loadData] Supabase client:', sb ? 'available' : 'NOT available');
      if(sb){
        var { data } = await sb.from('materials').select('*').order('created_at',{ascending:false}).limit(200);
        console.log('[loadData] Materials data:', data ? data.length + ' items' : 'null');
        if(data && data.length){
          materialsHistory = data.map(function(r){
            return { level:r.level, sem:r.semester, course:r.course, type:r.type, name:r.name,
              desc:r.description||'', url:r.file_url, path:r.storage_path||'',
              date:r.created_at, id:r.id, status:r.status||'approved' };
          });
        }
      }
    }catch(e){
      console.error('[loadData] Error loading materials:', e);
    }

    try{
      var sb2 = window.geramaSupabase;
      if(sb2){
        var { data: annData } = await sb2.from('announcements').select('*').order('created_at',{ascending:false}).limit(50);
        console.log('[loadData] Announcements data:', annData ? annData.length + ' items' : 'null');
        if(annData && annData.length){
          announcements = annData.map(function(r){
            return { id:r.id, title:r.title, message:r.message, priority:r.priority||'normal',
              image:r.image_url||null, date:r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '' };
          });
          localStorage.setItem('gerama_announcements', JSON.stringify(announcements));
        }
      }
    }catch(e){
      console.error('[loadData] Error loading announcements:', e);
    }

    console.log('[loadData] Calling render functions...');
    renderHistory();
    renderSubmissions();
    renderAnnouncements();
    updateStats();
    renderRecentActivity();

    // Load live visitor + content stats for overview
    loadOverviewStats();
    console.log('[loadData] Data load complete');
  };

  async function loadOverviewStats(){
    var sb = window.geramaSupabase; if(!sb) return;
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    var weekStart  = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
    var set = function(id, val){ var e=document.getElementById(id); if(e) e.textContent = (val!==null&&val!==undefined) ? val : '0'; };

    // Run every query independently — one failure never blocks others
    var safe = async function(fn){ try{ return await fn(); }catch(e){ return {count:0,data:[]}; } };

    var [todayRes, weekRes, totalRes, quizRes, asgRes, clsRes, clsReqRes, qrRes, subRes, userRes, matRes, annRes, ungradedRes] = await Promise.all([
      safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',todayStart); }),
      safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',weekStart); }),
      safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('quizzes').select('id',{count:'exact',head:true}).eq('status','active'); }),
      safe(function(){ return sb.from('assignments').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('classes').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('class_requests').select('id',{count:'exact',head:true}).eq('status','pending'); }),
      safe(function(){ return sb.from('quiz_requests').select('id',{count:'exact',head:true}).eq('status','pending'); }),
      safe(function(){ return sb.from('assignment_submissions').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('user_profiles').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('materials').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('announcements').select('id',{count:'exact',head:true}); }),
      safe(function(){ return sb.from('assignment_submissions').select('id',{count:'exact',head:true}).is('score',null); })
    ]);

    set('statVisitsToday', todayRes.count||0);
    set('statVisitsWeek',  weekRes.count||0);
    set('statVisitsTotal', totalRes.count||0);
    set('statQuizzes',     quizRes.count||0);
    set('statAssignments', asgRes.count||0);
    set('statClasses',     clsRes.count||0);
    set('statClassReqs',   clsReqRes.count||0);
    set('statQuizPending', qrRes.count||0);
    // Also update the top-row stats
    set('statMaterials',   matRes.count||0);
    set('statAnn',         annRes.count||0);
    set('statApproved',    subRes.count||0);  // reuse "Approved Subs" box for total submissions
    // Ungraded count — clickable red stat box
    var ungradedCount = ungradedRes.count || 0;
    set('statUngradedCount', ungradedCount);
    var ugBox = document.getElementById('statUngradedCount');
    if(ugBox){ ugBox.style.color = ungradedCount > 0 ? '#dc2626' : '#059669'; }

    var reqBadge = document.getElementById('reqBadge');
    if(reqBadge){ var rc=clsReqRes.count||0; reqBadge.textContent=rc; reqBadge.style.display=rc>0?'inline':'none'; }
    var qrBadge = document.getElementById('quizReqBadge');
    if(qrBadge){ var qc=qrRes.count||0; qrBadge.textContent=qc; qrBadge.style.display=qc>0?'inline':'none'; }

    // Opportunities pending badge
    try {
      var oppPendRes = await safe(function(){ return sb.from('opportunities').select('id',{count:'exact',head:true}).eq('status','pending'); });
      var oppPendCount = oppPendRes.count || 0;
      var oppBadge = document.getElementById('oppPendingBadge');
      if(oppBadge){ oppBadge.textContent = oppPendCount; oppBadge.style.display = oppPendCount > 0 ? 'inline' : 'none'; }
    } catch(e) {}

    // Did You Know pending badge
    try {
      var diykPendRes = await safe(function(){ return sb.from('did_you_know').select('id',{count:'exact',head:true}).eq('status','pending'); });
    } catch(e) {}
  }

  // Expose so admin-gate.js _applySession can call it after login
  window.loadOverviewStats = loadOverviewStats;

  // --- App boot ---
  document.addEventListener('DOMContentLoaded', function(){
    // Date in headers
    var dashDate = document.getElementById('dashDate');
    if(dashDate) dashDate.textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    var mobileDate = document.getElementById('mobileDate');
    if(mobileDate) mobileDate.textContent = new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});

    // Sidebar
    var toggleBtn = document.getElementById('sidebarToggle');
    var closeBtn  = document.getElementById('sidebarClose');
    var overlay   = document.getElementById('sidebarOverlay');

    function openSidebar(){
      var sidebar = document.getElementById('dashSidebar');
      if(sidebar) sidebar.classList.add('open');
      if(overlay) overlay.classList.add('active');
      document.body.style.overflow='hidden';
      if(closeBtn) closeBtn.style.display='flex';
    }

    if(toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if(closeBtn) closeBtn.addEventListener('click', window.closeSidebar);
    if(overlay) overlay.addEventListener('click', window.closeSidebar);
    window.addEventListener('resize', function(){ if(window.innerWidth>640) window.closeSidebar(); });

    // Sidebar nav
    var navItems = document.querySelectorAll('.nav-item[data-panel]');
    for(var i=0;i<navItems.length;i++){
      navItems[i].addEventListener('click', function(){
        window.switchPanel(this.getAttribute('data-panel'));
      });
    }

    // Drop zones
    setupDropZone('matDropZone','matFile',function(f){
      selectedMatFile = f;
      var el = document.getElementById('matFileChosen');
      if(el) el.textContent = '✅ '+f.name;
    });

    setupDropZone('annDropZone','annImage',function(f){
      // Multi-image: accumulate up to 5
      if(!window._annImages) window._annImages = [];
      var files = document.getElementById('annImage').files;
      var newFiles = files ? Array.from(files) : [f];
      newFiles.forEach(function(file){
        if(window._annImages.length >= 5) return;
        if(!file.type.startsWith('image/')) return;
        window._annImages.push(file);
      });
      // Show previews
      var prevEl = document.getElementById('annImgPreviews');
      var chosenEl = document.getElementById('annFileChosen');
      if(prevEl){
        prevEl.innerHTML = '';
        window._annImages.forEach(function(img, i){
          var reader = new FileReader();
          reader.onload = function(e){
            var div = document.createElement('div');
            div.style.cssText = 'position:relative;display:inline-block;';
            div.innerHTML = '<img src="'+e.target.result+'" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid #e5e7eb;">'+
              '<button onclick="removeAnnImg('+i+')" style="position:absolute;top:-6px;right:-6px;background:#dc2626;color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:0.65rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>';
            prevEl.appendChild(div);
          };
          reader.readAsDataURL(img);
        });
      }
      if(chosenEl) chosenEl.textContent = '✅ '+window._annImages.length+' image'+(window._annImages.length!==1?'s':'')+' selected';
    });

    setupDropZone('swDropZone','swFile',function(f){
      selectedSwFile = f;
      var el = document.getElementById('swFileChosen');
      if(el) el.textContent = '✅ '+f.name;
    });

    // POTW photo drop zone
    setupDropZone('potwPhotoZone','potwPhotoFile',function(f){
      var chosen = document.getElementById('potwPhotoChosen');
      if(chosen) chosen.textContent = '✅ '+f.name;
      var reader = new FileReader();
      reader.onload = function(e){
        var prev = document.getElementById('potwPhotoPreview');
        if(prev){ prev.src = e.target.result; prev.style.display='block'; }
      };
      reader.readAsDataURL(f);
    });

    // Assignment file drop zone
    setupDropZone('asgDropZone','asgFile',function(f){
      var el = document.getElementById('asgFileChosen');
      if(el) el.textContent = '✅ '+f.name;
    });

    // Buttons
    var publishBtn = document.getElementById('publishAnnBtn');
    if(publishBtn) publishBtn.addEventListener('click', window.publishAnnouncement);

    var saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if(saveSettingsBtn) saveSettingsBtn.addEventListener('click', function(){
      window.showStatus('settingsStatus','Settings saved.','ok');
    });

    var testConnBtn = document.getElementById('testConnBtn');
    if(testConnBtn) testConnBtn.addEventListener('click', window.testConnection || function(){});

    var uploadSwBtn = document.getElementById('uploadSwBtn');
    if(uploadSwBtn) uploadSwBtn.addEventListener('click', window.uploadSoftware);

    var uploadMatBtn = document.getElementById('uploadMatBtn');
    if(uploadMatBtn) uploadMatBtn.addEventListener('click', window.uploadMaterial);

    // Load main content ONLY if admin gate is NOT present (already logged in)
    // If gate is present, admin-gate.js will call loadData after successful login
    var adminGate = document.getElementById('geramaAdminGate');
    if(!adminGate || adminGate.style.display === 'none'){
      window.loadData();
    }
    // Wait for Supabase then load live stats (retry up to 10s)
    (function tryStats(attempts){
      if(typeof window.geramaSupabase !== 'undefined'){
        loadOverviewStats();
        setTimeout(window.loadVisitorStats, 200);
      } else if(attempts > 0){
        setTimeout(function(){ tryStats(attempts-1); }, 500);
      }
    })(20);
  });

  // ─── UPLOAD MATERIAL ───────────────────────────────────────
  window.toggleMatSource = function(){
    var val = document.querySelector('input[name="matSourceType"]:checked').value;
    document.getElementById('matFileField').style.display     = val==='file'     ? 'block' : 'none';
    document.getElementById('matTelegramField').style.display = val==='telegram' ? 'block' : 'none';
    document.getElementById('matGdriveField').style.display   = val==='gdrive'   ? 'block' : 'none';
    // Highlight active label
    ['matSrcFileLabel','matSrcTgLabel','matSrcGdLabel'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.borderColor='#e5e7eb';
    });
    var activeMap = {file:'matSrcFileLabel',telegram:'matSrcTgLabel',gdrive:'matSrcGdLabel'};
    var activeEl = document.getElementById(activeMap[val]);
    if(activeEl) activeEl.style.borderColor='#1B5E20';
  };

  window.uploadMaterial = async function(){
    var level  = document.getElementById('matLevel').value;
    var sem    = document.getElementById('matSem').value;
    var course = document.getElementById('matCourse').value.trim();
    var type   = document.getElementById('matType').value;
    var name   = document.getElementById('matName').value.trim();
    var desc   = document.getElementById('matDesc').value.trim();
    var srcType = document.querySelector('input[name="matSourceType"]:checked').value;

    if(!course || !name){ window.showStatus('matStatus','Please fill in Course Name and Display Name.','err'); return; }

    var btn = document.getElementById('uploadMatBtn');
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...';
    window.showStatus('matStatus','Processing...','info');

    try{
      var sb = window.geramaSupabase;
      if(!sb) throw new Error('Supabase not connected. Check Settings.');

      var fileUrl = null;
      var storagePath = null;

      if(srcType === 'telegram'){
        var tgUrl = document.getElementById('matTelegramUrl').value.trim();
        if(!tgUrl) throw new Error('Please enter the Telegram link.');
        fileUrl = tgUrl;
        window.showStatus('matStatus','Saving Telegram link...','info');

      } else if(srcType === 'gdrive'){
        var gdUrl = document.getElementById('matGdriveUrl').value.trim();
        if(!gdUrl) throw new Error('Please enter the Google Drive / external link.');
        fileUrl = gdUrl;
        window.showStatus('matStatus','Saving external link...','info');

      } else {
        // File upload
        var fileInput = document.getElementById('matFile');
        var file = fileInput && fileInput.files && fileInput.files[0];
        if(!file) throw new Error('Please select a file to upload.');
        if(file.size > 50*1024*1024) throw new Error('File too large. Max 50 MB.');

        window.showStatus('matStatus','Uploading file to Supabase...','info');
        var ext = file.name.split('.').pop();
        var safeName = name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now()+'.'+ext;
        storagePath = level.toLowerCase()+'/semester-'+sem+'/'+course.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'/'+type+'/'+safeName;

        var { error: upErr } = await sb.storage.from(window.BUCKET).upload(storagePath, file, { upsert:true, contentType: file.type });
        if(upErr) throw new Error('Upload failed: '+upErr.message);
        fileUrl = sb.storage.from(window.BUCKET).getPublicUrl(storagePath).data.publicUrl;
      }

      var { error: dbErr } = await sb.from('materials').insert({
        level: level, semester: parseInt(sem), course: course,
        type: type, name: name, description: desc||null,
        file_url: fileUrl, storage_path: storagePath||null,
        source_type: srcType,
        uploaded_by: 'admin', status: 'approved',
        created_at: new Date().toISOString()
      });
      if(dbErr) throw new Error('DB save failed: '+dbErr.message+(dbErr.code==='42501'?' (check RLS policy)':''));

      window.logActivity('Uploaded: '+name+' ('+level+' Sem '+sem+') via '+srcType);
      window.showStatus('matStatus','✅ "'+name+'" is now live on the Resources page!','ok');

      // Clear form
      document.getElementById('matCourse').value='';
      document.getElementById('matName').value='';
      document.getElementById('matDesc').value='';
      document.getElementById('matFileChosen').textContent='';
      var fi=document.getElementById('matFile'); if(fi) fi.value='';
      var tg=document.getElementById('matTelegramUrl'); if(tg) tg.value='';
      var gd=document.getElementById('matGdriveUrl'); if(gd) gd.value='';

      window.loadData();
    }catch(err){
      window.showStatus('matStatus','❌ '+err.message,'err');
    }
    btn.disabled=false; btn.innerHTML='<i class="fas fa-upload"></i> Upload &amp; Go Live';
  };

  // ─── REELS MANAGEMENT ───────────────────────────────────────
  window.loadAdminReels = async function(){
    var el = document.getElementById('adminReelsList');
    if(!el) return;
    var sb = window.geramaSupabase;
    if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
    var res = await sb.from('reels').select('*').order('created_at',{ascending:false});
    var data = res.data;
    if(!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:2rem;"><i class="fas fa-film" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No reels posted yet.</p>'; return; }
    var html = '';
    for(var i=0;i<data.length;i++){
      var r = data[i];
      var dt = new Date(r.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      var statusBadge = r.status==='blocked'
        ? '<span style="background:#fee2e2;color:#dc2626;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Blocked</span>'
        : '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Active</span>';
      html += '<div class="sub-card">';
      html += '<div class="sub-info"><strong>'+window.escHtml(r.author_name||'Unknown')+'</strong>';
      html += '<div class="sub-meta">'+(r.caption?window.escHtml(r.caption.substring(0,80)):'No caption')+'<br>';
      html += '<b>Course:</b> '+window.escHtml(r.course||'General')+' | <b>Posted:</b> '+dt+'</div></div>';
      html += '<div class="sub-actions">'+statusBadge;
      if(r.status!=='blocked'){
        html += '<button class="btn-danger" data-rid="'+r.id+'" data-ract="block"><i class="fas fa-ban"></i> Block</button>';
      } else {
        html += '<button class="btn-success" data-rid="'+r.id+'" data-ract="unblock"><i class="fas fa-check"></i> Unblock</button>';
      }
      html += '<button class="btn-danger" data-rid="'+r.id+'" data-rpath="'+window.escAttr(r.storage_path||'')+'" data-ract="delete"><i class="fas fa-trash"></i></button>';
      html += '</div></div>';
    }
    el.innerHTML = html;
    el.onclick = function(e){
      var btn = e.target.closest('[data-ract]');
      if(!btn) return;
      var act = btn.getAttribute('data-ract');
      var rid = btn.getAttribute('data-rid');
      if(act==='block')   adminReelAction(rid,'blocked');
      if(act==='unblock') adminReelAction(rid,'active');
      if(act==='delete')  adminDeleteReel(rid, btn.getAttribute('data-rpath'));
    };
  };

  async function adminReelAction(rid, status){
    var sb = window.geramaSupabase; if(!sb) return;
    await sb.from('reels').update({status:status}).eq('id',rid);
    window.logActivity((status==='blocked'?'Blocked':'Unblocked')+' reel: '+rid);
    window.loadAdminReels();
  }

  async function adminDeleteReel(rid, storagePath){
    if(!confirm('Permanently delete this reel?')) return;
    var sb = window.geramaSupabase; if(!sb) return;
    if(storagePath) await sb.storage.from(window.BUCKET).remove([storagePath]);
    await sb.from('reels').delete().eq('id',rid);
    window.logActivity('Deleted reel: '+rid);
    window.loadAdminReels();
  }

  // ─── QUIZ MANAGEMENT ───────────────────────────────────────
window.loadQzList = async function(){
  var container = document.getElementById('quizzesAdminList');
  if(!container) return;
  var sb = window.geramaSupabase;
  if(!sb){ container.innerHTML='<p style="color:#9ca3af;">Supabase not ready.</p>'; return; }
  var {data, error} = await sb.from('quizzes').select('*').order('created_at',{ascending:false});
  if(error||!data||!data.length){
    container.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-brain" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No quizzes posted yet.</p>';
    return;
  }
  var now = Date.now();
  container.innerHTML = data.map(function(q){
    var dl = q.deadline ? new Date(q.deadline).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'No deadline';
    var isPast = q.deadline && new Date(q.deadline).getTime() < now;
    var badge = isPast
      ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;margin-left:0.4rem;">Closed</span>'
      : '<span style="background:#ede9fe;color:#5b21b6;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;margin-left:0.4rem;">Active</span>';
    // Parse links
    var links = [];
    try{ links = JSON.parse(q.quiz_url||'[]'); }catch(e){ if(q.quiz_url) links=[q.quiz_url]; }
    if(!Array.isArray(links)) links = links ? [links] : [];
    var linkHtml = links.map(function(l,i){
      return '<a href="'+window.escAttr(l)+'" target="_blank" style="color:#6366f1;font-size:0.8rem;display:inline-flex;align-items:center;gap:0.3rem;margin-right:0.8rem;"><i class="fas fa-link"></i> Link '+(i+1)+'</a>';
    }).join('');
    var pdfLink = q.pdf_url ? '<a href="'+window.escAttr(q.pdf_url)+'" target="_blank" style="color:#dc2626;font-size:0.8rem;display:inline-flex;align-items:center;gap:0.3rem;margin-right:0.8rem;"><i class="fas fa-file-pdf"></i> PDF Quiz</a>' : '';
    return '<div class="sub-card">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(q.title)+badge+'</strong>'+
        '<div class="sub-meta">'+
          '<b>Course:</b> '+window.escHtml(q.course||'—')+
          ' | <b>Deadline:</b> '+dl+
          (q.duration_mins?' | <b>Time:</b> '+q.duration_mins+' min':'')+
          (q.points?' | <b>Marks:</b> '+q.points:'')+
          '<br>'+linkHtml+pdfLink+
          (links.length>1?'<span style="background:#f5f3ff;color:#5b21b6;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;"><i class="fas fa-random"></i> '+links.length+' versions (shuffle)</span>':'')+
        '</div>'+
        // Expandable grades drawer
        '<div id="qzgrades-'+q.id+'" style="display:none;margin-top:0.8rem;background:#f8fafc;border-radius:10px;padding:0.9rem;border:1px solid #e5e7eb;">'+
          '<div style="text-align:center;color:#9ca3af;font-size:0.82rem;"><i class="fas fa-spinner fa-spin"></i> Loading grades…</div>'+
        '</div>'+
      '</div>'+
      '<div class="sub-actions">'+
        '<button style="background:#f0fdf4;color:#1B5E20;border:1px solid #c8e6c9;padding:0.35rem 0.8rem;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;" onclick="toggleQzGrades(\''+q.id+'\',\''+window.escAttr(q.title)+'\')"><i class="fas fa-list-ol"></i> Grades</button>'+
        '<button class="btn-gold" style="font-size:0.78rem;padding:0.35rem 0.8rem;" onclick="extendQuizDeadline(\''+q.id+'\')"><i class="fas fa-clock"></i> Extend</button>'+
        (isPast||q.status==='closed'
          ? '<button class="btn-success" style="font-size:0.78rem;padding:0.35rem 0.8rem;" onclick="toggleQuizStatus(\''+q.id+'\',\'active\')"><i class="fas fa-unlock"></i> Reopen</button>'
          : '<button class="btn-primary" style="font-size:0.78rem;padding:0.35rem 0.8rem;background:#6366f1;" onclick="toggleQuizStatus(\''+q.id+'\',\'closed\')"><i class="fas fa-lock"></i> Close</button>')+
        '<button class="btn-danger" onclick="deleteQuiz(\''+q.id+'\')"><i class="fas fa-trash"></i></button>'+
      '</div>'+
    '</div>';
  }).join('');
};

window.deleteQuiz = async function(id){
  if(!confirm('Delete this quiz?')) return;
  var sb = window.geramaSupabase;
  if(sb) await sb.from('quizzes').delete().eq('id', id);
  window.loadQzList();
  window.showStatus('quizStatus','Quiz deleted.','ok');
};

// Toggle quiz grades drawer — shows all student_grades for that quiz title
window.toggleQzGrades = async function(quizId, quizTitle){
  var drawer = document.getElementById('qzgrades-'+quizId);
  if(!drawer) return;
  // Toggle
  if(drawer.style.display === 'block'){
    drawer.style.display = 'none';
    return;
  }
  drawer.style.display = 'block';
  drawer.innerHTML = '<div style="text-align:center;color:#9ca3af;font-size:0.82rem;padding:0.5rem;"><i class="fas fa-spinner fa-spin"></i> Loading grades…</div>';
  var sb = window.geramaSupabase;
  if(!sb){ drawer.innerHTML='<p style="color:#9ca3af;font-size:0.82rem;">Not connected.</p>'; return; }
  var {data, error} = await sb.from('student_grades')
    .select('*').eq('assignment_title', quizTitle).order('graded_at',{ascending:false});
  if(error){ drawer.innerHTML='<p style="color:#dc2626;font-size:0.82rem;">Error: '+window.escHtml(error.message)+'</p>'; return; }
  if(!data||!data.length){
    drawer.innerHTML='<p style="color:#9ca3af;font-size:0.82rem;text-align:center;padding:0.5rem;">No grades imported yet for this quiz. Use "Import Quiz Scores" above.</p>';
    return;
  }
  var graded = data.length;
  var avg = (data.reduce(function(s,g){ return s+(parseFloat(g.score)||0); },0)/graded).toFixed(1);
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.7rem;">' +
    '<div style="font-size:0.82rem;font-weight:700;color:#1B5E20;"><i class="fas fa-list-ol" style="margin-right:0.3rem;"></i>'+graded+' graded · Avg: <strong>'+avg+'</strong></div>' +
    '<button onclick="downloadQzGradesCSV(\''+window.escAttr(quizTitle)+'\')" style="background:none;border:1px solid #c8e6c9;color:#1B5E20;padding:0.2rem 0.7rem;border-radius:20px;font-size:0.72rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-download"></i> CSV</button>' +
  '</div>' +
  '<div class="tbl-wrap"><table style="min-width:340px;"><thead><tr style="background:#f0fdf4;"><th style="font-size:0.75rem;">Student</th><th style="font-size:0.75rem;">Email</th><th style="font-size:0.75rem;">Score</th><th style="font-size:0.75rem;">Graded</th></tr></thead><tbody>' +
  data.map(function(g){
    var dt = g.graded_at ? new Date(g.graded_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—';
    var scoreColor = (g.score>=70)?'#059669':(g.score>=50)?'#d97706':'#dc2626';
    return '<tr>' +
      '<td style="font-size:0.82rem;font-weight:600;">'+window.escHtml(g.student_name||'—')+'</td>' +
      '<td style="font-size:0.75rem;color:#6b7280;">'+window.escHtml(g.student_email||'—')+'</td>' +
      '<td><strong style="color:'+scoreColor+';">'+g.score+'</strong></td>' +
      '<td style="font-size:0.72rem;color:#9ca3af;white-space:nowrap;">'+dt+'</td>' +
    '</tr>';
  }).join('') +
  '</tbody></table></div>';
  drawer.innerHTML = html;
};

// Download grades CSV for a specific quiz
window.downloadQzGradesCSV = async function(quizTitle){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var {data} = await sb.from('student_grades').select('*').eq('assignment_title',quizTitle).order('graded_at',{ascending:false});
  if(!data||!data.length){ alert('No grades to download.'); return; }
  var headers = ['Student Name','Email','Score','Graded At'];
  var rows = data.map(function(g){
    return [g.student_name||'', g.student_email||'', g.score!==null?g.score:'', g.graded_at?new Date(g.graded_at).toLocaleString('en-GB'):'']
      .map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });
  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_Quiz_'+quizTitle.replace(/[^a-z0-9]/gi,'_')+'_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded quiz grades CSV: '+quizTitle);
};

window.extendQuizDeadline = async function(id){
  var newDl = prompt('Enter new deadline (YYYY-MM-DDTHH:MM):'); if(!newDl) return;
  var sb = window.geramaSupabase; if(!sb) return;
  var {error} = await sb.from('quizzes').update({deadline:new Date(newDl).toISOString()}).eq('id',id);
  if(!error){ alert('Deadline extended!'); window.loadQzList(); } else alert('Error: '+error.message);
};

window.toggleQuizStatus = async function(id, newStatus){
  var sb = window.geramaSupabase; if(!sb) return;
  var label = newStatus === 'closed' ? 'Close this quiz? Students will no longer be able to take it (stays in history).' : 'Reopen this quiz for students?';
  if(!confirm(label)) return;
  var {error} = await sb.from('quizzes').update({status: newStatus}).eq('id', id);
  if(error){ alert('Error: '+error.message); return; }
  window.logActivity((newStatus==='closed'?'Closed':'Reopened')+' quiz: '+id);
  window.loadQzList();
};

window.closeAllExpiredQuizzes = async function(){
  var sb = window.geramaSupabase; if(!sb) return;
  if(!confirm('Close all quizzes whose deadline has passed? They will stay visible as history.')) return;
  var {error} = await sb.from('quizzes')
    .update({status:'closed'})
    .eq('status','active')
    .lt('deadline', new Date().toISOString());
  if(error){ alert('Error: '+error.message); return; }
  window.logActivity('Auto-closed all expired quizzes');
  window.showStatus('quizStatus','✅ All expired quizzes closed.','ok');
  window.loadQzList();
};

// Publish quiz — click handler
document.addEventListener('click', function(e){
  if(e.target.id === 'publishQuizBtn' || e.target.closest('#publishQuizBtn')) publishQuiz();
});

async function publishQuiz(){
  var title    = (document.getElementById('qzTitle')||{}).value||'';
  var course   = (document.getElementById('qzCourse')||{}).value||'';
  var duration = parseInt((document.getElementById('qzDuration')||{}).value)||0;
  var points   = (document.getElementById('qzPoints')||{}).value||'';
  var tutor    = (document.getElementById('qzTutor')||{}).value||'';
  var deadline = (document.getElementById('qzDeadline')||{}).value||'';
  var desc     = (document.getElementById('qzDesc')||{}).value||'';
  title = title.trim(); course = course.trim(); desc = desc.trim();

  if(!title){ window.showStatus('quizStatus','Quiz title is required.','err'); return; }
  if(!deadline){ window.showStatus('quizStatus','Please set a deadline.','err'); return; }

  // Detect mode: link, question paper, or pdf upload
  var currentType = window._qzCurrentType || 'link';
  var isPaper = currentType === 'paper';
  var isPdf   = currentType === 'pdf';

  var links = [];
  var paperQuestions = null;
  var pdfUrl = null;

  if(isPdf){
    if(!_qzPdfFile){ window.showStatus('quizStatus','Please upload a PDF file.','err'); return; }
  } else if(isPaper){
    // Collect typed questions
    var blocks = document.querySelectorAll('.qz-question-block');
    var qs = [];
    blocks.forEach(function(block){
      var text = (block.querySelector('.qz-q-text')||{}).value||'';
      var type2 = (block.querySelector('.qz-q-type')||{}).value||'text';
      var marks = parseInt((block.querySelector('.qz-q-marks')||{}).value)||2;
      if(!text.trim()) return;
      var q = {text:text.trim(), type:type2, marks:marks};
      if(type2==='mc'){
        var opts = block.querySelectorAll('.mc-options input');
        q.optA = opts[0]?opts[0].value:''; q.optB = opts[1]?opts[1].value:'';
        q.optC = opts[2]?opts[2].value:''; q.optD = opts[3]?opts[3].value:'';
      }
      qs.push(q);
    });
    if(!qs.length){ window.showStatus('quizStatus','Please add at least one question.','err'); return; }
    paperQuestions = JSON.stringify(qs);
  } else {
    ['qzUrl1','qzUrl2','qzUrl3'].forEach(function(id){
      var el = document.getElementById(id);
      if(el && el.value.trim()) links.push(el.value.trim());
    });
    if(!links.length){ window.showStatus('quizStatus','At least one quiz link is required.','err'); return; }
  }

  var btn = document.getElementById('publishQuizBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Publishing...';

  try{
    var sb = window.geramaSupabase;
    if(!sb) throw new Error('Supabase not connected. Check your connection.');

    // Upload PDF if in pdf mode
    if(isPdf && _qzPdfFile){
      window.showStatus('quizStatus','Uploading PDF…','info');
      var ext  = _qzPdfFile.name.split('.').pop()||'pdf';
      var path = 'quizzes/'+title.replace(/[^a-z0-9]/gi,'-').toLowerCase()+'-'+Date.now()+'.'+ext;
      var {error: upErr} = await sb.storage.from(window.BUCKET||'gerama-materials').upload(path, _qzPdfFile, {upsert:true, contentType:_qzPdfFile.type});
      if(upErr) throw new Error('PDF upload failed: '+upErr.message);
      pdfUrl = sb.storage.from(window.BUCKET||'gerama-materials').getPublicUrl(path).data.publicUrl;
    }

    var record = {
      title:        title,
      course:       course || null,
      tutor:        tutor  || null,
      duration_mins: duration || null,
      points:       points  || null,
      quiz_url:     isPdf ? null : (links.length ? JSON.stringify(links) : null),
      pdf_url:      pdfUrl || null,
      paper_questions: paperQuestions,
      deadline:     new Date(deadline).toISOString(),
      description:  desc   || null,
      status:       'active',
      created_at:   new Date().toISOString()
    };

    var {error} = await sb.from('quizzes').insert(record);
    if(error) throw new Error(error.message + (error.details ? ' — '+error.details : ''));

    var modeLabel = isPdf ? 'PDF Upload' : isPaper ? 'Question Paper ('+JSON.parse(paperQuestions).length+' questions)' : 'Link'+(links.length>1?' ('+links.length+' versions)':'');
    window.logActivity('Published quiz: '+title+' — '+modeLabel);
    window.showStatus('quizStatus','✅ Quiz published! Students can now '+(isPaper?'open the question paper':isPdf?'download the PDF':'take it')+' on the Classroom page.','ok');

    // Clear form
    ['qzTitle','qzCourse','qzDuration','qzPoints','qzTutor','qzDeadline','qzDesc','qzUrl1','qzUrl2','qzUrl3'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.value = id==='qzDuration'?'0':'';
    });
    _qzPdfFile = null;
    var chosen = document.getElementById('qzPdfChosen'); if(chosen) chosen.textContent='';
    // Clear question paper blocks
    var container = document.getElementById('qzQuestionsContainer');
    if(container){
      var blocks2 = container.querySelectorAll('.qz-question-block');
      for(var k=1;k<blocks2.length;k++) blocks2[k].remove();
      var firstTA = container.querySelector('textarea');
      if(firstTA) firstTA.value='';
    }
    window.loadQzList();
  }catch(err){
    window.showStatus('quizStatus','❌ '+err.message,'err');
  }finally{
    btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Publish Quiz Live';
  }
}
})();


// ─── ASSIGNMENTS ───────────────────────────────────────────
window.loadAsgList = async function(){
  var el = document.getElementById('asgList'); if(!el) return;
  var sb = window.geramaSupabase;
  if(!sb){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Connecting…</p>';
    // Retry until Supabase is ready (up to 8 seconds)
    var waited=0;
    while(!window.geramaSupabase && waited<8000){ await new Promise(function(r){setTimeout(r,250);}); waited+=250; }
    sb=window.geramaSupabase;
    if(!sb){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">Not connected. Please refresh.</p>'; return; }
  }
  el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Loading assignments…</p>';
  var {data,error} = await sb.from('assignments').select('*').order('created_at',{ascending:false});
  if(error||!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">No assignments posted yet.</p>'; return; }
  var now = Date.now();
  el.innerHTML = data.map(function(a){
    var dl = a.deadline ? new Date(a.deadline).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    var isPast = a.deadline && new Date(a.deadline).getTime() < now;
    var badge = isPast ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;margin-left:0.4rem;">Closed</span>'
                       : '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;margin-left:0.4rem;">Active</span>';
    return '<div class="sub-card">'+
      '<div class="sub-info"><strong>'+window.escHtml(a.title)+badge+'</strong>'+
      '<div class="sub-meta"><b>Course:</b> '+window.escHtml(a.course||'—')+' | <b>Deadline:</b> '+dl+(a.points?' | <b>Marks:</b> '+a.points:'')+'</div></div>'+
      '<div class="sub-actions">'+
        '<button class="btn-gold" style="font-size:0.78rem;padding:0.35rem 0.8rem;" onclick="extendAsgDeadline(\''+a.id+'\')"><i class="fas fa-clock"></i> Extend</button>'+
        '<button class="btn-danger" onclick="deleteAssignment(\''+a.id+'\')"><i class="fas fa-trash"></i></button>'+
      '</div></div>';
  }).join('');
};

window.loadSubmissionsTable = function(){
  if(window.doLoadSubs){ window.doLoadSubs(); return; }
  var el = document.getElementById('submissionsTable');
  if(!el) return;
  var sb = window.geramaSupabase;
  if(!sb){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Connecting…</p>';
    // Retry until Supabase is ready
    var waited=0;
    var checkInterval=setInterval(function(){
      waited+=250;
      if(window.geramaSupabase){
        clearInterval(checkInterval);
        window.loadSubmissionsTable();
      } else if(waited>=8000){
        clearInterval(checkInterval);
        el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">Not connected. Please refresh.</p>';
      }
    },250);
    return;
  }
  el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Loading submissions...</p>';
  sb.from('assignment_submissions').select('*').order('submitted_at',{ascending:false})
    .then(function(res){
      if(res.error){ el.innerHTML='<div style="background:#fee2e2;color:#991b1b;padding:1rem;border-radius:10px;"><strong>Error:</strong> '+window.escHtml(res.error.message)+'<br><br><button onclick="window.loadSubmissionsTable()" style="background:#1B5E20;color:white;border:none;padding:0.4rem 1rem;border-radius:20px;cursor:pointer;">Retry</button></div>'; return; }
      var data = res.data||[];
      if(!data.length){ el.innerHTML='<div style="text-align:center;padding:2rem;color:#9ca3af;"><i class="fas fa-inbox" style="font-size:2.5rem;display:block;margin-bottom:0.8rem;opacity:0.3;"></i><p style="font-weight:600;">No submissions yet.</p></div>'; return; }
      sb.from('assignments').select('id,title,course,points').then(function(ar){
        var am={};
        if(ar.data) ar.data.forEach(function(a){ if(a.id) am[a.id]=a; if(a.title) am[a.title]=a; });
        data.forEach(function(s){ var a=am[s.assignment_id]||am[s.assignment_title]||{}; s._course=a.course||'General'; s._points=a.points||null; });
        window._renderSubmissions(data,el);
      }).catch(function(){ data.forEach(function(s){ s._course='General'; s._points=null; }); window._renderSubmissions(data,el); });
    })
    .catch(function(err){ el.innerHTML='<div style="background:#fee2e2;color:#991b1b;padding:1rem;border-radius:10px;"><strong>Network error:</strong> '+window.escHtml(err.message)+'<br><br><button onclick="window.loadSubmissionsTable()" style="background:#1B5E20;color:white;border:none;padding:0.4rem 1rem;border-radius:20px;cursor:pointer;">Retry</button></div>'; });
};

window._renderSubmissions = function(data, el){
  if(!el) el = document.getElementById('submissionsTable');
  if(!el) return;

  // Group by assignment title first, then within each group show students
  var byAssignment = {};
  data.forEach(function(s){
    var title = s.assignment_title || 'Untitled Assignment';
    if(!byAssignment[title]) byAssignment[title] = {subs:[], course: s._course||'General', points: s._points||null};
    byAssignment[title].subs.push(s);
    // Use the first non-null _points we find for this assignment
    if(!byAssignment[title].points && s._points) byAssignment[title].points = s._points;
  });

  var total   = data.length;
  var graded  = data.filter(function(s){ return s.score!==null&&s.score!==undefined&&s.score!==''; }).length;
  var pending = total - graded;

  var html = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.8rem;margin-bottom:1.5rem;padding:1rem 1.2rem;background:linear-gradient(135deg,#f0fdf4,#f8fafc);border-radius:14px;border:1px solid #c8e6c9;">'+
    '<div>'+
      '<div style="font-size:1rem;font-weight:800;color:#1B5E20;"><i class="fas fa-file-alt"></i> Student Submissions</div>'+
      '<div style="font-size:0.82rem;color:#6b7280;margin-top:0.3rem;">'+
        '<span style="background:#e8f5e9;color:#1B5E20;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;margin-right:0.4rem;">'+total+' total</span>'+
        '<span style="background:#d1fae5;color:#065f46;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;margin-right:0.4rem;">✅ '+graded+' graded</span>'+
        (pending>0?'<span style="background:#fef3c7;color:#92400e;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;">⏳ '+pending+' pending</span>':'')+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">'+
      '<button onclick="window.loadSubmissionsTable()" style="background:#f1f5f9;color:#374151;border:1px solid #e5e7eb;padding:0.45rem 0.9rem;border-radius:20px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-sync-alt"></i> Refresh</button>'+
      '<button onclick="window.syncAllGradesToPortal()" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Push all graded submissions into student_grades so students can see them"><i class="fas fa-upload"></i> Sync All to Portal</button>'+
      '<button onclick="downloadGradesSummary()" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-download"></i> Download All Grades</button>'+
    '</div>'+
  '</div>';

  // Sort assignments: ungraded first, then by title
  var assignmentTitles = Object.keys(byAssignment).sort(function(a,b){
    var ag = byAssignment[a].subs.filter(function(s){ return s.score!==null&&s.score!==undefined&&s.score!==''; }).length;
    var bg = byAssignment[b].subs.filter(function(s){ return s.score!==null&&s.score!==undefined&&s.score!==''; }).length;
    var ap = byAssignment[a].subs.length - ag;
    var bp = byAssignment[b].subs.length - bg;
    if(ap !== bp) return bp - ap; // more pending first
    return a.localeCompare(b);
  });

  assignmentTitles.forEach(function(asgTitle){
    var group  = byAssignment[asgTitle];
    var subs   = group.subs;
    var pts    = group.points;
    var course = group.course;
    var gradedCount = subs.filter(function(s){ return s.score!==null&&s.score!==undefined&&s.score!==''; }).length;
    var pendingCount = subs.length - gradedCount;

    var rows = subs.map(function(s){
      var dt   = s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      var cur  = (s.score!==null&&s.score!==undefined&&s.score!=='') ? s.score : '';
      var sid  = String(s.id).replace(/[^a-z0-9]/gi,'');
      var badge = cur!==''
        ? '<span style="background:#d1fae5;color:#065f46;font-size:0.82rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:10px;">'+cur+(pts?'/'+pts:'')+'</span>'
        : '<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:600;padding:0.2rem 0.5rem;border-radius:10px;">⏳ Ungraded</span>';
      return '<tr>'+
        '<td>'+
          '<strong style="font-size:0.88rem;">'+window.escHtml(s.student_name||'—')+'</strong>'+
          '<div style="font-size:0.75rem;color:#6b7280;">'+window.escHtml(s.student_email||'')+'</div>'+
          (s.index_number?'<div style="font-size:0.7rem;color:#1B5E20;font-weight:600;">'+window.escHtml(s.index_number)+'</div>':'')+
        '</td>'+
        '<td style="font-size:0.78rem;color:#6b7280;white-space:nowrap;">'+dt+'</td>'+
        '<td>'+
          (s.file_url
            ? '<a href="'+window.escAttr(s.file_url)+'" target="_blank" style="color:#1B5E20;font-size:0.8rem;font-weight:600;white-space:nowrap;"><i class="fas fa-download"></i> File</a>'
            : '<span style="color:#9ca3af;font-size:0.78rem;">—</span>')+
        '</td>'+
        '<td>'+badge+'</td>'+
        '<td>'+
          '<div style="display:flex;gap:0.3rem;align-items:center;">'+
            '<input type="number" id="score-'+sid+'" value="'+window.escAttr(String(cur))+'" min="0"'+(pts?' max="'+pts+'"':'')+' placeholder="0" style="width:58px;padding:0.3rem 0.4rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.82rem;outline:none;text-align:center;font-family:\'Inter\',sans-serif;" onfocus="this.style.borderColor=\'#1B5E20\'" onblur="this.style.borderColor=\'#e5e7eb\'">'+
            (pts?'<span style="font-size:0.72rem;color:#9ca3af;">/'+pts+'</span>':'')+
            '<button data-subid="'+s.id+'" data-safeid="'+sid+'" data-email="'+window.escAttr(s.student_email||'')+'" data-title="'+window.escAttr(s.assignment_title||'')+'" onclick="gradeSubmission(this)" style="background:#1B5E20;color:white;border:none;padding:0.3rem 0.7rem;border-radius:8px;font-size:0.75rem;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-check"></i> Grade</button>'+
          '</div>'+
          '<div id="grade-status-'+sid+'" style="font-size:0.7rem;margin-top:0.2rem;color:#059669;"></div>'+
        '</td>'+
      '</tr>';
    }).join('');

    html +=
      '<div style="margin-bottom:2rem;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 10px rgba(0,0,0,0.04);">'+
        // Assignment header bar
        '<div style="background:linear-gradient(135deg,#0a2f1f,#1B5E20);color:white;padding:0.9rem 1.2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">'+
          '<div>'+
            '<div style="font-size:0.95rem;font-weight:800;"><i class="fas fa-tasks" style="margin-right:0.4rem;opacity:0.8;"></i>'+window.escHtml(asgTitle)+'</div>'+
            '<div style="font-size:0.72rem;opacity:0.7;margin-top:0.2rem;"><i class="fas fa-book" style="margin-right:0.3rem;"></i>'+window.escHtml(course)+(pts?' &nbsp;·&nbsp; <i class="fas fa-star" style="margin-right:0.2rem;"></i>'+pts+' marks':'')+'</div>'+
          '</div>'+
          '<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">'+
            '<span style="background:rgba(255,255,255,0.15);padding:0.2rem 0.7rem;border-radius:20px;font-size:0.75rem;font-weight:700;">'+subs.length+' submitted</span>'+
            (gradedCount?'<span style="background:rgba(16,185,129,0.25);color:#6ee7b7;padding:0.2rem 0.7rem;border-radius:20px;font-size:0.75rem;font-weight:700;">✅ '+gradedCount+' graded</span>':'')+
            (pendingCount?'<span style="background:rgba(245,158,11,0.25);color:#FFC107;padding:0.2rem 0.7rem;border-radius:20px;font-size:0.75rem;font-weight:700;">⏳ '+pendingCount+' pending</span>':'')+
            '<button onclick="downloadAssignmentGrades(\''+window.escAttr(asgTitle)+'\')" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;padding:0.25rem 0.7rem;border-radius:20px;font-size:0.72rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-file-csv"></i> CSV</button>'+
          '</div>'+
        '</div>'+
        '<div class="tbl-wrap">'+
          '<table><thead><tr style="background:#f8fafc;"><th>Student</th><th>Submitted</th><th>File</th><th>Score</th><th>Grade</th></tr></thead>'+
          '<tbody>'+rows+'</tbody></table>'+
        '</div>'+
      '</div>';
  });

  el.innerHTML = html;
};

// Download grades for a specific assignment title
window.downloadAssignmentGrades = async function(asgTitle){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var {data} = await sb.from('assignment_submissions').select('*').eq('assignment_title', asgTitle).order('submitted_at',{ascending:false});
  if(!data||!data.length){ alert('No submissions for this assignment.'); return; }
  var asgRes = await sb.from('assignments').select('course,points').eq('title',asgTitle).maybeSingle();
  var pts = asgRes&&asgRes.data ? asgRes.data.points||'' : '';
  var headers = ['Student Name','Email','Index Number','Assignment','Score','Total Marks','Submitted','Graded At'];
  var rows = data.map(function(s){
    return [
      s.student_name||'', s.student_email||'', s.index_number||'', s.assignment_title||'',
      s.score!==null&&s.score!==undefined?s.score:'', pts,
      s.submitted_at?new Date(s.submitted_at).toLocaleString('en-GB'):'',
      s.graded_at?new Date(s.graded_at).toLocaleString('en-GB'):''
    ].map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });
  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_'+asgTitle.replace(/[^a-z0-9]/gi,'_')+'_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded grades CSV for assignment: '+asgTitle);
};

// Download ALL grades as CSV
window.downloadGradesSummary = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var {data} = await sb.from('assignment_submissions').select('*').order('submitted_at',{ascending:false});
  if(!data||!data.length){ alert('No submissions to download.'); return; }

  var headers = ['Student Name','Email','Index Number','Assignment','Course','Submitted','Score','Total Marks','Graded At'];
  var rows = data.map(function(s){
    var dt = s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-GB') : '';
    var gdt = s.graded_at ? new Date(s.graded_at).toLocaleString('en-GB') : '';
    return [
      s.student_name||'', s.student_email||'', s.index_number||'',
      s.assignment_title||'', s._course||'', dt,
      s.score!==null&&s.score!==undefined?s.score:'', '', gdt
    ].map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_Grades_All_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded all grades summary CSV');
};

// Download grades for a specific course
window.downloadCourseGrades = async function(course){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var {data} = await sb.from('assignment_submissions').select('*').order('submitted_at',{ascending:false});
  if(!data||!data.length){ alert('No submissions.'); return; }

  // Fetch assignment points
  var asgMap = {};
  try{
    var asgRes = await sb.from('assignments').select('id,title,course,points');
    if(asgRes.data) asgRes.data.forEach(function(a){ asgMap[a.id]=a; asgMap[a.title]=a; });
  }catch(e){}

  // Filter to this course
  var filtered = data.filter(function(s){
    var asg = asgMap[s.assignment_id] || asgMap[s.assignment_title] || {};
    var c = asg.course || s.assignment_title || 'General';
    return c === course;
  });

  if(!filtered.length){ alert('No submissions for this course.'); return; }

  var headers = ['Student Name','Email','Index Number','Assignment','Score','Total Marks','Graded At'];
  var rows = filtered.map(function(s){
    var asg = asgMap[s.assignment_id] || asgMap[s.assignment_title] || {};
    var gdt = s.graded_at ? new Date(s.graded_at).toLocaleString('en-GB') : '';
    return [
      s.student_name||'', s.student_email||'', s.index_number||'',
      s.assignment_title||'',
      s.score!==null&&s.score!==undefined?s.score:'',
      asg.points||'', gdt
    ].map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_Grades_'+course.replace(/[^a-z0-9]/gi,'_')+'_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded grades CSV for: '+course);
};

window.gradeSubmission = async function(btn){
  var subId   = btn.getAttribute('data-subid');
  var safeId  = btn.getAttribute('data-safeid');
  var email   = btn.getAttribute('data-email');
  var title   = btn.getAttribute('data-title');
  var scoreEl = document.getElementById('score-'+safeId);
  var statusEl= document.getElementById('grade-status-'+safeId);
  if(!scoreEl) return;

  var score = parseFloat(scoreEl.value);
  if(isNaN(score)||score<0){ if(statusEl){statusEl.textContent='Enter a valid score.';statusEl.style.color='#f59e0b';} return; }

  var sb = window.geramaSupabase; if(!sb) return;
  if(statusEl){statusEl.textContent='Saving...';statusEl.style.color='#6b7280';}

  var {error} = await sb.from('assignment_submissions')
    .update({score: score, graded_at: new Date().toISOString()})
    .eq('id', subId);

  if(error){ if(statusEl){statusEl.textContent='❌ '+error.message;statusEl.style.color='#dc2626';} return; }

    // Upsert (atomic) to student_grades table for portal display
    try{
      // Fetch course AND points for this submission
      var courseVal = 'General';
      var pointsVal = null;
      var studentNameVal = null;

      // Get assignment details (course + points)
      var asgRes = await sb.from('assignments').select('course,points').eq('title', title).maybeSingle();
      if(asgRes && asgRes.data){
        if(asgRes.data.course) courseVal = asgRes.data.course;
        if(asgRes.data.points) pointsVal = asgRes.data.points;
      }

      // Get student name from the submission
      var subRes = await sb.from('assignment_submissions').select('student_name,submitted_at').eq('id',subId).maybeSingle();
      if(subRes && subRes.data && subRes.data.student_name) studentNameVal = subRes.data.student_name;

      // Upsert grade atomically — no more delete+insert race
      await sb.from('student_grades').upsert({
        student_email:    email,
        student_name:     studentNameVal || null,
        assignment_title: title,
        course:           courseVal,
        score:            score,
        total_marks:      pointsVal || null,
        points:           pointsVal || null,
        submission_id:    subId,
        graded_at:        new Date().toISOString(),
        participated_at:  (subRes && subRes.data && subRes.data.submitted_at) || new Date().toISOString()
      }, {onConflict: 'student_email,assignment_title'});
    }catch(e){ console.warn('student_grades upsert error:', e.message); }

  window.logActivity('Graded: '+title+' for '+email+' → '+score);
  if(statusEl){statusEl.textContent='✅ Graded!';statusEl.style.color='#059669';}
  btn.style.background='#059669';
  setTimeout(function(){
    if(statusEl) statusEl.textContent='';
    btn.style.background='';
    if(window.loadGradesPanel) window.loadGradesPanel();
  }, 2000);
};

// Keep a reference to loadSubmissionsTable so gradeSubmission can call it after grading.
// loadGradesPanel is defined by the inline script in admin-dashboard.html which loads after this file.
// If it hasn't been defined yet (e.g. loaded standalone), fall back to loadSubmissionsTable.
window._loadGradesFallback = window.loadSubmissionsTable;
if (!window.loadGradesPanel) {
  window.loadGradesPanel = window.loadSubmissionsTable;
}

window.postAssignment = async function(){
  var title   = document.getElementById('asgTitle').value.trim();
  var course  = document.getElementById('asgCourse').value.trim();
  var tutor   = document.getElementById('asgTutor').value.trim();
  var points  = document.getElementById('asgPoints').value.trim();
  var desc    = document.getElementById('asgDesc').value.trim();
  var deadline= document.getElementById('asgDeadline').value;
  var extLink = document.getElementById('asgLink').value.trim();
  if(!title||!course||!desc||!deadline){ window.showStatus('asgStatus','Please fill in Title, Course, Description and Deadline.','err'); return; }
  var btn = document.getElementById('postAsgBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Posting...';
  try{
    var sb = window.geramaSupabase; if(!sb) throw new Error('Not connected.');

    // Upload assignment file if selected
    var fileUrl = null;
    var asgFileInput = document.getElementById('asgFile');
    var asgFile = asgFileInput && asgFileInput.files && asgFileInput.files[0];
    if(asgFile){
      window.showStatus('asgStatus','Uploading file...','info');
      var ext = asgFile.name.split('.').pop();
      var safeName = title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now()+'.'+ext;
      var storagePath = 'assignments/'+safeName;
      var {error: upErr} = await sb.storage.from(window.BUCKET).upload(storagePath, asgFile, {upsert:true, contentType:asgFile.type});
      if(upErr) throw new Error('File upload failed: '+upErr.message);
      fileUrl = sb.storage.from(window.BUCKET).getPublicUrl(storagePath).data.publicUrl;
    }

    var {error} = await sb.from('assignments').insert({
      title:title, course:course, tutor:tutor||null, points:points?parseInt(points):null,
      description:desc, deadline:new Date(deadline).toISOString(),
      external_link:extLink||null,
      file_url: fileUrl||null,
      status:'active', created_at:new Date().toISOString()
    });
    if(error) throw new Error(error.message);
    window.logActivity('Posted assignment: '+title+(fileUrl?' (with file)':''));
    window.showStatus('asgStatus','✅ Assignment posted! Students can see and download it on the Classroom page.','ok');
    ['asgTitle','asgCourse','asgTutor','asgPoints','asgDesc','asgDeadline','asgLink'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
    var fc = document.getElementById('asgFileChosen'); if(fc) fc.textContent='';
    if(asgFileInput) asgFileInput.value='';
    window.loadAsgList();
  }catch(e){ window.showStatus('asgStatus','❌ '+e.message,'err'); }
  btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Post Assignment';
};

window.extendAsgDeadline = async function(id){
  var newDl = prompt('Enter new deadline (YYYY-MM-DDTHH:MM):'); if(!newDl) return;
  var sb = window.geramaSupabase; if(!sb) return;
  var {error} = await sb.from('assignments').update({deadline:new Date(newDl).toISOString()}).eq('id',id);
  if(!error){ alert('Deadline extended!'); window.loadAsgList(); } else alert('Error: '+error.message);
};

window.deleteAssignment = async function(id){
  if(!confirm('Delete this assignment?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('assignments').delete().eq('id',id);
  window.loadAsgList();
};

// ─── SCHEDULE CLASS ───────────────────────────────────────
window.toggleClsType = function(){
  var val = document.querySelector('input[name="clsType"]:checked').value;
  var isVirtual = val === 'virtual';
  document.getElementById('clsVirtualInfo').style.display  = isVirtual ? 'block' : 'none';
  document.getElementById('clsVenueField').style.display   = isVirtual ? 'none'  : 'block';
  document.getElementById('clsMapField').style.display     = isVirtual ? 'none'  : 'block';
  document.getElementById('clsHintBox').style.display      = isVirtual ? 'block' : 'none';
  // Highlight active label
  document.getElementById('clsTypeVirtualLabel').style.borderColor  = isVirtual ? '#1d4ed8' : '#e5e7eb';
  document.getElementById('clsTypeInPersonLabel').style.borderColor = isVirtual ? '#e5e7eb' : '#dc2626';
};

window.scheduleClass = async function(){
  var course = document.getElementById('clsCourse').value.trim();
  var topic  = document.getElementById('clsTopic').value.trim();
  var tutor  = document.getElementById('clsTutor').value.trim();
  var dt     = document.getElementById('clsDateTime').value;
  var desc   = document.getElementById('clsDesc').value.trim();
  var clsType = document.querySelector('input[name="clsType"]:checked').value;
  var venue  = clsType === 'inperson' ? (document.getElementById('clsVenue').value.trim()) : '';
  var mapLink= clsType === 'inperson' ? (document.getElementById('clsMapLink').value.trim()) : '';

  if(!course||!topic||!dt){ window.showStatus('clsStatus','Please fill in Course, Topic and Date/Time.','err'); return; }
  if(clsType === 'inperson' && !venue){ window.showStatus('clsStatus','Please enter the venue/location.','err'); return; }

  var btn = document.getElementById('scheduleClsBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Scheduling...';
  try{
    var sb = window.geramaSupabase; if(!sb) throw new Error('Not connected.');
    var meetLink = null;

    if(clsType === 'virtual'){
      var slug = (course+'-'+topic).toLowerCase().replace(/[^a-z0-9]+/g,'-').substring(0,40);
      meetLink = 'https://meet.jit.si/GERAMA-'+slug+'-'+Date.now();
    }

    var {error} = await sb.from('classes').insert({
      course:course, topic:topic, tutor:tutor||null, description:desc||null,
      scheduled_at:new Date(dt).toISOString(),
      meet_link: meetLink,
      class_type: clsType,
      venue: venue||null,
      map_link: mapLink||null,
      status:'upcoming', created_at:new Date().toISOString()
    });
    if(error) throw new Error(error.message);

    if(clsType === 'virtual' && meetLink){
      document.getElementById('clsLinkInput').value = meetLink;
      document.getElementById('clsLinkOpen').href = meetLink;
      document.getElementById('clsLinkBox').style.display = 'block';
    }
    window.logActivity('Scheduled '+(clsType==='inperson'?'in-person':'virtual')+' class: '+course+' – '+topic);
    window.showStatus('clsStatus','✅ Class scheduled! '+(clsType==='inperson'?'Venue: '+venue:'Share the link with students.'),'ok');
    ['clsCourse','clsTopic','clsTutor','clsDesc','clsDateTime','clsVenue','clsMapLink'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
    window.loadClsList();
  }catch(e){ window.showStatus('clsStatus','❌ '+e.message,'err'); }
  btn.disabled=false; btn.innerHTML='<i class="fas fa-calendar-plus"></i> Schedule &amp; Publish';
};

window.copyClsLink = function(){
  var val = document.getElementById('clsLinkInput').value;
  if(navigator.clipboard) navigator.clipboard.writeText(val);
  else { var t=document.createElement('textarea'); t.value=val; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
  alert('Link copied!');
};

window.loadClsList = async function(){
  var el = document.getElementById('clsList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
  var {data} = await sb.from('classes').select('*').order('scheduled_at',{ascending:false});
  if(!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">No classes scheduled yet.</p>'; return; }

  var now = Date.now();

  // Sort: live first, then upcoming soonest first, then ended most recent first
  data.sort(function(a,b){
    var aLive=a.status==='live', bLive=b.status==='live';
    var aEnd=a.status==='ended', bEnd=b.status==='ended';
    if(aLive&&!bLive) return -1; if(!aLive&&bLive) return 1;
    if(aEnd&&!bEnd) return 1; if(!aEnd&&bEnd) return -1;
    return new Date(a.scheduled_at)-new Date(b.scheduled_at);
  });

  // Separate active (upcoming/live) from ended (history)
  var active = data.filter(function(c){ return c.status !== 'ended'; });
  var ended  = data.filter(function(c){ return c.status === 'ended'; });

  function renderCard(c){
    var dt = new Date(c.scheduled_at).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    var isLive   = c.status === 'live';
    var isEnded  = c.status === 'ended';
    var isPast   = new Date(c.scheduled_at).getTime() < now;
    var isInPerson = c.class_type === 'inperson';

    var badge = isLive
      ? '<span style="background:linear-gradient(135deg,#fee2e2,#fecaca);color:#dc2626;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;animation:pulse 2s infinite;">🔴 LIVE NOW</span>'
      : isEnded
        ? '<span style="background:#f3f4f6;color:#6b7280;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">✅ Ended</span>'
        : isPast
          ? '<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">⏰ Time Passed</span>'
          : '<span style="background:#dbeafe;color:#1d4ed8;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">📅 Upcoming</span>';

    var typeBadge = isInPerson
      ? '<span style="background:#fce7f3;color:#9d174d;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.4rem;"><i class="fas fa-map-marker-alt"></i> In-Person</span>'
      : '<span style="background:#dbeafe;color:#1e40af;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.4rem;"><i class="fas fa-video"></i> Virtual</span>';

    var goLiveBtn = (!isLive&&!isEnded)?'<button class="btn-gold" style="font-size:0.78rem;padding:0.4rem 0.9rem;" onclick="setClassStatus(\''+c.id+'\',\'live\')"><i class="fas fa-broadcast-tower"></i> Go Live</button>':'';
    var endBtn    = isLive?'<button class="btn-primary" style="font-size:0.78rem;padding:0.4rem 0.9rem;background:#dc2626;" onclick="setClassStatus(\''+c.id+'\',\'ended\')"><i class="fas fa-stop-circle"></i> End Class</button>':'';
    var reopenBtn = isEnded?'<button class="btn-gold" style="font-size:0.78rem;padding:0.4rem 0.9rem;" onclick="setClassStatus(\''+c.id+'\',\'upcoming\')"><i class="fas fa-redo"></i> Reopen</button>':'';
    var editBtn   = !isEnded ? '<button class="btn-primary" style="font-size:0.78rem;padding:0.4rem 0.9rem;background:linear-gradient(135deg,#0369a1,#0ea5e9);" onclick="openEditClassModal(\''+window.escAttr(JSON.stringify(c))+'\')"><i class="fas fa-edit"></i> Edit</button>' : '';
    var deleteBtn = '<button class="btn-danger" onclick="deleteClass(\''+c.id+'\')" style="font-size:0.78rem;padding:0.4rem 0.7rem;"><i class="fas fa-trash"></i></button>';

    var locationInfo = isInPerson
      ? '<br><i class="fas fa-map-marker-alt" style="color:#dc2626;margin-right:0.3rem;"></i><strong>Venue:</strong> '+window.escHtml(c.venue||'—')+
        (c.map_link?'&nbsp;<a href="'+window.escAttr(c.map_link)+'" target="_blank" style="color:#4285F4;font-size:0.8rem;"><i class="fab fa-google"></i> View Map</a>':'')
      : (c.meet_link?'<br><a href="'+window.escAttr(c.meet_link)+'" target="_blank" style="color:#1B5E20;font-size:0.8rem;"><i class="fas fa-link"></i> '+window.escHtml(c.meet_link.substring(0,55))+'</a>':'');

    return '<div class="sub-card" style="'+(isLive?'border-left:4px solid #dc2626;background:linear-gradient(135deg,#fff5f5,#fff);':'')+'">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(c.course)+' — '+window.escHtml(c.topic)+' '+badge+typeBadge+'</strong>'+
        '<div class="sub-meta"><b>When:</b> '+dt+(c.tutor?' | <b>Tutor:</b> '+window.escHtml(c.tutor):'')+locationInfo+'</div>'+
      '</div>'+
      '<div class="sub-actions">'+goLiveBtn+endBtn+reopenBtn+editBtn+deleteBtn+'</div>'+
    '</div>';
  }

  var html = '';

  // Active classes first
  if(active.length){
    html += active.map(renderCard).join('');
  }

  // Ended classes as collapsible history
  if(ended.length){
    html += '<div style="margin-top:1.5rem;">'+
      '<div style="font-size:0.82rem;font-weight:700;color:var(--muted,#6b7280);margin-bottom:0.6rem;display:flex;align-items:center;gap:0.5rem;padding-top:0.8rem;border-top:1px solid #e5e7eb;">'+
        '<i class="fas fa-history"></i> Past Classes ('+ended.length+')'+
      '</div>'+
      ended.map(renderCard).join('')+
    '</div>';
  }

  el.innerHTML = html || '<p style="color:#9ca3af;text-align:center;padding:1rem;">No classes yet.</p>';
};

window.setClassStatus = async function(id, status){
  var sb = window.geramaSupabase; if(!sb) return;
  // Map 'upcoming' back to the correct status
  var dbStatus = status === 'upcoming' ? 'upcoming' : status;
  var {error} = await sb.from('classes').update({status: dbStatus}).eq('id', id);
  if(error){ alert('Error: '+error.message); return; }
  var label = status==='live' ? '🔴 Class is now LIVE!' : status==='ended' ? '✅ Class ended — moved to history.' : '📅 Class reopened.';
  window.logActivity(label+' ('+id+')');
  window.loadClsList();
};

window.deleteClass = async function(id){
  if(!confirm('Delete this class?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('classes').delete().eq('id',id);
  window.loadClsList();
};

// ─── EDIT SCHEDULED CLASS ─────────────────────────────────────────────────────
// Allows changing venue, date/time, tutor, description — the meeting link is
// shown for reference only and is NEVER modified here.
window.openEditClassModal = function(classDataStr) {
  var c;
  try { c = JSON.parse(classDataStr); } catch(e) { alert('Could not load class data.'); return; }

  var existing = document.getElementById('editClassModal');
  if (existing) existing.remove();

  var isInPerson = c.class_type === 'inperson';

  // Format datetime-local value (YYYY-MM-DDTHH:MM)
  var dtVal = '';
  if (c.scheduled_at) {
    var d = new Date(c.scheduled_at);
    dtVal = d.getFullYear() + '-' +
            String(d.getMonth()+1).padStart(2,'0') + '-' +
            String(d.getDate()).padStart(2,'0') + 'T' +
            String(d.getHours()).padStart(2,'0') + ':' +
            String(d.getMinutes()).padStart(2,'0');
  }

  var modal = document.createElement('div');
  modal.id = 'editClassModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:6000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);overflow-y:auto;';
  modal.innerHTML =
    '<div style="background:white;border-radius:22px;padding:2rem;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.4rem;">' +
        '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;gap:0.6rem;">' +
          '<i class="fas fa-edit" style="color:#0ea5e9;"></i> Edit Class Details' +
        '</div>' +
        '<button onclick="document.getElementById(\'editClassModal\').remove()" style="background:#f1f5f9;border:none;color:#374151;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +

      // Course + Topic (read-only — they identify the class)
      '<div style="background:#f0fdf4;border:1px solid #c8e6c9;border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:1.2rem;">' +
        '<div style="font-size:0.78rem;font-weight:700;color:#1B5E20;margin-bottom:0.3rem;"><i class="fas fa-lock" style="margin-right:0.3rem;"></i>Class Identity (read-only)</div>' +
        '<div style="font-size:0.9rem;font-weight:700;color:#1e2a3e;">' + window.escHtml(c.course) + ' — ' + window.escHtml(c.topic) + '</div>' +
      '</div>' +

      // Meeting link shown for reference, not editable
      (c.meet_link ?
        '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:1.2rem;">' +
          '<div style="font-size:0.78rem;font-weight:700;color:#1d4ed8;margin-bottom:0.3rem;"><i class="fas fa-link" style="margin-right:0.3rem;"></i>Meeting Link (unchanged)</div>' +
          '<div style="font-size:0.8rem;color:#374151;word-break:break-all;font-family:monospace;">' + window.escHtml(c.meet_link) + '</div>' +
        '</div>'
      : '') +

      // Editable fields
      '<div class="form-grid">' +
        '<div class="form-field full">' +
          '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Date &amp; Time *</label>' +
          '<input type="datetime-local" id="editClsDateTime" value="' + window.escAttr(dtVal) + '" style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor=\'#0ea5e9\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
        '</div>' +
        (isInPerson ?
          '<div class="form-field full">' +
            '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Venue / Location *</label>' +
            '<input type="text" id="editClsVenue" value="' + window.escAttr(c.venue||'') + '" placeholder="e.g. Engineering Block, Room 204" style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor=\'#0ea5e9\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          '</div>' +
          '<div class="form-field full">' +
            '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Google Maps Link (optional)</label>' +
            '<input type="url" id="editClsMapLink" value="' + window.escAttr(c.map_link||'') + '" placeholder="https://maps.google.com/..." style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor=\'#0ea5e9\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          '</div>'
        : '') +
        '<div class="form-field full">' +
          '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Tutor / Host</label>' +
          '<input type="text" id="editClsTutor" value="' + window.escAttr(c.tutor||'') + '" placeholder="e.g. Aleks ZanderOD" style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor=\'#0ea5e9\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
        '</div>' +
        '<div class="form-field full">' +
          '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Description / Notes</label>' +
          '<textarea id="editClsDesc" rows="3" placeholder="Any additional info for students..." style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;resize:vertical;box-sizing:border-box;" onfocus="this.style.borderColor=\'#0ea5e9\'" onblur="this.style.borderColor=\'#e5e7eb\'">' + window.escHtml(c.description||c.desc||'') + '</textarea>' +
        '</div>' +
      '</div>' +

      '<div id="editClsStatus" style="font-size:0.85rem;min-height:1rem;margin:0.6rem 0;text-align:center;"></div>' +
      '<div style="display:flex;gap:0.7rem;margin-top:0.5rem;">' +
        '<button onclick="window.saveClassEdit(\''+window.escAttr(c.id)+'\',\''+window.escAttr(c.class_type||'virtual')+'\')" style="flex:1;background:linear-gradient(135deg,#0369a1,#0ea5e9);color:white;border:none;padding:0.75rem;border-radius:12px;font-size:0.92rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;justify-content:center;gap:0.5rem;"><i class="fas fa-save"></i> Save Changes</button>' +
        '<button onclick="document.getElementById(\'editClassModal\').remove()" style="flex:0 0 auto;background:#f1f5f9;color:#374151;border:none;padding:0.75rem 1.2rem;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
};

window.saveClassEdit = async function(classId, classType) {
  var statusEl = document.getElementById('editClsStatus');
  function setStatus(msg, ok) {
    if (statusEl) { statusEl.textContent = msg; statusEl.style.color = ok ? '#059669' : '#dc2626'; }
  }

  var dtInput = document.getElementById('editClsDateTime');
  var dt = dtInput && dtInput.value;
  if (!dt) { setStatus('Please set a date and time.', false); return; }

  var isInPerson = classType === 'inperson';
  var venue   = isInPerson ? (document.getElementById('editClsVenue') && document.getElementById('editClsVenue').value.trim()) : null;
  var mapLink = isInPerson ? (document.getElementById('editClsMapLink') && document.getElementById('editClsMapLink').value.trim()) : null;
  var tutor   = (document.getElementById('editClsTutor') && document.getElementById('editClsTutor').value.trim()) || null;
  var desc    = (document.getElementById('editClsDesc') && document.getElementById('editClsDesc').value.trim()) || null;

  if (isInPerson && !venue) { setStatus('Venue is required for in-person classes.', false); return; }

  var sb = window.geramaSupabase; if (!sb) { setStatus('Not connected.', false); return; }

  setStatus('Saving…', true);

  var updates = {
    scheduled_at: new Date(dt).toISOString(),
    tutor:        tutor,
    description:  desc,
    updated_at:   new Date().toISOString()
  };
  if (isInPerson) {
    updates.venue    = venue || null;
    updates.map_link = mapLink || null;
  }

  var { error } = await sb.from('classes').update(updates).eq('id', classId);

  if (error) { setStatus('❌ ' + error.message, false); return; }

  setStatus('✅ Class updated!', true);
  window.logActivity('Edited class details: ' + classId);

  setTimeout(function() {
    var m = document.getElementById('editClassModal');
    if (m) m.remove();
    window.loadClsList();
  }, 900);
};

// ─── CLASS REQUESTS ───────────────────────────────────────
window.loadClassRequests = async function(){
  var el = document.getElementById('classRequestsList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
  var {data} = await sb.from('class_requests').select('*').order('created_at',{ascending:false});
  if(!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">No class requests yet.</p>'; return; }
  el.innerHTML = data.map(function(r){
    var dt = new Date(r.scheduled_at).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    var badge = r.status==='approved' ? '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Approved</span>'
              : r.status==='rejected' ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Rejected</span>'
              : '<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Pending</span>';
    return '<div class="sub-card">'+
      '<div class="sub-info"><strong>'+window.escHtml(r.course)+' — '+window.escHtml(r.topic)+' '+badge+'</strong>'+
      '<div class="sub-meta"><b>By:</b> '+window.escHtml(r.requester_name||'—')+' ('+window.escHtml(r.requester_email||'—')+')<br><b>Proposed:</b> '+dt+'</div></div>'+
      '<div class="sub-actions">'+
        (r.status==='pending'?'<button class="btn-success" onclick="approveClassRequest(\''+r.id+'\',\''+window.escAttr(r.course)+'\',\''+window.escAttr(r.topic)+'\',\''+window.escAttr(r.scheduled_at)+'\',\''+window.escAttr(r.requester_email||'')+'\')"><i class="fas fa-check"></i> Approve</button>':'')+
        (r.status==='pending'?'<button class="btn-danger" onclick="rejectClassRequest(\''+r.id+'\')"><i class="fas fa-times"></i> Reject</button>':'')+
      '</div></div>';
  }).join('');
};

window.approveClassRequest = async function(id, course, topic, scheduledAt, email){
  var sb = window.geramaSupabase; if(!sb) return;
  var slug = (course+'-'+topic).toLowerCase().replace(/[^a-z0-9]+/g,'-').substring(0,40);
  var meetLink = 'https://meet.jit.si/GERAMA-'+slug+'-'+Date.now();
  await sb.from('classes').insert({ course:course, topic:topic, scheduled_at:scheduledAt, meet_link:meetLink, status:'upcoming', requester_email:email, created_at:new Date().toISOString() });
  await sb.from('class_requests').update({status:'approved'}).eq('id',id);
  window.logActivity('Approved class request: '+course+' – '+topic);
  alert('✅ Approved! Class is now live. Link: '+meetLink);
  window.loadClassRequests();
};

window.rejectClassRequest = async function(id){
  if(!confirm('Reject this request?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('class_requests').update({status:'rejected'}).eq('id',id);
  window.loadClassRequests();
};

// ─── PERSONALITY OF THE WEEK ───────────────────────────────
window.loadPotwList = async function(){
  var el = document.getElementById('potwList'); if(!el) return;
  var sb = window.geramaSupabase;
  if(!sb){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">Not connected.</p>'; return; }
  el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';
  var {data,error} = await sb.from('potw_nominations').select('*').order('created_at',{ascending:false});
  if(error){ el.innerHTML='<p style="color:#dc2626;padding:1rem;">Error: '+window.escHtml(error.message)+'</p>'; return; }
  if(!data||!data.length){
    el.innerHTML='<div style="text-align:center;padding:2rem;color:#9ca3af;"><i class="fas fa-star" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i><p>No nominations yet. Add the first one above.</p></div>';
    return;
  }
  el.innerHTML = data.map(function(p){
    var badge = p.status==='approved'
      ? '<span style="background:#d1fae5;color:#065f46;font-size:0.68rem;font-weight:700;padding:0.1rem 0.5rem;border-radius:20px;margin-left:0.4rem;">⭐ Featured</span>'
      : p.status==='rejected'
      ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.68rem;font-weight:700;padding:0.1rem 0.5rem;border-radius:20px;margin-left:0.4rem;">Removed</span>'
      : '<span style="background:#fef3c7;color:#92400e;font-size:0.68rem;font-weight:700;padding:0.1rem 0.5rem;border-radius:20px;margin-left:0.4rem;">Pending</span>';
    var photoHtml = p.photo_url
      ? '<img src="'+window.escAttr(p.photo_url)+'" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #FFC107;flex-shrink:0;" alt="" onerror="this.style.display=\'none\'">'
      : '<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#1B5E20,#2E7D32);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;color:white;flex-shrink:0;">'+window.escHtml((p.name||'?').charAt(0).toUpperCase())+'</div>';
    var dt = p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
    return '<div style="display:flex;align-items:center;gap:0.9rem;padding:0.9rem 1rem;background:white;border-radius:14px;border:1px solid #e8f5e9;margin-bottom:0.7rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);">'+
      photoHtml+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-size:0.92rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;flex-wrap:wrap;gap:0.3rem;">'+window.escHtml(p.name||'—')+badge+'</div>'+
        (p.role?'<div style="font-size:0.78rem;color:#1B5E20;font-weight:600;margin-top:0.1rem;">'+window.escHtml(p.role)+'</div>':'')+
        '<div style="font-size:0.78rem;color:#6b7280;margin-top:0.15rem;line-height:1.5;word-break:break-word;">'+window.escHtml((p.bio||'').substring(0,90))+(p.bio&&p.bio.length>90?'…':'')+'</div>'+
        (dt?'<div style="font-size:0.68rem;color:#9ca3af;margin-top:0.2rem;">'+dt+'</div>':'')+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:0.4rem;flex-shrink:0;">'+
        (p.status!=='approved'
          ?'<button onclick="approvePotwNom(\''+window.escAttr(p.id)+'\')" class="btn-success" style="font-size:0.75rem;padding:0.3rem 0.6rem;white-space:nowrap;"><i class="fas fa-star"></i> Feature</button>'
          :'<button disabled style="background:#e8f5e9;color:#065f46;border:none;padding:0.3rem 0.6rem;border-radius:8px;font-size:0.72rem;font-weight:600;white-space:nowrap;"><i class="fas fa-check"></i> Live</button>')+
        '<button onclick="rejectPotwNom(\''+window.escAttr(p.id)+'\')" class="btn-danger" style="font-size:0.75rem;padding:0.3rem 0.6rem;"><i class="fas fa-trash"></i></button>'+
      '</div>'+
    '</div>';
  }).join('');
};

window.addPotwDirect = async function(){
  var name  = document.getElementById('potwAdminName').value.trim();
  var role  = document.getElementById('potwAdminRole').value.trim();
  var bio   = document.getElementById('potwAdminBio').value.trim();
  if(!name||!bio){ window.showStatus('potwAdminStatus','Please fill in Name and Bio.','err'); return; }
  var sb = window.geramaSupabase; if(!sb){ window.showStatus('potwAdminStatus','Not connected.','err'); return; }

  var btn = document.querySelector('[onclick="addPotwDirect()"]');
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Uploading...'; }

  // Upload photo if selected
  var photoUrl = null;
  var photoFile = document.getElementById('potwPhotoFile');
  if(photoFile && photoFile.files && photoFile.files[0]){
    try{
      var f = photoFile.files[0];
      var ext = f.name.split('.').pop();
      var path = 'potw/'+Date.now()+'.'+ext;
      var up = await sb.storage.from(window.BUCKET).upload(path, f, {upsert:true});
      if(!up.error) photoUrl = sb.storage.from(window.BUCKET).getPublicUrl(path).data.publicUrl;
    }catch(e){ console.warn('Photo upload failed:', e); }
  }

  var {error} = await sb.from('potw_nominations').insert({
    name:name, role:role||null, bio:bio, photo_url:photoUrl||null,
    nominated_by:'admin', status:'approved', created_at:new Date().toISOString()
  });
  if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-star"></i> Feature on Home Page'; }
  if(error){ window.showStatus('potwAdminStatus','❌ '+error.message,'err'); return; }
  window.logActivity('Added Personality of the Week: '+name);
  window.showStatus('potwAdminStatus','✅ '+name+' is now featured on the home page!','ok');
  ['potwAdminName','potwAdminRole','potwAdminBio'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  if(photoFile) photoFile.value='';
  var prev = document.getElementById('potwPhotoPreview');
  if(prev){ prev.style.display='none'; prev.src=''; }
  var chosen = document.getElementById('potwPhotoChosen');
  if(chosen) chosen.textContent='';
  window.loadPotwList();
};

window.approvePotwNom = async function(id){
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('potw_nominations').update({status:'approved'}).eq('id',id);
  window.loadPotwList();
};

window.rejectPotwNom = async function(id){
  if(!confirm('Remove this nomination?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('potw_nominations').delete().eq('id',id);
  window.loadPotwList();
};

// ─── SETTINGS / CONNECTION TEST ───────────────────────────
window.testConnection = async function(){
  var sb = window.geramaSupabase;
  if(!sb){ window.showStatus('settingsStatus','❌ Supabase client not loaded.','err'); return; }
  try{
    var {data,error} = await sb.storage.listBuckets();
    if(error) throw new Error(error.message);
    var names = (data||[]).map(function(b){ return b.name; });
    var hasBucket = names.indexOf('gerama-materials') !== -1;
    window.showStatus('settingsStatus',
      '✅ Connected! Buckets: '+names.join(', ')+(hasBucket?' ✓ gerama-materials found':' ⚠️ gerama-materials NOT found'),
      hasBucket?'ok':'err');
  }catch(e){ window.showStatus('settingsStatus','❌ '+e.message,'err'); }
};

// Wire up buttons added in HTML panels
document.addEventListener('DOMContentLoaded', function(){
  var schedBtn = document.getElementById('scheduleClsBtn');
  if(schedBtn) schedBtn.addEventListener('click', window.scheduleClass);
  var postAsgBtn = document.getElementById('postAsgBtn');
  if(postAsgBtn) postAsgBtn.addEventListener('click', window.postAssignment);
});

// ─── QUIZ REQUESTS (user-submitted quizzes awaiting approval) ─
window.loadQuizRequests = async function(){
  var el = document.getElementById('quizRequestsList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
  var {data,error} = await sb.from('quiz_requests').select('*').order('created_at',{ascending:false});
  if(error){
    // Table may not exist yet
    el.innerHTML='<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:1.2rem;font-size:0.88rem;color:#92400e;">'+
      '<strong><i class="fas fa-info-circle"></i> Setup needed:</strong> Create the <code>quiz_requests</code> table in Supabase with columns: '+
      '<code>id, title, course, submitted_by, email, quiz_url, description, status, created_at</code>. '+
      'Status should default to <code>pending</code>.</div>';
    return;
  }
  if(!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:2rem;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No quiz requests yet.</p>'; return;
  }
  el.innerHTML = data.map(function(r){
    var badge = r.status==='approved' ? '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Approved</span>'
              : r.status==='rejected' ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Rejected</span>'
              : '<span style="background:#ede9fe;color:#5b21b6;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Pending</span>';
    var dt = r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
    var linkOrFile = r.file_url
      ? '<a href="'+window.escAttr(r.file_url)+'" target="_blank" style="color:#dc2626;font-size:0.82rem;"><i class="fas fa-file-pdf"></i> View Uploaded PDF</a>'
      : (r.quiz_url ? '<a href="'+window.escAttr(r.quiz_url)+'" target="_blank" style="color:#6366f1;font-size:0.82rem;"><i class="fas fa-external-link-alt"></i> Preview Quiz Link</a>' : '—');
    return '<div class="sub-card">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(r.title||'Untitled Quiz')+' '+badge+'</strong>'+
        '<div class="sub-meta">'+
          '<b>Submitted by:</b> '+window.escHtml(r.submitted_by||'—')+' ('+window.escHtml(r.email||'—')+')<br>'+
          '<b>Course:</b> '+window.escHtml(r.course||'—')+' | <b>Date:</b> '+dt+'<br>'+
          linkOrFile+
          (r.description?'<br><span style="color:#374151;font-size:0.82rem;">'+window.escHtml(r.description)+'</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="sub-actions">'+
        (r.status==='pending'?
          '<button class="btn-success" onclick="approveQuizRequest(\''+r.id+'\',\''+window.escAttr(r.title||'')+'\',\''+window.escAttr(r.course||'')+'\',\''+window.escAttr(r.quiz_url||'')+'\',\''+window.escAttr(r.description||'')+'\',\''+window.escAttr(r.file_url||'')+'\')"><i class="fas fa-check"></i> Approve & Publish</button>'+
          '<button class="btn-danger" onclick="rejectQuizRequest(\''+r.id+'\')"><i class="fas fa-times"></i> Reject</button>'
        :'')+
      '</div>'+
    '</div>';
  }).join('');
};

window.approveQuizRequest = async function(id, title, course, url, desc, fileUrl){
  var sb = window.geramaSupabase; if(!sb) return;
  var deadline = new Date(Date.now() + 7*24*60*60*1000).toISOString();
  var isPdfQuiz = !url && fileUrl;
  var record = {
    title:title, course:course||null,
    quiz_url:  isPdfQuiz ? null : (url ? JSON.stringify([url]) : null),
    pdf_url:   fileUrl || null,
    description: desc||null,
    deadline:deadline, status:'active', created_at:new Date().toISOString()
  };
  var {error} = await sb.from('quizzes').insert(record);
  if(error){ alert('Error publishing: '+error.message); return; }
  await sb.from('quiz_requests').update({status:'approved'}).eq('id',id);
  window.logActivity('Approved & published quiz request: '+title);
  alert('✅ Quiz "'+title+'" is now live on the Classroom page!');
  window.loadQuizRequests();
  loadOverviewStats();
};

window.rejectQuizRequest = async function(id){
  if(!confirm('Reject this quiz request?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('quiz_requests').update({status:'rejected'}).eq('id',id);
  window.loadQuizRequests();
};

// ─── ATTENDANCE SYSTEM ────────────────────────────────────────────
var _attSessionId = null;
var _attTimer = null;

window.generateAttendanceCode = async function(){
  var title    = document.getElementById('attClassTitle').value.trim();
  var duration = parseInt(document.getElementById('attDuration').value)||15;
  if(!title){ window.showStatus('attStatus','Please enter a class title.','err'); return; }

  var sb = window.geramaSupabase; if(!sb){ window.showStatus('attStatus','Not connected.','err'); return; }
  window.showStatus('attStatus','Generating code...','info');

  // Generate random 6-char code
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for(var i=0;i<6;i++) code += chars[Math.floor(Math.random()*chars.length)];

  var expiresAt = new Date(Date.now() + duration*60*1000).toISOString();

  // Close any existing active sessions first (best-effort, don't block on error)
  try { await sb.from('attendance_sessions').update({is_active:false}).eq('is_active',true); } catch(e){}

  // Insert the new session — only include columns that definitely exist
  var insertPayload = {
    code:       code,
    class_title: title,
    expires_at: expiresAt,
    is_active:  true,
    created_at: new Date().toISOString()
  };

  // Try with duration_mins first, fall back without it if column doesn't exist
  var data, error;
  var res1 = await sb.from('attendance_sessions').insert({...insertPayload, duration_mins: duration}).select().single();
  if(res1.error && (res1.error.message.includes('duration_mins') || res1.error.code === '42703')) {
    // Column doesn't exist — insert without it
    var res2 = await sb.from('attendance_sessions').insert(insertPayload).select().single();
    data = res2.data; error = res2.error;
  } else {
    data = res1.data; error = res1.error;
  }

  if(error){
    window.showStatus('attStatus','❌ DB error: '+error.message,'err');
    console.error('Attendance session insert error:', error);
    return;
  }

  _attSessionId = data ? data.id : null;
  window.logActivity('Generated attendance code: '+code+' for "'+title+'"');

  // Show code box
  document.getElementById('attCodeBox').style.display = 'block';
  document.getElementById('attCodeDisplay').textContent = code;
  window.showStatus('attStatus','✅ Code active! Share it with students now.','ok');

  // Countdown timer
  clearInterval(_attTimer);
  var secsLeft = duration * 60;
  function tick(){
    var m = Math.floor(secsLeft/60), s = secsLeft%60;
    var timerEl = document.getElementById('attCodeTimer');
    if(timerEl) timerEl.textContent = 'Expires in: '+m+':'+(s<10?'0':'')+s;
    if(secsLeft <= 0){
      clearInterval(_attTimer);
      if(timerEl) timerEl.textContent = '⏰ Code expired';
      document.getElementById('attCodeDisplay').style.opacity = '0.4';
      window.closeAttSession();
    }
    secsLeft--;
  }
  tick();
  _attTimer = setInterval(tick, 1000);

  // Refresh sessions dropdown
  window.loadAttSessions();
};

window.copyAttCode = function(){
  var code = document.getElementById('attCodeDisplay').textContent;
  if(navigator.clipboard) navigator.clipboard.writeText(code);
  else { var t=document.createElement('textarea'); t.value=code; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
  alert('Code "'+code+'" copied! Share it with your students.');
};

window.closeAttSession = async function(){
  clearInterval(_attTimer);
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('attendance_sessions').update({is_active:false}).eq('is_active',true);
  document.getElementById('attCodeBox').style.display = 'none';
  document.getElementById('attClassTitle').value = '';
  window.showStatus('attStatus','Session closed.','ok');
  window.loadAttRecords();
};

window.loadAttSessions = async function(){
  var sb = window.geramaSupabase; if(!sb) return;
  var {data} = await sb.from('attendance_sessions').select('id,class_title,created_at').order('created_at',{ascending:false}).limit(20);
  var sel = document.getElementById('attSessionFilter'); if(!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">All Sessions</option>';
  (data||[]).forEach(function(s){
    var dt = new Date(s.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    var opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.class_title+' ('+dt+')';
    if(s.id === current) opt.selected = true;
    sel.appendChild(opt);
  });
};

window.loadAttRecords = async function(){
  var el = document.getElementById('attRecordsList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }

  var sessionId = document.getElementById('attSessionFilter').value;
  var query = sb.from('attendance_records').select('*').order('marked_at',{ascending:false});
  if(sessionId) query = query.eq('session_id', sessionId);

  var {data, error} = await query;
  if(error||!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:2rem;"><i class="fas fa-clipboard-check" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No attendance records yet.</p>';
    return;
  }

  // Group by session
  // Group by session — use session_id if available, fall back to class_title
  var bySession = {};
  data.forEach(function(r){
    var key = r.session_id ? r.session_id : (r.class_title||'Unknown Session');
    if(!bySession[key]) bySession[key] = {title: r.class_title||'Unknown Session', session_id: r.session_id||null, records: []};
    bySession[key].records.push(r);
  });

  el.innerHTML = Object.keys(bySession).map(function(key){
    var group = bySession[key];
    var title = group.title;
    var sessionId = group.session_id;
    var records = group.records;
    var rows = records.map(function(r){
      var dt = r.marked_at ? new Date(r.marked_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
      return '<tr>'+
        '<td><strong>'+window.escHtml(r.student_name||'—')+'</strong></td>'+
        '<td style="font-size:0.78rem;color:#6b7280;">'+window.escHtml(r.student_email||'—')+'</td>'+
        '<td style="font-size:0.78rem;color:#6b7280;">'+window.escHtml(r.student_phone||'—')+'</td>'+
        '<td style="font-size:0.8rem;white-space:nowrap;">'+dt+'</td>'+
        '<td style="font-size:0.78rem;color:#6b7280;">'+(r.location_name ? '📍 '+window.escHtml(r.location_name) : (r.latitude ? '📍 '+r.latitude.toFixed(4)+','+r.longitude.toFixed(4) : '—'))+'</td>'+
        '<td><span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">+'+( r.points||1)+' pt</span></td>'+
        '<td><button class="btn-danger" style="font-size:0.72rem;padding:0.25rem 0.5rem;" data-attid="'+r.id+'" data-attname="'+window.escAttr(r.student_name||'')+'" onclick="removeAttRecord(this.getAttribute(\'data-attid\'),this.getAttribute(\'data-attname\'))" title="Remove (requires secret code)"><i class="fas fa-minus-circle"></i></button></td>'+
      '</tr>';
    }).join('');
    return '<div style="margin-bottom:1.5rem;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;flex-wrap:wrap;gap:0.5rem;">'+
        '<div style="display:flex;align-items:center;gap:0.6rem;">'+
          '<strong style="font-size:0.95rem;">'+window.escHtml(title)+'</strong>'+
          '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.78rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">'+records.length+' student'+(records.length!==1?'s':'')+' present</span>'+
        '</div>'+
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">'+
          '<button class="btn-primary" style="font-size:0.75rem;padding:0.3rem 0.8rem;background:#059669;" '+
            'data-session-id="'+(sessionId||'')+'" data-session-title="'+window.escAttr(title)+'" '+
            'onclick="openAddToSession(this.getAttribute(\'data-session-id\'),this.getAttribute(\'data-session-title\'))" '+
            'title="Add a student to this session">'+
            '<i class="fas fa-user-plus"></i> Add to Session'+
          '</button>'+
          '<button class="btn-danger" style="font-size:0.75rem;padding:0.3rem 0.8rem;" '+
            'data-session-id="'+(sessionId||'')+'" data-session-title="'+window.escAttr(title)+'" '+
            'onclick="deleteEntireSession(this.getAttribute(\'data-session-id\'),this.getAttribute(\'data-session-title\'))" '+
            'title="Delete entire session and all its records (requires admin code)">'+
            '<i class="fas fa-trash-alt"></i> Delete Session'+
          '</button>'+
        '</div>'+
      '</div>'+
      '<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Phone</th><th>Time</th><th>Location</th><th>Points</th><th>Remove</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '</div>';
  }).join('');
};

// ─── QUIZ ATTEMPTS VIEWER ────────────────────────────────────────
window.loadQzAttempts = async function(){
  var el = document.getElementById('qzAttemptsList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }

  var {data, error} = await sb.from('quiz_attempts')
    .select('*, quizzes(title)')
    .order('completed_at',{ascending:false})
    .limit(100);

  if(error||!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-users" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No quiz attempts yet.</p>';
    return;
  }

  el.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Quiz</th><th>Completed</th></tr></thead><tbody>'+
    data.map(function(a){
      var quizTitle = (a.quizzes && a.quizzes.title) ? window.escHtml(a.quizzes.title) : '<span style="color:#9ca3af;">—</span>';
      var dt = a.completed_at ? new Date(a.completed_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      return '<tr>'+
        '<td><strong>'+window.escHtml(a.student_name||'—')+'</strong></td>'+
        '<td style="font-size:0.78rem;color:#6b7280;">'+window.escHtml(a.student_email||'—')+'</td>'+
        '<td>'+quizTitle+'</td>'+
        '<td style="font-size:0.8rem;white-space:nowrap;">'+dt+'</td>'+
      '</tr>';
    }).join('')+
  '</tbody></table></div>';
};

// ─── REGISTERED USERS ────────────────────────────────────────────
window.loadUsers = async function(){
  var el = document.getElementById('usersList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }

  var {data, error} = await sb.from('user_profiles')
    .select('*').order('created_at',{ascending:false});

  if(error){
    el.innerHTML='<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:1rem;font-size:0.88rem;color:#92400e;">'+
      '<strong>Setup needed:</strong> Run the <code>user_profiles</code> table SQL in Supabase first.</div>';
    return;
  }
  if(!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:2rem;"><i class="fas fa-users" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No users yet. Students appear here after signing up and updating their profile.</p>';
    return;
  }

  // Also fetch group membership to show group in user list
  var groupMembersMap = {};
  try{
    var {data: gmData} = await sb.from('gerama_group_members').select('user_email, group_id, role, gerama_groups(name)');
    (gmData||[]).forEach(function(gm){
      groupMembersMap[gm.user_email] = { groupName: (gm.gerama_groups && gm.gerama_groups.name) || gm.group_id, role: gm.role };
    });
  }catch(e){}

  // Count stats
  var active = data.filter(function(u){ return u.is_active !== false; }).length;
  var withIndex = data.filter(function(u){ return u.index_number; }).length;
  var withGroup = Object.keys(groupMembersMap).length;

  // Store data for filtering
  window._allUsersData = data;
  window._groupMembersMap = groupMembersMap;

  el.innerHTML =
    '<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center;">'+
      '<div style="background:#e8f5e9;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#1B5E20;">'+data.length+'</strong> <span style="color:#6b7280;">Total</span></div>'+
      '<div style="background:#dbeafe;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#1d4ed8;">'+active+'</strong> <span style="color:#6b7280;">Active</span></div>'+
      '<div style="background:#fef3c7;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#92400e;">'+withIndex+'</strong> <span style="color:#6b7280;">With Index No.</span></div>'+
      '<div style="background:#f5f3ff;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#6366f1;">'+withGroup+'</strong> <span style="color:#6b7280;">In a Group</span></div>'+
      '<div style="margin-left:auto;display:flex;gap:0.5rem;flex-wrap:wrap;">'+
        '<button class="btn-gold" onclick="downloadUsersCSV()" style="padding:0.5rem 1rem;font-size:0.82rem;"><i class="fas fa-download"></i> Download CSV</button>'+
        '<button class="btn-primary" onclick="printUsersTable()" style="padding:0.5rem 1rem;font-size:0.82rem;background:#6366f1;"><i class="fas fa-print"></i> Print</button>'+
      '</div>'+
    '</div>'+
    '<div class="tbl-wrap"><table><thead><tr>'+
      '<th>Name</th><th>Email</th><th>Phone</th><th>Program</th><th>Level</th>'+
      '<th>Index Number <small style="font-weight:400;color:#9ca3af;">(UETG/ENG/26/001)</small></th>'+
      '<th>Group</th>'+
      '<th>Status</th><th>Actions</th>'+
    '</tr></thead><tbody>'+
    data.map(function(u){
      var dt = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
      var isActive = u.is_active !== false;
      var statusBadge = isActive
        ? '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">Active</span>'
        : '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">Inactive</span>';
      var safeEmail = window.escAttr(u.email||'');
      var safeId = (u.id||'').replace(/[^a-z0-9]/gi,'');

      // Group info
      var gmInfo = groupMembersMap[u.email] || {};
      var groupBadge = gmInfo.groupName
        ? '<div style="display:flex;align-items:center;gap:0.3rem;flex-wrap:wrap;">'+
            '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">'+window.escHtml(gmInfo.groupName)+'</span>'+
            (gmInfo.role==='tutor'?'<span style="background:#fef3c7;color:#92400e;font-size:0.68rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:10px;">Tutor</span>':'')+
          '</div>'
        : '<span style="color:#9ca3af;font-size:0.78rem;">Not assigned</span>';

      return '<tr id="urow-'+safeId+'">'+
        '<td><strong>'+window.escHtml(u.full_name||'—')+'</strong><br><small style="color:#9ca3af;">Joined '+dt+'</small></td>'+
        '<td style="font-size:0.8rem;color:#6b7280;">'+window.escHtml(u.email||'—')+'</td>'+
        '<td style="font-size:0.8rem;">'+window.escHtml(u.phone||'—')+'</td>'+
        '<td style="font-size:0.82rem;">'+window.escHtml(u.program||'—')+'</td>'+
        '<td><span style="background:#e8f5e9;color:#1B5E20;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;">'+window.escHtml(u.level||'—')+'</span></td>'+
        '<td>'+
          '<div style="display:flex;gap:0.4rem;align-items:center;">'+
            '<input type="text" id="idx-'+safeId+'" value="'+window.escAttr(u.index_number||'')+'" placeholder="UETG/ENG/26/001" '+
              'style="padding:0.4rem 0.6rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.82rem;font-family:\'Inter\',sans-serif;width:160px;outline:none;" '+
              'onfocus="this.style.borderColor=\'#1B5E20\'" onblur="this.style.borderColor=\'#e5e7eb\'">'+
            '<button class="btn-primary" style="padding:0.4rem 0.7rem;font-size:0.75rem;white-space:nowrap;" onclick="saveIndexNumber(\''+safeEmail+'\',\''+safeId+'\')">'+
              '<i class="fas fa-save"></i> Save'+
            '</button>'+
          '</div>'+
          '<div id="idx-status-'+safeId+'" style="font-size:0.75rem;margin-top:0.2rem;min-height:1rem;"></div>'+
        '</td>'+
        '<td>'+groupBadge+'</td>'+
        '<td>'+
          statusBadge+
          (u.block_reason ? '<br><small style="color:#dc2626;font-size:0.68rem;" title="'+window.escAttr(u.block_reason||'')+'"><i class="fas fa-flag"></i> '+window.escHtml((u.block_reason||'').substring(0,30))+'</small>' : '')+
        '</td>'+
        '<td style="white-space:nowrap;">'+
          (isActive
            ? '<div style="display:flex;flex-direction:column;gap:0.3rem;">'+
                '<button class="btn-danger" style="font-size:0.72rem;padding:0.25rem 0.5rem;" onclick="blockUser(\''+safeEmail+'\',\''+safeId+'\',\''+window.escAttr(u.full_name||u.email||'User')+'\')"><i class="fas fa-ban"></i> Block</button>'+
                '<button class="btn-danger" style="font-size:0.72rem;padding:0.25rem 0.5rem;background:#fef3c7;color:#92400e;" onclick="deactivateUser(\''+safeEmail+'\',\''+safeId+'\')"><i class="fas fa-user-slash"></i> Deactivate</button>'+
              '</div>'
            : '<div style="display:flex;flex-direction:column;gap:0.3rem;">'+
                '<button class="btn-success" style="font-size:0.72rem;padding:0.25rem 0.5rem;" onclick="reactivateUser(\''+safeEmail+'\',\''+safeId+'\')"><i class="fas fa-user-check"></i> Reactivate</button>'+
              '</div>')+
        '</td>'+
      '</tr>';
    }).join('')+
  '</tbody></table></div>';
};

window.saveIndexNumber = async function(email, safeId){
  var inp = document.getElementById('idx-'+safeId);
  var statusEl = document.getElementById('idx-status-'+safeId);
  if(!inp) return;
  var indexNum = inp.value.trim().toUpperCase();
  if(!indexNum){ if(statusEl){ statusEl.textContent='Enter an index number.'; statusEl.style.color='#f59e0b'; } return; }

  // Validate format loosely: must contain at least one slash
  if(indexNum.indexOf('/') === -1){
    if(statusEl){ statusEl.textContent='⚠️ Format: UETG/ENG/26/001'; statusEl.style.color='#f59e0b'; } return;
  }

  var sb = window.geramaSupabase; if(!sb) return;
  if(statusEl){ statusEl.textContent='Checking uniqueness...'; statusEl.style.color='#6b7280'; }

  // ── CHECK UNIQUENESS: no other active user should have this index number ──
  var {data: existing, error: checkErr} = await sb.from('user_profiles')
    .select('email, full_name')
    .eq('index_number', indexNum)
    .neq('email', email)  // exclude current user
    .eq('is_active', true)
    .limit(1);

  if(checkErr){ if(statusEl){ statusEl.textContent='❌ Check failed: '+checkErr.message; statusEl.style.color='#dc2626'; } return; }

  if(existing && existing.length > 0){
    var owner = existing[0].full_name || existing[0].email;
    if(statusEl){
      statusEl.textContent = '❌ "'+indexNum+'" is already assigned to '+owner+'. Each index number must be unique.';
      statusEl.style.color = '#dc2626';
    }
    inp.style.borderColor = '#dc2626';
    setTimeout(function(){ inp.style.borderColor='#e5e7eb'; }, 3000);
    return;
  }

  if(statusEl){ statusEl.textContent='Saving...'; statusEl.style.color='#6b7280'; }

  var {error} = await sb.from('user_profiles')
    .update({index_number: indexNum, updated_at: new Date().toISOString()})
    .eq('email', email);

  if(error){
    if(statusEl){ statusEl.textContent='❌ '+error.message; statusEl.style.color='#dc2626'; }
    return;
  }

  if(statusEl){ statusEl.textContent='✅ Saved! Student will see it on next login.'; statusEl.style.color='#059669'; }
  inp.style.borderColor = '#1B5E20';
  window.logActivity('Assigned index number '+indexNum+' to '+email);

  // ── PUSH TO STUDENT IN REAL-TIME via Supabase realtime (best effort) ──
  // The student's portal will pick it up on next page load / login
  // We also update the input to show it's confirmed
  setTimeout(function(){
    if(statusEl) statusEl.textContent='';
    inp.style.borderColor = '#e5e7eb';
  }, 4000);
};

window.deactivateUser = async function(email, safeId){
  if(!confirm('Deactivate '+email+'? They will be logged out and blocked from the portal.')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  var {error} = await sb.from('user_profiles').update({is_active:false}).eq('email',email);
  if(error){ alert('Error: '+error.message); return; }
  // Sign out the user via Supabase admin (best effort)
  try{ await sb.auth.admin.deleteUser(email); }catch(e){}
  window.logActivity('Deactivated user: '+email);
  window.loadUsers();
};

window.reactivateUser = async function(email, safeId){
  var sb = window.geramaSupabase; if(!sb) return;
  var {error} = await sb.from('user_profiles').update({is_active:true, block_reason: null}).eq('email',email);
  if(error){ alert('Error: '+error.message); return; }
  window.logActivity('Reactivated user: '+email);
  window.loadUsers();
};

// ─── BLOCK USER (with reason — fraud/fake ID/suspicious activity) ─────────────
window.blockUser = async function(email, safeId, displayName){
  var reason = window.prompt(
    'Block "'+displayName+'" ('+email+')?\n\n'+
    'Enter reason for blocking (will be logged):\n'+
    'e.g. "Fake ID", "Fraudulent activity", "Suspicious posts", "Multiple accounts"\n\n'+
    'Leave empty to cancel.',
    ''
  );
  if(reason === null || reason.trim() === '') return; // cancelled
  var sb = window.geramaSupabase; if(!sb) return;

  var {error} = await sb.from('user_profiles').update({
    is_active: false,
    block_reason: reason.trim(),
    blocked_at: new Date().toISOString(),
    blocked_by: (window._activeAdminSession && window._activeAdminSession.name) || 'Admin'
  }).eq('email', email);

  if(error){ alert('Error blocking user: '+error.message); return; }

  // Notify the user if possible
  try{
    await sb.from('user_notifications').insert({
      user_email: email,
      type: 'account_blocked',
      message: '🚫 Your account has been suspended. Reason: '+reason+'. Contact GERAMA admin to appeal.',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }catch(e){}

  window.logActivity('🚫 BLOCKED user: '+email+' | Reason: '+reason);
  alert('✅ User "'+displayName+'" has been blocked.\nReason: '+reason);
  window.loadUsers();
};

// ─── DOWNLOAD USERS TABLE ────────────────────────────────────────
window.downloadUsersCSV = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var {data} = await sb.from('user_profiles').select('*').order('created_at',{ascending:false});
  if(!data||!data.length){ alert('No users to download.'); return; }

  // Fetch group memberships
  var groupMap = {};
  try{
    var {data: gmData} = await sb.from('gerama_group_members').select('user_email, role, gerama_groups(name)');
    (gmData||[]).forEach(function(gm){
      groupMap[gm.user_email] = { name: (gm.gerama_groups && gm.gerama_groups.name)||'', role: gm.role||'member' };
    });
  }catch(e){}

  var headers = ['Full Name','Email','Phone','Program','Level','Index Number','Group','Group Role','Status','Joined'];
  var rows = data.map(function(u){
    var dt = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '';
    var status = u.is_active === false ? 'Inactive' : 'Active';
    var gm = groupMap[u.email] || {};
    return [
      u.full_name||'', u.email||'', u.phone||'', u.program||'', u.level||'',
      u.index_number||'', gm.name||'', gm.role||'', status, dt
    ].map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'GERAMA_Members_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded members list as CSV');
};

window.printUsersTable = function(){
  var el = document.getElementById('usersList');
  if(!el){ alert('Load the users table first.'); return; }
  var win = window.open('','_blank');
  win.document.write('<html><head><title>GERAMA Members</title>'+
    '<style>body{font-family:Inter,sans-serif;padding:2rem;}table{width:100%;border-collapse:collapse;font-size:0.85rem;}'+
    'th{background:#1B5E20;color:white;padding:0.6rem 0.8rem;text-align:left;}'+
    'td{padding:0.5rem 0.8rem;border-bottom:1px solid #e5e7eb;}'+
    'tr:nth-child(even){background:#f8fafc;}'+
    'h2{color:#1B5E20;margin-bottom:1rem;}'+
    '.no-print{display:none;}'+
    '@media print{.no-print{display:none;}}'+
    '</style></head><body>'+
    '<h2>GERAMA Registered Members — '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+'</h2>'+
    '<table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Program</th><th>Level</th><th>Index No.</th><th>Status</th></tr></thead><tbody>'+
    Array.from(el.querySelectorAll('tbody tr')).map(function(row, i){
      var cells = row.querySelectorAll('td');
      if(cells.length < 6) return '';
      return '<tr>'+
        '<td>'+(i+1)+'</td>'+
        '<td>'+cells[0].querySelector('strong').textContent+'</td>'+
        '<td>'+cells[1].textContent+'</td>'+
        '<td>'+cells[2].textContent+'</td>'+
        '<td>'+cells[3].textContent+'</td>'+
        '<td>'+cells[4].textContent+'</td>'+
        '<td><strong>'+(cells[5].querySelector('input')?cells[5].querySelector('input').value:'—')+'</strong></td>'+
        '<td>'+cells[6].textContent.trim()+'</td>'+
      '</tr>';
    }).join('')+
    '</tbody></table>'+
    '<p style="margin-top:2rem;font-size:0.8rem;color:#9ca3af;">Generated by GERAMA Admin Dashboard</p>'+
    '</body></html>');
  win.document.close();
  win.focus();
  setTimeout(function(){ win.print(); }, 500);
};

// ─── USERS SEARCH & FILTER ───────────────────────────────────────
var _allUsersData = [];

// Note: loadUsers is defined above and now stores window._allUsersData and window._groupMembersMap

window.filterUsers = function(){
  var q = (document.getElementById('userSearch')||{}).value||'';
  var prog = (document.getElementById('userFilterProgram')||{}).value||'';
  var level = (document.getElementById('userFilterLevel')||{}).value||'';
  q = q.toLowerCase();
  var allData = window._allUsersData || _allUsersData || [];
  var gMap = window._groupMembersMap || {};
  var filtered = allData.filter(function(u){
    var gm = gMap[u.email] || {};
    var matchQ = !q || (u.full_name||'').toLowerCase().includes(q) ||
                       (u.email||'').toLowerCase().includes(q) ||
                       (u.index_number||'').toLowerCase().includes(q) ||
                       (u.phone||'').includes(q) ||
                       (gm.groupName||'').toLowerCase().includes(q);
    var matchP = !prog || u.program === prog;
    var matchL = !level || u.level === level;
    return matchQ && matchP && matchL;
  });
  renderUsersTable(filtered);
};

function renderUsersTable(data){
  var el = document.getElementById('usersList'); if(!el) return;
  if(!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:2rem;"><i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>No users match your search.</p>';
    return;
  }
  var active = data.filter(function(u){ return u.is_active !== false; }).length;
  var withIndex = data.filter(function(u){ return u.index_number; }).length;
  var gMap = window._groupMembersMap || {};

  el.innerHTML =
    '<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center;">'+
      '<div style="background:#e8f5e9;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#1B5E20;">'+data.length+'</strong> <span style="color:#6b7280;">Shown</span></div>'+
      '<div style="background:#dbeafe;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#1d4ed8;">'+active+'</strong> <span style="color:#6b7280;">Active</span></div>'+
      '<div style="background:#fef3c7;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#92400e;">'+withIndex+'</strong> <span style="color:#6b7280;">With Index No.</span></div>'+
      '<div style="margin-left:auto;display:flex;gap:0.5rem;flex-wrap:wrap;">'+
        '<button class="btn-gold" onclick="downloadUsersCSV()" style="padding:0.5rem 1rem;font-size:0.82rem;"><i class="fas fa-download"></i> Download CSV</button>'+
        '<button class="btn-primary" onclick="printUsersTable()" style="padding:0.5rem 1rem;font-size:0.82rem;background:#6366f1;"><i class="fas fa-print"></i> Print</button>'+
      '</div>'+
    '</div>'+
    '<div class="tbl-wrap"><table><thead><tr>'+
      '<th>Name</th><th>Email</th><th>Phone</th><th>Program</th><th>Level</th>'+
      '<th>Index Number</th><th>Group</th><th>Status</th><th>Actions</th>'+
    '</tr></thead><tbody>'+
    data.map(function(u){
      var dt = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
      var isActive = u.is_active !== false;
      var statusBadge = isActive
        ? '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">Active</span>'
        : '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">Inactive</span>';
      var safeEmail = window.escAttr(u.email||'');
      var safeId = (u.id||'').replace(/[^a-z0-9]/gi,'');
      var gmInfo = gMap[u.email] || {};
      var groupBadge = gmInfo.groupName
        ? '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;white-space:nowrap;">'+window.escHtml(gmInfo.groupName)+'</span>'+
          (gmInfo.role==='tutor'?' <span style="background:#fef3c7;color:#92400e;font-size:0.68rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:10px;">Tutor</span>':'')
        : '<span style="color:#9ca3af;font-size:0.78rem;">—</span>';
      return '<tr id="urow-'+safeId+'">'+
        '<td><strong>'+window.escHtml(u.full_name||'—')+'</strong><br><small style="color:#9ca3af;">Joined '+dt+'</small></td>'+
        '<td style="font-size:0.8rem;color:#6b7280;">'+window.escHtml(u.email||'—')+'</td>'+
        '<td style="font-size:0.8rem;">'+window.escHtml(u.phone||'—')+'</td>'+
        '<td style="font-size:0.82rem;">'+window.escHtml(u.program||'—')+'</td>'+
        '<td><span style="background:#e8f5e9;color:#1B5E20;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;">'+window.escHtml(u.level||'—')+'</span></td>'+
        '<td>'+
          '<div style="display:flex;gap:0.4rem;align-items:center;">'+
            '<input type="text" id="idx-'+safeId+'" value="'+window.escAttr(u.index_number||'')+'" placeholder="UETG/ENG/26/001" '+
              'style="padding:0.4rem 0.6rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.82rem;font-family:\'Inter\',sans-serif;width:160px;outline:none;" '+
              'onfocus="this.style.borderColor=\'#1B5E20\'" onblur="this.style.borderColor=\'#e5e7eb\'">'+
            '<button class="btn-primary" style="padding:0.4rem 0.7rem;font-size:0.75rem;white-space:nowrap;" onclick="saveIndexNumber(\''+safeEmail+'\',\''+safeId+'\')">'+
              '<i class="fas fa-save"></i> Save'+
            '</button>'+
          '</div>'+
          '<div id="idx-status-'+safeId+'" style="font-size:0.75rem;margin-top:0.2rem;min-height:1rem;"></div>'+
        '</td>'+
        '<td>'+groupBadge+'</td>'+
        '<td>'+statusBadge+'</td>'+
        '<td>'+
          (isActive
            ? '<button class="btn-danger" style="font-size:0.75rem;padding:0.3rem 0.6rem;white-space:nowrap;" onclick="deactivateUser(\''+safeEmail+'\',\''+safeId+'\')"><i class="fas fa-user-slash"></i> Deactivate</button>'
            : '<button class="btn-success" style="font-size:0.75rem;padding:0.3rem 0.6rem;white-space:nowrap;" onclick="reactivateUser(\''+safeEmail+'\',\''+safeId+'\')"><i class="fas fa-user-check"></i> Reactivate</button>')+
        '</td>'+
      '</tr>';
    }).join('')+
  '</tbody></table></div>';
}

// ─── MANUAL ATTENDANCE ENTRY ─────────────────────────────────────
var _ATTENDANCE_SECRET = '2026GERAMA';

window.showAddAttendanceRow = function(){
  var row = document.getElementById('addAttRow');
  if(!row) return;
  // Reset session link when opened from the top "Add Record" button
  var sessionIdEl = document.getElementById('addAttSessionId');
  var sessionTag  = document.getElementById('addAttSessionTag');
  var classEl     = document.getElementById('addAttClass');
  if(sessionIdEl) sessionIdEl.value = '';
  if(sessionTag)  sessionTag.style.display = 'none';
  if(classEl)     classEl.removeAttribute('readonly');
  row.style.display = row.style.display === 'none' ? 'block' : 'none';
  if(row.style.display === 'block') row.scrollIntoView({behavior:'smooth', block:'nearest'});
};

window.openAddToSession = function(sessionId, sessionTitle) {
  var row = document.getElementById('addAttRow');
  if(!row) return;
  // Pre-fill the session context
  var sessionIdEl = document.getElementById('addAttSessionId');
  var sessionTag  = document.getElementById('addAttSessionTag');
  var classEl     = document.getElementById('addAttClass');
  if(sessionIdEl) sessionIdEl.value = sessionId || '';
  if(classEl){ classEl.value = sessionTitle || ''; classEl.setAttribute('readonly','readonly'); }
  if(sessionTag){ sessionTag.textContent = '📋 Session: ' + sessionTitle; sessionTag.style.display = 'inline-block'; }
  // Clear other fields
  ['addAttName','addAttEmail','addAttSearch','addAttSecret'].forEach(function(id){
    var e = document.getElementById(id); if(e) e.value = '';
  });
  document.getElementById('addAttPoints').value = '1';
  var statusEl = document.getElementById('addAttStatus');
  if(statusEl){ statusEl.textContent = ''; statusEl.style.display = 'none'; }
  var sugEl = document.getElementById('addAttSuggestions');
  if(sugEl) sugEl.style.display = 'none';
  row.style.display = 'block';
  row.scrollIntoView({behavior:'smooth', block:'nearest'});
};

window.closeAddAttRow = function() {
  var row = document.getElementById('addAttRow');
  if(row) row.style.display = 'none';
  var sessionIdEl = document.getElementById('addAttSessionId');
  var sessionTag  = document.getElementById('addAttSessionTag');
  var classEl     = document.getElementById('addAttClass');
  if(sessionIdEl) sessionIdEl.value = '';
  if(sessionTag)  sessionTag.style.display = 'none';
  if(classEl)     classEl.removeAttribute('readonly');
};

window.searchAttUser = async function(q){
  var sugEl = document.getElementById('addAttSuggestions');
  if(!sugEl) return;
  if(!q || q.length < 2){ sugEl.style.display='none'; return; }

  var sb = window.geramaSupabase; if(!sb) return;
  var {data} = await sb.from('user_profiles')
    .select('full_name,email,phone,index_number,program,level')
    .or('full_name.ilike.%'+q+'%,index_number.ilike.%'+q+'%,email.ilike.%'+q+'%')
    .eq('is_active', true)
    .limit(8);

  if(!data||!data.length){ sugEl.style.display='none'; return; }

  sugEl.style.display = 'block';
  sugEl.innerHTML = data.map(function(u){
    return '<div onclick="fillAttUser(\''+window.escAttr(u.full_name||'')+'\',\''+window.escAttr(u.email||'')+'\',\''+window.escAttr(u.index_number||'')+'\')" '+
      'style="padding:0.7rem 1rem;cursor:pointer;border-bottom:1px solid #f1f5f9;font-size:0.88rem;" '+
      'onmouseover="this.style.background=\'#f0fdf4\'" onmouseout="this.style.background=\'white\'">'+
      '<strong>'+window.escHtml(u.full_name||'—')+'</strong>'+
      (u.index_number?'<span style="background:#e8f5e9;color:#1B5E20;font-size:0.72rem;font-weight:700;padding:0.1rem 0.5rem;border-radius:10px;margin-left:0.5rem;">'+window.escHtml(u.index_number)+'</span>':'')+
      '<br><small style="color:#9ca3af;">'+window.escHtml(u.email||'')+(u.program?' · '+u.program:'')+' '+window.escHtml(u.level||'')+'</small>'+
    '</div>';
  }).join('');
};

window.fillAttUser = function(name, email, indexNum){
  var nameEl = document.getElementById('addAttName');
  var emailEl = document.getElementById('addAttEmail');
  var searchEl = document.getElementById('addAttSearch');
  var sugEl = document.getElementById('addAttSuggestions');
  if(nameEl) nameEl.value = name;
  if(emailEl) emailEl.value = email;
  if(searchEl) searchEl.value = name+(indexNum?' ('+indexNum+')':'');
  if(sugEl) sugEl.style.display = 'none';
};

window.submitManualAttendance = async function(){
  var name      = (document.getElementById('addAttName')||{}).value||'';
  var email     = (document.getElementById('addAttEmail')||{}).value||'';
  var cls       = (document.getElementById('addAttClass')||{}).value||'';
  var pts       = parseInt((document.getElementById('addAttPoints')||{}).value)||1;
  var secret    = (document.getElementById('addAttSecret')||{}).value||'';
  var sessionId = (document.getElementById('addAttSessionId')||{}).value||'';
  var statusEl  = document.getElementById('addAttStatus');

  function setS(msg, type){ if(statusEl){ statusEl.textContent=msg; statusEl.className='status-msg status-'+type; statusEl.style.display='block'; } }

  if(!name.trim() || !email.trim() || !cls.trim()){ setS('Please fill in Name, Email and Class Title.','err'); return; }
  if(secret !== _ATTENDANCE_SECRET){ setS('❌ Wrong secret code (2026GERAMA). Access denied.','err'); return; }

  var sb = window.geramaSupabase; if(!sb){ setS('Not connected.','err'); return; }
  setS('Adding...','info');

  var record = {
    class_title:   cls.trim(),
    student_name:  name.trim(),
    student_email: email.trim().toLowerCase(),
    points:        pts,
    marked_at:     new Date().toISOString()
  };

  // If added to a specific session, link it
  if(sessionId) record.session_id = sessionId;

  var {error} = await sb.from('attendance_records').insert(record);
  if(error){ setS('❌ '+error.message,'err'); return; }

  var sessionLabel = sessionId ? ' to session "'+cls.trim()+'"' : ' for "'+cls.trim()+'"';
  window.logActivity('Manually added attendance: '+name.trim()+sessionLabel);
  setS('✅ '+name.trim()+' added to attendance'+sessionLabel+'!','ok');

  // Clear form
  ['addAttName','addAttEmail','addAttSecret','addAttSearch'].forEach(function(id){
    var e=document.getElementById(id); if(e) e.value='';
  });
  document.getElementById('addAttPoints').value='1';
  var sugEl = document.getElementById('addAttSuggestions');
  if(sugEl) sugEl.style.display = 'none';

  setTimeout(function(){
    window.closeAddAttRow();
    window.loadAttRecords();
    window.loadAttSessions();
  }, 1500);
};

// Remove attendance record (with secret code)
window.removeAttRecord = async function(id, name){
  var secret = prompt('Enter admin secret code to remove this attendance record for '+name+':');
  if(!secret) return;
  if(secret !== _ATTENDANCE_SECRET){ alert('❌ Wrong secret code. Access denied.'); return; }
  var sb = window.geramaSupabase; if(!sb) return;
  var {error} = await sb.from('attendance_records').delete().eq('id', id);
  if(error){ alert('Error: '+error.message); return; }
  window.logActivity('Removed attendance record for '+name);
  window.loadAttRecords();
};

// Delete an entire attendance session and ALL its records (with secret code)
window.deleteEntireSession = async function(sessionId, sessionTitle){
  var secret = prompt('⚠️ This will delete ALL attendance records for "'+sessionTitle+'".\n\nEnter admin code to confirm:');
  if(!secret) return;
  if(secret !== _ATTENDANCE_SECRET){ alert('❌ Wrong code. Access denied.'); return; }

  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }

  try {
    // Delete all attendance records for this session
    if(sessionId) {
      var {error: recErr} = await sb.from('attendance_records').delete().eq('session_id', sessionId);
      if(recErr) throw new Error('Records: '+recErr.message);
      // Also delete the session itself
      var {error: sesErr} = await sb.from('attendance_sessions').delete().eq('id', sessionId);
      if(sesErr) throw new Error('Session: '+sesErr.message);
    } else {
      // No session_id — delete by class title
      var {error: recErr2} = await sb.from('attendance_records').delete().eq('class_title', sessionTitle);
      if(recErr2) throw new Error('Records: '+recErr2.message);
    }
    window.logActivity('Deleted entire attendance session: "'+sessionTitle+'"');
    alert('✅ Session "'+sessionTitle+'" and all its records have been deleted.');
    window.loadAttRecords();
    window.loadAttSessions();
  } catch(e) {
    alert('❌ Error: '+e.message);
  }
};

// ─── DOWNLOAD ATTENDANCE CSV ─────────────────────────────────────
window.downloadAttCSV = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var sessionId = (document.getElementById('attSessionFilter')||{}).value||'';
  var query = sb.from('attendance_records').select('*').order('marked_at',{ascending:false});
  if(sessionId) query = query.eq('session_id', sessionId);
  var {data} = await query;
  if(!data||!data.length){ alert('No records to download.'); return; }

  var headers = ['Student Name','Email','Phone','Class','Date/Time','Points','Location'];
  var rows = data.map(function(r){
    var dt = r.marked_at ? new Date(r.marked_at).toLocaleString('en-GB') : '';
    var loc = r.location_name || (r.latitude ? r.latitude+','+r.longitude : '');
    return [r.student_name||'',r.student_email||'',r.student_phone||'',r.class_title||'',dt,r.points||1,loc]
      .map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_Attendance_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded attendance records as CSV');
};

// ─── CONTACT MESSAGES ────────────────────────────────────────
window.loadContactMessages = async function(filter){
  var el = document.getElementById('contactMessagesList');
  if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }

  el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

  // Store current filter for refresh
  window._msgFilter = filter || 'all';

  try {
    var query = sb.from('contact_messages').select('*').order('sent_at',{ascending:false}).limit(100);
    if(filter && filter !== 'all') query = query.eq('type', filter);
    var {data, error} = await query;

    if(error) throw new Error(error.message);
    if(!data||!data.length){
      el.innerHTML='<div style="text-align:center;padding:2rem;color:#9ca3af;"><i class="fas fa-inbox" style="font-size:2.5rem;display:block;margin-bottom:0.8rem;opacity:0.3;"></i><p>No messages yet.</p></div>';
      return;
    }

    var badge = document.getElementById('msgBadge');
    if(badge){ badge.textContent=data.length; badge.style.display='inline'; }

    // Build HTML using data-* attributes to avoid inline-quote issues
    var html = data.map(function(m){
      var safeId = String(m.id).replace(/[^a-z0-9]/gi,'');
      var dt = m.sent_at ? new Date(m.sent_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
      var typeBadge = m.type==='assistance'
        ? '<span style="background:#dbeafe;color:#1d4ed8;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;">Assistance</span>'
        : '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;">Contact</span>';

      return '<div class="sub-card" style="margin-bottom:0.8rem;flex-direction:column;" data-msg-id="'+safeId+'">'+
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.8rem;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:0;">'+
            '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;flex-wrap:wrap;">'+
              '<strong>'+window.escHtml(m.name||'—')+'</strong>'+typeBadge+
              '<span style="font-size:0.75rem;color:#9ca3af;margin-left:auto;white-space:nowrap;">'+dt+'</span>'+
            '</div>'+
            '<div style="font-size:0.82rem;color:#6b7280;margin-bottom:0.4rem;"><i class="fas fa-envelope" style="margin-right:0.3rem;"></i>'+window.escHtml(m.email||'—')+'</div>'+
            (m.subject ? '<div style="font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.3rem;">'+window.escHtml(m.subject)+'</div>' : '')+
            '<div style="font-size:0.88rem;color:#374151;background:#f8fafc;border-radius:10px;padding:0.7rem 0.9rem;border-left:4px solid #1B5E20;white-space:pre-wrap;line-height:1.6;margin-bottom:0.6rem;">'+window.escHtml(m.message||'')+'</div>'+
            (m.admin_reply ? '<div style="font-size:0.85rem;color:#065f46;background:#d1fae5;border-radius:10px;padding:0.6rem 0.9rem;border-left:4px solid #059669;margin-bottom:0.5rem;"><strong>✅ Admin replied:</strong><br>'+window.escHtml(m.admin_reply)+'</div>' : '')+
          '</div>'+
          '<div style="display:flex;flex-direction:column;gap:0.4rem;flex-shrink:0;">'+
            '<button class="btn-primary" data-action="toggle-reply" style="font-size:0.78rem;padding:0.35rem 0.9rem;"><i class="fas fa-reply"></i> Reply</button>'+
            '<a href="mailto:'+window.escAttr(m.email||'')+'" class="btn-gold" style="font-size:0.78rem;padding:0.35rem 0.9rem;text-decoration:none;text-align:center;" title="Open email app"><i class="fas fa-external-link-alt"></i> Email</a>'+
            '<button class="btn-danger" data-action="delete-msg" style="font-size:0.72rem;padding:0.25rem 0.6rem;"><i class="fas fa-trash"></i> Delete</button>'+
          '</div>'+
        '</div>'+
        '<div class="reply-box" style="display:none;margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid #e8f0e8;" data-full-id="'+window.escAttr(String(m.id))+'" data-email="'+window.escAttr(m.email||'')+'" data-name="'+window.escAttr(m.name||'')+'">'+
          '<div style="font-size:0.82rem;font-weight:700;color:#374151;margin-bottom:0.5rem;"><i class="fas fa-reply" style="color:#1B5E20;margin-right:0.4rem;"></i>Reply to '+window.escHtml(m.name||'user')+'</div>'+
          '<textarea class="reply-textarea" rows="3" placeholder="Type your reply here..." style="width:100%;padding:0.7rem 0.9rem;border:2px solid #c8e6c9;border-radius:10px;font-size:0.88rem;font-family:\'Inter\',sans-serif;outline:none;resize:vertical;box-sizing:border-box;"></textarea>'+
          '<div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">'+
            '<button class="btn-primary" data-action="send-reply" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);font-size:0.85rem;padding:0.4rem 1.2rem;"><i class="fas fa-paper-plane"></i> Send Reply</button>'+
            '<button data-action="cancel-reply" style="background:#f1f5f9;color:#374151;border:1px solid #e5e7eb;padding:0.4rem 0.9rem;border-radius:20px;font-size:0.82rem;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>'+
          '</div>'+
          '<div class="reply-status" style="font-size:0.82rem;margin-top:0.4rem;min-height:1.2rem;"></div>'+
        '</div>'+
      '</div>';
    }).join('');

    el.innerHTML = html;

    // ── Attach event delegation (one handler for the whole list) ──
    el.onclick = function(e) {
      var btn = e.target.closest('[data-action]');
      if(!btn) return;
      var action = btn.getAttribute('data-action');
      var card = btn.closest('[data-msg-id]');
      if(!card) return;

      if(action === 'toggle-reply') {
        var box = card.querySelector('.reply-box');
        if(box) {
          var isHidden = box.style.display === 'none' || box.style.display === '';
          box.style.display = isHidden ? 'block' : 'none';
          if(isHidden) {
            var ta = box.querySelector('.reply-textarea');
            if(ta) setTimeout(function(){ ta.focus(); }, 50);
          }
        }
      }

      if(action === 'cancel-reply') {
        var box2 = card.querySelector('.reply-box');
        if(box2) box2.style.display = 'none';
      }

      if(action === 'send-reply') {
        var box3 = card.querySelector('.reply-box');
        if(!box3) return;
        var fullId = box3.getAttribute('data-full-id');
        var toEmail = box3.getAttribute('data-email');
        var toName = box3.getAttribute('data-name');
        var ta = box3.querySelector('.reply-textarea');
        var statusEl = box3.querySelector('.reply-status');
        var replyText = (ta && ta.value || '').trim();
        if(!replyText) { if(statusEl){ statusEl.textContent='Please type a reply.'; statusEl.style.color='#f59e0b'; } return; }
        _doSendReply(fullId, toEmail, toName, replyText, btn, statusEl);
      }

      if(action === 'delete-msg') {
        var fullIdDel = card.querySelector('.reply-box') && card.querySelector('.reply-box').getAttribute('data-full-id');
        if(!fullIdDel) return;
        window.deleteContactMsg(fullIdDel);
      }
    };

  } catch(e) {
    el.innerHTML='<p style="color:#dc2626;padding:1rem;">Error: '+window.escHtml(e.message)+'</p>';
  }
};

async function _doSendReply(msgId, toEmail, toName, replyText, btn, statusEl) {
  var sb = window.geramaSupabase; if(!sb) return;
  if(btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sending...'; }
  if(statusEl) { statusEl.textContent='Sending...'; statusEl.style.color='#6b7280'; }

  try {
    var {error} = await sb.from('contact_messages')
      .update({ admin_reply: replyText, replied_at: new Date().toISOString() })
      .eq('id', msgId);

    if(error) throw new Error(error.message);

    window.logActivity('Replied to message from '+(toName||toEmail));
    if(statusEl){ statusEl.textContent='✅ Reply saved! Student will see it in their Contact page.'; statusEl.style.color='#059669'; }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Send Reply'; }
    setTimeout(function(){ window.loadContactMessages(window._msgFilter||'all'); }, 1800);
  } catch(err) {
    if(statusEl){ statusEl.textContent='❌ '+err.message; statusEl.style.color='#dc2626'; }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Send Reply'; }
  }
}

window.sendContactReply = async function(msgId, toEmail, toName, safeId){
  // Legacy — kept for backward compat
  var replyText = (document.getElementById('reply-text-'+safeId)||{value:''}).value.trim();
  var statusEl = document.getElementById('reply-status-'+safeId);
  if(!replyText){ if(statusEl){statusEl.textContent='Please type a reply.';statusEl.style.color='#f59e0b';} return; }
  await _doSendReply(msgId, toEmail, toName, replyText, null, statusEl);
};

window.deleteContactMsg = async function(id){
  if(!confirm('Delete this message?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('contact_messages').delete().eq('id',id);
  window.loadContactMessages(window._msgFilter||'all');
};

// ─── QUIZ TYPE TOGGLE ────────────────────────────────────────────
window.setQzType = function(type, btn) {
  document.querySelectorAll('[id^="qzType"]').forEach(function(b) {
    b.style.background='white'; b.style.color='#374151'; b.style.borderColor='#e5e7eb';
  });
  btn.style.background='#1B5E20'; btn.style.color='white'; btn.style.borderColor='#1B5E20';
  var linkSec  = document.getElementById('qzLinkSection');
  var paperSec = document.getElementById('qzPaperSection');
  var pdfSec   = document.getElementById('qzPdfSection');
  if(linkSec)  linkSec.style.display  = type==='link'  ? 'block' : 'none';
  if(paperSec) paperSec.style.display = type==='paper' ? 'block' : 'none';
  if(pdfSec)   pdfSec.style.display   = type==='pdf'   ? 'block' : 'none';
  window._qzCurrentType = type;
};

var _qzPdfFile = null;
window.previewQzPdf = function(inp) {
  var f = inp.files && inp.files[0]; if(!f) return;
  _qzPdfFile = f;
  var chosen = document.getElementById('qzPdfChosen');
  if(chosen) chosen.textContent = '✅ ' + f.name + (f.size > 20*1024*1024 ? ' — ⚠️ too large (max 20MB)' : '');
};

window.addQuestion = function() {
  var container = document.getElementById('qzQuestionsContainer');
  var blocks = container.querySelectorAll('.qz-question-block');
  var n = blocks.length + 1;
  var div = document.createElement('div');
  div.className = 'qz-question-block';
  div.setAttribute('data-q', n);
  div.style.cssText = 'background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:0.8rem;';
  div.innerHTML = '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem;">' +
    '<span style="background:#1B5E20;color:white;font-weight:800;font-size:0.82rem;padding:0.2rem 0.6rem;border-radius:20px;">Q'+n+'</span>' +
    '<span style="font-size:0.82rem;color:#6b7280;">Question '+n+'</span>' +
    '<button onclick="removeQuestion(this)" style="margin-left:auto;background:#fee2e2;color:#dc2626;border:none;padding:0.2rem 0.5rem;border-radius:8px;cursor:pointer;font-size:0.75rem;font-family:\'Inter\',sans-serif;">Remove</button>' +
    '</div>' +
    '<textarea class="qz-q-text" placeholder="Type your question here..." rows="2" style="width:100%;border:2px solid #e5e7eb;border-radius:8px;padding:0.6rem;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;resize:vertical;" onfocus="this.style.borderColor=\'#1B5E20\'" onblur="this.style.borderColor=\'#e5e7eb\'"></textarea>' +
    '<div style="display:flex;gap:0.5rem;margin-top:0.5rem;align-items:center;flex-wrap:wrap;">' +
      '<select class="qz-q-type" style="padding:0.3rem 0.6rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.8rem;font-family:\'Inter\',sans-serif;outline:none;" onchange="toggleMCOptions(this)">' +
        '<option value="text">Long Answer</option><option value="short">Short Answer</option><option value="mc">Multiple Choice</option>' +
      '</select>' +
      '<input type="number" class="qz-q-marks" placeholder="Marks" min="1" value="2" style="width:80px;padding:0.3rem 0.6rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.8rem;font-family:\'Inter\',sans-serif;outline:none;">' +
      '<span style="font-size:0.75rem;color:#9ca3af;">marks</span>' +
    '</div>' +
    '<div class="mc-options" style="display:none;margin-top:0.5rem;">' +
      '<input type="text" placeholder="Option A" style="width:100%;margin-bottom:0.3rem;padding:0.4rem 0.7rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;font-family:\'Inter\',sans-serif;outline:none;">' +
      '<input type="text" placeholder="Option B" style="width:100%;margin-bottom:0.3rem;padding:0.4rem 0.7rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;font-family:\'Inter\',sans-serif;outline:none;">' +
      '<input type="text" placeholder="Option C" style="width:100%;margin-bottom:0.3rem;padding:0.4rem 0.7rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;font-family:\'Inter\',sans-serif;outline:none;">' +
      '<input type="text" placeholder="Option D" style="width:100%;padding:0.4rem 0.7rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;font-family:\'Inter\',sans-serif;outline:none;">' +
    '</div>';
  container.appendChild(div);
};

window.removeQuestion = function(btn) {
  var block = btn.closest('.qz-question-block');
  if(block) block.remove();
  // Renumber
  var blocks = document.querySelectorAll('.qz-question-block');
  blocks.forEach(function(b,i){
    var badge = b.querySelector('span[style*="background:#1B5E20"]');
    var lbl = b.querySelectorAll('span')[1];
    if(badge) badge.textContent='Q'+(i+1);
    if(lbl) lbl.textContent='Question '+(i+1);
    b.setAttribute('data-q',i+1);
  });
};

window.toggleMCOptions = function(sel) {
  var mcDiv = sel.closest('.qz-question-block').querySelector('.mc-options');
  if(mcDiv) mcDiv.style.display = sel.value==='mc' ? 'block' : 'none';
};

// ─── ADMIN PROFILES ──────────────────────────────────────────────
// Add adminprofiles to switchPanel
(function(){
  var _orig = window.switchPanel;
  window.switchPanel = function(name){
    if(typeof _orig === 'function') _orig(name);
    if(name==='adminprofiles') setTimeout(loadAdminProfiles, 150);
    if(name==='quizzes') setTimeout(function(){
      // Pre-fill import quiz select
      loadImportQzSelect();
    }, 300);
  };
})();

function loadImportQzSelect() {
  var sel = document.getElementById('importQzSelect'); if(!sel) return;
  var sb = window.geramaSupabase; if(!sb) return;
  sb.from('quizzes').select('id,title').order('created_at',{ascending:false}).limit(50).then(function(res){
    if(!res.data||!res.data.length){ sel.innerHTML='<option value="">No quizzes found</option>'; return; }
    sel.innerHTML='<option value="">Select quiz...</option>'+res.data.map(function(q){ return '<option value="'+q.id+'">'+q.title+'</option>'; }).join('');
  });
}

window.previewAdminPhoto = function(input) {
  var file = input.files && input.files[0]; if(!file) return;
  document.getElementById('apPhotoChosen').textContent = '✅ '+file.name;
  var reader = new FileReader();
  reader.onload = function(e){ var p=document.getElementById('apPhotoPreview'); p.src=e.target.result; p.style.display='block'; };
  reader.readAsDataURL(file);
};

window.saveAdminProfile = async function() {
  var name = (document.getElementById('apName').value||'').trim();
  var role = (document.getElementById('apRole').value||'').trim();
  var email = (document.getElementById('apEmail').value||'').trim();
  var phone = (document.getElementById('apPhone').value||'').trim();
  var bio = (document.getElementById('apBio').value||'').trim();
  var photoFile = document.getElementById('apPhotoFile').files[0];
  var statusEl = document.getElementById('apStatus');

  if(!name||!role){ window.showStatus('apStatus','Please fill in Name and Role.','err'); return; }
  var sb = window.geramaSupabase; if(!sb){ window.showStatus('apStatus','Not connected.','err'); return; }
  window.showStatus('apStatus','Saving...','info');

  var photoUrl = null;
  if(photoFile){
    try{
      var ext = photoFile.name.split('.').pop();
      var path = 'admin-profiles/'+Date.now()+'.'+ext;
      var up = await sb.storage.from(window.BUCKET).upload(path, photoFile, {upsert:true});
      if(!up.error) photoUrl = sb.storage.from(window.BUCKET).getPublicUrl(path).data.publicUrl;
    }catch(e){}
  }

  var profile = { name:name, role:role, email:email||null, phone:phone||null, bio:bio||null, updated_at:new Date().toISOString() };
  if(photoUrl) profile.photo_url = photoUrl;

  var {error} = await sb.from('admin_profiles').upsert(profile, {onConflict:'email'});
  if(error){ window.showStatus('apStatus','❌ '+error.message,'err'); return; }
  window.logActivity('Updated admin profile: '+name);
  window.showStatus('apStatus','✅ Profile saved and visible to all admins!','ok');
  loadAdminProfiles();
};

window.loadAdminProfiles = async function() {
  var el = document.getElementById('adminProfilesList'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb) return;
  var {data} = await sb.from('admin_profiles').select('*').order('updated_at',{ascending:false});
  if(!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1.5rem;">No admin profiles yet. Add yours above!</p>'; return; }

  // Get current session to show "You" badge
  var session = (window.getAdminSession && window.getAdminSession()) || {};
  var myId = session.id || '';

  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;">'+
    data.map(function(p){
      var isMe = myId && p.id === myId;
      return '<div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;padding:1.2rem;border:1px solid #c4b5fd;position:relative;">'+
        // "You" badge
        (isMe ? '<span style="position:absolute;top:0.7rem;right:0.7rem;background:#7c3aed;color:white;font-size:0.65rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:20px;">You</span>' : '')+
        (p.photo_url
          ? '<img src="'+p.photo_url+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #a78bfa;margin-bottom:0.8rem;display:block;">'
          : '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;margin-bottom:0.8rem;">'+window.escHtml(p.name.charAt(0))+'</div>')+
        '<div style="font-weight:800;color:#1e2a3e;margin-bottom:0.2rem;">'+window.escHtml(p.name)+'</div>'+
        '<div style="font-size:0.78rem;color:#7c3aed;font-weight:700;margin-bottom:0.4rem;">'+window.escHtml(p.role||'Admin')+'</div>'+
        (p.bio  ? '<div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.4rem;">'+window.escHtml(p.bio)+'</div>' : '')+
        (p.phone? '<div style="font-size:0.78rem;color:#374151;margin-bottom:0.2rem;"><i class="fas fa-phone" style="margin-right:0.3rem;color:#7c3aed;"></i>'+window.escHtml(p.phone)+'</div>' : '')+
        (p.email? '<div style="font-size:0.78rem;color:#374151;margin-bottom:0.8rem;"><i class="fas fa-envelope" style="margin-right:0.3rem;color:#7c3aed;"></i>'+window.escHtml(p.email)+'</div>' : '')+
        // Remove button — always visible, requires super-admin code
        (!isMe
          ? '<button onclick="deleteAdminProfile(\''+window.escAttr(p.id||'')+'\',\''+window.escAttr(p.name)+'\')" '+
            'style="width:100%;background:#fee2e2;color:#dc2626;border:none;padding:0.4rem 0.8rem;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;justify-content:center;gap:0.4rem;" '+
            'onmouseover="this.style.background=\'#dc2626\';this.style.color=\'white\'" '+
            'onmouseout="this.style.background=\'#fee2e2\';this.style.color=\'#dc2626\'">'+
            '<i class="fas fa-user-minus"></i> Remove Admin</button>'
          : '<div style="font-size:0.72rem;color:#9ca3af;text-align:center;padding-top:0.3rem;">Edit your profile above</div>'
        )+
      '</div>';
    }).join('')+
  '</div>';
};

// ─── IMPORT SCORES FROM CSV ──────────────────────────────────────
window.importScoresFromCSV = async function() {
  var quizId = document.getElementById('importQzSelect').value;
  var csvText = (document.getElementById('importCsvData').value||'').trim();
  if(!quizId){ window.showStatus('importStatus','Please select a quiz.','err'); return; }
  if(!csvText){ window.showStatus('importStatus','Please paste CSV data.','err'); return; }

  var sb = window.geramaSupabase; if(!sb){ window.showStatus('importStatus','Not connected.','err'); return; }

  // Get quiz title
  var qzRes = await sb.from('quizzes').select('title,points').eq('id',quizId).single();
  var qzTitle = qzRes.data ? qzRes.data.title : 'Quiz';

  // Parse CSV
  var lines = csvText.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l && !l.startsWith('email'); });
  var parsed = [];
  lines.forEach(function(line){
    var parts = line.split(',');
    var email = (parts[0]||'').trim().toLowerCase();
    var score = parseFloat((parts[1]||'').trim());
    if(email && email.includes('@') && !isNaN(score)) parsed.push({email:email, score:score});
  });

  if(!parsed.length){ window.showStatus('importStatus','No valid rows found. Format: email,score','err'); return; }
  window.showStatus('importStatus','Importing '+parsed.length+' scores...','info');

  // Pick up the participated date set by admin (defaults to today)
  var participatedDateEl = document.getElementById('importParticipatedDate');
  var participatedAt = (participatedDateEl && participatedDateEl.value)
    ? new Date(participatedDateEl.value).toISOString()
    : new Date().toISOString();

  var ok=0, fail=0;
  for(var i=0;i<parsed.length;i++){
    var row = parsed[i];
    try{
      // Upsert to student_grades
      await sb.from('student_grades').upsert({
        student_email:    row.email,
        assignment_title: qzTitle,
        score:            row.score,
        graded_at:        new Date().toISOString(),
        participated_at:  participatedAt
      }, {onConflict:'student_email,assignment_title'});
      ok++;
    }catch(e){ fail++; }
  }
  window.logActivity('Imported '+ok+' quiz scores for: '+qzTitle);
  window.showStatus('importStatus','✅ Imported '+ok+' scores'+(fail?' ('+fail+' failed)':'')+'! Students can now see their grades in the Classroom → My Grades tab.','ok');
};

// ─── CSV FILE UPLOAD FOR SCORE IMPORT ───────────────────────────
window.loadCsvFile = function(input) {
  var file = input.files && input.files[0]; if(!file) return;
  document.getElementById('csvFileChosen').textContent = '✅ ' + file.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('importCsvData').value = e.target.result;
  };
  reader.readAsText(file);
};

// Smart CSV parser — auto-detects identifier (email OR name) and score columns
function parseScoreCSV(csvText, identColHint, scoreColHint) {
  var lines = csvText.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
  if(!lines.length) return [];

  // Parse header row
  var header = lines[0].toLowerCase().split(',').map(function(h){ return h.replace(/"/g,'').trim(); });
  var hasHeader = header.some(function(h){
    return h.includes('email') || h.includes('name') || h.includes('student') || h.includes('score') || h.includes('mark');
  });

  var identIdx = -1, scoreIdx = -1;

  // Use hints if provided
  if(identColHint) {
    var n = parseInt(identColHint);
    if(!isNaN(n)) identIdx = n - 1;
    else identIdx = header.findIndex(function(h){ return h.includes(identColHint.toLowerCase()); });
  }
  if(scoreColHint) {
    var n2 = parseInt(scoreColHint);
    if(!isNaN(n2)) scoreIdx = n2 - 1;
    else scoreIdx = header.findIndex(function(h){ return h.includes(scoreColHint.toLowerCase()); });
  }

  // Auto-detect identifier column (email preferred, then name)
  if(identIdx === -1) {
    identIdx = header.findIndex(function(h){ return h.includes('email') || h.includes('mail'); });
  }
  if(identIdx === -1) {
    identIdx = header.findIndex(function(h){ return h.includes('name') || h.includes('student'); });
  }

  // Auto-detect score column
  if(scoreIdx === -1) {
    scoreIdx = header.findIndex(function(h){
      return h.includes('score') || h.includes('mark') || h.includes('grade') || h.includes('result') || h.includes('total') || h.includes('point');
    });
  }

  // Last-resort fallback: col 0 = identifier, col 1 = score
  if(identIdx === -1) identIdx = 0;
  if(scoreIdx === -1) scoreIdx = 1;

  var dataLines = hasHeader ? lines.slice(1) : lines;
  var results = [];
  dataLines.forEach(function(line) {
    if(!line) return;
    var cols = line.split(',').map(function(c){ return c.replace(/"/g,'').trim(); });
    var ident = (cols[identIdx] || '').trim();
    var score = parseFloat(cols[scoreIdx]);
    if(ident && !isNaN(score)) {
      // Determine if it's an email or a name
      var isEmail = ident.includes('@');
      results.push({ ident: ident, isEmail: isEmail, email: isEmail ? ident.toLowerCase() : '', name: isEmail ? '' : ident, score: score });
    }
  });
  return results;
}

window.previewCsvImport = function() {
  var csvText = document.getElementById('importCsvData').value||'';
  var emailCol = document.getElementById('importEmailCol').value||'';
  var scoreCol = document.getElementById('importScoreCol').value||'';
  var parsed = parseScoreCSV(csvText, emailCol, scoreCol);
  var prevEl = document.getElementById('csvPreview');
  if(!prevEl) return;
  if(!parsed.length){
    prevEl.style.display='block';
    prevEl.innerHTML='<p style="color:#dc2626;">No valid rows found. Check your CSV format — make sure there is a name or email column and a score column.</p>';
    return;
  }
  var nameCount = parsed.filter(function(r){ return !r.isEmail; }).length;
  var emailCount = parsed.filter(function(r){ return r.isEmail; }).length;
  var note = nameCount > 0 ? '<div style="font-size:0.78rem;color:#f59e0b;font-weight:600;margin-bottom:0.5rem;"><i class="fas fa-info-circle"></i> '+nameCount+' row(s) use student names — will be matched to registered email addresses automatically.</div>' : '';
  prevEl.style.display = 'block';
  prevEl.innerHTML = '<div style="font-weight:700;color:#1B5E20;margin-bottom:0.4rem;">Preview ('+parsed.length+' students detected, '+emailCount+' by email, '+nameCount+' by name):</div>' +
    note +
    '<div class="tbl-wrap"><table><thead><tr><th>Name / Email</th><th>Score</th></tr></thead><tbody>' +
    parsed.slice(0,10).map(function(r){
      var label = r.isEmail
        ? window.escHtml(r.email)
        : '<span style="background:#fef3c7;color:#92400e;padding:0.1rem 0.4rem;border-radius:6px;font-size:0.78rem;">name: </span> '+window.escHtml(r.name);
      return '<tr><td style="font-size:0.85rem;">'+label+'</td><td><strong>'+r.score+'</strong></td></tr>';
    }).join('') +
    (parsed.length>10?'<tr><td colspan="2" style="color:#9ca3af;font-size:0.8rem;text-align:center;">…and '+(parsed.length-10)+' more</td></tr>':'')+
    '</tbody></table></div>';
};

// Override the old importScoresFromCSV with smart version (supports name OR email)
window.importScoresFromCSV = async function() {
  var quizId   = document.getElementById('importQzSelect').value;
  var csvText  = (document.getElementById('importCsvData').value||'').trim();
  var identCol = document.getElementById('importEmailCol').value||'';
  var scoreCol = document.getElementById('importScoreCol').value||'';

  if(!quizId)  { window.showStatus('importStatus','Please select a quiz.','err'); return; }
  if(!csvText) { window.showStatus('importStatus','Please paste CSV data or upload a file.','err'); return; }

  var sb = window.geramaSupabase;
  if(!sb){ window.showStatus('importStatus','Not connected.','err'); return; }

  var qzRes  = await sb.from('quizzes').select('title,points').eq('id',quizId).single();
  var qzTitle = qzRes.data ? qzRes.data.title : 'Quiz';

  var parsed = parseScoreCSV(csvText, identCol, scoreCol);
  if(!parsed.length){
    window.showStatus('importStatus','No valid rows found. Use Preview to diagnose. Make sure there is a name/email column and a score column.','err');
    return;
  }

  // Separate rows that need name→email resolution
  var nameRows  = parsed.filter(function(r){ return !r.isEmail; });
  var emailRows = parsed.filter(function(r){ return r.isEmail; });

  // Resolve names to emails via user_profiles — fuzzy token matching
  var nameMap = {}; // lowercase full_name → email
  var profiles = [];
  if(nameRows.length > 0){
    window.showStatus('importStatus','Resolving student names…','info');
    try{
      var profRes = await sb.from('user_profiles').select('email,full_name');
      profiles = profRes.data || [];
      profiles.forEach(function(p){
        if(p.full_name && p.email){
          nameMap[p.full_name.toLowerCase().trim()] = p.email.toLowerCase();
        }
      });
    }catch(e){ /* non-fatal */ }
  }

  // Token-based fuzzy matcher: splits name into words, scores overlap
  function fuzzyMatchEmail(searchName){
    var key = searchName.toLowerCase().trim();
    // 1. Exact match
    if(nameMap[key]) return nameMap[key];
    // 2. Contains match (one side contains the other fully)
    var found = null;
    Object.keys(nameMap).forEach(function(k){
      if(!found && (k.includes(key) || key.includes(k))) found = nameMap[k];
    });
    if(found) return found;
    // 3. Token overlap: split both names into words, count shared tokens
    var searchTokens = key.split(/\s+/).filter(Boolean);
    var bestScore = 0, bestEmail = null;
    Object.keys(nameMap).forEach(function(k){
      var profileTokens = k.split(/\s+/).filter(Boolean);
      var shared = searchTokens.filter(function(t){
        return profileTokens.some(function(pt){ return pt === t || (t.length > 3 && pt.startsWith(t)) || (pt.length > 3 && t.startsWith(pt)); });
      }).length;
      // Score = shared tokens / max possible
      var score = shared / Math.max(searchTokens.length, profileTokens.length);
      if(score > bestScore && score >= 0.5){ // at least 50% token match
        bestScore = score;
        bestEmail = nameMap[k];
      }
    });
    return bestEmail;
  }

  // Build final list with emails
  var toImport = [];
  var skipped = [];
  var matchLog = []; // for status display
  emailRows.forEach(function(r){ toImport.push({email: r.email, score: r.score, ident: r.email}); });
  nameRows.forEach(function(r){
    var email = fuzzyMatchEmail(r.name);
    if(email){
      toImport.push({email: email, score: r.score, ident: r.name+' → '+email});
      matchLog.push(r.name+' → '+email);
    } else {
      skipped.push(r.name);
    }
  });

  if(!toImport.length){
    var skipMsg = 'No students matched. ';
    if(skipped.length) skipMsg += 'Could not find emails for: '+skipped.slice(0,5).join(', ')+(skipped.length>5?' …and '+(skipped.length-5)+' more':'');
    skipMsg += ' — make sure names match the registered profile names exactly (or use emails instead).';
    window.showStatus('importStatus', skipMsg, 'err');
    return;
  }

  window.showStatus('importStatus','Importing '+toImport.length+' scores'+(skipped.length?' ('+skipped.length+' names unmatched)':'')+'…','info');

  // Read admin-specified participation date (shown on student dashboard)
  var partDateEl2 = document.getElementById('importParticipatedDate');
  var participatedAt2 = (partDateEl2 && partDateEl2.value)
    ? new Date(partDateEl2.value).toISOString()
    : new Date().toISOString();

  // Fetch quiz points once, not inside the loop
  var qzPoints = null;
  var qzCourse = null;
  try{
    var qzDetail = await sb.from('quizzes').select('points,course').eq('title',qzTitle).maybeSingle();
    if(qzDetail && qzDetail.data){ qzPoints = qzDetail.data.points || null; qzCourse = qzDetail.data.course || null; }
  }catch(e){}

  var ok=0, fail=0, errors=[];
  for(var i=0;i<toImport.length;i++){
    var row = toImport[i];
    try{
      // Upsert atomically — prevents race condition from delete+insert
      await sb.from('student_grades').upsert({
        student_email:    row.email,
        assignment_title: qzTitle,
        course:           qzCourse,
        score:            row.score,
        total_marks:      qzPoints,
        points:           qzPoints,
        graded_at:        new Date().toISOString(),
        participated_at:  participatedAt2
      }, {onConflict: 'student_email,assignment_title'});
      ok++;
    }catch(e){ fail++; errors.push(row.ident+': '+e.message); }
  }

  window.logActivity('Imported '+ok+' quiz scores for: '+qzTitle);
  var msg = '✅ Imported '+ok+' score'+(ok!==1?'s':'')+' for "'+qzTitle+'".';
  if(matchLog.length) msg += ' 🔗 Name matches: '+matchLog.slice(0,3).join(', ')+(matchLog.length>3?' …+'+( matchLog.length-3)+' more':'')+'';
  if(skipped.length) msg += ' ⚠️ '+skipped.length+' unmatched: '+skipped.slice(0,3).join(', ')+(skipped.length>3?' …+' +(skipped.length-3)+' more':'');
  if(fail) msg += ' ❌ '+fail+' failed to save.';
  window.showStatus('importStatus', msg, ok>0?'ok':'err');
  if(errors.length) console.warn('Import errors:', errors);
};

// ============================================================
//  GERAMA TEAM GROUPS MANAGEMENT (v2 — Group F, index numbers, balance, per-group export, tutor-on-top)
//  Tables required in Supabase:
//    gerama_groups  (id, name, color, created_at)
//    gerama_group_members (id, group_id, user_email, user_name, role, index_number, gender, assigned_at)
// ============================================================

var GROUP_NAMES = ['Gerama A', 'Gerama B', 'Gerama C', 'Gerama D', 'Gerama E', 'Gerama F'];
var GROUP_COLORS = ['#1B5E20','#1565C0','#6A1B9A','#E65100','#AD1457','#00695C'];
var GROUP_MAX = 25; // max per group after rebalance

window.loadGroups = async function(){
  var container = document.getElementById('groupsContainer');
  if(!container) return;
  var sb = window.geramaSupabase;
  if(!sb){ container.innerHTML='<p style="color:#9ca3af;text-align:center;padding:2rem;">Not connected to database.</p>'; return; }

  container.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Loading groups...</p>';

  try{
    // Ensure all 6 default groups exist
    var {data: existingGroups} = await sb.from('gerama_groups').select('*').order('name');
    if(!existingGroups || existingGroups.length < GROUP_NAMES.length){
      for(var i=0;i<GROUP_NAMES.length;i++){
        var gName = 'Team '+GROUP_NAMES[i];
        var already = (existingGroups||[]).find(function(g){ return g.name === gName; });
        if(!already){
          await sb.from('gerama_groups').insert({ name: gName, color: GROUP_COLORS[i], created_at: new Date().toISOString() });
        }
      }
      var refreshed = await sb.from('gerama_groups').select('*').order('name');
      existingGroups = refreshed.data || [];
    }

    // Fetch all group members
    var {data: allMembers} = await sb.from('gerama_group_members').select('*');
    allMembers = allMembers || [];

    // Fetch all registered users for "Add member" dropdowns
    var {data: allUsers} = await sb.from('user_profiles').select('email, full_name, level, program, index_number, gender').order('full_name');
    allUsers = allUsers || [];

    // Store globally for use in modal functions
    window._geramaGroups = existingGroups;
    window._allGroupMembers = allMembers;
    window._allUsers = allUsers;

    renderGroupsUI(existingGroups, allMembers, allUsers, container);
  } catch(e){
    container.innerHTML = '<div style="background:#fee2e2;color:#991b1b;padding:1.2rem;border-radius:12px;"><strong>Error:</strong> '+window.escHtml(e.message)+'<br><br>Make sure the <code>gerama_groups</code> and <code>gerama_group_members</code> tables exist. <a href="#" onclick="window.showGroupsSetupSQL();return false;" style="color:#dc2626;font-weight:700;text-decoration:underline;">View Setup SQL</a></div>';
  }
};

window.showGroupsSetupSQL = function(){
  alert(
    'Run this SQL in your Supabase SQL editor:\n\n' +
    'CREATE TABLE IF NOT EXISTS gerama_groups (\n' +
    '  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n' +
    '  name text NOT NULL,\n' +
    '  color text DEFAULT \'#1B5E20\',\n' +
    '  created_at timestamptz DEFAULT now()\n' +
    ');\n\n' +
    'CREATE TABLE IF NOT EXISTS gerama_group_members (\n' +
    '  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n' +
    '  group_id uuid REFERENCES gerama_groups(id) ON DELETE CASCADE,\n' +
    '  user_email text NOT NULL,\n' +
    '  user_name text,\n' +
    '  role text DEFAULT \'member\',\n' +
    '  assigned_at timestamptz DEFAULT now()\n' +
    ');\n\n' +
    'ALTER TABLE gerama_groups ENABLE ROW LEVEL SECURITY;\n' +
    'ALTER TABLE gerama_group_members ENABLE ROW LEVEL SECURITY;\n' +
    'CREATE POLICY "Public read gerama_groups" ON gerama_groups FOR SELECT USING (true);\n' +
    'CREATE POLICY "Public read gerama_group_members" ON gerama_group_members FOR SELECT USING (true);\n' +
    'CREATE POLICY "Anon insert gerama_groups" ON gerama_groups FOR ALL USING (true) WITH CHECK (true);\n' +
    'CREATE POLICY "Anon insert gerama_group_members" ON gerama_group_members FOR ALL USING (true) WITH CHECK (true);'
  );
};

function renderGroupsUI(groups, allMembers, allUsers, container){
  var totalMembers = allMembers.length;

  // Deduplicate member count (unique emails only)
  var uniqueEmails = {};
  allMembers.forEach(function(m){ if(m.user_email) uniqueEmails[m.user_email.toLowerCase().trim()] = true; });
  var uniqueMemberCount = Object.keys(uniqueEmails).length;
  var dupCount = totalMembers - uniqueMemberCount;

  var assignedEmails = allMembers.map(function(m){ return (m.user_email||'').toLowerCase().trim(); });
  // Unassigned = L100 users not yet assigned
  var l100Users = allUsers.filter(function(u){ return u.level === 'L100'; });
  var unassignedL100 = l100Users.filter(function(u){ return assignedEmails.indexOf((u.email||'').toLowerCase().trim()) === -1; });

  // ── Build the merge-users map: enrich member rows with index_number/gender from user_profiles ──
  var userMap = {};
  allUsers.forEach(function(u){ userMap[u.email] = u; });

  var headerHtml =
    '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;padding:1rem 1.2rem;background:linear-gradient(135deg,#e8f5e9,#f0fdf4);border-radius:14px;border:1px solid #c8e6c9;">'+
      '<div>'+
        '<div style="font-size:1.05rem;font-weight:800;color:#1B5E20;"><i class="fas fa-users-cog"></i> Gerama Study Groups <span style="font-size:0.75rem;font-weight:600;background:#dcfce7;color:#166534;padding:0.15rem 0.5rem;border-radius:8px;margin-left:0.3rem;">L100 Only</span></div>'+
        '<div style="font-size:0.82rem;color:#6b7280;margin-top:0.3rem;">'+
          '<span style="background:#e8f5e9;color:#1B5E20;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;margin-right:0.4rem;">'+uniqueMemberCount+' assigned (unique)</span>'+
          (dupCount>0?'<span style="background:#fee2e2;color:#dc2626;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;margin-right:0.4rem;" title="Same email assigned more than once — click Clean Duplicates to fix">⚠️ '+dupCount+' duplicate'+(dupCount!==1?'s':'')+' found</span>':'')+
          '<span style="background:#fef3c7;color:#92400e;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;margin-right:0.4rem;">'+unassignedL100.length+' L100 unassigned</span>'+
          '<span style="background:#dbeafe;color:#1d4ed8;padding:0.15rem 0.6rem;border-radius:10px;font-weight:700;">'+groups.length+' groups</span>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">'+
        '<button onclick="window.showAddGroupModal()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-plus"></i> New Group</button>'+
        '<button onclick="window.randomlyAssignAll()" class="btn-gold" style="font-size:0.82rem;padding:0.45rem 1rem;"><i class="fas fa-random"></i> Auto-Assign L100</button>'+
        '<button onclick="window.openAttendanceShuffleModal()" style="background:linear-gradient(135deg,#7c3aed,#a78bfa);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Fetch students from an attendance session and shuffle them into groups"><i class="fas fa-clipboard-check"></i> Shuffle by Attendance</button>'+
        '<button onclick="window.cleanDuplicateMembers()" style="background:linear-gradient(135deg,#dc2626,#ef4444);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Remove duplicate member entries — keeps one per email"'+(dupCount>0?' ':' disabled style="opacity:0.4;cursor:not-allowed;"')+'><i class="fas fa-broom"></i> Clean Duplicates'+(dupCount>0?' ('+dupCount+')':'')+'</button>'+
        '<button onclick="window.rebalanceGroups()" style="background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Move excess members (>25) to Group F, gender-balanced"><i class="fas fa-balance-scale"></i> Rebalance</button>'+
        '<button onclick="window.pushGroupsToAllProfiles()" style="background:linear-gradient(135deg,#0369a1,#0ea5e9);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Force-sync group names into all user_profiles — so all students see their group immediately"><i class="fas fa-broadcast-tower"></i> Push Groups</button>'+
        '<button onclick="window.loadGroups()" style="background:#f1f5f9;color:#374151;border:1px solid #e5e7eb;padding:0.45rem 0.9rem;border-radius:20px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-sync-alt"></i> Refresh</button>'+
        '<button onclick="window.downloadGroupsCSV()" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-download"></i> Export All</button>'+
        '<button onclick="window.openIndexAssignModal()" style="background:linear-gradient(135deg,#92400e,#b45309);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Auto-assign index numbers only to registered members who are in a group"><i class="fas fa-id-badge"></i> Assign Index Nos.</button>'+
      '</div>'+
    '</div>';

  var groupsHtml = groups.map(function(group){
    var members = allMembers.filter(function(m){ return m.group_id === group.id; });
    // Tutors on top, then regular members — each sorted by name
    var tutors = members.filter(function(m){ return m.role === 'tutor'; });
    var regulars = members.filter(function(m){ return m.role !== 'tutor'; });
    tutors.sort(function(a,b){ return (a.user_name||'').localeCompare(b.user_name||''); });
    regulars.sort(function(a,b){ return (a.user_name||'').localeCompare(b.user_name||''); });
    var sortedMembers = tutors.concat(regulars);

    var color = group.color || '#1B5E20';
    var lighterBg = hexToRgba(color, 0.07);
    var borderColor = hexToRgba(color, 0.3);
    var isFull = members.length >= GROUP_MAX;

    // Count gender for display
    var femaleCount = members.filter(function(m){ var u=userMap[m.user_email]; return u && (u.gender||'').toLowerCase()==='female'; }).length;
    var maleCount = members.filter(function(m){ var u=userMap[m.user_email]; return u && (u.gender||'').toLowerCase()==='male'; }).length;

    // Member rows — tutors rendered first
    var memberRows = sortedMembers.map(function(m, rowIdx){
      var isTutor = m.role === 'tutor';
      var roleBadge = isTutor
        ? '<span style="background:'+hexToRgba(color,0.15)+';color:'+color+';font-size:0.7rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.3rem;"><i class="fas fa-chalkboard-teacher"></i> Tutor</span>'
        : '';
      var safeId = m.id.replace(/-/g,'');
      // Get index number — from member record or from user_profiles
      var userInfo = userMap[m.user_email] || {};
      var indexNum = m.index_number || userInfo.index_number || '';
      var indexBadge = indexNum
        ? '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.68rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:8px;margin-left:0.3rem;font-family:monospace;">'+window.escHtml(indexNum)+'</span>'
        : '<span style="background:#f1f5f9;color:#9ca3af;font-size:0.68rem;padding:0.1rem 0.4rem;border-radius:8px;margin-left:0.3rem;" title="No index number yet">—</span>';

      // Row background: tutors get a subtle highlight
      var rowBg = isTutor ? hexToRgba(color, 0.04) : 'white';
      var rowBorder = isTutor ? '1px solid '+hexToRgba(color, 0.2) : '1px solid #f1f5f9';

      return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.6rem;background:'+rowBg+';border-radius:8px;border:'+rowBorder+';margin-bottom:0.3rem;" id="gmrow-'+safeId+'">'+
        '<div style="width:22px;text-align:center;font-size:0.72rem;color:#9ca3af;font-weight:600;flex-shrink:0;">'+(rowIdx+1)+'</div>'+
        '<div style="width:28px;height:28px;border-radius:50%;background:'+color+';color:white;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">'+
          window.escHtml((m.user_name||'?').charAt(0).toUpperCase())+
        '</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-size:0.85rem;font-weight:600;color:#1e2a3e;">'+window.escHtml(m.user_name||m.user_email||'—')+roleBadge+indexBadge+'</div>'+
          '<div style="font-size:0.72rem;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+window.escHtml(m.user_email||'')+'</div>'+
        '</div>'+
        '<div style="display:flex;gap:0.3rem;flex-shrink:0;">'+
          (isTutor
            ? '<button onclick="window.setMemberRole(\''+m.id+'\',\'member\')" style="background:#fef3c7;color:#92400e;border:none;padding:0.25rem 0.5rem;border-radius:6px;font-size:0.7rem;cursor:pointer;" title="Remove tutor role"><i class="fas fa-user"></i></button>'
            : '<button onclick="window.setMemberRole(\''+m.id+'\',\'tutor\')" style="background:'+hexToRgba(color,0.12)+';color:'+color+';border:none;padding:0.25rem 0.5rem;border-radius:6px;font-size:0.7rem;cursor:pointer;" title="Make tutor"><i class="fas fa-chalkboard-teacher"></i></button>')+
          '<button onclick="window.openMoveModal(\''+m.id+'\',\''+window.escAttr(m.user_name||'')+'\',\''+window.escAttr(group.id)+'\')" style="background:#dbeafe;color:#1d4ed8;border:none;padding:0.25rem 0.5rem;border-radius:6px;font-size:0.7rem;cursor:pointer;" title="Move to another group"><i class="fas fa-exchange-alt"></i></button>'+
          '<button onclick="window.removeMember(\''+m.id+'\')" style="background:#fee2e2;color:#dc2626;border:none;padding:0.25rem 0.5rem;border-radius:6px;font-size:0.7rem;cursor:pointer;" title="Remove from group"><i class="fas fa-times"></i></button>'+
        '</div>'+
      '</div>';
    }).join('');

    // Build available users for "add" dropdown (not already in this group, L100 users first)
    var membersEmails = members.map(function(m){ return (m.user_email||'').toLowerCase().trim(); });
    // Show L100 users at top, other levels below with a label
    var l100Opts = allUsers
      .filter(function(u){ return u.level === 'L100' && membersEmails.indexOf((u.email||'').toLowerCase().trim()) === -1; })
      .map(function(u){
        var idx = u.index_number ? ' ['+u.index_number+']' : '';
        return '<option value="'+window.escAttr(u.email)+'">'+window.escHtml((u.full_name||u.email)+idx+' L100')+'</option>';
      }).join('');
    var otherOpts = allUsers
      .filter(function(u){ return u.level !== 'L100' && membersEmails.indexOf((u.email||'').toLowerCase().trim()) === -1; })
      .map(function(u){
        var idx = u.index_number ? ' ['+u.index_number+']' : '';
        return '<option value="'+window.escAttr(u.email)+'">'+window.escHtml((u.full_name||u.email)+idx+(u.level?' '+u.level:''))+'</option>';
      }).join('');
    var addOptions = l100Opts + (otherOpts ? '<optgroup label="Other Levels">'+otherOpts+'</optgroup>' : '');

    var accordionId = 'group-accordion-'+group.id.replace(/-/g,'');
    var genderInfo = (femaleCount || maleCount)
      ? '<span style="font-size:0.72rem;color:#6b7280;margin-left:0.4rem;">♀ '+femaleCount+' ♂ '+maleCount+'</span>'
      : '';

    return '<div style="margin-bottom:1.2rem;border:1px solid '+borderColor+';border-radius:14px;overflow:hidden;">'+
      // Header
      '<div onclick="toggleGroupAccordion(\''+accordionId+'\')" style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.2rem;background:'+lighterBg+';cursor:pointer;user-select:none;">'+
        '<div style="display:flex;align-items:center;gap:0.8rem;">'+
          '<div style="width:10px;height:10px;border-radius:50%;background:'+color+';flex-shrink:0;"></div>'+
          '<div>'+
            '<div style="font-size:0.95rem;font-weight:800;color:'+color+';">'+window.escHtml(group.name)+'</div>'+
            '<div style="font-size:0.78rem;color:#6b7280;margin-top:0.1rem;">'+
              '<span style="font-weight:600;">'+members.length+'</span> member'+(members.length!==1?'s':'')+
              (tutors.length?' &nbsp;·&nbsp; <span style="color:'+color+';font-weight:600;">'+tutors.length+' tutor'+(tutors.length!==1?'s':'')+'</span>':'')+
              genderInfo+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:0.5rem;">'+
          '<button onclick="event.stopPropagation();window.downloadSingleGroupCSV(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:white;color:'+color+';border:1px solid '+color+';padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Export this group"><i class="fas fa-download"></i> Export</button>'+
          '<button onclick="event.stopPropagation();window.openBulkAssignModal(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:white;color:#059669;border:1px solid #34d399;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Bulk assign students by name"><i class="fas fa-list-check"></i> Bulk</button>'+
          '<button onclick="event.stopPropagation();window.deleteGroup(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;" title="Delete this group"><i class="fas fa-trash"></i> Delete</button>'+
          '<span style="background:'+color+';color:white;border-radius:20px;padding:0.15rem 0.7rem;font-size:0.8rem;font-weight:700;">'+members.length+'/'+GROUP_MAX+'</span>'+
          '<i id="acc-icon-'+accordionId+'" class="fas fa-chevron-down" style="color:'+color+';font-size:0.85rem;transition:transform 0.2s;"></i>'+
        '</div>'+
      '</div>'+
      // Body
      '<div id="'+accordionId+'" style="display:none;padding:1rem 1.2rem;background:white;">'+
        // Tutors highlighted section
        (tutors.length ? '<div style="background:'+hexToRgba(color,0.06)+';border-radius:10px;padding:0.7rem 0.8rem;margin-bottom:0.8rem;border-left:3px solid '+color+';">'+
          '<div style="font-size:0.78rem;font-weight:700;color:'+color+';margin-bottom:0.4rem;"><i class="fas fa-chalkboard-teacher"></i> Assigned Tutors</div>'+
          tutors.map(function(t){
            var userInfo = userMap[t.user_email] || {};
            var idxNum = t.index_number || userInfo.index_number || '';
            return '<div style="font-size:0.85rem;color:#374151;font-weight:600;">👨‍🏫 '+window.escHtml(t.user_name||t.user_email)+(idxNum?' <span style="font-size:0.72rem;color:#1B5E20;font-family:monospace;">['+window.escHtml(idxNum)+']</span>':'')+'</div>';
          }).join('')+
        '</div>' : '')+
        // Members list
        (members.length ? memberRows : '<p style="color:#9ca3af;font-size:0.85rem;text-align:center;padding:1rem;">No members yet.</p>')+
        // Add member form — typeahead search from registered members
        (!isFull
          ? '<div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid #f1f5f9;">'+
              '<div style="font-size:0.75rem;font-weight:700;color:#6b7280;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.04em;">Add Member</div>'+
              '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-start;">'+
                '<div style="flex:1;min-width:180px;position:relative;">'+
                  '<input type="text" id="addMemberSearch-'+group.id+'" placeholder="Type name to search…" autocomplete="off"'+
                    ' oninput="window.filterMemberSearch(\''+group.id+'\')"'+
                    ' onfocus="window.filterMemberSearch(\''+group.id+'\')"'+
                    ' style="width:100%;padding:0.42rem 0.7rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.82rem;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;"'+
                    ' onfocusin="this.style.borderColor=\''+color+'\'" onblur="setTimeout(function(){ var d=document.getElementById(\'addMemberDrop-'+group.id+'\'); if(d) d.style.display=\'none\'; },200)">'+
                  '<div id="addMemberDrop-'+group.id+'" style="display:none;position:absolute;top:100%;left:0;right:0;background:white;border:2px solid '+color+';border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:200;max-height:220px;overflow-y:auto;"></div>'+
                '</div>'+
                '<button onclick="window.addMemberToGroupSearch(\''+group.id+'\')" style="background:'+color+';color:white;border:none;padding:0.42rem 0.9rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;white-space:nowrap;"><i class="fas fa-user-plus"></i> Add</button>'+
                '<button onclick="window.openAttendanceAddModal(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:#f5f3ff;color:#6d28d9;border:1px solid #c4b5fd;padding:0.42rem 0.7rem;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;white-space:nowrap;" title="Add members from another attendance session"><i class="fas fa-clipboard-check"></i> Attendance</button>'+
                '<button onclick="window.openSubmissionAddModal(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;padding:0.42rem 0.7rem;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;white-space:nowrap;" title="Add members from assignment or quiz submitters"><i class="fas fa-file-alt"></i> Submissions</button>'+
              '</div>'+
            '</div>'
          : (isFull
              ? '<div style="margin-top:0.5rem;"><div style="text-align:center;font-size:0.78rem;color:#92400e;background:#fef3c7;padding:0.4rem;border-radius:8px;margin-bottom:0.4rem;">Group is full (max '+GROUP_MAX+')</div>'+
                  '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.3rem;">'+
                    '<button onclick="window.openAttendanceAddModal(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:#f5f3ff;color:#6d28d9;border:1px solid #c4b5fd;padding:0.4rem 0.7rem;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-clipboard-check"></i> From Attendance</button>'+
                    '<button onclick="window.openSubmissionAddModal(\''+window.escAttr(group.id)+'\',\''+window.escAttr(group.name)+'\')" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;padding:0.4rem 0.7rem;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-file-alt"></i> From Submissions</button>'+
                  '</div>'+
                '</div>'
              : '<div style="text-align:center;font-size:0.78rem;color:#9ca3af;padding:0.5rem;margin-top:0.5rem;">All registered users are already assigned.</div>'))+
      '</div>'+
    '</div>';
  }).join('');

  // Move modal
  var moveModal =
    '<div id="moveGroupModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;align-items:center;justify-content:center;">'+
      '<div style="background:white;border-radius:16px;padding:1.8rem;width:90%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'+
        '<div style="font-size:1rem;font-weight:800;color:#1e2a3e;margin-bottom:0.4rem;"><i class="fas fa-exchange-alt" style="color:#1B5E20;margin-right:0.4rem;"></i> Move Member</div>'+
        '<div id="moveMemberName" style="font-size:0.88rem;color:#6b7280;margin-bottom:1rem;"></div>'+
        '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.3rem;">Move to group:</label>'+
        '<select id="moveTargetGroup" style="width:100%;padding:0.55rem 0.8rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.88rem;font-family:\'Inter\',sans-serif;outline:none;margin-bottom:1rem;"></select>'+
        '<div style="display:flex;gap:0.6rem;">'+
          '<button onclick="window.confirmMove()" class="btn-primary" style="flex:1;">Confirm Move</button>'+
          '<button onclick="document.getElementById(\'moveGroupModal\').style.display=\'none\'" style="flex:1;background:#f1f5f9;border:none;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer;color:#374151;">Cancel</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  // Add New Group modal
  var addGroupModal =
    '<div id="addGroupModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9100;align-items:center;justify-content:center;">'+
      '<div style="background:white;border-radius:20px;padding:2rem;width:90%;max-width:420px;box-shadow:0 25px 70px rgba(0,0,0,0.25);">'+
        '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;margin-bottom:1.2rem;"><i class="fas fa-plus-circle" style="color:#6366f1;margin-right:0.5rem;"></i> Create New Group</div>'+
        '<div class="form-field" style="margin-bottom:0.8rem;"><label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.3rem;">Group Name *</label>'+
          '<input type="text" id="newGroupName" placeholder="e.g. Team Gerama G" style="width:100%;padding:0.6rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.9rem;font-family:\'Inter\',sans-serif;outline:none;box-sizing:border-box;"></div>'+
        '<div class="form-field" style="margin-bottom:1.2rem;"><label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.3rem;">Group Colour</label>'+
          '<input type="color" id="newGroupColor" value="#0f766e" style="width:60px;height:40px;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;"></div>'+
        '<div id="addGroupStatus" style="font-size:0.82rem;min-height:1rem;margin-bottom:0.8rem;"></div>'+
        '<div style="display:flex;gap:0.6rem;">'+
          '<button onclick="window.createNewGroup()" class="btn-primary" style="flex:1;justify-content:center;"><i class="fas fa-plus"></i> Create Group</button>'+
          '<button onclick="document.getElementById(\'addGroupModal\').style.display=\'none\'" style="flex:1;background:#f1f5f9;border:none;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer;color:#374151;font-family:\'Inter\',sans-serif;">Cancel</button>'+
        '</div>'+
      '</div>'+
    '</div>';

  container.innerHTML = headerHtml + '<div id="groupsAccordion">' + groupsHtml + '</div>' + moveModal + addGroupModal;

  // Auto-open first group
  if(groups.length){
    var firstId = 'group-accordion-'+groups[0].id.replace(/-/g,'');
    toggleGroupAccordion(firstId);
  }
}

function hexToRgba(hex, alpha){
  try{
    hex = hex.replace('#','');
    if(hex.length === 3) hex = hex.split('').map(function(c){ return c+c; }).join('');
    var r = parseInt(hex.substring(0,2),16);
    var g = parseInt(hex.substring(2,4),16);
    var b = parseInt(hex.substring(4,6),16);
    return 'rgba('+r+','+g+','+b+','+alpha+')';
  }catch(e){ return 'rgba(27,94,32,'+alpha+')'; }
}

window.toggleGroupAccordion = function(id){
  var el = document.getElementById(id);
  var icon = document.getElementById('acc-icon-'+id);
  if(!el) return;
  var isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if(icon) icon.style.transform = isOpen ? '' : 'rotate(180deg)';
};

window.addMemberToGroup = async function(groupId){
  var selectEl = document.getElementById('addMember-'+groupId);
  if(!selectEl || !selectEl.value){ alert('Please select a member to add.'); return; }
  var email = selectEl.value;
  var sb = window.geramaSupabase; if(!sb) return;

  // ── Admin password gate (absent members added manually) ──
  var pw = window.prompt('Enter admin password to add a member manually:');
  if(!pw) return;
  if(pw.trim() !== '2026GERAMA'){
    alert('❌ Wrong password. Only admin can manually add members to groups.');
    return;
  }

  // Check member count
  var {data: existing} = await sb.from('gerama_group_members').select('id').eq('group_id', groupId);
  if(existing && existing.length >= GROUP_MAX){ alert('This group is full ('+GROUP_MAX+' members maximum).'); return; }

  // Get user name + index number
  var user = (window._allUsers||[]).find(function(u){ return u.email === email; });
  var userName = user ? (user.full_name || email) : email;

  // Warn if not L100
  if(user && user.level && user.level !== 'L100'){
    if(!confirm(userName+' is '+user.level+', not L100. Study groups are currently for L100 only. Add anyway?')) return;
  }

  // Check not already in another group (also check for duplicate email in any group)
  var {data: inGroup} = await sb.from('gerama_group_members').select('id, group_id').eq('user_email', email).maybeSingle();
  if(inGroup){ alert(userName+' is already in a group. Use the Move (⇄) button to change their group.'); return; }

  var {error} = await sb.from('gerama_group_members').insert({
    group_id: groupId,
    user_email: email,
    user_name: userName,
    role: 'member',
    assigned_at: new Date().toISOString()
  });

  if(error){ alert('Error: '+error.message); return; }

  // Also update user_profiles with group info
  try{
    var group = (window._geramaGroups||[]).find(function(g){ return g.id === groupId; });
    if(group){
      await sb.from('user_profiles').update({ group_name: group.name }).eq('email', email);
    }
  }catch(e){}

  window.logActivity('Admin manually added '+userName+' to group (absent member)');
  window.loadGroups();
};

window.removeMember = async function(memberId){
  if(!confirm('Remove this member from their group?')) return;
  var sb = window.geramaSupabase; if(!sb) return;

  // Find member email to clear group from user_profiles
  var mem = (window._allGroupMembers||[]).find(function(m){ return m.id === memberId; });

  var {error} = await sb.from('gerama_group_members').delete().eq('id', memberId);
  if(error){ alert('Error: '+error.message); return; }

  // Clear group_name from user_profiles
  if(mem && mem.user_email){
    try{ await sb.from('user_profiles').update({ group_name: null }).eq('email', mem.user_email); }catch(e){}
  }

  window.logActivity('Removed member from group');
  window.loadGroups();
};

window.setMemberRole = async function(memberId, role){
  var sb = window.geramaSupabase; if(!sb) return;
  var {error} = await sb.from('gerama_group_members').update({ role: role }).eq('id', memberId);
  if(error){ alert('Error: '+error.message); return; }
  // If promoted to tutor, store notification for user
  if(role === 'tutor'){
    var mem = (window._allGroupMembers||[]).find(function(m){ return m.id === memberId; });
    if(mem){
      try{
        await sb.from('user_notifications').insert({
          user_email: mem.user_email,
          type: 'tutor_assigned',
          message: '🎉 Congratulations! You have been assigned as a Tutor for your study group.',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }catch(e){}
    }
  }
  window.logActivity('Updated member role to: '+role);
  window.loadGroups();
};

window.openMoveModal = function(memberId, memberName, currentGroupId){
  var modal = document.getElementById('moveGroupModal');
  var targetSelect = document.getElementById('moveTargetGroup');
  var nameEl = document.getElementById('moveMemberName');
  if(!modal || !targetSelect) return;

  window._movingMemberId = memberId;
  window._movingCurrentGroup = currentGroupId;

  if(nameEl) nameEl.textContent = 'Moving: ' + memberName;

  // Populate group options (exclude current)
  targetSelect.innerHTML = (window._geramaGroups||[])
    .filter(function(g){ return g.id !== currentGroupId; })
    .map(function(g){ return '<option value="'+window.escAttr(g.id)+'">'+window.escHtml(g.name)+'</option>'; })
    .join('');

  modal.style.display = 'flex';
};

window.confirmMove = async function(){
  var targetGroupId = document.getElementById('moveTargetGroup').value;
  if(!targetGroupId || !window._movingMemberId) return;
  var sb = window.geramaSupabase; if(!sb) return;

  var {error} = await sb.from('gerama_group_members').update({ group_id: targetGroupId, assigned_at: new Date().toISOString() }).eq('id', window._movingMemberId);
  if(error){ alert('Error: '+error.message); return; }

  // Update user_profiles.group_name
  try{
    var mem = (window._allGroupMembers||[]).find(function(m){ return m.id === window._movingMemberId; });
    var group = (window._geramaGroups||[]).find(function(g){ return g.id === targetGroupId; });
    if(mem && group){
      await sb.from('user_profiles').update({ group_name: group.name }).eq('email', mem.user_email);
    }
  }catch(e){}

  document.getElementById('moveGroupModal').style.display = 'none';
  window.logActivity('Moved member to '+((window._geramaGroups||[]).find(function(g){return g.id===targetGroupId;})||{}).name);
  window.loadGroups();
};

// ─── CLEAN DUPLICATE MEMBER ENTRIES ──────────────────────────────────────────
// Removes rows where the same user_email appears more than once in gerama_group_members.
// Keeps the earliest assigned_at row, deletes the rest.
window.cleanDuplicateMembers = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var allMembers = window._allGroupMembers || [];
  if(!allMembers.length){ alert('No group members loaded. Load groups first.'); return; }

  // Find duplicates
  var emailMap = {};
  var toDelete = [];
  // Sort by assigned_at ascending so we keep the earliest
  var sorted = allMembers.slice().sort(function(a,b){
    return new Date(a.assigned_at||0) - new Date(b.assigned_at||0);
  });
  sorted.forEach(function(m){
    var key = (m.user_email||'').toLowerCase().trim();
    if(!key) return;
    if(!emailMap[key]){
      emailMap[key] = m.id;
    } else {
      toDelete.push(m.id);
    }
  });

  if(!toDelete.length){
    alert('✅ No duplicates found. All member entries are unique.');
    return;
  }

  if(!confirm('Found '+toDelete.length+' duplicate member entry'+(toDelete.length!==1?'ies':'y')+'. Remove them? (keeps oldest assignment per person)')) return;

  var removed = 0, failed = 0;
  for(var i=0;i<toDelete.length;i++){
    try{
      var {error} = await sb.from('gerama_group_members').delete().eq('id', toDelete[i]);
      if(!error) removed++; else failed++;
    }catch(e){ failed++; }
  }

  window.logActivity('Cleaned '+removed+' duplicate group member entries'+(failed>0?' ('+failed+' failed)':''));
  alert('✅ Done! Removed '+removed+' duplicate'+( removed!==1?'s':'')+' from group members.'+(failed>0?'\n⚠️ '+failed+' failed.':''));
  window.loadGroups();
};

// ─── PUSH ALL GROUP NAMES TO USER_PROFILES ────────────────────────────────────
// Forces every group member's user_profiles.group_name to match their assigned group.
// Run this after any bulk changes so all students see their group immediately.
window.pushGroupsToAllProfiles = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var allMembers = window._allGroupMembers || [];
  var allGroups  = window._geramaGroups   || [];
  if(!allMembers.length){ alert('No group members found. Load groups first.'); return; }

  if(!confirm('Push group assignments to all '+allMembers.length+' member profile(s)? Students will see their group immediately after this.')) return;

  var groupMap = {};
  allGroups.forEach(function(g){ groupMap[g.id] = g.name; });

  var ok = 0, fail = 0;
  for(var i = 0; i < allMembers.length; i++){
    var m = allMembers[i];
    var gName = groupMap[m.group_id];
    if(!gName || !m.user_email) continue;
    try{
      var {error} = await sb.from('user_profiles').update({ group_name: gName }).eq('email', m.user_email);
      if(!error) ok++; else fail++;
    }catch(e){ fail++; }
  }

  window.logActivity('Pushed group names to '+ok+' user profiles'+(fail>0?' ('+fail+' failed)':''));
  alert('✅ Done! Group names pushed to '+ok+' student profile'+(ok!==1?'s':'')+'. Students will see their group on next login or page refresh.'+(fail>0?'\n⚠️ '+fail+' failed — check console.':''));
  window.loadGroups();
};

// ─── DELETE GROUP ─────────────────────────────────────────────────────────────
window.deleteGroup = async function(groupId, groupName){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected to database.'); return; }

  // Always fetch fresh member count from DB
  var members = [];
  try{
    var memRes = await sb.from('gerama_group_members').select('*').eq('group_id', groupId);
    members = memRes.data || [];
  }catch(e){ members = (window._allGroupMembers||[]).filter(function(m){ return m.group_id === groupId; }); }

  var memberCount = members.length;
  var msg = '⚠️ Delete group "'+groupName+'"?';
  if(memberCount > 0) msg += '\n\nThis group has '+memberCount+' member'+(memberCount!==1?'s':'')+'. They will be UNASSIGNED.';
  msg += '\n\nEnter the admin code to confirm deletion:';

  var code = window.prompt(msg);
  if(!code) return;
  if(code.trim() !== '2026GERAMA'){
    alert('❌ Wrong code. Deletion cancelled.\n\nHint: The code is 2026GERAMA');
    return;
  }

  try{
    if(memberCount > 0){
      for(var i=0;i<members.length;i++){
        try{ await sb.from('user_profiles').update({ group_name: null }).eq('email', members[i].user_email); }catch(e){}
      }
      await sb.from('gerama_group_members').delete().eq('group_id', groupId);
    }
    var {error} = await sb.from('gerama_groups').delete().eq('id', groupId);
    if(error){ alert('Error deleting group: '+error.message); return; }
    window.logActivity('Deleted group: '+groupName+(memberCount>0?' ('+memberCount+' members unassigned)':''));
    alert('✅ Group "'+groupName+'" deleted.'+(memberCount>0?' '+memberCount+' member'+(memberCount!==1?'s':'')+' unassigned.':''));
    window.loadGroups();
  }catch(e){ alert('Error: '+e.message); }
};

// ─── BULK ASSIGN MEMBERS BY NAME ──────────────────────────────────────────────
// Admin pastes/types up to ~50 student names, system matches them against
// registered user_profiles and assigns them to the chosen group.
window.openBulkAssignModal = function(groupId, groupName){
  var existing = document.getElementById('bulkAssignModal');
  if(existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'bulkAssignModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:5000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);overflow-y:auto;';
  modal.innerHTML =
    '<div style="background:white;border-radius:20px;padding:2rem;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">'+
        '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;gap:0.5rem;"><i class="fas fa-users" style="color:#1B5E20;"></i> Bulk Assign to <span style="color:#1B5E20;">'+window.escHtml(groupName)+'</span></div>'+
        '<button onclick="document.getElementById(\'bulkAssignModal\').remove()" style="background:#f1f5f9;border:none;color:#374151;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>'+
      '</div>'+
      '<p style="font-size:0.85rem;color:#6b7280;margin-bottom:1rem;line-height:1.6;">'+
        'Enter one student name <strong>per line</strong> (or paste from a list). The system will match names against registered students.'+
      '</p>'+
      '<textarea id="bulkNamesInput" placeholder="John Kwame&#10;Ama Serwaa&#10;Kofi Mensah&#10;..." '+
        'style="width:100%;height:180px;border:2px solid #c8e6c9;border-radius:12px;padding:0.8rem;font-family:\'Inter\',sans-serif;font-size:0.88rem;resize:vertical;outline:none;box-sizing:border-box;"'+
        'onfocus="this.style.borderColor=\'#1B5E20\'" onblur="this.style.borderColor=\'#c8e6c9\'"></textarea>'+
      '<div style="display:flex;align-items:center;gap:0.6rem;margin-top:0.8rem;padding:0.7rem 0.9rem;background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">'+
        '<input type="checkbox" id="bulkReplaceAll" style="width:16px;height:16px;cursor:pointer;accent-color:#1B5E20;">'+
        '<label for="bulkReplaceAll" style="font-size:0.85rem;font-weight:600;color:#92400e;cursor:pointer;">'+
          '⚠️ Replace all current members in this group with the new list'+
        '</label>'+
      '</div>'+
      '<div id="bulkAssignPreview" style="margin-top:0.8rem;min-height:2rem;"></div>'+
      '<div style="display:flex;gap:0.7rem;margin-top:1rem;flex-wrap:wrap;">'+
        '<button onclick="previewBulkAssign(\''+window.escAttr(groupId)+'\')" style="background:#f1f5f9;color:#374151;border:1px solid #e5e7eb;padding:0.6rem 1.2rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-search"></i> Preview Match</button>'+
        '<button onclick="confirmBulkAssign(\''+window.escAttr(groupId)+'\',\''+window.escAttr(groupName)+'\')" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;gap:0.4rem;flex:1;justify-content:center;"><i class="fas fa-user-plus"></i> Assign to Group</button>'+
        '<button onclick="document.getElementById(\'bulkAssignModal\').remove()" style="background:#fee2e2;color:#dc2626;border:none;padding:0.6rem 1rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>'+
      '</div>'+
      '<div id="bulkAssignStatus" style="margin-top:0.8rem;font-size:0.85rem;min-height:1rem;"></div>'+
    '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
  setTimeout(function(){ var ta=document.getElementById('bulkNamesInput'); if(ta) ta.focus(); }, 100);
};

window.previewBulkAssign = function(groupId){
  var raw = (document.getElementById('bulkNamesInput').value||'').trim();
  var preview = document.getElementById('bulkAssignPreview');
  if(!raw){ if(preview) preview.innerHTML=''; return; }

  var lines = raw.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l.length>1; });
  var allUsers = window._allUsers || [];
  var results = [];

  lines.forEach(function(name){
    var nameLow = name.toLowerCase();
    // Try exact match first, then partial
    var match = allUsers.find(function(u){
      return (u.full_name||'').toLowerCase() === nameLow;
    }) || allUsers.find(function(u){
      return (u.full_name||'').toLowerCase().includes(nameLow) || nameLow.includes((u.full_name||'').toLowerCase().split(' ')[0]);
    });
    results.push({ input: name, match: match || null });
  });

  var found = results.filter(function(r){ return r.match; });
  var notFound = results.filter(function(r){ return !r.match; });

  var html = '<div style="border:1px solid #e8f5e9;border-radius:12px;padding:0.9rem;background:#f9fdf9;">';
  html += '<div style="font-size:0.82rem;font-weight:700;color:#1B5E20;margin-bottom:0.5rem;"><i class="fas fa-check-circle"></i> '+found.length+' matched · <span style="color:#dc2626;">'+notFound.length+' not found</span></div>';
  html += found.map(function(r){
    var u = r.match;
    return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0;font-size:0.8rem;">'+
      '<i class="fas fa-user-check" style="color:#059669;"></i>'+
      '<span style="font-weight:600;">'+window.escHtml(u.full_name||u.email)+'</span>'+
      (u.index_number?'<span style="color:#9ca3af;font-size:0.72rem;">'+window.escHtml(u.index_number)+'</span>':'')+
      (u.level?'<span style="background:#e8f5e9;color:#1B5E20;font-size:0.68rem;font-weight:700;padding:0.05rem 0.4rem;border-radius:8px;">'+window.escHtml(u.level)+'</span>':'')+
    '</div>';
  }).join('');
  if(notFound.length){
    html += '<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid #fde8d8;">';
    html += notFound.map(function(r){
      return '<div style="font-size:0.78rem;color:#dc2626;display:flex;align-items:center;gap:0.4rem;padding:0.2rem 0;">'+
        '<i class="fas fa-user-times"></i>'+
        '<span>'+window.escHtml(r.input)+' — not found in registered members</span>'+
      '</div>';
    }).join('');
    html += '</div>';
  }
  html += '</div>';
  if(preview) preview.innerHTML = html;
  window._bulkAssignResults = results;
};

window.confirmBulkAssign = async function(groupId, groupName){
  var statusEl = document.getElementById('bulkAssignStatus');
  function setStatus(msg, ok){ if(statusEl){ statusEl.textContent=msg; statusEl.style.color=ok?'#059669':'#dc2626'; } }

  // Run preview if not done yet
  window.previewBulkAssign(groupId);
  var results = window._bulkAssignResults;
  if(!results || !results.length){ setStatus('Please enter names and click Preview Match first.', false); return; }

  var toAssign = results.filter(function(r){ return r.match; });
  if(!toAssign.length){ setStatus('No matching students found. Check names against registered members.', false); return; }

  var replaceAll = document.getElementById('bulkReplaceAll').checked;
  var sb = window.geramaSupabase; if(!sb){ setStatus('Not connected.', false); return; }

  setStatus('Processing...', true);

  try{
    // ── If Replace All: clear existing members first ──
    if(replaceAll){
      // Get current members to clear their profiles
      var {data: current} = await sb.from('gerama_group_members').select('user_email').eq('group_id', groupId);
      (current||[]).forEach(async function(m){
        try{ await sb.from('user_profiles').update({group_name:null}).eq('email',m.user_email); }catch(e){}
      });
      await sb.from('gerama_group_members').delete().eq('group_id', groupId);
      window.logActivity('Cleared all members from '+groupName+' for bulk replace');
    }

    // Get existing members (after potential clear) to avoid duplicates
    var {data: existingMems} = await sb.from('gerama_group_members').select('user_email').eq('group_id', groupId);
    var existingSet = {};
    (existingMems||[]).forEach(function(m){ if(m.user_email) existingSet[m.user_email.toLowerCase().trim()]=true; });

    // Get the group info for updating profiles
    var group = (window._geramaGroups||[]).find(function(g){ return g.id===groupId; });

    var added=0, skipped=0, errors=0;
    for(var i=0; i<toAssign.length; i++){
      var u = toAssign[i].match;
      var emailKey = (u.email||'').toLowerCase().trim();
      if(existingSet[emailKey]){ skipped++; continue; }
      try{
        await sb.from('gerama_group_members').insert({
          group_id: groupId,
          user_email: u.email,
          user_name: u.full_name || u.email,
          role: 'member',
          assigned_at: new Date().toISOString()
        });
        if(group) await sb.from('user_profiles').update({group_name:group.name}).eq('email',u.email);
        existingSet[emailKey]=true;
        added++;
      }catch(e){ errors++; }
    }

    window.logActivity('Bulk assigned '+added+' members to '+groupName+(skipped?' ('+skipped+' already in group)':'')+(replaceAll?' [replaced all]':''));
    setStatus('✅ '+added+' member'+(added!==1?'s':'')+' assigned!'+(skipped?' '+skipped+' already in group, skipped.':'')+(errors?' '+errors+' errors.':''), true);
    setTimeout(function(){ document.getElementById('bulkAssignModal').remove(); window.loadGroups(); }, 1800);

  }catch(e){ setStatus('❌ '+e.message, false); }
};

// ─── ATTENDANCE-BASED SHUFFLE ─────────────────────────────────────────────────
// Fetches students from a selected attendance session, shuffles them randomly,
// and distributes them evenly across all study groups.
window.openAttendanceShuffleModal = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var existing = document.getElementById('attShuffleModal');
  if(existing) existing.remove();

  // Fetch attendance sessions
  var {data: sessions} = await sb.from('attendance_sessions')
    .select('id,class_title,code,created_at')
    .order('created_at',{ascending:false})
    .limit(30);
  sessions = sessions||[];

  var modal = document.createElement('div');
  modal.id = 'attShuffleModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:5000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);overflow-y:auto;';

  var sessionOptions = sessions.length
    ? sessions.map(function(s){
        var dt = s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
        return '<option value="'+window.escAttr(s.id)+'">'+window.escHtml(s.class_title||'Session')+(dt?' · '+dt:'')+(s.code?' ['+s.code+']':'')+'</option>';
      }).join('')
    : '<option value="">No sessions found</option>';

  modal.innerHTML =
    '<div style="background:white;border-radius:20px;padding:2rem;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">'+
        '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;gap:0.5rem;"><i class="fas fa-random" style="color:#6366f1;"></i> Shuffle from Attendance</div>'+
        '<button onclick="document.getElementById(\'attShuffleModal\').remove()" style="background:#f1f5f9;border:none;color:#374151;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>'+
      '</div>'+
      '<p style="font-size:0.85rem;color:#6b7280;margin-bottom:1rem;line-height:1.6;">'+
        'Select an attendance session. All students who signed that session will be fetched, shuffled randomly, and distributed equally across all 5 (or 6) study groups.'+
      '</p>'+
      '<div style="margin-bottom:0.8rem;">'+
        '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Select Attendance Session</label>'+
        '<select id="shuffleSessionId" style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.88rem;outline:none;font-family:\'Inter\',sans-serif;" onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e5e7eb\'">'+
          sessionOptions+
        '</select>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.8rem;padding:0.7rem 0.9rem;background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">'+
        '<input type="checkbox" id="shuffleClearFirst" checked style="width:16px;height:16px;cursor:pointer;accent-color:#6366f1;">'+
        '<label for="shuffleClearFirst" style="font-size:0.85rem;font-weight:600;color:#92400e;cursor:pointer;">'+
          '⚠️ Clear all existing group members before shuffling (fresh groupings)'+
        '</label>'+
      '</div>'+
      '<button onclick="previewAttendanceShuffle()" style="background:#f5f3ff;color:#6366f1;border:1px solid #c4b5fd;padding:0.6rem 1.2rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;gap:0.4rem;margin-bottom:0.8rem;"><i class="fas fa-eye"></i> Preview Shuffle</button>'+
      '<div id="shufflePreview" style="margin-bottom:0.8rem;"></div>'+
      '<div style="display:flex;gap:0.7rem;flex-wrap:wrap;">'+
        '<button onclick="executeAttendanceShuffle()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;flex:1;justify-content:center;display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-random"></i> Execute Shuffle</button>'+
        '<button onclick="document.getElementById(\'attShuffleModal\').remove()" style="background:#fee2e2;color:#dc2626;border:none;padding:0.6rem 1rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>'+
      '</div>'+
      '<div id="shuffleStatus" style="margin-top:0.8rem;font-size:0.85rem;min-height:1rem;"></div>'+
    '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
};

window.previewAttendanceShuffle = async function(){
  var preview = document.getElementById('shufflePreview');
  var statusEl = document.getElementById('shuffleStatus');
  var sessionId = document.getElementById('shuffleSessionId').value;
  if(!sessionId){ if(preview) preview.innerHTML='<p style="color:#dc2626;font-size:0.85rem;">Please select a session.</p>'; return; }

  var sb = window.geramaSupabase; if(!sb) return;
  if(preview) preview.innerHTML='<p style="color:#9ca3af;font-size:0.82rem;"><i class="fas fa-spinner fa-spin"></i> Fetching attendees…</p>';

  var {data:records} = await sb.from('attendance_records').select('student_email,student_name').eq('session_id', sessionId);
  records = records||[];

  if(!records.length){
    preview.innerHTML='<p style="color:#dc2626;font-size:0.85rem;">No attendance records found for this session.</p>';
    return;
  }

  var groups = window._geramaGroups || [];
  var numGroups = groups.length || 5;
  var perGroup = Math.ceil(records.length / numGroups);

  window._shuffleAttendees = records;

  preview.innerHTML =
    '<div style="background:#f5f3ff;border-radius:12px;padding:0.9rem;border:1px solid #c4b5fd;">'+
      '<div style="font-size:0.82rem;font-weight:700;color:#6366f1;margin-bottom:0.4rem;">'+
        '<i class="fas fa-users"></i> '+records.length+' attendees → '+numGroups+' groups (~'+perGroup+' per group)'+
      '</div>'+
      '<div style="font-size:0.78rem;color:#6b7280;">'+
        records.slice(0,8).map(function(r){ return window.escHtml(r.student_name||r.student_email); }).join(', ')+
        (records.length>8?'… and '+(records.length-8)+' more':'.')+
      '</div>'+
    '</div>';
};

window.executeAttendanceShuffle = async function(){
  var statusEl = document.getElementById('shuffleStatus');
  function setStatus(msg, ok){ if(statusEl){ statusEl.textContent=msg; statusEl.style.color=ok?'#059669':'#dc2626'; } }

  var attendees = window._shuffleAttendees;
  if(!attendees||!attendees.length){ setStatus('Run Preview first.', false); return; }

  var sb = window.geramaSupabase; if(!sb){ setStatus('Not connected.', false); return; }
  var groups = window._geramaGroups;
  if(!groups||!groups.length){ setStatus('No groups found. Load groups panel first.', false); return; }

  var clearFirst = document.getElementById('shuffleClearFirst').checked;
  setStatus('Shuffling…', true);

  try{
    // ── 1. Optionally clear existing members ──
    if(clearFirst){
      for(var g=0;g<groups.length;g++){
        var {data:cur} = await sb.from('gerama_group_members').select('user_email').eq('group_id',groups[g].id);
        (cur||[]).forEach(async function(m){ try{ await sb.from('user_profiles').update({group_name:null}).eq('email',m.user_email); }catch(e){} });
        await sb.from('gerama_group_members').delete().eq('group_id',groups[g].id);
      }
    }

    // ── 2. Shuffle attendees randomly ──
    var shuffled = attendees.slice();
    for(var i=shuffled.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var tmp=shuffled[i]; shuffled[i]=shuffled[j]; shuffled[j]=tmp;
    }

    // ── 3. Distribute evenly across groups ──
    var assigned=0, errors=0;
    for(var k=0;k<shuffled.length;k++){
      var att = shuffled[k];
      var targetGroup = groups[k % groups.length];
      var email = att.student_email;
      if(!email) continue;
      try{
        // Get full user details
        var user = (window._allUsers||[]).find(function(u){ return u.email===email; });
        var name = att.student_name || (user&&user.full_name) || email;
        await sb.from('gerama_group_members').insert({
          group_id: targetGroup.id,
          user_email: email,
          user_name: name,
          role: 'member',
          assigned_at: new Date().toISOString()
        });
        await sb.from('user_profiles').update({group_name:targetGroup.name}).eq('email',email);
        assigned++;
      }catch(e){ errors++; }
    }

    window.logActivity('Attendance shuffle: '+assigned+' students distributed across '+groups.length+' groups'+(errors?' ('+errors+' errors)':''));
    setStatus('✅ Done! '+assigned+' students shuffled into '+groups.length+' groups.'+(errors?' '+errors+' errors.':''), true);
    setTimeout(function(){ document.getElementById('attShuffleModal').remove(); window.loadGroups(); }, 2000);

  }catch(e){ setStatus('❌ '+e.message, false); }
};

window.randomlyAssignAll = async function(){
  var sb = window.geramaSupabase; if(!sb) return;
  var allUsers = window._allUsers || [];
  var allMembers = window._allGroupMembers || [];
  var groups = window._geramaGroups || [];
  if(!groups.length){ alert('No groups found. Please refresh.'); return; }

  // ── Only assign L100 students ──
  var l100Users = allUsers.filter(function(u){ return u.level === 'L100'; });

  // Find already-assigned emails (deduplicated: treat any duplicate as assigned)
  var assignedEmailSet = {};
  allMembers.forEach(function(m){ if(m.user_email) assignedEmailSet[m.user_email.toLowerCase().trim()] = true; });

  // ── Remove duplicate entries from gerama_group_members ──
  // (same email assigned multiple times — keep first by assigned_at, delete rest)
  var emailFirstSeen = {};
  var duplicateIds = [];
  allMembers.forEach(function(m){
    var key = (m.user_email||'').toLowerCase().trim();
    if(!key) return;
    if(!emailFirstSeen[key]){
      emailFirstSeen[key] = m.id;
    } else {
      duplicateIds.push(m.id);
    }
  });

  if(duplicateIds.length){
    var removedDups = 0;
    for(var d=0;d<duplicateIds.length;d++){
      try{
        await sb.from('gerama_group_members').delete().eq('id', duplicateIds[d]);
        removedDups++;
      }catch(e){}
    }
    if(removedDups) window.logActivity('Removed '+removedDups+' duplicate group member entries');
    // Refresh assignedEmailSet after dedup
    var {data: freshMembers} = await sb.from('gerama_group_members').select('user_email');
    assignedEmailSet = {};
    (freshMembers||[]).forEach(function(m){ if(m.user_email) assignedEmailSet[m.user_email.toLowerCase().trim()] = true; });
  }

  // Unassigned L100 users only
  var unassigned = l100Users.filter(function(u){ return !assignedEmailSet[(u.email||'').toLowerCase().trim()]; });

  if(!unassigned.length){
    var msg = 'All L100 students are already assigned to groups.';
    if(l100Users.length < allUsers.length) msg += '\n\nNote: '+(allUsers.length - l100Users.length)+' non-L100 students were skipped (groups are L100 only for now).';
    alert(msg);
    window.loadGroups();
    return;
  }

  var skipMsg = l100Users.length < allUsers.length ? '\n\n(Non-L100 students are skipped — groups are L100 only for now)' : '';
  if(!confirm('Auto-assign '+unassigned.length+' unassigned L100 member'+(unassigned.length!==1?'s':'')+' to groups (max '+GROUP_MAX+' per group, gender-balanced)?'+skipMsg)) return;

  // Separate by gender for balanced distribution
  var females = unassigned.filter(function(u){ return (u.gender||'').toLowerCase()==='female'; });
  var males = unassigned.filter(function(u){ return (u.gender||'').toLowerCase()==='male'; });
  var others = unassigned.filter(function(u){ var g=(u.gender||'').toLowerCase(); return g!=='female'&&g!=='male'; });

  // Shuffle each sub-list
  function shuffle(arr){ return arr.slice().sort(function(){ return Math.random()-0.5; }); }
  females = shuffle(females); males = shuffle(males); others = shuffle(others);

  // Interleave: female, male, female, male, … then others
  var ordered = [];
  var fi=0, mi=0;
  while(fi<females.length || mi<males.length){
    if(fi<females.length) ordered.push(females[fi++]);
    if(mi<males.length) ordered.push(males[mi++]);
  }
  ordered = ordered.concat(others);

  // Calculate current counts per group
  var groupCounts = {};
  groups.forEach(function(g){ groupCounts[g.id] = allMembers.filter(function(m){ return m.group_id===g.id; }).length; });

  var assigned = 0, errors = 0;
  for(var i=0;i<ordered.length;i++){
    var user = ordered[i];
    // Find group with least members and < GROUP_MAX
    var targetGroup = groups.reduce(function(best, g){
      if(groupCounts[g.id] >= GROUP_MAX) return best;
      if(!best) return g;
      return groupCounts[g.id] < groupCounts[best.id] ? g : best;
    }, null);

    if(!targetGroup){ alert('All groups are full ('+GROUP_MAX+' members each). Could not assign all members.'); break; }

    try{
      await sb.from('gerama_group_members').insert({
        group_id: targetGroup.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'member',
        assigned_at: new Date().toISOString()
      });
      try{ await sb.from('user_profiles').update({ group_name: targetGroup.name }).eq('email', user.email); }catch(e){}
      groupCounts[targetGroup.id]++;
      assigned++;
    }catch(e){ errors++; }
  }

  window.logActivity('Auto-assigned '+assigned+' members to groups (gender-balanced)');
  alert('✅ Done! '+assigned+' member'+(assigned!==1?'s':'')+' assigned with gender balance.'+(errors?' ('+errors+' failed)':''));
  window.loadGroups();
};

window.downloadGroupsCSV = function(){
  var groups = window._geramaGroups || [];
  var members = window._allGroupMembers || [];
  var users = window._allUsers || [];
  if(!members.length){ alert('No members assigned yet.'); return; }

  var groupMap = {};
  groups.forEach(function(g){ groupMap[g.id] = g.name; });
  var userMap = {};
  users.forEach(function(u){ userMap[u.email] = u; });

  var headers = ['Group','Member Name','Index Number','Email','Role','Gender','Assigned At'];
  var rows = members.map(function(m){
    var uInfo = userMap[m.user_email] || {};
    var idx = m.index_number || uInfo.index_number || '';
    var gender = uInfo.gender || '';
    return [
      groupMap[m.group_id]||'—',
      m.user_name||'', idx, m.user_email||'',
      m.role||'member', gender,
      m.assigned_at ? new Date(m.assigned_at).toLocaleDateString('en-GB') : ''
    ].map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_AllGroups_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Downloaded all groups CSV');
};

// ── Export a single group ──────────────────────────────────────
window.downloadSingleGroupCSV = function(groupId, groupName){
  var members = (window._allGroupMembers || []).filter(function(m){ return m.group_id === groupId; });
  var users = window._allUsers || [];
  if(!members.length){ alert('No members in this group yet.'); return; }

  var userMap = {};
  users.forEach(function(u){ userMap[u.email] = u; });

  // Sort: tutors first, then alphabetically
  var tutors = members.filter(function(m){ return m.role==='tutor'; });
  var regulars = members.filter(function(m){ return m.role!=='tutor'; });
  tutors.sort(function(a,b){ return (a.user_name||'').localeCompare(b.user_name||''); });
  regulars.sort(function(a,b){ return (a.user_name||'').localeCompare(b.user_name||''); });
  var sorted = tutors.concat(regulars);

  var headers = ['#','Member Name','Index Number','Email','Role','Gender','Assigned At'];
  var rows = sorted.map(function(m, i){
    var uInfo = userMap[m.user_email] || {};
    var idx = m.index_number || uInfo.index_number || '';
    var gender = uInfo.gender || '';
    return [
      i+1, m.user_name||'', idx, m.user_email||'',
      m.role||'member', gender,
      m.assigned_at ? new Date(m.assigned_at).toLocaleDateString('en-GB') : ''
    ].map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='GERAMA_'+groupName.replace(/\s+/g,'_')+'_'+new Date().toISOString().split('T')[0]+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.logActivity('Exported group: '+groupName);
};

// ── Show Add New Group modal ───────────────────────────────────
window.showAddGroupModal = function(){
  var modal = document.getElementById('addGroupModal');
  if(modal) modal.style.display = 'flex';
};

// ── Create a new group ────────────────────────────────────────
window.createNewGroup = async function(){
  var nameEl = document.getElementById('newGroupName');
  var colorEl = document.getElementById('newGroupColor');
  var statusEl = document.getElementById('addGroupStatus');
  var name = (nameEl && nameEl.value || '').trim();
  var color = (colorEl && colorEl.value) || '#0f766e';
  if(!name){ if(statusEl){ statusEl.textContent='Please enter a group name.'; statusEl.style.color='#dc2626'; } return; }
  var sb = window.geramaSupabase; if(!sb) return;
  if(statusEl){ statusEl.textContent='Creating...'; statusEl.style.color='#6b7280'; }
  var {error} = await sb.from('gerama_groups').insert({ name: name, color: color, created_at: new Date().toISOString() });
  if(error){ if(statusEl){ statusEl.textContent='❌ '+error.message; statusEl.style.color='#dc2626'; } return; }
  if(statusEl){ statusEl.textContent='✅ Group created!'; statusEl.style.color='#059669'; }
  window.logActivity('Created new group: '+name);
  setTimeout(function(){
    var modal = document.getElementById('addGroupModal');
    if(modal) modal.style.display='none';
    if(nameEl) nameEl.value='';
    window.loadGroups();
  }, 800);
};

// ── Rebalance: move excess members (> GROUP_MAX) to a target group, gender-balanced ──
window.rebalanceGroups = async function(){
  var sb = window.geramaSupabase; if(!sb) return;
  var groups = window._geramaGroups || [];
  var allMembers = window._allGroupMembers || [];
  var allUsers = window._allUsers || [];
  var userMap = {};
  allUsers.forEach(function(u){ userMap[u.email]=u; });

  if(!groups.length){ alert('Load groups first.'); return; }

  // Find Group F (the target for excess members)
  var groupF = groups.find(function(g){ return /team\s+gerama\s+f/i.test(g.name) || /gerama\s+f/i.test(g.name) || /team\s+f/i.test(g.name); });
  if(!groupF){ alert('Group F not found. Make sure it exists.'); return; }

  // Find groups over GROUP_MAX
  var overflows = [];
  groups.forEach(function(g){
    if(g.id === groupF.id) return;
    var members = allMembers.filter(function(m){ return m.group_id === g.id && m.role !== 'tutor'; });
    var excess = members.length - GROUP_MAX;
    if(excess > 0){
      // Sort: pick members without index numbers first (less established), then alphabetically
      members.sort(function(a,b){
        var aIdx = (userMap[a.user_email]||{}).index_number || '';
        var bIdx = (userMap[b.user_email]||{}).index_number || '';
        if(!aIdx && bIdx) return -1;
        if(aIdx && !bIdx) return 1;
        return (a.user_name||'').localeCompare(b.user_name||'');
      });
      // Pick `excess` members to move — gender-balanced: pick roughly equal males/females
      var females = members.filter(function(m){ return ((userMap[m.user_email]||{}).gender||'').toLowerCase()==='female'; });
      var males = members.filter(function(m){ return ((userMap[m.user_email]||{}).gender||'').toLowerCase()==='male'; });
      var others2 = members.filter(function(m){ var g=((userMap[m.user_email]||{}).gender||'').toLowerCase(); return g!=='female'&&g!=='male'; });
      var toMove = [];
      var fi2=0, mi2=0, oi=0;
      while(toMove.length < excess){
        var added = false;
        if(fi2 < females.length && toMove.length < excess){ toMove.push(females[fi2++]); added=true; }
        if(mi2 < males.length && toMove.length < excess){ toMove.push(males[mi2++]); added=true; }
        if(!added){
          if(oi<others2.length && toMove.length < excess) toMove.push(others2[oi++]);
          else break;
        }
      }
      overflows = overflows.concat(toMove);
    }
  });

  if(!overflows.length){ alert('All groups are already at or below '+GROUP_MAX+' members. No rebalancing needed.'); return; }

  var curF = allMembers.filter(function(m){ return m.group_id === groupF.id; }).length;
  if(curF + overflows.length > 30){ alert('Group F would exceed 30 members. Please create another group first.'); return; }

  if(!confirm('Move '+overflows.length+' member(s) to '+groupF.name+' to rebalance? This will be gender-balanced.')) return;

  var ok=0;
  for(var i=0;i<overflows.length;i++){
    var m = overflows[i];
    var {error} = await sb.from('gerama_group_members')
      .update({ group_id: groupF.id, assigned_at: new Date().toISOString() })
      .eq('id', m.id);
    if(!error){
      try{ await sb.from('user_profiles').update({ group_name: groupF.name }).eq('email', m.user_email); }catch(e){}
      ok++;
    }
  }
  window.logActivity('Rebalanced groups: moved '+ok+' members to '+groupF.name);
  alert('✅ Done! '+ok+' member(s) moved to '+groupF.name+'. Groups are now balanced.');
  window.loadGroups();
};

// ─── QUICK MEMBER LOOKUP (Overview panel) ────────────────────────
window.quickMemberLookup = async function(q) {
  var el = document.getElementById('quickMemberResults');
  if (!el) return;
  q = (q || '').trim();
  if (q.length < 2) { el.innerHTML = ''; return; }

  var sb = window.geramaSupabase;
  if (!sb) return;

  try {
    var { data } = await sb.from('user_profiles')
      .select('full_name, email, index_number, level, program')
      .or('full_name.ilike.%' + q + '%,email.ilike.%' + q + '%,index_number.ilike.%' + q + '%')
      .eq('is_active', true)
      .limit(6);

    if (!data || !data.length) {
      el.innerHTML = '<p style="font-size:0.82rem;color:#9ca3af;padding:0.5rem 0;">No members found.</p>';
      return;
    }

    // Also fetch group info for the matched users
    var emails = data.map(function(u) { return u.email; });
    var gmMap = {};
    try {
      var { data: gmData } = await sb.from('gerama_group_members')
        .select('user_email, role, gerama_groups(name, color)')
        .in('user_email', emails);
      (gmData || []).forEach(function(gm) {
        gmMap[gm.user_email] = {
          name: (gm.gerama_groups && gm.gerama_groups.name) || '',
          color: (gm.gerama_groups && gm.gerama_groups.color) || '#1B5E20',
          role: gm.role || 'member'
        };
      });
    } catch (e) {}

    el.innerHTML = '<div style="display:grid;gap:0.5rem;margin-top:0.2rem;">' +
      data.map(function(u) {
        var gm = gmMap[u.email] || {};
        var groupBadge = gm.name
          ? '<span style="background:' + (gm.color || '#1B5E20') + '22;color:' + (gm.color || '#1B5E20') + ';font-size:0.7rem;font-weight:700;padding:0.1rem 0.5rem;border-radius:10px;margin-left:0.4rem;">' +
            window.escHtml(gm.name) + (gm.role === 'tutor' ? ' · Tutor' : '') + '</span>'
          : '<span style="background:#f1f5f9;color:#9ca3af;font-size:0.7rem;padding:0.1rem 0.5rem;border-radius:10px;margin-left:0.4rem;">Unassigned</span>';
        return '<div style="background:#f8fafc;border-radius:10px;padding:0.6rem 0.9rem;display:flex;align-items:center;gap:0.8rem;border:1px solid #e5e7eb;">' +
          '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;flex-shrink:0;">' +
            window.escHtml((u.full_name || u.email || '?').charAt(0).toUpperCase()) +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.88rem;font-weight:700;color:#1e2a3e;">' +
              window.escHtml(u.full_name || '—') + groupBadge +
            '</div>' +
            '<div style="font-size:0.75rem;color:#6b7280;">' +
              window.escHtml(u.email) +
              (u.index_number ? ' &nbsp;·&nbsp; <span style="font-family:monospace;color:#1B5E20;font-weight:600;">' + window.escHtml(u.index_number) + '</span>' : '') +
              (u.level ? ' &nbsp;·&nbsp; ' + window.escHtml(u.level) : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  } catch (e) {
    el.innerHTML = '<p style="font-size:0.82rem;color:#dc2626;padding:0.5rem 0;">Error: ' + window.escHtml(e.message) + '</p>';
  }
};

// ─── ADMIN OVERVIEW: load overview stats on panel switch ─────────
(function() {
  var _origSw = window.switchPanel;
  window.switchPanel = function(name) {
    if (typeof _origSw === 'function') _origSw(name);
    if (name === 'overview') {
      // Clear quick search results when returning to overview
      var el = document.getElementById('quickMemberResults');
      if (el) el.innerHTML = '';
      var inp = document.getElementById('quickMemberSearch');
      if (inp) inp.value = '';
      // Reload live stats
      setTimeout(function(){ if(window.loadOverviewStats) window.loadOverviewStats(); }, 200);
    }
  };
})();

// ─── LIVE OVERVIEW STATS (defined inside IIFE above, exposed as window.loadOverviewStats) ────
// The canonical loadOverviewStats is already assigned to window inside the main IIFE.
// Nothing extra needed here — admin-gate.js calls window.loadOverviewStats() after login.

// ═══════════════════════════════════════════════════════════════
// GERAMA CONNECT — Admin Panel Functions
// ═══════════════════════════════════════════════════════════════

window.loadConnectStats = async function(){
  var sb = window.geramaSupabase; if(!sb) return;

  // Stats
  try{
    var res = await Promise.allSettled([
      sb.from('connect_messages').select('id', {count:'exact',head:true}),
      sb.from('connect_statuses').select('id',{count:'exact',head:true}).gte('expires_at',new Date().toISOString()),
      sb.from('connect_groups').select('id',{count:'exact',head:true}),
      sb.from('user_profiles').select('id',{count:'exact',head:true}).eq('is_active',false)
    ]);
    var counts = res.map(function(r){ return (r.status==='fulfilled' && r.value && r.value.count != null) ? r.value.count : '—'; });
    ['cStatMsg','cStatStatus','cStatGroups','cStatBlocked'].forEach(function(id,i){
      var el = document.getElementById(id); if(el) el.textContent = counts[i];
    });
  }catch(e){}

  // Load recent messages
  window.loadAdminConnectMessages();
  window.loadAdminConnectStatuses();
  window.loadAdminConnectGroups();
};

window.loadAdminConnectMessages = async function(){
  var el = document.getElementById('adminConnectMessages'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
  el.innerHTML='<p style="color:#9ca3af;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';

  var {data,error} = await sb.from('connect_messages').select('*').order('created_at',{ascending:false}).limit(50);
  if(error||!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;font-size:0.85rem;text-align:center;padding:1.5rem;">No messages yet — or table not set up. <a href="connect.html" target="_blank" style="color:#0ea5e9;">Open Connect to run setup SQL →</a></p>';
    return;
  }

  var html = '<div style="display:flex;flex-direction:column;gap:0.5rem;">';
  data.forEach(function(m){
    var dt = new Date(m.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    var isGroup = m.is_group;
    var tag = isGroup
      ? '<span style="background:#ede9fe;color:#7c3aed;font-size:0.68rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:8px;">Group</span>'
      : '<span style="background:#e0f2fe;color:#0369a1;font-size:0.68rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:8px;">DM</span>';
    html += '<div style="background:#f8fafc;border-radius:10px;padding:0.6rem 0.9rem;border:1px solid #e5e7eb;display:flex;align-items:flex-start;gap:0.8rem;">'+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-size:0.82rem;font-weight:700;color:#1e2a3e;">'+tag+' <span style="color:#0369a1;">'+window.escHtml(m.sender_name||m.sender_email||'Unknown')+'</span>'+(isGroup?'':' → <span style="color:#6b7280;">'+window.escHtml(m.recipient_name||m.recipient_email||'')+'</span>')+'</div>'+
        '<div style="font-size:0.82rem;color:#374151;margin-top:0.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+window.escHtml((m.text||'').substring(0,120))+'</div>'+
        '<div style="font-size:0.7rem;color:#9ca3af;margin-top:0.15rem;">'+dt+'</div>'+
      '</div>'+
      '<button class="btn-danger" style="font-size:0.7rem;padding:0.2rem 0.5rem;flex-shrink:0;" onclick="adminDeleteConnectMsg(\''+window.escAttr(m.id)+'\')"><i class="fas fa-trash"></i></button>'+
    '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
};

window.adminDeleteConnectMsg = async function(id){
  if(!confirm('Delete this message permanently?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('connect_messages').delete().eq('id',id);
  window.logActivity('Deleted Connect message: '+id);
  window.loadAdminConnectMessages();
};

window.loadAdminConnectStatuses = async function(){
  var el = document.getElementById('adminConnectStatuses'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb) return;
  el.innerHTML='<p style="color:#9ca3af;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';

  var {data,error} = await sb.from('connect_statuses').select('*').gte('expires_at',new Date().toISOString()).order('created_at',{ascending:false});
  if(error||!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;font-size:0.85rem;text-align:center;padding:1rem;">No active statuses.</p>';
    return;
  }

  var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:0.7rem;">';
  data.forEach(function(s){
    var dt = new Date(s.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    var expires = new Date(s.expires_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    var preview = s.type==='photo'
      ? '<img src="'+window.escAttr(s.photo_url||'')+'" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-top:0.4rem;">'
      : '<div style="background:'+(s.bg||'#0369a1')+';border-radius:8px;padding:0.5rem 0.7rem;margin-top:0.4rem;font-size:0.78rem;font-weight:700;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+window.escHtml(s.text||'')+'</div>';
    html += '<div style="background:#f8fafc;border-radius:12px;padding:0.8rem;border:1px solid #e5e7eb;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;">'+
        '<div style="font-size:0.82rem;font-weight:700;color:#1e2a3e;">'+window.escHtml(s.author_name||s.author_email||'Unknown')+'</div>'+
        '<button class="btn-danger" style="font-size:0.68rem;padding:0.15rem 0.4rem;" onclick="adminDeleteConnectStatus(\''+window.escAttr(s.id)+'\')"><i class="fas fa-ban"></i> Remove</button>'+
      '</div>'+
      '<div style="font-size:0.7rem;color:#9ca3af;">Posted: '+dt+' &nbsp;·&nbsp; Expires: '+expires+'</div>'+
      preview+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
};

window.adminDeleteConnectStatus = async function(id){
  if(!confirm('Remove this status?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('connect_statuses').delete().eq('id',id);
  window.logActivity('Removed Connect status: '+id);
  window.loadAdminConnectStatuses();
};

window.loadAdminConnectGroups = async function(){
  var el = document.getElementById('adminConnectGroups'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb) return;
  el.innerHTML='<p style="color:#9ca3af;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';

  var {data,error} = await sb.from('connect_groups').select('*').order('created_at',{ascending:false});
  if(error||!data||!data.length){
    el.innerHTML='<p style="color:#9ca3af;font-size:0.85rem;text-align:center;padding:1rem;">No group chats yet.</p>';
    return;
  }

  var html='<div style="display:flex;flex-direction:column;gap:0.5rem;">';
  data.forEach(function(g){
    var dt = new Date(g.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    html += '<div class="sub-card">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(g.emoji||'💬')+' '+window.escHtml(g.name)+'</strong>'+
        '<div class="sub-meta">'+
          '<b>Created by:</b> '+window.escHtml(g.created_by||'—')+' &nbsp;·&nbsp; '+
          '<b>Members:</b> '+window.escHtml(g.member_count||0)+' &nbsp;·&nbsp; '+
          '<b>Last msg:</b> '+window.escHtml((g.last_message||'—').substring(0,40))+'<br>'+
          '<b>Created:</b> '+dt+
        '</div>'+
      '</div>'+
      '<div class="sub-actions">'+
        '<button class="btn-danger" onclick="adminDeleteConnectGroup(\''+window.escAttr(g.id)+'\',\''+window.escAttr(g.name)+'\')"><i class="fas fa-trash"></i> Delete</button>'+
      '</div>'+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
};

window.adminDeleteConnectGroup = async function(id,name){
  if(!confirm('Delete group "'+name+'" and ALL its messages?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('connect_messages').delete().eq('group_id',id);
  await sb.from('connect_groups').delete().eq('id',id);
  window.logActivity('Deleted Connect group: '+name);
  window.loadAdminConnectGroups();
  window.loadAdminConnectMessages();
};

// ══════════════════════════════════════════════════════════════
// DID YOU KNOW — ADMIN
// ══════════════════════════════════════════════════════════════

window.loadDiykAdmin = async function() {
  var sb = window.geramaSupabase; if(!sb) return;
  var pendEl    = document.getElementById('diykPendingList');
  var approvedEl = document.getElementById('diykApprovedList');
  if(pendEl)    pendEl.innerHTML    = '<p style="color:#9ca3af;">Loading...</p>';
  if(approvedEl) approvedEl.innerHTML = '<p style="color:#9ca3af;">Loading...</p>';

  try {
    var {data: pending} = await sb.from('did_you_know').select('*').eq('status','pending').order('created_at',{ascending:false});
    var {data: approved} = await sb.from('did_you_know').select('*').eq('status','approved').order('created_at',{ascending:false});
    _renderDiykList(pending||[], pendEl, 'pending');
    _renderDiykList(approved||[], approvedEl, 'approved');

    // Update badge
    var badge = document.getElementById('oppPendingBadge');
    if(badge && (pending||[]).length > 0) {
      badge.textContent = pending.length;
      badge.style.display = 'inline';
    }
  } catch(e) {
    if(pendEl) pendEl.innerHTML = '<p style="color:#9ca3af;">Error: ' + window.escHtml(e.message) + '</p>';
  }
};

function _renderDiykList(list, el, type) {
  if(!el) return;
  if(!list.length) {
    el.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;padding:0.5rem 0;">No ' + type + ' facts yet.</p>';
    return;
  }
  el.innerHTML = list.map(function(item) {
    var date = new Date(item.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    return '<div class="sub-card">' +
      '<div class="sub-info">' +
        '<strong style="font-size:0.92rem;color:#075985;">' + window.escHtml(item.fact_text||'') + '</strong>' +
        '<div class="sub-meta">' +
          (item.source ? '<b>Source:</b> ' + window.escHtml(item.source) + ' &nbsp;|&nbsp; ' : '') +
          '<b>By:</b> ' + window.escHtml(item.submitted_by||'Admin') +
          ' &nbsp;|&nbsp; <b>Date:</b> ' + window.escHtml(date) +
        '</div>' +
      '</div>' +
      '<div class="sub-actions">' +
        (type === 'pending'
          ? '<button class="btn-success" onclick="approveDiyk(\'' + window.escAttr(item.id) + '\')"><i class="fas fa-check"></i> Approve</button>'
          : '') +
        '<button class="btn-danger" onclick="deleteDiyk(\'' + window.escAttr(item.id) + '\')"><i class="fas fa-trash"></i> Delete</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

window.postDiykFact = async function() {
  var fact   = (document.getElementById('diykAdminFact').value || '').trim();
  var source = (document.getElementById('diykAdminSource').value || '').trim();
  var status = document.getElementById('diykAdminStatusSelect').value || 'approved';
  if(!fact) { window.showStatus('diykAdminStatusMsg','Please enter a fact.','err'); return; }
  var sb = window.geramaSupabase; if(!sb) return;
  try {
    await sb.from('did_you_know').insert({
      fact_text: fact,
      source: source || null,
      submitted_by: 'Admin',
      status: status,
      created_at: new Date().toISOString()
    });
    document.getElementById('diykAdminFact').value = '';
    document.getElementById('diykAdminSource').value = '';
    window.showStatus('diykAdminStatusMsg', '✅ Fact posted!', 'ok');
    window.logActivity('Added Did You Know fact');
    window.loadDiykAdmin();
  } catch(e) {
    window.showStatus('diykAdminStatusMsg', '❌ ' + e.message, 'err');
  }
};

window.approveDiyk = async function(id) {
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('did_you_know').update({status:'approved'}).eq('id', id);
  window.logActivity('Approved Did You Know fact');
  window.loadDiykAdmin();
};

window.deleteDiyk = async function(id) {
  if(!confirm('Delete this fact?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('did_you_know').delete().eq('id', id);
  window.logActivity('Deleted Did You Know fact');
  window.loadDiykAdmin();
};


// ══════════════════════════════════════════════════════════════
// OPPORTUNITIES — ADMIN
// ══════════════════════════════════════════════════════════════

window.loadAdminOpportunities = async function() {
  var sb = window.geramaSupabase; if(!sb) return;
  var pendEl   = document.getElementById('adminOppPendingList');
  var listEl   = document.getElementById('adminOppList');
  var appsEl   = document.getElementById('adminOppApplications');

  if(pendEl) pendEl.innerHTML = '<p style="color:#9ca3af;font-size:0.88rem;">Loading...</p>';
  if(listEl) listEl.innerHTML = '<p style="color:#9ca3af;font-size:0.88rem;">Loading...</p>';
  if(appsEl) appsEl.innerHTML = '<p style="color:#9ca3af;font-size:0.88rem;">Loading...</p>';

  try {
    var {data: all}     = await sb.from('opportunities').select('*').order('created_at',{ascending:false});
    var {data: apps}    = await sb.from('opportunity_applications').select('*').order('applied_at',{ascending:false}).limit(100);
    all  = all  || [];
    apps = apps || [];

    var pending  = all.filter(function(o){ return o.status === 'pending'; });
    var approved = all.filter(function(o){ return o.status === 'approved'; });
    var totalViews  = all.reduce(function(s,o){ return s + (o.view_count||0); }, 0);
    var totalApplied = apps.length;

    // Stats
    var setEl = function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
    setEl('oppStatTotal',   approved.length);
    setEl('oppStatPending', pending.length);
    setEl('oppStatViews',   totalViews);
    setEl('oppStatApplied', totalApplied);

    // Pending badge on nav
    var pb = document.getElementById('oppPendingBadge');
    if(pb) { pb.textContent = pending.length; pb.style.display = pending.length ? 'inline' : 'none'; }

    // Render pending
    if(pendEl) {
      if(!pending.length) {
        pendEl.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;">No pending submissions.</p>';
      } else {
        pendEl.innerHTML = pending.map(function(opp) {
          return _renderAdminOppCard(opp, true);
        }).join('');
      }
    }

    // Render approved
    if(listEl) {
      if(!approved.length) {
        listEl.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;">No approved opportunities yet.</p>';
      } else {
        listEl.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Company</th><th>Type</th><th>Location</th><th>Views</th><th>Applied</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>' +
          approved.map(function(opp) {
            var oppApps = apps.filter(function(a){ return a.opportunity_id === opp.id; });
            var deadline = opp.deadline ? new Date(opp.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
            return '<tr>' +
              '<td style="font-weight:600;">' + window.escHtml(opp.company||'') + '</td>' +
              '<td><span style="background:#ede9fe;color:#5b21b6;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:20px;">' + window.escHtml(opp.type||'') + '</span></td>' +
              '<td style="font-size:0.82rem;">' + window.escHtml(opp.location||'—') + '</td>' +
              '<td style="text-align:center;">' + (opp.view_count||0) + '</td>' +
              '<td style="text-align:center;">' + oppApps.length + '</td>' +
              '<td style="font-size:0.82rem;">' + window.escHtml(deadline) + '</td>' +
              '<td style="white-space:nowrap;">' +
                '<button class="btn-danger" onclick="deleteAdminOpp(\'' + window.escAttr(opp.id) + '\',\'' + window.escAttr(opp.image_url||'') + '\')" style="font-size:0.75rem;padding:0.25rem 0.6rem;"><i class="fas fa-trash"></i></button>' +
              '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>';
      }
    }

    // Applications list
    if(appsEl) {
      if(!apps.length) {
        appsEl.innerHTML = '<p style="color:#9ca3af;font-size:0.85rem;">No applications tracked yet.</p>';
      } else {
        var oppMap = {};
        all.forEach(function(o){ oppMap[o.id] = o.company; });
        appsEl.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Opportunity</th><th>Date Applied</th><th>Status</th></tr></thead><tbody>' +
          apps.map(function(a) {
            var date = new Date(a.applied_at||a.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
            return '<tr>' +
              '<td>' + window.escHtml(a.user_name||'—') + '</td>' +
              '<td style="font-size:0.82rem;">' + window.escHtml(a.user_email||'—') + '</td>' +
              '<td>' + window.escHtml(oppMap[a.opportunity_id] || a.opportunity_id || '—') + '</td>' +
              '<td style="font-size:0.82rem;">' + window.escHtml(date) + '</td>' +
              '<td><span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:20px;">' + window.escHtml(a.status||'applied') + '</span></td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>';
      }
    }
  } catch(e) {
    if(listEl) listEl.innerHTML = '<p style="color:#9ca3af;">Error: ' + window.escHtml(e.message) + '</p>';
  }
};

function _renderAdminOppCard(opp, showApprove) {
  var date = new Date(opp.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  return '<div class="sub-card">' +
    (opp.image_url ? '<img src="' + window.escAttr(opp.image_url) + '" style="width:60px;height:50px;object-fit:cover;border-radius:8px;flex-shrink:0;" alt="">' : '') +
    '<div class="sub-info">' +
      '<strong>' + window.escHtml(opp.company||'') + ' — ' + window.escHtml(opp.location||'') + '</strong>' +
      '<div class="sub-meta">' +
        '<b>Type:</b> ' + window.escHtml(opp.type||'—') +
        (opp.deadline ? ' &nbsp;|&nbsp; <b>Deadline:</b> ' + new Date(opp.deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '') +
        '<br><b>Submitted by:</b> ' + window.escHtml(opp.submitted_by||'Admin') + ' &nbsp;|&nbsp; ' + window.escHtml(date) +
        (opp.apply_link ? '<br><a href="' + window.escAttr(opp.apply_link) + '" target="_blank" style="color:#1B5E20;font-size:0.8rem;"><i class="fas fa-external-link-alt"></i> Apply Link</a>' : '') +
      '</div>' +
    '</div>' +
    '<div class="sub-actions">' +
      (showApprove ? '<button class="btn-success" onclick="approveAdminOpp(\'' + window.escAttr(opp.id) + '\')"><i class="fas fa-check"></i> Approve</button>' : '') +
      '<button class="btn-danger" onclick="deleteAdminOpp(\'' + window.escAttr(opp.id) + '\',\'' + window.escAttr(opp.image_url||'') + '\')"><i class="fas fa-trash"></i></button>' +
    '</div>' +
  '</div>';
}

window.approveAdminOpp = async function(id) {
  var sb = window.geramaSupabase; if(!sb) return;
  await sb.from('opportunities').update({status:'approved'}).eq('id', id);
  window.logActivity('Approved opportunity: ' + id);
  window.loadAdminOpportunities();
};

window.deleteAdminOpp = async function(id, imgUrl) {
  if(!confirm('Delete this opportunity permanently?')) return;
  var sb = window.geramaSupabase; if(!sb) return;
  // Delete comments and applications too
  await sb.from('opportunity_comments').delete().eq('opportunity_id', id);
  await sb.from('opportunity_applications').delete().eq('opportunity_id', id);
  await sb.from('opportunities').delete().eq('id', id);
  window.logActivity('Deleted opportunity: ' + id);
  window.loadAdminOpportunities();
};

window.postAdminOpportunity = async function() {
  var company  = (document.getElementById('adminOppCompany').value || '').trim();
  var location = (document.getElementById('adminOppLocation').value || '').trim();
  var type     = document.getElementById('adminOppType').value;
  var link     = (document.getElementById('adminOppLink').value || '').trim();
  var mode     = (document.getElementById('adminOppMode').value || '').trim();
  var deadline = document.getElementById('adminOppDeadline').value || null;
  var desc     = (document.getElementById('adminOppDesc').value || '').trim();
  var imgFile  = document.getElementById('adminOppImgFile').files[0] || null;

  if(!company || !location || !type) { window.showStatus('adminOppStatus','Fill in Company, Location and Type.','err'); return; }

  var btn = document.querySelector('[onclick="postAdminOpportunity()"]');
  if(btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...'; }

  var sb = window.geramaSupabase;
  if(!sb) { window.showStatus('adminOppStatus','Supabase not connected.','err'); if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i> Publish Opportunity';} return; }

  var imageUrl = null;
  if(imgFile) {
    try {
      var ext = imgFile.name.split('.').pop();
      var path = 'opportunities/' + Date.now() + '-' + company.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '.' + ext;
      var up = await sb.storage.from(window.BUCKET).upload(path, imgFile, {upsert:true});
      if(!up.error) imageUrl = sb.storage.from(window.BUCKET).getPublicUrl(path).data.publicUrl;
    } catch(e) {}
  }

  try {
    await sb.from('opportunities').insert({
      company, location, type,
      apply_link: link || null,
      mode_of_application: mode || null,
      deadline: deadline || null,
      description: desc || null,
      image_url: imageUrl,
      submitted_by: 'Admin',
      submitted_by_email: 'gerama.uenr@gmail.com',
      status: 'approved',
      view_count: 0,
      apply_count: 0,
      created_at: new Date().toISOString()
    });
    window.showStatus('adminOppStatus', '✅ Opportunity published and live!', 'ok');
    window.logActivity('Posted opportunity: ' + company + ' — ' + type);
    // Clear form
    ['adminOppCompany','adminOppLocation','adminOppLink','adminOppMode','adminOppDesc'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('adminOppType').value = '';
    document.getElementById('adminOppDeadline').value = '';
    document.getElementById('adminOppImgFile').value = '';
    document.getElementById('adminOppImgChosen').textContent = '';
    document.getElementById('adminOppImgPreview').style.display = 'none';
    window.loadAdminOpportunities();
  } catch(e) {
    window.showStatus('adminOppStatus', '❌ ' + e.message, 'err');
  }
  if(btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Publish Opportunity'; }
};

window.previewAdminOppImg = function(input) {
  var f = input.files[0]; if(!f) return;
  if(f.size > 5*1024*1024) { alert('Image too large. Max 5MB.'); return; }
  document.getElementById('adminOppImgChosen').textContent = '✅ ' + f.name;
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('adminOppImgPreview');
    prev.src = e.target.result;
    prev.style.display = 'block';
  };
  reader.readAsDataURL(f);
};

// ═══════════════════════════════════════════════════════════════════════════════
// INDEX NUMBER AUTO-ASSIGNMENT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// Rules:
//  1. Only assign to members who are IN a group (gerama_group_members).
//  2. L100 tutor range UETG/ENG/26/001–012 is PROTECTED — never overwritten.
//  3. Members who already have an index number keep it (skip them).
//  4. Format: UETG/ENG/<YY>/<NNN> where YY = intake year suffix, NNN = 3-digit seq.
//  5. Year codes per level (detected from existing data, with sensible defaults):
//       L100 → 26 (intake 2025/26), L200 → 25, L300 → 24, L400 → 23
//  6. Sequences are shuffled (random order) per level so no student can infer
//     their rank from their number.
//  7. Admin password 2026GERAMA required before commit.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Year-code mapping per academic level ──────────────────────────────────────
var INDEX_YEAR_MAP = { 'L100': '26', 'L200': '25', 'L300': '24', 'L400': '23' };

// ── Protected L100 tutor range ────────────────────────────────────────────────
// These index numbers must never be reassigned or overwritten.
var PROTECTED_TUTOR_RANGE = { prefix: 'UETG/ENG/26/', start: 1, end: 12 };

function _isProtectedIndex(indexNum) {
    if (!indexNum) return false;
    var n = indexNum.toUpperCase().trim();
    var prefix = PROTECTED_TUTOR_RANGE.prefix.toUpperCase();
    if (!n.startsWith(prefix)) return false;
    var num = parseInt(n.replace(prefix, ''), 10);
    return num >= PROTECTED_TUTOR_RANGE.start && num <= PROTECTED_TUTOR_RANGE.end;
}

// ── Detect what year code is already in use for a level ───────────────────────
function _detectYearCode(users, level) {
    // Scan existing index numbers for this level to find the year segment
    var pattern = /UETG\/ENG\/(\d{2})\/\d+/i;
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (u.level === level && u.index_number) {
            var m = u.index_number.match(pattern);
            if (m) return m[1];
        }
    }
    return INDEX_YEAR_MAP[level] || '26';
}

// ── Find the highest sequence number already assigned for a level+year ────────
function _highestSeq(users, level, yearCode) {
    var prefix = ('UETG/ENG/' + yearCode + '/').toUpperCase();
    var max = 0;
    users.forEach(function(u) {
        if (u.level === level && u.index_number) {
            var n = u.index_number.toUpperCase().trim();
            if (n.startsWith(prefix)) {
                var seq = parseInt(n.replace(prefix, ''), 10);
                if (!isNaN(seq) && seq > max) max = seq;
            }
        }
    });
    return max;
}

// ── Fisher-Yates shuffle ──────────────────────────────────────────────────────
function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

// ── Format sequence as 3-digit padded ────────────────────────────────────────
function _fmtSeq(n) { return String(n).padStart(3, '0'); }

// ─── OPEN MODAL ───────────────────────────────────────────────────────────────
window.openIndexAssignModal = async function() {
    var sb = window.geramaSupabase;
    if (!sb) { alert('Not connected to database.'); return; }

    var existing = document.getElementById('indexAssignModal');
    if (existing) existing.remove();

    // Build modal shell first
    var modal = document.createElement('div');
    modal.id = 'indexAssignModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:6000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);overflow-y:auto;';
    modal.innerHTML =
        '<div style="background:white;border-radius:22px;padding:2rem;width:100%;max-width:680px;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">' +
                '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;gap:0.6rem;">' +
                    '<i class="fas fa-id-badge" style="color:#b45309;font-size:1.2rem;"></i> Assign Index Numbers' +
                '</div>' +
                '<button onclick="document.getElementById(\'indexAssignModal\').remove()" style="background:#f1f5f9;border:none;color:#374151;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>' +
            '</div>' +
            '<div style="background:#fef3c7;border-radius:12px;padding:0.9rem 1.1rem;margin-bottom:1rem;border:1px solid #fde68a;font-size:0.84rem;color:#92400e;line-height:1.6;">' +
                '<strong>⚙️ Rules applied:</strong><br>' +
                '• <strong>L100 only:</strong> all existing L100 index numbers (except tutor range 001–012) are <strong>cleared first</strong>.<br>' +
                '• L100 members <strong>in a group</strong> get a new number from <strong>013 upwards</strong>, randomly shuffled.<br>' +
                '• L100 members <strong>not in a group</strong> are left <strong>blank</strong>.<br>' +
                '• Tutor range <strong>UETG/ENG/26/001–012</strong> is never touched.<br>' +
                '• <strong>L200 / L300 / L400</strong> index numbers are never modified.' +
            '</div>' +
            '<div id="indexAssignPreviewArea" style="min-height:100px;margin-bottom:1rem;">' +
                '<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Analysing members…</p>' +
            '</div>' +
            '<div style="display:flex;gap:0.7rem;flex-wrap:wrap;">' +
                '<button onclick="window.runIndexPreview()" style="background:#f5f3ff;color:#6d28d9;border:1px solid #c4b5fd;padding:0.6rem 1.2rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;gap:0.4rem;">' +
                    '<i class="fas fa-eye"></i> Refresh Preview' +
                '</button>' +
                '<button onclick="window.commitIndexAssignment()" style="background:linear-gradient(135deg,#92400e,#b45309);color:white;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;">' +
                    '<i class="fas fa-check-circle"></i> Assign Numbers (requires password)' +
                '</button>' +
                '<button onclick="document.getElementById(\'indexAssignModal\').remove()" style="background:#fee2e2;color:#dc2626;border:none;padding:0.6rem 1rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>' +
            '</div>' +
            '<div id="indexAssignStatus" style="margin-top:0.8rem;font-size:0.85rem;min-height:1rem;text-align:center;"></div>' +
        '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });

    // Auto-run preview
    window.runIndexPreview();
};

// ─── BUILD PREVIEW ────────────────────────────────────────────────────────────
window.runIndexPreview = async function() {
    var area = document.getElementById('indexAssignPreviewArea');
    if (!area) return;
    area.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:1.5rem;"><i class="fas fa-spinner fa-spin"></i> Building preview…</p>';

    var sb = window.geramaSupabase;
    if (!sb) { area.innerHTML = '<p style="color:#dc2626;">Not connected.</p>'; return; }

    try {
        // Fresh fetch — include role from gerama_group_members to detect tutors
        var [profRes, gmRes] = await Promise.all([
            sb.from('user_profiles').select('email, full_name, level, index_number').eq('is_active', true),
            sb.from('gerama_group_members').select('user_email, group_id, role')
        ]);

        var allProfiles = profRes.data || [];
        var allGM       = gmRes.data   || [];

        // Build lookup maps
        var inGroupSet = {}; // email → true if in any group
        var isTutorSet = {}; // email → true if role=tutor
        allGM.forEach(function(m) {
            var k = (m.user_email || '').toLowerCase().trim();
            if (!k) return;
            inGroupSet[k] = true;
            if (m.role === 'tutor') isTutorSet[k] = true;
        });

        var yearCode = INDEX_YEAR_MAP['L100'] || '26'; // always '26' for L100

        // ── Categorise every L100 profile ──
        // protected  : tutor-range numbers (001-012) — never touch
        // willClear  : L100 with a non-protected index who is NOT in a group → set null
        // toAssign   : L100 in a group, no index yet (or will be cleared) → gets a new number
        // noGroup    : L100 not in a group, currently blank → stays blank (no action needed)
        var plan = {
            protected:  [],  // tutors 001-012
            toAssign:   [],  // in a group, will receive a new number
            willClear:  [],  // has a non-protected index but NOT in a group → will be blanked
            noGroup:    []   // no group, already blank → no action
        };

        allProfiles.forEach(function(u) {
            if ((u.level || '').trim() !== 'L100') return; // L200+ never touched
            var k       = (u.email || '').toLowerCase().trim();
            var inGroup = !!inGroupSet[k];

            if (u.index_number && _isProtectedIndex(u.index_number)) {
                plan.protected.push(u);  // tutor 001-012 — untouched
                return;
            }
            if (inGroup) {
                plan.toAssign.push(u);   // in group → will get a new number (old one cleared first)
            } else if (u.index_number) {
                plan.willClear.push(u);  // not in group but has a stale number → blank it
            } else {
                plan.noGroup.push(u);    // not in group, already blank → nothing to do
            }
        });

        // ── Propose new numbers for group members (random order, start at 013) ──
        var proposed  = {}; // email → new index string
        var toAssignShuffled = _shuffle(plan.toAssign);
        var seq = PROTECTED_TUTOR_RANGE.end; // start at 12 so first ++ gives 13
        toAssignShuffled.forEach(function(u) {
            seq++;
            proposed[u.email] = 'UETG/ENG/' + yearCode + '/' + _fmtSeq(seq);
        });

        window._indexAssignProposed = proposed;
        window._indexAssignPlan     = plan;
        window._indexAssignWillClear = plan.willClear.map(function(u){ return u.email; });


        // â”€â”€ Render preview â”€â”€
        var html = '';
        var totalNew = plan.toAssign.length;

        // Summary badges
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.5rem;margin-bottom:1rem;">' +
          '<div style="background:#e8f5e9;color:#1B5E20;border-radius:10px;padding:0.45rem 0.7rem;font-size:0.78rem;font-weight:700;text-align:center;">' + plan.protected.length + ' protected tutors (001â€“012)</div>' +
          '<div style="background:#dbeafe;color:#1d4ed8;border-radius:10px;padding:0.45rem 0.7rem;font-size:0.78rem;font-weight:700;text-align:center;">' + plan.toAssign.length + ' will get numbers (013+)</div>' +
          '<div style="background:#fee2e2;color:#dc2626;border-radius:10px;padding:0.45rem 0.7rem;font-size:0.78rem;font-weight:700;text-align:center;">' + plan.willClear.length + ' stale numbers cleared</div>' +
          '<div style="background:#f1f5f9;color:#6b7280;border-radius:10px;padding:0.45rem 0.7rem;font-size:0.78rem;font-weight:700;text-align:center;">' + plan.noGroup.length + ' no group â†’ stay blank</div>' +
        '</div>';

        // New assignments table
        if (plan.toAssign.length) {
            html += '<div style="margin-bottom:1rem;">' +
              '<div style="font-size:0.82rem;font-weight:700;color:#1B5E20;margin-bottom:0.4rem;"><i class="fas fa-user-check"></i> New assignments (randomly shuffled, starts at 013)</div>' +
              '<div style="border:1px solid #e8f5e9;border-radius:12px;overflow:hidden;max-height:240px;overflow-y:auto;">' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;background:#f0fdf4;padding:0.4rem 0.8rem;font-size:0.74rem;font-weight:700;color:#374151;position:sticky;top:0;">' +
                '<span>Member</span><span>Will be assigned</span>' +
              '</div>';
            plan.toAssign.forEach(function(u) {
                var idx = proposed[u.email] || 'â€”';
                html += '<div style="display:grid;grid-template-columns:1fr 1fr;padding:0.32rem 0.8rem;border-top:1px solid #f1f5f9;font-size:0.82rem;">' +
                  '<span style="color:#1e2a3e;font-weight:600;">' + window.escHtml(u.full_name || u.email) + '</span>' +
                  '<span style="color:#b45309;font-family:monospace;font-weight:700;">' + window.escHtml(idx) + '</span>' +
                '</div>';
            });
            html += '</div></div>';
        }

        // Stale / clear table
        if (plan.willClear.length) {
            html += '<div style="margin-bottom:1rem;">' +
              '<div style="font-size:0.82rem;font-weight:700;color:#dc2626;margin-bottom:0.4rem;"><i class="fas fa-eraser"></i> Stale numbers to clear (not in any group)</div>' +
              '<div style="border:1px solid #fecaca;border-radius:12px;overflow:hidden;max-height:160px;overflow-y:auto;">' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;background:#fee2e2;padding:0.4rem 0.8rem;font-size:0.74rem;font-weight:700;color:#374151;position:sticky;top:0;">' +
                '<span>Member</span><span>Current number (will be cleared)</span>' +
              '</div>';
            plan.willClear.forEach(function(u) {
                html += '<div style="display:grid;grid-template-columns:1fr 1fr;padding:0.32rem 0.8rem;border-top:1px solid #f1f5f9;font-size:0.82rem;">' +
                  '<span style="color:#1e2a3e;font-weight:600;">' + window.escHtml(u.full_name || u.email) + '</span>' +
                  '<span style="color:#dc2626;font-family:monospace;text-decoration:line-through;">' + window.escHtml(u.index_number) + '</span>' +
                '</div>';
            });
            html += '</div></div>';
        }

        // Protected tutors note
        if (plan.protected.length) {
            html += '<div style="font-size:0.78rem;color:#6b7280;padding:0.4rem 0.6rem;background:#f9fdf9;border-radius:8px;display:flex;align-items:flex-start;gap:0.4rem;">' +
              '<i class="fas fa-shield-alt" style="color:#059669;margin-top:0.1rem;"></i>' +
              '<span>Protected tutors (unchanged): ' +
              plan.protected.map(function(u){ return window.escHtml(u.full_name||u.email) + ' [' + window.escHtml(u.index_number) + ']'; }).join(' Â· ') +
              '</span>' +
            '</div>';
        }

        if (!totalNew && !plan.willClear.length) {
            html = '<div style="text-align:center;padding:2rem;background:#f0fdf4;border-radius:12px;color:#059669;font-weight:700;">' +
              '<i class="fas fa-check-circle" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>' +
              'Nothing to do â€” group members all have index numbers and no stale ones found.' +
            '</div>';
        }

        area.innerHTML = html;

    } catch(e) {
        area.innerHTML = '<p style="color:#dc2626;font-size:0.85rem;">Error: ' + window.escHtml(e.message) + '</p>';
    }
};

// â”€â”€â”€ COMMIT ASSIGNMENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.commitIndexAssignment = async function() {
    var statusEl = document.getElementById('indexAssignStatus');
    function setStatus(msg, ok) { if (statusEl) { statusEl.textContent = msg; statusEl.style.color = ok ? '#059669' : '#dc2626'; } }

    var proposed   = window._indexAssignProposed;
    var willClear  = window._indexAssignWillClear || [];

    if ((!proposed || !Object.keys(proposed).length) && !willClear.length) {
        setStatus('Run preview first â€” nothing to do.', false);
        return;
    }

    // Password gate
    var pw = window.prompt('Enter admin password to commit. This will:\nâ€¢ Clear all non-tutor L100 index numbers\nâ€¢ Reassign 013+ only to L100 group members\nâ€¢ Leave L200+ untouched');
    if (!pw) return;
    if (pw.trim() !== '2026GERAMA') {
        alert('âŒ Wrong password. Assignment cancelled.');
        return;
    }

    var sb = window.geramaSupabase;
    if (!sb) { setStatus('Not connected.', false); return; }

    var cleared = 0, assigned = 0, errors = 0;

    // â”€â”€ STEP 1: Clear stale L100 index numbers (not in any group) â”€â”€
    setStatus('Step 1/2 â€” clearing stale index numbersâ€¦', true);
    for (var i = 0; i < willClear.length; i++) {
        try {
            var { error: ce } = await sb.from('user_profiles')
                .update({ index_number: null, updated_at: new Date().toISOString() })
                .eq('email', willClear[i]);
            if (!ce) cleared++; else errors++;
        } catch(e) { errors++; }
    }

    // â”€â”€ STEP 2: Also clear any existing non-protected L100 index numbers
    //    on group members (they will be re-assigned fresh from 013) â”€â”€
    var toAssignEmails = Object.keys(proposed || {});
    for (var j = 0; j < toAssignEmails.length; j++) {
        try {
            await sb.from('user_profiles')
                .update({ index_number: null })
                .eq('email', toAssignEmails[j])
                .not('index_number', 'is', null);
        } catch(e) {}
    }

    // â”€â”€ STEP 3: Assign new numbers from 013 â”€â”€
    setStatus('Step 2/2 â€” assigning new index numbersâ€¦', true);
    for (var k = 0; k < toAssignEmails.length; k++) {
        var email  = toAssignEmails[k];
        var newIdx = proposed[email];
        try {
            // Uniqueness check
            var { data: clash } = await sb.from('user_profiles')
                .select('email')
                .eq('index_number', newIdx)
                .neq('email', email)
                .limit(1);
            if (clash && clash.length) { errors++; continue; }

            var { error: ae } = await sb.from('user_profiles')
                .update({ index_number: newIdx, updated_at: new Date().toISOString() })
                .eq('email', email);
            if (!ae) assigned++; else errors++;
        } catch(e) { errors++; }
    }

    window.logActivity(
        'Index numbers reset: ' + cleared + ' cleared (no group), ' + assigned + ' assigned (group members 013+)' +
        (errors ? ', ' + errors + ' errors' : '')
    );
    setStatus(
        'âœ… Done! ' + cleared + ' stale number' + (cleared !== 1 ? 's' : '') + ' cleared Â· ' +
        assigned + ' new number' + (assigned !== 1 ? 's' : '') + ' assigned (013+).' +
        (errors ? ' âš ï¸ ' + errors + ' errors.' : ''),
        true
    );

    setTimeout(function() {
        window.runIndexPreview();
        if (typeof window.loadRegisteredUsers === 'function') window.loadRegisteredUsers();
    }, 2000);
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADD MEMBERS — TYPEAHEAD SEARCH  (per-group inline search box)
// ─────────────────────────────────────────────────────────────────────────────

// Called on every keystroke in the per-group search box
window.filterMemberSearch = function(groupId) {
  var input = document.getElementById('addMemberSearch-' + groupId);
  var drop  = document.getElementById('addMemberDrop-' + groupId);
  if (!input || !drop) return;

  var q = input.value.trim().toLowerCase();
  drop.style.display = 'none';
  if (q.length < 1) return;

  var allUsers   = window._allUsers || [];
  var allMembers = window._allGroupMembers || [];

  // Emails already in this specific group
  var inGroup = {};
  allMembers.filter(function(m){ return m.group_id === groupId; })
    .forEach(function(m){ if (m.user_email) inGroup[m.user_email.toLowerCase().trim()] = true; });

  var matches = allUsers.filter(function(u) {
    if (inGroup[(u.email || '').toLowerCase().trim()]) return false;
    var name  = (u.full_name  || '').toLowerCase();
    var email = (u.email      || '').toLowerCase();
    var idx   = (u.index_number || '').toLowerCase();
    return name.indexOf(q) !== -1 || email.indexOf(q) !== -1 || idx.indexOf(q) !== -1;
  }).slice(0, 10);

  if (!matches.length) {
    drop.innerHTML = '<div style="padding:0.55rem 0.8rem;font-size:0.82rem;color:#9ca3af;">No matches found</div>';
    drop.style.display = 'block';
    return;
  }

  drop.innerHTML = matches.map(function(u) {
    var lvlBadge = u.level
      ? '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.68rem;font-weight:700;padding:0.1rem 0.35rem;border-radius:6px;margin-left:0.3rem;">' + window.escHtml(u.level) + '</span>'
      : '';
    var idxBadge = u.index_number
      ? '<span style="font-size:0.7rem;color:#6b7280;margin-left:0.3rem;font-family:monospace;">' + window.escHtml(u.index_number) + '</span>'
      : '';
    return '<div data-email="' + window.escAttr(u.email) + '" data-name="' + window.escAttr(u.full_name || u.email) + '"' +
      ' onmousedown="window.selectMemberSearch(\'' + groupId + '\',\'' + window.escAttr(u.email) + '\',\'' + window.escAttr(u.full_name || u.email) + '\')"' +
      ' style="padding:0.5rem 0.8rem;cursor:pointer;font-size:0.83rem;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:0.3rem;"' +
      ' onmouseover="this.style.background=\'#f0fdf4\'" onmouseout="this.style.background=\'\'">' +
      '<span style="font-weight:600;color:#1e2a3e;">' + window.escHtml(u.full_name || u.email) + '</span>' +
      lvlBadge + idxBadge +
    '</div>';
  }).join('');
  drop.style.display = 'block';
};

// Called when a suggestion row is clicked
window.selectMemberSearch = function(groupId, email, name) {
  var input = document.getElementById('addMemberSearch-' + groupId);
  var drop  = document.getElementById('addMemberDrop-' + groupId);
  if (input) { input.value = name; input.dataset.selectedEmail = email; }
  if (drop)  drop.style.display = 'none';
};

// Called when the Add button next to the search box is clicked
window.addMemberToGroupSearch = async function(groupId) {
  var input = document.getElementById('addMemberSearch-' + groupId);
  if (!input) return;

  var email = (input.dataset.selectedEmail || '').trim();
  var name  = (input.value || '').trim();

  // Validate selection — must pick from dropdown, not freeform
  if (!email) {
    alert('Please select a member from the dropdown list first.');
    input.focus();
    return;
  }

  var sb = window.geramaSupabase; if (!sb) return;

  // Admin password gate
  var pw = window.prompt('Enter admin password to add a member manually:');
  if (!pw) return;
  if (pw.trim() !== '2026GERAMA') {
    alert('❌ Wrong password. Only admin can manually add members to groups.');
    return;
  }

  // Check group capacity
  var { data: existing } = await sb.from('gerama_group_members').select('id').eq('group_id', groupId);
  if (existing && existing.length >= GROUP_MAX) {
    alert('This group is full (' + GROUP_MAX + ' members maximum).');
    return;
  }

  // Check not already in any group
  var { data: inGroup } = await sb.from('gerama_group_members').select('id, group_id').eq('user_email', email).maybeSingle();
  if (inGroup) {
    var g = (window._geramaGroups || []).find(function(g){ return g.id === inGroup.group_id; });
    alert(name + ' is already in ' + (g ? g.name : 'a group') + '. Use the Move (⇄) button to change their group.');
    return;
  }

  // Warn if not L100
  var user = (window._allUsers || []).find(function(u){ return u.email === email; });
  if (user && user.level && user.level !== 'L100') {
    if (!confirm(name + ' is ' + user.level + ', not L100. Add anyway?')) return;
  }

  var { error } = await sb.from('gerama_group_members').insert({
    group_id:    groupId,
    user_email:  email,
    user_name:   name,
    role:        'member',
    assigned_at: new Date().toISOString()
  });
  if (error) { alert('Error: ' + error.message); return; }

  try {
    var group = (window._geramaGroups || []).find(function(g){ return g.id === groupId; });
    if (group) await sb.from('user_profiles').update({ group_name: group.name }).eq('email', email);
  } catch(e) {}

  window.logActivity('Admin added ' + name + ' to group via search');
  if (input) { input.value = ''; delete input.dataset.selectedEmail; }
  window.loadGroups();
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADD MEMBERS FROM ATTENDANCE SESSION  (per-group, dedup-safe)
// ─────────────────────────────────────────────────────────────────────────────

window.openAttendanceAddModal = async function(groupId, groupName) {
  var sb = window.geramaSupabase; if (!sb) { alert('Not connected.'); return; }
  var existing = document.getElementById('attAddModal');
  if (existing) existing.remove();

  // Fetch last 50 attendance sessions
  var { data: sessions } = await sb.from('attendance_sessions')
    .select('id, class_title, code, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  sessions = sessions || [];

  var sessionOptions = sessions.length
    ? sessions.map(function(s) {
        var dt = s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        return '<option value="' + window.escAttr(s.id) + '">' +
          window.escHtml(s.class_title || 'Session') +
          (dt ? ' · ' + dt : '') +
          (s.code ? ' [' + s.code + ']' : '') +
          '</option>';
      }).join('')
    : '<option value="">No sessions found</option>';

  var modal = document.createElement('div');
  modal.id = 'attAddModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:6000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);overflow-y:auto;';
  modal.innerHTML =
    '<div style="background:white;border-radius:22px;padding:2rem;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">' +
        '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;gap:0.6rem;">' +
          '<i class="fas fa-clipboard-check" style="color:#6d28d9;font-size:1.2rem;"></i> Add from Attendance &rarr; ' +
          '<span style="color:#6d28d9;">' + window.escHtml(groupName) + '</span>' +
        '</div>' +
        '<button onclick="document.getElementById(\'attAddModal\').remove()" style="background:#f1f5f9;border:none;color:#374151;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<p style="font-size:0.85rem;color:#6b7280;margin-bottom:1rem;line-height:1.6;">' +
        'Select an attendance session. Students who signed it will be added to <strong>' + window.escHtml(groupName) + '</strong>. ' +
        'Anyone already in a group is automatically skipped.' +
      '</p>' +
      '<div style="margin-bottom:0.9rem;">' +
        '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.35rem;">Attendance Session</label>' +
        '<select id="attAddSessionId" style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.88rem;outline:none;font-family:\'Inter\',sans-serif;" onfocus="this.style.borderColor=\'#6d28d9\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          sessionOptions +
        '</select>' +
      '</div>' +
      '<button onclick="window.previewAttendanceAdd(\'' + window.escAttr(groupId) + '\')" style="background:#f5f3ff;color:#6d28d9;border:1px solid #c4b5fd;padding:0.55rem 1.1rem;border-radius:10px;font-weight:600;font-size:0.85rem;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;gap:0.4rem;margin-bottom:0.8rem;">' +
        '<i class="fas fa-eye"></i> Preview' +
      '</button>' +
      '<div id="attAddPreview" style="margin-bottom:0.9rem;min-height:1rem;"></div>' +
      '<div style="display:flex;gap:0.7rem;flex-wrap:wrap;">' +
        '<button onclick="window.executeAttendanceAdd(\'' + window.escAttr(groupId) + '\',\'' + window.escAttr(groupName) + '\')" style="background:linear-gradient(135deg,#6d28d9,#7c3aed);color:white;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;">' +
          '<i class="fas fa-user-plus"></i> Add to Group' +
        '</button>' +
        '<button onclick="document.getElementById(\'attAddModal\').remove()" style="background:#fee2e2;color:#dc2626;border:none;padding:0.6rem 1rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>' +
      '</div>' +
      '<div id="attAddStatus" style="margin-top:0.8rem;font-size:0.85rem;min-height:1rem;text-align:center;"></div>' +
    '</div>';

  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  // Store target group for preview/execute
  window._attAddGroupId = groupId;
};

window.previewAttendanceAdd = async function(groupId) {
  var preview  = document.getElementById('attAddPreview');
  var sessionId = document.getElementById('attAddSessionId') && document.getElementById('attAddSessionId').value;
  if (!sessionId) { if (preview) preview.innerHTML = '<p style="color:#dc2626;font-size:0.85rem;">Please select a session.</p>'; return; }

  var sb = window.geramaSupabase; if (!sb) return;
  if (preview) preview.innerHTML = '<p style="color:#9ca3af;font-size:0.82rem;"><i class="fas fa-spinner fa-spin"></i> Fetching attendees…</p>';

  var { data: records } = await sb.from('attendance_records')
    .select('student_email, student_name')
    .eq('session_id', sessionId);
  records = records || [];

  if (!records.length) {
    preview.innerHTML = '<p style="color:#dc2626;font-size:0.85rem;">No attendance records found for this session.</p>';
    return;
  }

  // Deduplicate by email within the session records themselves
  var seen = {};
  records = records.filter(function(r) {
    var k = (r.student_email || '').toLowerCase().trim();
    if (!k || seen[k]) return false;
    seen[k] = true;
    return true;
  });

  // Who is already in ANY group?
  var allMembers = window._allGroupMembers || [];
  var assignedSet = {};
  allMembers.forEach(function(m) { if (m.user_email) assignedSet[m.user_email.toLowerCase().trim()] = true; });

  var toAdd    = records.filter(function(r) { return !assignedSet[(r.student_email || '').toLowerCase().trim()]; });
  var existing = records.filter(function(r) { return  assignedSet[(r.student_email || '').toLowerCase().trim()]; });

  window._attAddCandidates = toAdd;

  var html = '<div style="border:1px solid #ede9fe;border-radius:12px;padding:0.9rem;background:#faf5ff;">' +
    '<div style="font-size:0.82rem;font-weight:700;color:#6d28d9;margin-bottom:0.6rem;">' +
      '<i class="fas fa-user-plus"></i> ' + toAdd.length + ' will be added &nbsp;·&nbsp; ' +
      '<span style="color:#9ca3af;">' + existing.length + ' already in a group (skipped)</span>' +
    '</div>';

  if (toAdd.length) {
    html += '<div style="max-height:180px;overflow-y:auto;border:1px solid #ede9fe;border-radius:8px;">';
    toAdd.forEach(function(r, i) {
      html += '<div style="padding:0.3rem 0.7rem;font-size:0.81rem;border-bottom:1px solid #f5f3ff;display:flex;align-items:center;gap:0.4rem;">' +
        '<span style="color:#9ca3af;min-width:18px;">' + (i + 1) + '</span>' +
        '<span style="font-weight:600;color:#1e2a3e;">' + window.escHtml(r.student_name || r.student_email) + '</span>' +
        '<span style="font-size:0.72rem;color:#9ca3af;">' + window.escHtml(r.student_email || '') + '</span>' +
      '</div>';
    });
    html += '</div>';
  } else {
    html += '<p style="font-size:0.82rem;color:#9ca3af;margin:0;">All attendees from this session are already in a group.</p>';
  }

  if (existing.length) {
    html += '<div style="margin-top:0.5rem;font-size:0.76rem;color:#9ca3af;padding:0.3rem 0.5rem;background:#f9f5ff;border-radius:8px;">' +
      '<i class="fas fa-info-circle"></i> Skipped: ' +
      existing.slice(0, 5).map(function(r) { return window.escHtml(r.student_name || r.student_email); }).join(', ') +
      (existing.length > 5 ? '… and ' + (existing.length - 5) + ' more' : '') +
    '</div>';
  }

  html += '</div>';
  preview.innerHTML = html;
};

window.executeAttendanceAdd = async function(groupId, groupName) {
  var statusEl = document.getElementById('attAddStatus');
  function setStatus(msg, ok) { if (statusEl) { statusEl.textContent = msg; statusEl.style.color = ok ? '#059669' : '#dc2626'; } }

  var candidates = window._attAddCandidates;
  if (!candidates || !candidates.length) { setStatus('Run Preview first, or there is nobody new to add.', false); return; }

  var sb = window.geramaSupabase; if (!sb) { setStatus('Not connected.', false); return; }

  // Admin password gate
  var pw = window.prompt('Enter admin password to add members from attendance:');
  if (!pw) return;
  if (pw.trim() !== '2026GERAMA') { setStatus('❌ Wrong password.', false); return; }

  // Check capacity
  var { data: curMems } = await sb.from('gerama_group_members').select('id').eq('group_id', groupId);
  var curCount = (curMems || []).length;
  var space = GROUP_MAX - curCount;
  if (space <= 0) { setStatus('Group is full (' + GROUP_MAX + ' max).', false); return; }

  var toAdd = candidates.slice(0, space); // respect cap
  var capped = candidates.length > space;

  setStatus('Adding members…', true);

  var group = (window._geramaGroups || []).find(function(g) { return g.id === groupId; });
  var added = 0, errors = 0;

  for (var i = 0; i < toAdd.length; i++) {
    var r = toAdd[i];
    if (!r.student_email) { errors++; continue; }
    try {
      var userInfo = (window._allUsers || []).find(function(u) { return u.email === r.student_email; });
      var name = r.student_name || (userInfo && userInfo.full_name) || r.student_email;
      await sb.from('gerama_group_members').insert({
        group_id:    groupId,
        user_email:  r.student_email,
        user_name:   name,
        role:        'member',
        assigned_at: new Date().toISOString()
      });
      if (group) {
        try { await sb.from('user_profiles').update({ group_name: group.name }).eq('email', r.student_email); } catch(e) {}
      }
      added++;
    } catch(e) { errors++; }
  }

  window.logActivity('Added ' + added + ' members to ' + groupName + ' from attendance' + (capped ? ' (capped at group max)' : ''));
  setStatus('✅ ' + added + ' member' + (added !== 1 ? 's' : '') + ' added to ' + groupName + '.' +
    (capped ? ' ⚠️ ' + (candidates.length - space) + ' skipped (group full).' : '') +
    (errors ? ' ' + errors + ' errors.' : ''), true);
  setTimeout(function() {
    var m = document.getElementById('attAddModal'); if (m) m.remove();
    window.loadGroups();
  }, 2000);
};

window.openSubmissionAddModal = async function(groupId, groupName) {
  var sb = window.geramaSupabase; if (!sb) { alert('Not connected.'); return; }
  var existing = document.getElementById('subAddModal');
  if (existing) existing.remove();

  // Fetch assignments and quizzes in parallel
  var [asgRes, qzRes] = await Promise.all([
    sb.from('assignments').select('id, title, course').order('created_at', { ascending: false }).limit(60),
    sb.from('quizzes').select('id, title').order('created_at', { ascending: false }).limit(60)
  ]);
  var assignments = asgRes.data || [];
  var quizzes     = qzRes.data  || [];

  var asgOptions = assignments.map(function(a) {
    return '<option value="asg:' + window.escAttr(a.title) + '">' + window.escHtml(a.title) + (a.course ? ' (' + a.course + ')' : '') + '</option>';
  }).join('');
  var qzOptions = quizzes.map(function(q) {
    return '<option value="qz:' + window.escAttr(q.title) + '">' + window.escHtml(q.title) + '</option>';
  }).join('');

  var allOptions = (asgOptions ? '<optgroup label="📝 Assignments">' + asgOptions + '</optgroup>' : '') +
                   (qzOptions  ? '<optgroup label="🧠 Quizzes">'     + qzOptions  + '</optgroup>' : '');
  if (!allOptions) allOptions = '<option value="">No assignments or quizzes found</option>';

  var modal = document.createElement('div');
  modal.id = 'subAddModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:5500;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);overflow-y:auto;';
  modal.innerHTML =
    '<div style="background:white;border-radius:22px;padding:2rem;width:100%;max-width:620px;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">' +
        '<div style="font-size:1.05rem;font-weight:800;color:#1e2a3e;display:flex;align-items:center;gap:0.5rem;">' +
          '<i class="fas fa-file-alt" style="color:#c2410c;font-size:1.2rem;"></i>' +
          'Add from Submissions &rarr; <span style="color:#c2410c;">' + window.escHtml(groupName) + '</span>' +
        '</div>' +
        '<button onclick="document.getElementById(\'subAddModal\').remove()" style="background:#f1f5f9;border:none;color:#374151;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<p style="font-size:0.84rem;color:#6b7280;margin-bottom:1rem;line-height:1.6;">' +
        'Select an assignment or quiz. All students who submitted it will be added to <strong>' + window.escHtml(groupName) + '</strong>. Students already in any group are skipped.' +
      '</p>' +
      '<div style="margin-bottom:0.9rem;">' +
        '<label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:0.3rem;">Select Assignment or Quiz</label>' +
        '<select id="subAddSource" style="width:100%;padding:0.65rem 0.9rem;border:2px solid #e5e7eb;border-radius:10px;font-size:0.88rem;outline:none;font-family:\'Inter\',sans-serif;" onfocus="this.style.borderColor=\'#c2410c\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          '<option value="">— Choose assignment or quiz —</option>' + allOptions +
        '</select>' +
      '</div>' +
      '<button onclick="window.previewSubmissionAdd(\'' + window.escAttr(groupId) + '\')" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;padding:0.6rem 1.2rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;display:flex;align-items:center;gap:0.4rem;margin-bottom:0.8rem;">' +
        '<i class="fas fa-eye"></i> Preview' +
      '</button>' +
      '<div id="subAddPreview" style="margin-bottom:0.8rem;"></div>' +
      '<div style="display:flex;gap:0.7rem;flex-wrap:wrap;">' +
        '<button onclick="window.executeSubmissionAdd(\'' + window.escAttr(groupId) + '\',\'' + window.escAttr(groupName) + '\')" style="background:linear-gradient(135deg,#c2410c,#ea580c);color:white;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-weight:700;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;flex:1;display:flex;align-items:center;justify-content:center;gap:0.4rem;">' +
          '<i class="fas fa-user-plus"></i> Add Members' +
        '</button>' +
        '<button onclick="document.getElementById(\'subAddModal\').remove()" style="background:#fee2e2;color:#dc2626;border:none;padding:0.6rem 1rem;border-radius:10px;font-weight:600;font-size:0.88rem;cursor:pointer;font-family:\'Inter\',sans-serif;">Cancel</button>' +
      '</div>' +
      '<div id="subAddStatus" style="margin-top:0.8rem;font-size:0.85rem;min-height:1rem;text-align:center;"></div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
};

window.previewSubmissionAdd = async function(groupId) {
  var preview   = document.getElementById('subAddPreview');
  var sourceVal = (document.getElementById('subAddSource') || {}).value || '';
  if (!sourceVal) { if (preview) preview.innerHTML = '<p style="color:#dc2626;font-size:0.85rem;">Please select an assignment or quiz.</p>'; return; }

  var sb = window.geramaSupabase; if (!sb) return;
  if (preview) preview.innerHTML = '<p style="color:#9ca3af;font-size:0.82rem;"><i class="fas fa-spinner fa-spin"></i> Fetching submitters…</p>';

  // Decode type:title
  var colonIdx = sourceVal.indexOf(':');
  var srcType  = sourceVal.substring(0, colonIdx);   // 'asg' or 'qz'
  var srcTitle = sourceVal.substring(colonIdx + 1);  // the title

  var submitters = [];
  try {
    if (srcType === 'asg') {
      // assignment_submissions: student_email, student_name, assignment_title
      var { data } = await sb.from('assignment_submissions')
        .select('student_email, student_name')
        .eq('assignment_title', srcTitle);
      submitters = data || [];
    } else {
      // student_grades (quizzes use this table): student_email, student_name, assignment_title
      var { data } = await sb.from('student_grades')
        .select('student_email, student_name')
        .eq('assignment_title', srcTitle);
      submitters = data || [];
    }
  } catch(e) {
    if (preview) preview.innerHTML = '<p style="color:#dc2626;font-size:0.85rem;">Error: ' + window.escHtml(e.message) + '</p>';
    return;
  }

  if (!submitters.length) {
    preview.innerHTML = '<p style="color:#92400e;background:#fef3c7;padding:0.7rem 1rem;border-radius:8px;font-size:0.85rem;">No submissions found for this ' + (srcType === 'asg' ? 'assignment' : 'quiz') + '.</p>';
    return;
  }

  // Deduplicate by email
  var seen = {};
  var unique = [];
  submitters.forEach(function(r) {
    var key = (r.student_email || '').toLowerCase().trim();
    if (!key || seen[key]) return;
    seen[key] = true;
    unique.push(r);
  });

  // Separate into: will be added vs already in a group
  var allMembers  = window._allGroupMembers || [];
  var assignedSet = {};
  allMembers.forEach(function(m){ if (m.user_email) assignedSet[m.user_email.toLowerCase().trim()] = true; });

  var toAdd     = unique.filter(function(r){ return !assignedSet[(r.student_email||'').toLowerCase().trim()]; });
  var alreadyIn = unique.filter(function(r){ return  assignedSet[(r.student_email||'').toLowerCase().trim()]; });

  window._subAddRecords = toAdd; // cache for execute step

  var typeLabel = srcType === 'asg' ? 'assignment' : 'quiz';
  var html = '<div style="border:1px solid #fed7aa;border-radius:12px;padding:0.9rem;background:#fff7ed;">';
  html += '<div style="font-size:0.83rem;font-weight:700;color:#c2410c;margin-bottom:0.5rem;">' +
    '<i class="fas fa-file-alt"></i> ' + unique.length + ' unique submitters for this ' + typeLabel + ' &nbsp;·&nbsp; ' +
    '<span style="color:#059669;">' + toAdd.length + ' will be added</span>' +
    (alreadyIn.length ? ' &nbsp;·&nbsp; <span style="color:#9ca3af;">' + alreadyIn.length + ' already in a group (skipped)</span>' : '') +
  '</div>';

  if (toAdd.length) {
    html += '<div style="border:1px solid #fed7aa;border-radius:8px;overflow:hidden;max-height:220px;overflow-y:auto;margin-bottom:0.4rem;">';
    html += '<div style="background:#ffedd5;padding:0.35rem 0.8rem;font-size:0.74rem;font-weight:700;color:#374151;position:sticky;top:0;">Will be added</div>';
    toAdd.forEach(function(r) {
      html += '<div style="padding:0.32rem 0.8rem;border-top:1px solid #f1f5f9;font-size:0.82rem;color:#1e2a3e;font-weight:500;">' +
        '<i class="fas fa-user-check" style="color:#059669;margin-right:0.3rem;font-size:0.72rem;"></i>' +
        window.escHtml(r.student_name || r.student_email) +
        '<span style="color:#9ca3af;font-size:0.72rem;margin-left:0.4rem;">' + window.escHtml(r.student_email) + '</span>' +
      '</div>';
    });
    html += '</div>';
  }

  if (alreadyIn.length) {
    html += '<div style="font-size:0.77rem;color:#9ca3af;padding:0.25rem 0.2rem;">' +
      '<i class="fas fa-info-circle"></i> Already assigned: ' +
      alreadyIn.map(function(r){ return window.escHtml(r.student_name || r.student_email); }).join(', ') +
    '</div>';
  }

  html += '</div>';
  if (preview) preview.innerHTML = html;
};

window.executeSubmissionAdd = async function(groupId, groupName) {
  var statusEl = document.getElementById('subAddStatus');
  function setStatus(msg, ok) { if (statusEl) { statusEl.textContent = msg; statusEl.style.color = ok ? '#059669' : '#dc2626'; } }

  var toAdd = window._subAddRecords;
  if (!toAdd || !toAdd.length) { setStatus('Run Preview first.', false); return; }

  var sb = window.geramaSupabase; if (!sb) { setStatus('Not connected.', false); return; }

  // Admin password gate
  var pw = window.prompt('Enter admin password to add these members:');
  if (!pw) return;
  if (pw.trim() !== '2026GERAMA') { setStatus('❌ Wrong password.', false); return; }

  setStatus('Adding members…', true);

  // Re-fetch current members fresh to avoid races / catch any already added since preview
  var { data: currentMembers } = await sb.from('gerama_group_members').select('user_email');
  var assignedSet = {};
  (currentMembers || []).forEach(function(m){ if (m.user_email) assignedSet[m.user_email.toLowerCase().trim()] = true; });

  var group  = (window._geramaGroups || []).find(function(g){ return g.id === groupId; });
  var added  = 0, skipped = 0, errors = 0;

  for (var i = 0; i < toAdd.length; i++) {
    var r     = toAdd[i];
    var email = (r.student_email || '').trim();
    var key   = email.toLowerCase();
    if (!email || assignedSet[key]) { skipped++; continue; }

    var user = (window._allUsers || []).find(function(u){ return u.email === email; });
    var name = r.student_name || (user && user.full_name) || email;

    try {
      await sb.from('gerama_group_members').insert({
        group_id:    groupId,
        user_email:  email,
        user_name:   name,
        role:        'member',
        assigned_at: new Date().toISOString()
      });
      if (group) {
        try { await sb.from('user_profiles').update({ group_name: group.name }).eq('email', email); } catch(e) {}
      }
      assignedSet[key] = true;
      added++;
    } catch(e) { errors++; }
  }

  window.logActivity('Added ' + added + ' member(s) to ' + groupName + ' from submissions' + (skipped ? ' (' + skipped + ' skipped)' : ''));
  setStatus('✅ Done! ' + added + ' member' + (added !== 1 ? 's' : '') + ' added.' + (skipped ? ' ' + skipped + ' skipped (already assigned).' : '') + (errors ? ' ⚠️ ' + errors + ' errors.' : ''), true);
  setTimeout(function() {
    var m = document.getElementById('subAddModal'); if (m) m.remove();
    window.loadGroups();
  }, 2000);
};

// ─────────────────────────────────────────────────────────────────────────────
//  SYNC ALL GRADED SUBMISSIONS → student_grades  (portal visibility fix)
//  Reads every assignment_submissions row that has a score, then upserts it
//  into student_grades so the student can see it in their portal.
// ─────────────────────────────────────────────────────────────────────────────
window.syncAllGradesToPortal = async function() {
  var sb = window.geramaSupabase;
  if (!sb) { alert('Not connected to database.'); return; }

  if (!confirm(
    'This will push ALL graded assignment submissions into student_grades so students can see their scores in the portal.\n\n' +
    'Quiz scores imported via CSV are already in student_grades — only assignment submissions are synced here.\n\n' +
    'Continue?'
  )) return;

  // Fetch all graded submissions
  var { data: subs, error: subErr } = await sb
    .from('assignment_submissions')
    .select('id, assignment_title, assignment_id, student_email, student_name, score, graded_at, submitted_at')
    .not('score', 'is', null)
    .order('submitted_at', { ascending: false });

  if (subErr) { alert('Error fetching submissions: ' + subErr.message); return; }
  if (!subs || !subs.length) { alert('No graded submissions found yet.'); return; }

  // Fetch all assignments for course + points enrichment
  var { data: asgList } = await sb.from('assignments').select('id, title, course, points');
  var asgMap = {};
  (asgList || []).forEach(function(a) {
    if (a.id)    asgMap[a.id]                         = a;
    if (a.title) asgMap[a.title.toLowerCase().trim()] = a;
  });

  var ok = 0, skipped = 0, errors = 0;
  var total = subs.length;

  // Show a progress alert (can't update mid-operation without a modal, so just run)
  for (var i = 0; i < subs.length; i++) {
    var s = subs[i];
    if (!s.student_email || s.score === null || s.score === undefined) { skipped++; continue; }

    // Enrich with assignment metadata
    var asgMeta = asgMap[s.assignment_id] || asgMap[(s.assignment_title || '').toLowerCase().trim()] || {};

    try {
      var { error: uErr } = await sb.from('student_grades').upsert({
        student_email:    s.student_email.toLowerCase().trim(),
        student_name:     s.student_name  || null,
        assignment_title: s.assignment_title || 'Assignment',
        course:           asgMeta.course  || null,
        score:            s.score,
        total_marks:      asgMeta.points  || null,
        points:           asgMeta.points  || null,
        submission_id:    s.id,
        graded_at:        s.graded_at     || new Date().toISOString(),
        participated_at:  s.submitted_at  || s.graded_at || new Date().toISOString()
      }, { onConflict: 'student_email,assignment_title' });

      if (uErr) { errors++; } else { ok++; }
    } catch(e) { errors++; }
  }

  window.logActivity('Synced ' + ok + ' graded submissions to student_grades portal' + (errors ? ' (' + errors + ' errors)' : ''));
  alert(
    '✅ Sync complete!\n\n' +
    '• ' + ok    + ' grade' + (ok !== 1 ? 's' : '')    + ' pushed to student portal\n' +
    (skipped ? '• ' + skipped + ' skipped (no email or score)\n' : '') +
    (errors  ? '• ' + errors  + ' failed (check console)\n'      : '') +
    '\nStudents can now see their grades. If the table columns are missing, run SUPABASE-GRADES-FIX.sql first.'
  );
  window.loadSubmissionsTable();
};
