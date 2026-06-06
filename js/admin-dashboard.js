/* GERAMA Admin Dashboard — extracted JS — v2 */

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
    }, 150);
    if(name === 'quizzes' && window.loadQzList) setTimeout(function(){ window.loadQzList(); window.loadQzAttempts && window.loadQzAttempts(); }, 150);
    if(name === 'quizrequests' && window.loadQuizRequests) setTimeout(window.loadQuizRequests, 150);
    if(name === 'classes' && window.loadClsList) setTimeout(window.loadClsList, 150);
    if(name === 'attendance') setTimeout(function(){ if(window.loadAttSessions) window.loadAttSessions(); if(window.loadAttRecords) window.loadAttRecords(); }, 150);
    if(name === 'classrequests' && window.loadClassRequests) setTimeout(window.loadClassRequests, 150);
    if(name === 'visitors' && window.loadVisitorStats) setTimeout(window.loadVisitorStats, 150);
    if(name === 'messages' && window.loadContactMessages) setTimeout(function(){ window.loadContactMessages('all'); }, 150);
    if(name === 'users') setTimeout(function(){ if(window.loadUsers) window.loadUsers(); }, 150);
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

    // Run every query independently — one failure never blocks others
    var safe = async function(fn){ try{ return await fn(); }catch(e){ return {count:0,data:[]}; } };

    var [todayRes, weekRes, totalRes, quizRes, asgRes, clsRes, clsReqRes, qrRes, subRes, userRes, matRes, annRes] = await Promise.all([
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
      safe(function(){ return sb.from('announcements').select('id',{count:'exact',head:true}); })
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

    var reqBadge = document.getElementById('reqBadge');
    if(reqBadge){ var rc=clsReqRes.count||0; reqBadge.textContent=rc; reqBadge.style.display=rc>0?'inline':'none'; }
    var qrBadge = document.getElementById('quizReqBadge');
    if(qrBadge){ var qc=qrRes.count||0; qrBadge.textContent=qc; qrBadge.style.display=qc>0?'inline':'none'; }
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

    // Load main content
    window.loadData();
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

  if(!title){ window.showStatus('quizStatus','Quiz title is required.','err'); return; }
  if(!deadline){ window.showStatus('quizStatus','Please set a deadline.','err'); return; }

  // Detect mode: link or question paper
  var isPaper = document.getElementById('qzPaperSection') && document.getElementById('qzPaperSection').style.display !== 'none';

  var links = [];
  var paperQuestions = null;

  if(isPaper){
    // Collect typed questions
    var blocks = document.querySelectorAll('.qz-question-block');
    var qs = [];
    blocks.forEach(function(block){
      var text = (block.querySelector('.qz-q-text')||{}).value||'';
      var type = (block.querySelector('.qz-q-type')||{}).value||'text';
      var marks = parseInt((block.querySelector('.qz-q-marks')||{}).value)||2;
      if(!text.trim()) return;
      var q = {text:text.trim(), type:type, marks:marks};
      if(type==='mc'){
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

    var record = {
      title:        title,
      course:       course || null,
      tutor:        tutor  || null,
      duration_mins: duration || null,
      points:       points  || null,
      quiz_url:     links.length ? JSON.stringify(links) : null,
      paper_questions: paperQuestions,
      deadline:     new Date(deadline).toISOString(),
      description:  desc   || null,
      status:       'active',
      created_at:   new Date().toISOString()
    };

    var {error} = await sb.from('quizzes').insert(record);
    if(error) throw new Error(error.message + (error.details ? ' — '+error.details : ''));

    var mode = isPaper ? 'Question Paper ('+JSON.parse(paperQuestions).length+' questions)' : 'Link'+(links.length>1?' ('+links.length+' versions)':'');
    window.logActivity('Published quiz: '+title+' — '+mode);
    window.showStatus('quizStatus','✅ Quiz published! Students can now '+(isPaper?'open the question paper':'take it')+' on the Classroom page.','ok');

    // Clear form
    ['qzTitle','qzCourse','qzDuration','qzPoints','qzTutor','qzDeadline','qzDesc','qzUrl1','qzUrl2','qzUrl3'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.value = id==='qzDuration'?'0':'';
    });
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

window.loadSubmissionsTable = function(){
  if(window.doLoadSubs){ window.doLoadSubs(); return; }
  var el = document.getElementById('submissionsTable');
  var sb = window.geramaSupabase;
  if(!el) return;
  if(!sb){ el.innerHTML='<p style="color:#9ca3af;text-align:center;padding:1rem;">Not connected. Refresh the page.</p>'; return; }
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
  var byCourse={};
  data.forEach(function(s){ var c=s._course||'General'; if(!byCourse[c]) byCourse[c]=[]; byCourse[c].push(s); });
  var total=data.length, graded=data.filter(function(s){ return s.score!==null&&s.score!==undefined&&s.score!==''; }).length;
  var html='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.8rem;margin-bottom:1.2rem;padding:1rem 1.2rem;background:linear-gradient(135deg,#f0fdf4,#f8fafc);border-radius:14px;border:1px solid #c8e6c9;">'+
    '<div><div style="font-size:1rem;font-weight:800;color:#1B5E20;"><i class="fas fa-file-alt"></i> Student Submissions</div>'+
    '<div style="font-size:0.82rem;color:#6b7280;margin-top:0.2rem;">'+
      '<span style="background:#e8f5e9;color:#1B5E20;padding:0.1rem 0.5rem;border-radius:10px;font-weight:700;margin-right:0.4rem;">'+total+' total</span>'+
      '<span style="background:#d1fae5;color:#065f46;padding:0.1rem 0.5rem;border-radius:10px;font-weight:700;margin-right:0.4rem;">'+graded+' graded</span>'+
      '<span style="background:#fef3c7;color:#92400e;padding:0.1rem 0.5rem;border-radius:10px;font-weight:700;">'+(total-graded)+' pending</span></div></div>'+
    '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">'+
      '<button onclick="window.loadSubmissionsTable()" style="background:#f1f5f9;color:#374151;border:1px solid #e5e7eb;padding:0.45rem 0.9rem;border-radius:20px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-sync-alt"></i> Refresh</button>'+
      '<button onclick="downloadGradesSummary()" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);color:white;border:none;padding:0.45rem 1rem;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-download"></i> Download All Grades</button>'+
    '</div></div>';
  Object.keys(byCourse).sort().forEach(function(course){
    var subs=byCourse[course], cg=subs.filter(function(s){ return s.score!==null&&s.score!==undefined&&s.score!==''; }).length;
    var rows=subs.map(function(s){
      var dt=s.submitted_at?new Date(s.submitted_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
      var pts=s._points, cur=(s.score!==null&&s.score!==undefined&&s.score!=='')?s.score:'', sid=String(s.id).replace(/[^a-z0-9]/gi,'');
      var badge=cur!==''?'<span style="background:#d1fae5;color:#065f46;font-size:0.82rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:10px;">'+cur+(pts?'/'+pts:'')+'</span>':'<span style="background:#fef3c7;color:#92400e;font-size:0.72rem;font-weight:600;padding:0.2rem 0.5rem;border-radius:10px;">Ungraded</span>';
      return '<tr>'+
        '<td><strong style="font-size:0.88rem;">'+window.escHtml(s.student_name||'—')+'</strong><div style="font-size:0.75rem;color:#6b7280;">'+window.escHtml(s.student_email||'')+'</div>'+(s.index_number?'<div style="font-size:0.7rem;color:#9ca3af;">'+window.escHtml(s.index_number)+'</div>':'')+'</td>'+
        '<td style="font-size:0.82rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+window.escHtml(s.assignment_title||'—')+'</td>'+
        '<td style="font-size:0.78rem;color:#6b7280;white-space:nowrap;">'+dt+'</td>'+
        '<td>'+(s.file_url?'<a href="'+window.escAttr(s.file_url)+'" target="_blank" style="color:#1B5E20;font-size:0.8rem;font-weight:600;"><i class="fas fa-download"></i> Download</a>':'<span style="color:#9ca3af;font-size:0.78rem;">No file</span>')+'</td>'+
        '<td>'+badge+'</td>'+
        '<td><div style="display:flex;gap:0.3rem;align-items:center;">'+
          '<input type="number" id="score-'+sid+'" value="'+window.escAttr(String(cur))+'" min="0"'+(pts?' max="'+pts+'"':'')+' placeholder="0" style="width:60px;padding:0.3rem 0.4rem;border:2px solid #e5e7eb;border-radius:8px;font-size:0.82rem;outline:none;font-family:\'Inter\',sans-serif;text-align:center;" onfocus="this.style.borderColor=\'#1B5E20\'" onblur="this.style.borderColor=\'#e5e7eb\'">'+
          (pts?'<span style="font-size:0.72rem;color:#9ca3af;">/'+pts+'</span>':'')+
          '<button style="background:#1B5E20;color:white;border:none;padding:0.3rem 0.7rem;border-radius:8px;font-size:0.75rem;cursor:pointer;font-family:\'Inter\',sans-serif;" data-subid="'+s.id+'" data-safeid="'+sid+'" data-email="'+window.escAttr(s.student_email||'')+'" data-title="'+window.escAttr(s.assignment_title||'')+'" onclick="gradeSubmission(this)"><i class="fas fa-check"></i> Grade</button>'+
        '</div><div id="grade-status-'+sid+'" style="font-size:0.7rem;margin-top:0.2rem;color:#059669;"></div></td>'+
      '</tr>';
    }).join('');
    html+='<div style="margin-bottom:2rem;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.7rem;flex-wrap:wrap;gap:0.5rem;">'+
      '<div style="display:flex;align-items:center;gap:0.6rem;"><span style="background:#e8f5e9;color:#1B5E20;font-size:0.82rem;font-weight:700;padding:0.35rem 1rem;border-radius:20px;"><i class="fas fa-book" style="margin-right:0.3rem;"></i>'+window.escHtml(course)+'</span>'+
      '<span style="font-size:0.8rem;color:#6b7280;">'+subs.length+' submission'+(subs.length!==1?'s':'')+(cg?' · <span style="color:#059669;font-weight:600;">'+cg+' graded</span>':'')+'</span></div>'+
      '<button onclick="downloadCourseGrades(\''+window.escAttr(course)+'\')" style="background:none;border:1px solid #c8e6c9;color:#1B5E20;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.75rem;font-weight:600;cursor:pointer;font-family:\'Inter\',sans-serif;"><i class="fas fa-file-csv"></i> Export CSV</button></div>'+
      '<div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>File</th><th>Score</th><th>Grade</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  });
  el.innerHTML=html;
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

  // Also save to student_grades table for portal display
  try{
    await sb.from('student_grades').upsert({
      student_email: email,
      assignment_title: title,
      score: score,
      submission_id: subId,
      graded_at: new Date().toISOString()
    }, {onConflict:'submission_id'});
  }catch(e){}

  window.logActivity('Graded: '+title+' for '+email+' → '+score);
  if(statusEl){statusEl.textContent='✅ Graded!';statusEl.style.color='#059669';}
  btn.style.background='#059669';
  setTimeout(function(){
    if(statusEl) statusEl.textContent='';
    btn.style.background='';
    if(window.loadGradesPanel) window.loadGradesPanel();
  }, 2000);
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
        '<button class="btn-danger" style="font-size:0.75rem;padding:0.3rem 0.8rem;" '+
          'data-session-id="'+(sessionId||'')+'" data-session-title="'+window.escAttr(title)+'" '+
          'onclick="deleteEntireSession(this.getAttribute(\'data-session-id\'),this.getAttribute(\'data-session-title\'))" '+
          'title="Delete entire session and all its records (requires admin code)">'+
          '<i class="fas fa-trash-alt"></i> Delete Session'+
        '</button>'+
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

  // Count stats
  var active = data.filter(function(u){ return u.is_active !== false; }).length;
  var withIndex = data.filter(function(u){ return u.index_number; }).length;

  el.innerHTML =
    '<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center;">'+
      '<div style="background:#e8f5e9;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#1B5E20;">'+data.length+'</strong> <span style="color:#6b7280;">Total</span></div>'+
      '<div style="background:#dbeafe;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#1d4ed8;">'+active+'</strong> <span style="color:#6b7280;">Active</span></div>'+
      '<div style="background:#fef3c7;border-radius:12px;padding:0.8rem 1.2rem;font-size:0.85rem;"><strong style="color:#92400e;">'+withIndex+'</strong> <span style="color:#6b7280;">With Index No.</span></div>'+
      '<div style="margin-left:auto;display:flex;gap:0.5rem;flex-wrap:wrap;">'+
        '<button class="btn-gold" onclick="downloadUsersCSV()" style="padding:0.5rem 1rem;font-size:0.82rem;"><i class="fas fa-download"></i> Download CSV</button>'+
        '<button class="btn-primary" onclick="printUsersTable()" style="padding:0.5rem 1rem;font-size:0.82rem;background:#6366f1;"><i class="fas fa-print"></i> Print</button>'+
      '</div>'+
    '</div>'+
    '<div class="tbl-wrap"><table><thead><tr>'+
      '<th>Name</th><th>Email</th><th>Phone</th><th>Program</th><th>Level</th>'+
      '<th>Index Number <small style="font-weight:400;color:#9ca3af;">(UETG/ENG/26/001)</small></th>'+
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
        '<td>'+statusBadge+'</td>'+
        '<td>'+
          (isActive
            ? '<button class="btn-danger" style="font-size:0.75rem;padding:0.3rem 0.6rem;white-space:nowrap;" onclick="deactivateUser(\''+safeEmail+'\',\''+safeId+'\')"><i class="fas fa-user-slash"></i> Deactivate</button>'
            : '<button class="btn-success" style="font-size:0.75rem;padding:0.3rem 0.6rem;white-space:nowrap;" onclick="reactivateUser(\''+safeEmail+'\',\''+safeId+'\')"><i class="fas fa-user-check"></i> Reactivate</button>')+
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
  var {error} = await sb.from('user_profiles').update({is_active:true}).eq('email',email);
  if(error){ alert('Error: '+error.message); return; }
  window.logActivity('Reactivated user: '+email);
  window.loadUsers();
};

// ─── DOWNLOAD USERS TABLE ────────────────────────────────────────
window.downloadUsersCSV = async function(){
  var sb = window.geramaSupabase; if(!sb){ alert('Not connected.'); return; }
  var {data} = await sb.from('user_profiles').select('*').order('created_at',{ascending:false});
  if(!data||!data.length){ alert('No users to download.'); return; }

  var headers = ['Full Name','Email','Phone','Program','Level','Index Number','Status','Joined'];
  var rows = data.map(function(u){
    var dt = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '';
    var status = u.is_active === false ? 'Inactive' : 'Active';
    return [
      u.full_name||'', u.email||'', u.phone||'', u.program||'', u.level||'',
      u.index_number||'', status, dt
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

// Override loadUsers to store data for filtering
var _origLoadUsers = window.loadUsers;
window.loadUsers = async function(){
  var sb = window.geramaSupabase; if(!sb) return;
  var {data, error} = await sb.from('user_profiles').select('*').order('created_at',{ascending:false});
  if(error || !data) { if(_origLoadUsers) _origLoadUsers(); return; }
  _allUsersData = data;
  renderUsersTable(data);
};

window.filterUsers = function(){
  var q = (document.getElementById('userSearch')||{}).value||'';
  var prog = (document.getElementById('userFilterProgram')||{}).value||'';
  var level = (document.getElementById('userFilterLevel')||{}).value||'';
  q = q.toLowerCase();
  var filtered = _allUsersData.filter(function(u){
    var matchQ = !q || (u.full_name||'').toLowerCase().includes(q) ||
                       (u.email||'').toLowerCase().includes(q) ||
                       (u.index_number||'').toLowerCase().includes(q) ||
                       (u.phone||'').includes(q);
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
      '<th>Index Number</th><th>Status</th><th>Actions</th>'+
    '</tr></thead><tbody>'+
    data.map(function(u){
      var dt = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
      var isActive = u.is_active !== false;
      var statusBadge = isActive
        ? '<span style="background:#d1fae5;color:#065f46;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">Active</span>'
        : '<span style="background:#fee2e2;color:#991b1b;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">Inactive</span>';
      var safeEmail = window.escAttr(u.email||'');
      var safeId = (u.id||'').replace(/[^a-z0-9]/gi,'');
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
  if(row) row.style.display = row.style.display==='none' ? 'block' : 'none';
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
  var name    = (document.getElementById('addAttName')||{}).value||'';
  var email   = (document.getElementById('addAttEmail')||{}).value||'';
  var cls     = (document.getElementById('addAttClass')||{}).value||'';
  var pts     = parseInt((document.getElementById('addAttPoints')||{}).value)||1;
  var secret  = (document.getElementById('addAttSecret')||{}).value||'';
  var statusEl = document.getElementById('addAttStatus');

  function setS(msg,type){ if(statusEl){ statusEl.textContent=msg; statusEl.className='status-msg status-'+type; statusEl.style.display='block'; } }

  if(!name||!email||!cls){ setS('Please fill in Name, Email and Class Title.','err'); return; }
  if(secret !== _ATTENDANCE_SECRET){ setS('❌ Wrong secret code. Access denied.','err'); return; }

  var sb = window.geramaSupabase; if(!sb){ setS('Not connected.','err'); return; }
  setS('Adding...','info');

  var {error} = await sb.from('attendance_records').insert({
    class_title:   cls,
    student_name:  name.trim(),
    student_email: email.trim().toLowerCase(),
    points:        pts,
    marked_at:     new Date().toISOString()
  });

  if(error){ setS('❌ '+error.message,'err'); return; }

  window.logActivity('Manually added attendance: '+name+' for "'+cls+'"');
  setS('✅ Attendance record added for '+name+'!','ok');

  // Clear form
  ['addAttName','addAttEmail','addAttClass','addAttSecret','addAttSearch'].forEach(function(id){
    var e=document.getElementById(id); if(e) e.value='';
  });
  document.getElementById('addAttPoints').value='1';

  setTimeout(function(){
    document.getElementById('addAttRow').style.display='none';
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
  document.getElementById('qzLinkSection').style.display = type==='link' ? 'block' : 'none';
  document.getElementById('qzPaperSection').style.display = type==='paper' ? 'block' : 'none';
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
window.switchPanel_old = window.switchPanel;
// Add adminprofiles to switchPanel
(function(){
  var _orig = window.switchPanel;
  window.switchPanel = function(name){
    if(_orig) _orig(name);
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
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;">'+
    data.map(function(p){
      var initial = (p.name||'A').charAt(0).toUpperCase();
      return '<div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;padding:1.2rem;border:1px solid #c4b5fd;position:relative;">'+
        (p.photo_url?'<img src="'+p.photo_url+'" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #a78bfa;margin-bottom:0.8rem;display:block;">':
          '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:800;margin-bottom:0.8rem;">'+initial+'</div>')+
        '<div style="font-weight:800;color:#1e2a3e;margin-bottom:0.2rem;">'+window.escHtml(p.name)+'</div>'+
        '<div style="font-size:0.78rem;color:#7c3aed;font-weight:700;margin-bottom:0.4rem;">'+window.escHtml(p.role||'Admin')+'</div>'+
        (p.bio?'<div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.4rem;">'+window.escHtml(p.bio)+'</div>':'')+
        (p.phone?'<div style="font-size:0.78rem;color:#374151;"><i class="fas fa-phone" style="margin-right:0.3rem;color:#7c3aed;"></i>'+window.escHtml(p.phone)+'</div>':'')+
        (p.email?'<div style="font-size:0.78rem;color:#374151;margin-bottom:0.6rem;"><i class="fas fa-envelope" style="margin-right:0.3rem;color:#7c3aed;"></i>'+window.escHtml(p.email)+'</div>':'')+
        '<button onclick="deleteAdminProfile(\''+window.escAttr(p.id)+'\',\''+window.escAttr(p.name)+'\')" style="background:#fee2e2;color:#dc2626;border:none;padding:0.25rem 0.7rem;border-radius:8px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;margin-top:0.3rem;"><i class="fas fa-user-minus"></i> Remove Admin</button>'+
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

  var ok=0, fail=0;
  for(var i=0;i<parsed.length;i++){
    var row = parsed[i];
    try{
      // Upsert to student_grades
      await sb.from('student_grades').upsert({
        student_email: row.email,
        assignment_title: qzTitle,
        score: row.score,
        graded_at: new Date().toISOString()
      }, {onConflict:'student_email,assignment_title'});
      ok++;
    }catch(e){ fail++; }
  }
  window.logActivity('Imported '+ok+' quiz scores for: '+qzTitle);
  window.showStatus('importStatus','✅ Imported '+ok+' scores'+(fail?' ('+fail+' failed)':'')+'! Students can now see their grades in the Classroom → Assignments tab.','ok');
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

// Smart CSV parser — auto-detects email and score columns
function parseScoreCSV(csvText, emailColHint, scoreColHint) {
  var lines = csvText.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
  if(!lines.length) return [];

  // Parse header
  var header = lines[0].toLowerCase().split(',').map(function(h){ return h.replace(/"/g,'').trim(); });
  var hasHeader = header.some(function(h){ return h.includes('email')||h.includes('name')||h.includes('student'); });

  var emailIdx = -1, scoreIdx = -1;

  if(emailColHint) {
    var n = parseInt(emailColHint);
    if(!isNaN(n)) emailIdx = n - 1;
    else emailIdx = header.findIndex(function(h){ return h.includes(emailColHint.toLowerCase()); });
  }
  if(scoreColHint) {
    var n2 = parseInt(scoreColHint);
    if(!isNaN(n2)) scoreIdx = n2 - 1;
    else scoreIdx = header.findIndex(function(h){ return h.includes(scoreColHint.toLowerCase()); });
  }

  // Auto-detect if not specified
  if(emailIdx === -1) {
    emailIdx = header.findIndex(function(h){ return h.includes('email')||h.includes('mail'); });
  }
  if(scoreIdx === -1) {
    scoreIdx = header.findIndex(function(h){ return h.includes('score')||h.includes('mark')||h.includes('grade')||h.includes('result')||h.includes('total'); });
  }
  // Fallback: assume first col = email, second = score
  if(emailIdx === -1) emailIdx = 0;
  if(scoreIdx === -1) scoreIdx = 1;

  var dataLines = hasHeader ? lines.slice(1) : lines;
  var results = [];
  dataLines.forEach(function(line) {
    var cols = line.split(',').map(function(c){ return c.replace(/"/g,'').trim(); });
    var email = (cols[emailIdx]||'').toLowerCase();
    var score = parseFloat(cols[scoreIdx]);
    if(email.includes('@') && !isNaN(score)) results.push({email:email, score:score});
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
  if(!parsed.length){ prevEl.style.display='block'; prevEl.innerHTML='<p style="color:#dc2626;">No valid rows found. Check your CSV format.</p>'; return; }
  prevEl.style.display = 'block';
  prevEl.innerHTML = '<div style="font-weight:700;color:#1B5E20;margin-bottom:0.5rem;">Preview ('+parsed.length+' students detected):</div>' +
    '<div class="tbl-wrap"><table><thead><tr><th>Email</th><th>Score</th></tr></thead><tbody>' +
    parsed.slice(0,10).map(function(r){
      return '<tr><td style="font-size:0.85rem;">'+window.escHtml(r.email)+'</td><td><strong>'+r.score+'</strong></td></tr>';
    }).join('') +
    (parsed.length>10?'<tr><td colspan="2" style="color:#9ca3af;font-size:0.8rem;text-align:center;">...and '+(parsed.length-10)+' more</td></tr>':'')+
    '</tbody></table></div>';
};

// Override the old importScoresFromCSV with smart version
window.importScoresFromCSV = async function() {
  var quizId = document.getElementById('importQzSelect').value;
  var csvText = (document.getElementById('importCsvData').value||'').trim();
  var emailCol = document.getElementById('importEmailCol').value||'';
  var scoreCol = document.getElementById('importScoreCol').value||'';

  if(!quizId){ window.showStatus('importStatus','Please select a quiz.','err'); return; }
  if(!csvText){ window.showStatus('importStatus','Please paste CSV data or upload a file.','err'); return; }

  var sb = window.geramaSupabase; if(!sb){ window.showStatus('importStatus','Not connected.','err'); return; }

  var qzRes = await sb.from('quizzes').select('title,points').eq('id',quizId).single();
  var qzTitle = qzRes.data ? qzRes.data.title : 'Quiz';

  var parsed = parseScoreCSV(csvText, emailCol, scoreCol);
  if(!parsed.length){ window.showStatus('importStatus','No valid email+score rows found. Try Preview to diagnose.','err'); return; }

  window.showStatus('importStatus','Importing '+parsed.length+' scores...','info');

  var ok=0, fail=0, errors=[];
  for(var i=0;i<parsed.length;i++){
    var row = parsed[i];
    try{
      // Delete existing then insert fresh (avoids unique constraint issues)
      await sb.from('student_grades').delete().eq('student_email',row.email).eq('assignment_title',qzTitle);
      await sb.from('student_grades').insert({
        student_email: row.email,
        assignment_title: qzTitle,
        score: row.score,
        graded_at: new Date().toISOString()
      });
      ok++;
    }catch(e){ fail++; errors.push(row.email+': '+e.message); }
  }
  window.logActivity('Imported '+ok+' quiz scores for: '+qzTitle);
  var msg = '✅ Successfully imported '+ok+' scores for "'+qzTitle+'"! Students can now see their grades in the Classroom → My Grades tab.';
  if(fail) msg += ' ('+fail+' failed)';
  window.showStatus('importStatus',msg,'ok');
  if(errors.length) console.warn('Import errors:', errors);
};
