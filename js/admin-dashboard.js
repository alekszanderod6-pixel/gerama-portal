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
    if(name === 'classes' && window.loadClsList) setTimeout(window.loadClsList, 150);
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
            return {
              level: r.level,
              sem: r.semester,
              course: r.course,
              type: r.type,
              name: r.name,
              desc: r.description||'',
              url: r.file_url,
              path: r.storage_path||'',
              date: r.created_at,
              id: r.id,
              status: r.status||'approved'
            };
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
            return {
              id: r.id,
              title: r.title,
              message: r.message,
              priority: r.priority||'normal',
              image: r.image_url||null,
              date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : ''
            };
          });
          localStorage.setItem('gerama_announcements', JSON.stringify(announcements));
        }
      }
    }catch(e){}

    renderHistory();
    renderSubmissions();
    renderAnnouncements();
    updateStats();
    renderRecent();

    // class request badge (best effort)
    try{
      var sb3 = window.geramaSupabase;
      if(sb3){
        var res = await sb3.from('class_requests').select('id').eq('status','pending');
        var pending = (res && res.data) ? res.data.length : 0;
        var badge = document.getElementById('reqBadge');
        var statEl = document.getElementById('statClassReqs');
        if(badge){ badge.textContent=pending; badge.style.display=pending>0?'inline':'none'; }
        if(statEl) statEl.textContent=pending;
      }
    }catch(e){}
  };

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
    if(uploadMatBtn) uploadMatBtn.addEventListener('click', window.uploadMaterial || function(){});

    // Load main content
    window.loadData();
    setTimeout(window.loadVisitorStats, 800);
  });

  // Note: Remaining admin panels (assignments/quizzes/class scheduling/etc.)
  // were intentionally removed from inline scripts to stop the UI from rendering code.
  // If needed later, we can re-extract those remaining functions safely into this file.

})();

