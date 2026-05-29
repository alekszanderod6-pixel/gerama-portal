/* GERAMA Admin Dashboard — extracted JS
   This file is intentionally kept as plain JS (no build step).
*/

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
    var items = document.querySelectorAll('.nav-item');
    for(var i=0;i<items.length;i++) items[i].classList.remove('active');

    var panels = document.querySelectorAll('.panel');
    for(var j=0;j<panels.length;j++) panels[j].classList.remove('active');

    var navEl = document.querySelector('.nav-item[data-panel="'+name+'"]');
    if(navEl) navEl.classList.add('active');

    var panelEl = document.getElementById('panel-'+name);
    if(panelEl) panelEl.classList.add('active');

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
      if(window.loadSubmissionsTable) window.loadSubmissionsTable();
    }, 150);
    if(name === 'quizzes' && window.loadQzList) setTimeout(window.loadQzList, 150);
    if(name === 'quizrequests' && window.loadQuizRequests) setTimeout(window.loadQuizRequests, 150);
    if(name === 'classes' && window.loadClsList) setTimeout(window.loadClsList, 150);
    if(name === 'attendance') setTimeout(function(){ if(window.loadAttSessions) window.loadAttSessions(); if(window.loadAttRecords) window.loadAttRecords(); }, 150);
    if(name === 'classrequests' && window.loadClassRequests) setTimeout(window.loadClassRequests, 150);
    if(name === 'visitors' && window.loadVisitorStats) setTimeout(window.loadVisitorStats, 150);
    if(name === 'potw' && window.loadPotwList) setTimeout(window.loadPotwList, 150);
    if(name === 'reels' && window.loadAdminReels) setTimeout(window.loadAdminReels, 150);
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

  // --- Announcements ---
  window.publishAnnouncement = async function(){
    var title = document.getElementById('annTitle').value.trim();
    var msg   = document.getElementById('annMessage').value.trim();
    var pri   = document.getElementById('annPriority').value;

    if(!title || !msg){ window.showStatus('annStatus','Please fill in title and message.','err'); return; }

    var btn = document.getElementById('publishAnnBtn');
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Publishing...';

    var imgUrl = null;
    if(selectedAnnImage){
      try{
        var sb = window.geramaSupabase;
        if(sb){
          var ext = selectedAnnImage.name.split('.').pop();
          var imgPath = 'announcements/'+Date.now()+'.'+ext;
          var up = await sb.storage.from(window.BUCKET).upload(imgPath, selectedAnnImage, { upsert:true });
          if(!up.error){
            var urlData = sb.storage.from(window.BUCKET).getPublicUrl(imgPath).data;
            imgUrl = urlData.publicUrl;
          }
        }
      }catch(e){ /* ignore */ }
    }

    var ann = {
      id: Date.now(),
      title: title,
      message: msg,
      priority: pri,
      image: imgUrl,
      date: new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
    };

    announcements.unshift(ann);
    localStorage.setItem('gerama_announcements', JSON.stringify(announcements));

    try{
      var sb2 = window.geramaSupabase;
      if(sb2) await sb2.from('announcements').insert({
        title: ann.title, message: ann.message, priority: ann.priority,
        image_url: ann.image, created_at: new Date().toISOString()
      });
    }catch(e){}

    window.logActivity('Published announcement: '+title);
    renderAnnouncements();
    updateStats();

    document.getElementById('annTitle').value='';
    document.getElementById('annMessage').value='';
    document.getElementById('annFileChosen').textContent='';
    document.getElementById('annImgPreview').style.display='none';
    selectedAnnImage=null;

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
      var {data:all}   = await sb.from('page_views').select('id, page, visited_at', {count:'exact'});
      var {data:today} = await sb.from('page_views').select('id').gte('visited_at', todayStart);
      var {data:week}  = await sb.from('page_views').select('id').gte('visited_at', weekStart);
      var {data:month} = await sb.from('page_views').select('id').gte('visited_at', monthStart);

      var setEl = function(id,val){ var e=document.getElementById(id); if(e) e.textContent=val; };
      setEl('vsToday', (today||[]).length);
      setEl('vsWeek', (week||[]).length);
      setEl('vsMonth', (month||[]).length);
      setEl('vsTotal', (all||[]).length);

      setEl('statVisitsToday', (today||[]).length);
      setEl('statVisitsWeek', (week||[]).length);
      setEl('statVisitsTotal', (all||[]).length);

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
    materialsHistory = JSON.parse(localStorage.getItem('gerama_mat_history')||'[]');
    announcements    = JSON.parse(localStorage.getItem('gerama_announcements')||'[]');

    // Supabase source of truth (best effort)
    try{
      var sb = window.geramaSupabase;
      if(sb){
        var { data } = await sb.from('materials').select('*').order('created_at',{ascending:false}).limit(200);
        if(data && data.length){
          materialsHistory = data.map(function(r){
            return { level:r.level, sem:r.semester, course:r.course, type:r.type, name:r.name,
              desc:r.description||'', url:r.file_url, path:r.storage_path||'',
              date:r.created_at, id:r.id, status:r.status||'approved' };
          });
        }
      }
    }catch(e){}

    try{
      var sb2 = window.geramaSupabase;
      if(sb2){
        var { data: annData } = await sb2.from('announcements').select('*').order('created_at',{ascending:false}).limit(50);
        if(annData && annData.length){
          announcements = annData.map(function(r){
            return { id:r.id, title:r.title, message:r.message, priority:r.priority||'normal',
              image:r.image_url||null, date:r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '' };
          });
          localStorage.setItem('gerama_announcements', JSON.stringify(announcements));
        }
      }
    }catch(e){}

    renderHistory();
    renderSubmissions();
    renderAnnouncements();
    updateStats();
    renderRecentActivity();

    // Load live visitor + content stats for overview
    loadOverviewStats();
  };

  async function loadOverviewStats(){
    var sb = window.geramaSupabase; if(!sb) return;
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    var weekStart  = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
    var set = function(id, val){ var e=document.getElementById(id); if(e) e.textContent = (val!==null&&val!==undefined) ? val : '0'; };

    // Run each query independently so one failure doesn't block others
    var safe = async function(fn){ try{ return await fn(); }catch(e){ return null; } };

    var todayRes  = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',todayStart); });
    var weekRes   = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}).gte('visited_at',weekStart); });
    var totalRes  = await safe(function(){ return sb.from('page_views').select('id',{count:'exact',head:true}); });
    var quizRes   = await safe(function(){ return sb.from('quizzes').select('id',{count:'exact',head:true}).eq('status','active'); });
    var asgRes    = await safe(function(){ return sb.from('assignments').select('id',{count:'exact',head:true}); });
    var clsRes    = await safe(function(){ return sb.from('classes').select('id',{count:'exact',head:true}); });
    var clsReqRes = await safe(function(){ return sb.from('class_requests').select('id',{count:'exact',head:true}).eq('status','pending'); });
    var qrRes     = await safe(function(){ return sb.from('quiz_requests').select('id',{count:'exact',head:true}).eq('status','pending'); });

    set('statVisitsToday', todayRes&&todayRes.count||0);
    set('statVisitsWeek',  weekRes&&weekRes.count||0);
    set('statVisitsTotal', totalRes&&totalRes.count||0);
    set('statQuizzes',     quizRes&&quizRes.count||0);
    set('statAssignments', asgRes&&asgRes.count||0);
    set('statClasses',     clsRes&&clsRes.count||0);
    set('statClassReqs',   clsReqRes&&clsReqRes.count||0);
    set('statQuizPending', qrRes&&qrRes.count||0);

    var reqBadge = document.getElementById('reqBadge');
    if(reqBadge){ var rc=clsReqRes&&clsReqRes.count||0; reqBadge.textContent=rc; reqBadge.style.display=rc>0?'inline':'none'; }
    var qrBadge = document.getElementById('quizReqBadge');
    if(qrBadge){ var qc=qrRes&&qrRes.count||0; qrBadge.textContent=qc; qrBadge.style.display=qc>0?'inline':'none'; }
  }

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
      selectedAnnImage = f;
      var el = document.getElementById('annFileChosen');
      if(el) el.textContent = '✅ '+f.name;

      var reader = new FileReader();
      reader.onload = function(e){
        var img = document.getElementById('annImgPreview');
        if(img){ img.src = e.target.result; img.style.display='block'; }
      };
      reader.readAsDataURL(f);
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

    // Load main content
    window.loadData();
    setTimeout(window.loadVisitorStats, 800);
  });

  // ─── UPLOAD MATERIAL ───────────────────────────────────────
  window.uploadMaterial = async function(){
    var level  = document.getElementById('matLevel').value;
    var sem    = document.getElementById('matSem').value;
    var course = document.getElementById('matCourse').value.trim();
    var type   = document.getElementById('matType').value;
    var name   = document.getElementById('matName').value.trim();
    var desc   = document.getElementById('matDesc').value.trim();

    if(!course || !name){ window.showStatus('matStatus','Please fill in Course Name and Display Name.','err'); return; }
    if(!selectedMatFile){ window.showStatus('matStatus','Please select a file to upload.','err'); return; }
    if(selectedMatFile.size > 50*1024*1024){ window.showStatus('matStatus','File too large. Max 50 MB.','err'); return; }

    var btn = document.getElementById('uploadMatBtn');
    btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Uploading...';
    window.showStatus('matStatus','Uploading to Supabase...','info');

    try{
      var sb = window.geramaSupabase;
      if(!sb) throw new Error('Supabase not connected. Check Settings.');

      var ext = selectedMatFile.name.split('.').pop();
      var safeName = name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now()+'.'+ext;
      var storagePath = level.toLowerCase()+'/semester-'+sem+'/'+course.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'/'+type+'/'+safeName;

      var { error: upErr } = await sb.storage.from(window.BUCKET).upload(storagePath, selectedMatFile, { upsert:true, contentType: selectedMatFile.type });
      if(upErr) throw new Error('Upload failed: '+upErr.message);

      var fileUrl = sb.storage.from(window.BUCKET).getPublicUrl(storagePath).data.publicUrl;

      var { error: dbErr } = await sb.from('materials').insert({
        level: level, semester: parseInt(sem), course: course,
        type: type, name: name, description: desc||null,
        file_url: fileUrl, storage_path: storagePath,
        uploaded_by: 'admin', status: 'approved',
        created_at: new Date().toISOString()
      });
      if(dbErr) throw new Error('DB save failed: '+dbErr.message+(dbErr.code==='42501'?' (check RLS policy)':''));

      window.logActivity('Uploaded: '+name+' ('+level+' Sem '+sem+')');
      window.showStatus('matStatus','✅ "'+name+'" is now live on the Resources page!','ok');

      document.getElementById('matCourse').value='';
      document.getElementById('matName').value='';
      document.getElementById('matDesc').value='';
      document.getElementById('matFileChosen').textContent='';
      selectedMatFile = null;

      // Refresh history
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
    return '<div class="sub-card">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(q.title)+badge+'</strong>'+
        '<div class="sub-meta">'+
          '<b>Course:</b> '+window.escHtml(q.course||'—')+
          ' | <b>Deadline:</b> '+dl+
          (q.duration_mins?' | <b>Time:</b> '+q.duration_mins+' min':'')+
          (q.points?' | <b>Marks:</b> '+q.points:'')+
          '<br>'+linkHtml+
          (links.length>1?'<span style="background:#f5f3ff;color:#5b21b6;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;"><i class="fas fa-random"></i> '+links.length+' versions (shuffle)</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="sub-actions">'+
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

  // Collect up to 3 links
  var links = [];
  ['qzUrl1','qzUrl2','qzUrl3'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.value.trim()) links.push(el.value.trim());
  });

  if(!title){ window.showStatus('quizStatus','Quiz title is required.','err'); return; }
  if(!links.length){ window.showStatus('quizStatus','At least one quiz link is required.','err'); return; }
  if(!deadline){ window.showStatus('quizStatus','Please set a deadline.','err'); return; }

  var btn = document.getElementById('publishQuizBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Publishing...';

  try{
    var sb = window.geramaSupabase;
    if(!sb) throw new Error('Supabase not connected. Check your connection.');

    // Store links as JSON array in quiz_url; first link also in quiz_url for backward compat
    var linksJson = JSON.stringify(links);

    var record = {
      title:        title,
      course:       course || null,
      tutor:        tutor  || null,
      duration_mins: duration || null,
      points:       points  || null,
      quiz_url:     linksJson,          // JSON array of all links
      deadline:     new Date(deadline).toISOString(),
      description:  desc   || null,     // use 'description' — matches Supabase schema
      status:       'active',
      created_at:   new Date().toISOString()
    };

    var {error} = await sb.from('quizzes').insert(record);
    if(error) throw new Error(error.message + (error.details ? ' — '+error.details : ''));

    window.logActivity('Published quiz: '+title+(links.length>1?' ('+links.length+' versions)':''));
    window.showStatus('quizStatus','✅ Quiz published! Students can now take it on the Classroom page.','ok');

    // Clear form
    ['qzTitle','qzCourse','qzDuration','qzPoints','qzTutor','qzDeadline','qzDesc','qzUrl1','qzUrl2','qzUrl3'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.value = id==='qzDuration'?'0':'';
    });
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
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
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

window.loadSubmissionsTable = async function(){
  var el = document.getElementById('submissionsTable'); if(!el) return;
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
  var {data,error} = await sb.from('assignment_submissions').select('*').order('submitted_at',{ascending:false});
  if(error||!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">No submissions yet.</p>'; return; }
  el.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>File</th></tr></thead><tbody>'+
    data.map(function(s){
      var dt = s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
      return '<tr>'+
        '<td><strong>'+window.escHtml(s.student_name||'—')+'</strong><br><small style="color:#6b7280;">'+window.escHtml(s.student_email||'')+'</small></td>'+
        '<td style="font-size:0.85rem;">'+window.escHtml(s.assignment_title||'—')+'</td>'+
        '<td style="font-size:0.82rem;white-space:nowrap;">'+dt+'</td>'+
        '<td>'+(s.file_url?'<a href="'+window.escAttr(s.file_url)+'" target="_blank" style="color:#1B5E20;font-size:0.82rem;"><i class="fas fa-download"></i> Download</a>':'—')+'</td>'+
      '</tr>';
    }).join('')+'</tbody></table></div>';
};

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
window.scheduleClass = async function(){
  var course = document.getElementById('clsCourse').value.trim();
  var topic  = document.getElementById('clsTopic').value.trim();
  var tutor  = document.getElementById('clsTutor').value.trim();
  var dt     = document.getElementById('clsDateTime').value;
  var desc   = document.getElementById('clsDesc').value.trim();
  if(!course||!topic||!dt){ window.showStatus('clsStatus','Please fill in Course, Topic and Date/Time.','err'); return; }
  var btn = document.getElementById('scheduleClsBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Scheduling...';
  try{
    var sb = window.geramaSupabase; if(!sb) throw new Error('Not connected.');
    var slug = (course+'-'+topic).toLowerCase().replace(/[^a-z0-9]+/g,'-').substring(0,40);
    var meetLink = 'https://meet.jit.si/GERAMA-'+slug+'-'+Date.now();
    var {error} = await sb.from('classes').insert({
      course:course, topic:topic, tutor:tutor||null, description:desc||null,
      scheduled_at:new Date(dt).toISOString(), meet_link:meetLink,
      status:'upcoming', created_at:new Date().toISOString()
    });
    if(error) throw new Error(error.message);
    document.getElementById('clsLinkInput').value = meetLink;
    document.getElementById('clsLinkOpen').href = meetLink;
    document.getElementById('clsLinkBox').style.display = 'block';
    window.logActivity('Scheduled class: '+course+' – '+topic);
    window.showStatus('clsStatus','✅ Class scheduled! Share the link with students.','ok');
    ['clsCourse','clsTopic','clsTutor','clsDesc','clsDateTime'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
    window.loadClsList();
  }catch(e){ window.showStatus('clsStatus','❌ '+e.message,'err'); }
  btn.disabled=false; btn.innerHTML='<i class="fas fa-calendar-plus"></i> Schedule &amp; Generate Link';
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

  // Separate active (upcoming/live) from ended (history)
  var active = data.filter(function(c){ return c.status !== 'ended'; });
  var ended  = data.filter(function(c){ return c.status === 'ended'; });

  function renderCard(c){
    var dt = new Date(c.scheduled_at).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    var isLive   = c.status === 'live';
    var isEnded  = c.status === 'ended';
    var isPast   = new Date(c.scheduled_at).getTime() < now;

    var badge = isLive
      ? '<span style="background:linear-gradient(135deg,#fee2e2,#fecaca);color:#dc2626;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;animation:pulse 2s infinite;">🔴 LIVE NOW</span>'
      : isEnded
        ? '<span style="background:#f3f4f6;color:#6b7280;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">✅ Ended</span>'
        : isPast
          ? '<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">⏰ Time Passed</span>'
          : '<span style="background:#dbeafe;color:#1d4ed8;font-size:0.72rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">📅 Upcoming</span>';

    // Buttons:
    // - Not live + not ended → show "Go Live" (always, even if time passed)
    // - Live → show "End Class" 
    // - Ended → show "Reopen" (in case of mistake)
    var goLiveBtn   = (!isLive && !isEnded) ? '<button class="btn-gold" style="font-size:0.78rem;padding:0.4rem 0.9rem;" onclick="setClassStatus(\''+c.id+'\',\'live\')"><i class="fas fa-broadcast-tower"></i> Go Live</button>' : '';
    var endBtn      = isLive ? '<button class="btn-primary" style="font-size:0.78rem;padding:0.4rem 0.9rem;background:#dc2626;" onclick="setClassStatus(\''+c.id+'\',\'ended\')"><i class="fas fa-stop-circle"></i> End Class</button>' : '';
    var reopenBtn   = isEnded ? '<button class="btn-gold" style="font-size:0.78rem;padding:0.4rem 0.9rem;" onclick="setClassStatus(\''+c.id+'\',\'upcoming\')"><i class="fas fa-redo"></i> Reopen</button>' : '';
    var deleteBtn   = '<button class="btn-danger" onclick="deleteClass(\''+c.id+'\')" style="font-size:0.78rem;padding:0.4rem 0.7rem;"><i class="fas fa-trash"></i></button>';

    return '<div class="sub-card" style="'+(isLive?'border-left:4px solid #dc2626;background:linear-gradient(135deg,#fff5f5,#fff);':'')+'">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(c.course)+' — '+window.escHtml(c.topic)+' '+badge+'</strong>'+
        '<div class="sub-meta">'+
          '<b>When:</b> '+dt+(c.tutor?' | <b>Tutor:</b> '+window.escHtml(c.tutor):'')+
          (isLive?'<br><span style="color:#dc2626;font-weight:600;font-size:0.8rem;"><i class="fas fa-circle" style="animation:pulse 1s infinite;"></i> Class is currently LIVE</span>':'')+
          '<br><a href="'+window.escAttr(c.meet_link||'#')+'" target="_blank" style="color:#1B5E20;font-size:0.8rem;"><i class="fas fa-link"></i> '+window.escHtml((c.meet_link||'').substring(0,55))+'</a>'+
        '</div>'+
      '</div>'+
      '<div class="sub-actions">'+goLiveBtn+endBtn+reopenBtn+deleteBtn+'</div>'+
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
  var sb = window.geramaSupabase; if(!sb){ el.innerHTML='<p style="color:#9ca3af;">Not connected.</p>'; return; }
  var {data} = await sb.from('potw_nominations').select('*').order('created_at',{ascending:false});
  if(!data||!data.length){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">No nominations yet.</p>'; return; }
  el.innerHTML = data.map(function(p){
    var badge = p.status==='approved' ? '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Featured</span>'
              : p.status==='rejected' ? '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Rejected</span>'
              : '<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">Pending</span>';
    return '<div class="sub-card">'+
      '<div class="sub-info"><strong>'+window.escHtml(p.name||'—')+' '+badge+'</strong>'+
      '<div class="sub-meta">'+(p.role?'<b>Role:</b> '+window.escHtml(p.role)+'<br>':'')+window.escHtml((p.bio||'').substring(0,100))+'</div></div>'+
      '<div class="sub-actions">'+
        (p.status!=='approved'?'<button class="btn-success" onclick="approvePotwNom(\''+p.id+'\')"><i class="fas fa-check"></i> Feature</button>':'')+
        '<button class="btn-danger" onclick="rejectPotwNom(\''+p.id+'\')"><i class="fas fa-trash"></i></button>'+
      '</div></div>';
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
    return '<div class="sub-card">'+
      '<div class="sub-info">'+
        '<strong>'+window.escHtml(r.title||'Untitled Quiz')+' '+badge+'</strong>'+
        '<div class="sub-meta">'+
          '<b>Submitted by:</b> '+window.escHtml(r.submitted_by||'—')+' ('+window.escHtml(r.email||'—')+')<br>'+
          '<b>Course:</b> '+window.escHtml(r.course||'—')+' | <b>Date:</b> '+dt+'<br>'+
          '<a href="'+window.escAttr(r.quiz_url||'#')+'" target="_blank" style="color:#6366f1;font-size:0.82rem;"><i class="fas fa-external-link-alt"></i> Preview Quiz Link</a>'+
          (r.description?'<br><span style="color:#374151;font-size:0.82rem;">'+window.escHtml(r.description)+'</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="sub-actions">'+
        (r.status==='pending'?
          '<button class="btn-success" onclick="approveQuizRequest(\''+r.id+'\',\''+window.escAttr(r.title||'')+'\',\''+window.escAttr(r.course||'')+'\',\''+window.escAttr(r.quiz_url||'')+'\',\''+window.escAttr(r.description||'')+'\')"><i class="fas fa-check"></i> Approve & Publish</button>'+
          '<button class="btn-danger" onclick="rejectQuizRequest(\''+r.id+'\')"><i class="fas fa-times"></i> Reject</button>'
        :'')+
      '</div>'+
    '</div>';
  }).join('');
};

window.approveQuizRequest = async function(id, title, course, url, desc){
  var sb = window.geramaSupabase; if(!sb) return;
  var deadline = new Date(Date.now() + 7*24*60*60*1000).toISOString();
  // Store as JSON array so classroom shuffle works
  var linksJson = JSON.stringify([url]);
  var {error} = await sb.from('quizzes').insert({
    title:title, course:course||null,
    quiz_url: linksJson,
    description: desc||null,
    deadline:deadline, status:'active', created_at:new Date().toISOString()
  });
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

  // Generate random 6-char code
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for(var i=0;i<6;i++) code += chars[Math.floor(Math.random()*chars.length)];

  var expiresAt = new Date(Date.now() + duration*60*1000).toISOString();

  // Close any existing active session first
  await sb.from('attendance_sessions').update({is_active:false}).eq('is_active',true);

  var {data, error} = await sb.from('attendance_sessions').insert({
    code: code,
    class_title: title,
    duration_mins: duration,
    expires_at: expiresAt,
    is_active: true,
    created_at: new Date().toISOString()
  }).select().single();

  if(error){ window.showStatus('attStatus','❌ '+error.message,'err'); return; }

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
  var bySession = {};
  data.forEach(function(r){
    var key = r.class_title||'Unknown Session';
    if(!bySession[key]) bySession[key] = [];
    bySession[key].push(r);
  });

  el.innerHTML = Object.keys(bySession).map(function(title){
    var records = bySession[title];
    var rows = records.map(function(r){
      var dt = r.marked_at ? new Date(r.marked_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
      return '<tr>'+
        '<td><strong>'+window.escHtml(r.student_name||'—')+'</strong></td>'+
        '<td style="font-size:0.8rem;color:#6b7280;">'+window.escHtml(r.student_email||'—')+'</td>'+
        '<td style="font-size:0.8rem;white-space:nowrap;">'+dt+'</td>'+
        '<td><span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.15rem 0.6rem;border-radius:20px;">+'+( r.points||1)+' pt</span></td>'+
      '</tr>';
    }).join('');
    return '<div style="margin-bottom:1.5rem;">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;flex-wrap:wrap;gap:0.5rem;">'+
        '<strong style="font-size:0.95rem;">'+window.escHtml(title)+'</strong>'+
        '<span style="background:#e8f5e9;color:#1B5E20;font-size:0.78rem;font-weight:700;padding:0.2rem 0.7rem;border-radius:20px;">'+records.length+' student'+(records.length!==1?'s':'')+' present</span>'+
      '</div>'+
      '<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Time</th><th>Points</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '</div>';
  }).join('');
};
