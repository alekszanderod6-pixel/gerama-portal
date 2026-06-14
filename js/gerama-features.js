// ═══════════════════════════════════════════════════════════════
// GERAMA Brilliant Features v1.0
// Grade sparkline · Class reminders · Emoji reactions
// Mall new-arrival toasts · Attendance streak
// ═══════════════════════════════════════════════════════════════
'use strict';

// ── 1. GRADE SPARKLINE ─────────────────────────────────────────
// Renders a tiny inline SVG trend line inside the grades card on dashboard.
window.renderGradeSparkline = function(grades) {
  var el = document.getElementById('gradeSpark');
  if (!el || !grades || grades.length < 2) return;

  var scores = grades
    .filter(function(g){ return g.score !== null && g.score !== undefined; })
    .map(function(g){ return parseFloat(g.score) || 0; })
    .slice(0, 10)
    .reverse(); // oldest → newest left-to-right

  if (scores.length < 2) return;

  var w = 120, h = 32, pad = 2;
  var min = Math.min.apply(null, scores);
  var max = Math.max.apply(null, scores);
  var range = max - min || 1;

  var pts = scores.map(function(s, i) {
    var x = pad + (i / (scores.length - 1)) * (w - pad * 2);
    var y = pad + (1 - (s - min) / range) * (h - pad * 2);
    return x.toFixed(1) + ',' + y.toFixed(1);
  });

  var trend = scores[scores.length - 1] >= scores[0] ? '#059669' : '#dc2626';
  var polyline = '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + trend + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  var dot = (function(){
    var last = pts[pts.length - 1].split(',');
    return '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" fill="' + trend + '"/>';
  })();

  el.innerHTML =
    '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;">' +
    polyline + dot +
    '</svg>';
  el.title = 'Grade trend (last ' + scores.length + ' grades). ' + (trend === '#059669' ? '↑ Improving' : '↓ Declining');
};

// Hook into existing loadDashboardData — append sparkline after grades render
(function patchDashGrades(){
  var orig = window.renderGrades;
  if (typeof orig !== 'function') {
    // Wait for it to be defined
    setTimeout(patchDashGrades, 500);
    return;
  }
  window.renderGrades = function(grades) {
    orig(grades);
    // Inject sparkline container if not already there
    var sec = document.getElementById('gradesSection');
    if (sec && !document.getElementById('gradeSpark')) {
      var sparkDiv = document.createElement('div');
      sparkDiv.id = 'gradeSpark';
      sparkDiv.title = '';
      sparkDiv.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:0 0.8rem 0.4rem;opacity:0.8;';
      sec.appendChild(sparkDiv);
    }
    window.renderGradeSparkline(grades);
  };
})();

// ── 2. CLASS REMINDER (Browser Notification) ───────────────────
// Adds a "🔔 Remind me" button to upcoming class cards.
// When clicked, schedules a browser notification 15 min before class.
window.scheduleClassReminder = function(classId, classTitle, scheduledAt) {
  if (!('Notification' in window)) { alert('Notifications not supported by your browser.'); return; }

  Notification.requestPermission().then(function(perm) {
    if (perm !== 'granted') { alert('Please allow notifications to use this feature.'); return; }

    var classTime = new Date(scheduledAt).getTime();
    var remindAt  = classTime - 15 * 60 * 1000; // 15 min before
    var now       = Date.now();
    var delay     = remindAt - now;

    if (delay <= 0) {
      alert('This class starts in less than 15 minutes — reminder not needed!'); return;
    }

    // Persist reminder in localStorage
    var reminders = JSON.parse(localStorage.getItem('gerama_class_reminders') || '{}');
    reminders[classId] = { title: classTitle, scheduledAt: scheduledAt, remindAt: remindAt };
    localStorage.setItem('gerama_class_reminders', JSON.stringify(reminders));

    // Schedule the notification
    setTimeout(function() {
      new Notification('📚 GERAMA Class Starting Soon!', {
        body: classTitle + ' starts in 15 minutes. Get ready!',
        icon: 'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg',
        tag: 'gerama-class-' + classId
      });
    }, Math.max(delay, 0));

    // Update button state
    var btn = document.querySelector('[data-remind-id="' + classId + '"]');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-bell"></i> Reminder set!';
      btn.style.background = '#d1fae5';
      btn.style.color = '#065f46';
      btn.disabled = true;
    }

    var eta = Math.round(delay / 60000);
    alert('✅ Reminder set! We\'ll notify you ' + (eta > 60 ? Math.round(eta/60) + ' hour(s)' : eta + ' minute(s)') + ' before the class starts.');
  });
};

// Re-fire any pending reminders that survived a page reload
(function restoreReminders(){
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  var reminders = JSON.parse(localStorage.getItem('gerama_class_reminders') || '{}');
  var now = Date.now();
  Object.keys(reminders).forEach(function(id) {
    var r = reminders[id];
    var delay = r.remindAt - now;
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // only re-set if within 24h
      setTimeout(function() {
        new Notification('📚 GERAMA Class Starting Soon!', {
          body: r.title + ' starts in 15 minutes. Get ready!',
          icon: 'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg',
          tag: 'gerama-class-' + id
        });
      }, delay);
    } else if (delay <= 0) {
      delete reminders[id]; // clean up past reminders
      localStorage.setItem('gerama_class_reminders', JSON.stringify(reminders));
    }
  });
})();

// Inject "Remind me" button into each upcoming class card after renderClasses runs
(function patchRenderClasses(){
  var orig = window.renderClasses;
  if (typeof orig !== 'function') {
    setTimeout(patchRenderClasses, 500);
    return;
  }
  window.renderClasses = function(classes) {
    orig(classes);
    // After render, inject reminder buttons into upcoming class cards
    var reminders = JSON.parse(localStorage.getItem('gerama_class_reminders') || '{}');
    classes.forEach(function(c) {
      if (c.status === 'live' || c.status === 'ended') return;
      var dt = new Date(c.scheduled_at);
      if (dt.getTime() < Date.now()) return; // already past
      // Find the card — match by title text (safest without adding data-id to HTML)
      var cards = document.querySelectorAll('.class-card');
      cards.forEach(function(card) {
        var titleEl = card.querySelector('.class-title');
        if (!titleEl) return;
        var cardText = titleEl.textContent;
        if (cardText.indexOf(c.course) === -1 && cardText.indexOf(c.topic) === -1) return;
        if (card.querySelector('.remind-btn')) return; // already has button
        var alreadySet = !!reminders[c.id];
        var btn = document.createElement('button');
        btn.className = 'remind-btn';
        btn.setAttribute('data-remind-id', c.id);
        btn.style.cssText = 'background:' + (alreadySet ? '#d1fae5' : '#fef3c7') + ';color:' + (alreadySet ? '#065f46' : '#92400e') + ';border:none;padding:0.35rem 0.9rem;border-radius:20px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:\'Inter\',sans-serif;display:inline-flex;align-items:center;gap:0.3rem;transition:all 0.2s;';
        btn.innerHTML = '<i class="fas fa-bell"></i> ' + (alreadySet ? 'Reminder set' : 'Remind me');
        btn.disabled = alreadySet;
        btn.onclick = function() {
          window.scheduleClassReminder(c.id, c.course + ' — ' + c.topic, c.scheduled_at);
        };
        var actionsEl = card.querySelector('.class-actions');
        if (actionsEl) actionsEl.appendChild(btn);
      });
    });
  };
})();

// ── 3. EMOJI REACTIONS ON DM MESSAGES ─────────────────────────
// Adds a quick-react bar (👍❤️😂😮😢) that floats when hovering a message bubble.
// Reactions are stored per-message in localStorage (client-side only — no DB change needed).
var REACT_EMOJIS = ['👍','❤️','😂','😮','😢','🔥'];

window.toggleReactBar = function(msgId, anchorEl) {
  var existing = document.getElementById('reactBar-' + msgId);
  if (existing) { existing.remove(); return; }

  // Remove any other open react bars
  document.querySelectorAll('.gerama-react-bar').forEach(function(b){ b.remove(); });

  var bar = document.createElement('div');
  bar.id = 'reactBar-' + msgId;
  bar.className = 'gerama-react-bar';
  bar.style.cssText = 'position:absolute;bottom:calc(100% + 4px);left:0;background:white;border-radius:30px;box-shadow:0 4px 20px rgba(0,0,0,0.18);padding:0.3rem 0.5rem;display:flex;gap:0.2rem;z-index:999;border:1px solid #e5e7eb;';

  REACT_EMOJIS.forEach(function(emoji) {
    var btn = document.createElement('button');
    btn.style.cssText = 'background:none;border:none;font-size:1.15rem;cursor:pointer;padding:0.2rem;border-radius:50%;transition:transform 0.15s;';
    btn.textContent = emoji;
    btn.title = 'React ' + emoji;
    btn.onmouseover = function(){ btn.style.transform = 'scale(1.35)'; };
    btn.onmouseout  = function(){ btn.style.transform = ''; };
    btn.onclick = function(e) {
      e.stopPropagation();
      window.addReaction(msgId, emoji);
      bar.remove();
    };
    bar.appendChild(btn);
  });

  // Position relative to the message row
  var msgRow = anchorEl.closest('[data-msgid]') || anchorEl.parentElement;
  if (msgRow) {
    msgRow.style.position = 'relative';
    msgRow.appendChild(bar);
  }
  // Auto-close after 4s
  setTimeout(function(){ if(bar.parentNode) bar.remove(); }, 4000);
};

window.addReaction = function(msgId, emoji) {
  if (!msgId) return;
  var key = 'gerama_reactions';
  var reactions = JSON.parse(localStorage.getItem(key) || '{}');
  if (!reactions[msgId]) reactions[msgId] = {};
  reactions[msgId][emoji] = (reactions[msgId][emoji] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(reactions));
  window.renderReactions(msgId);
};

window.renderReactions = function(msgId) {
  if (!msgId) return;
  var reactions = JSON.parse(localStorage.getItem('gerama_reactions') || '{}');
  var msgReacts = reactions[msgId];
  if (!msgReacts) return;

  var msgRow = document.querySelector('[data-msgid="' + msgId + '"]');
  if (!msgRow) return;

  var existing = msgRow.querySelector('.react-display');
  if (existing) existing.remove();

  var entries = Object.entries(msgReacts).filter(function(e){ return e[1] > 0; });
  if (!entries.length) return;

  var display = document.createElement('div');
  display.className = 'react-display';
  display.style.cssText = 'display:flex;gap:0.25rem;flex-wrap:wrap;margin-top:0.25rem;padding-left:0.4rem;';
  display.innerHTML = entries.map(function(e) {
    return '<span style="background:white;border:1px solid #e5e7eb;border-radius:20px;padding:0.1rem 0.45rem;font-size:0.8rem;cursor:pointer;" onclick="window.addReaction(\'' + msgId + '\',\'' + e[0] + '\')" title="React">' + e[0] + (e[1] > 1 ? ' ' + e[1] : '') + '</span>';
  }).join('');

  var bubble = msgRow.querySelector('.msg-bubble');
  if (bubble) bubble.after(display);
  else msgRow.appendChild(display);
};

// Patch buildMsgHtml to: (a) add react button, (b) restore saved reactions
(function patchBuildMsg(){
  var orig = window.buildMsgHtml;
  if (typeof orig !== 'function') {
    setTimeout(patchBuildMsg, 400);
    return;
  }
  window.buildMsgHtml = function(m, mine) {
    var html = orig(m, mine);
    if (!m || !m.id || m.is_deleted || m.deleted) return html;
    // Inject react trigger into the bubble
    // We use a wrapper trick: inject after the menu btn
    html = html.replace(
      'class="msg-menu-btn"',
      'class="msg-menu-btn"'
    );
    // Add react button alongside the menu
    var reactBtn = '<button class="msg-react-btn" onclick="event.stopPropagation();window.toggleReactBar(\'' + m.id + '\',this)" style="background:none;border:none;color:#9ca3af;font-size:0.82rem;cursor:pointer;padding:0.2rem 0.3rem;opacity:0.7;transition:opacity 0.2s;" title="React">😊</button>';
    html = html.replace('class="msg-menu-btn"', 'class="msg-menu-btn"').replace(/(<button class="msg-menu-btn"[^>]*>)/, reactBtn + '$1');
    return html;
  };
})();

// On DM messages load, restore any saved reactions
(function patchRenderMessages(){
  var orig = window.renderMessages;
  if (typeof orig !== 'function') {
    setTimeout(patchRenderMessages, 400);
    return;
  }
  window.renderMessages = function(data, container) {
    orig(data, container);
    // After rendering, restore reactions for each visible message
    var reactions = JSON.parse(localStorage.getItem('gerama_reactions') || '{}');
    Object.keys(reactions).forEach(function(msgId) {
      window.renderReactions(msgId);
    });
  };
})();

// ── 4. MALL NEW-ARRIVAL TOAST ──────────────────────────────────
// Shows a toast notification at the bottom of the page when a new
// product arrives via realtime. Already handled in mall.html realtime
// callback — we just provide the toast utility here.
window.showMallToast = function(productName, sellerName) {
  var existing = document.getElementById('mallToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'mallToast';
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:linear-gradient(135deg,#0a2f1f,#1B5E20);color:white;padding:0.75rem 1.4rem;border-radius:30px;box-shadow:0 8px 30px rgba(27,94,32,0.4);font-size:0.88rem;font-weight:700;display:flex;align-items:center;gap:0.6rem;z-index:9999;opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);max-width:90vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
  toast.innerHTML = '<i class="fas fa-store" style="color:#FFC107;"></i> New arrival: <strong>' + (productName||'Product') + '</strong> by ' + (sellerName||'Seller') + ' 🎉';

  document.body.appendChild(toast);
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });
  setTimeout(function(){
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(function(){ if(toast.parentNode) toast.remove(); }, 400);
  }, 5000);
};

// ── 5. ATTENDANCE STREAK BADGE ─────────────────────────────────
// Computes how many consecutive weeks the student attended ≥1 class,
// then injects a "🔥 X-week streak" badge on the dashboard attendance stat box.
window.computeAttendanceStreak = function(records) {
  if (!records || !records.length) return 0;
  // Group by ISO week
  function isoWeek(dateStr) {
    var d = new Date(dateStr);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }
  var weeks = new Set(records.map(function(r){ return new Date(r.marked_at).getFullYear() + '-W' + isoWeek(r.marked_at); }));
  // Count consecutive weeks ending at most recent
  var sorted = Array.from(weeks).sort().reverse();
  if (!sorted.length) return 0;
  var streak = 1;
  for (var i = 1; i < sorted.length; i++) {
    var parts = sorted[i].split('-W');
    var prevParts = sorted[i-1].split('-W');
    var diff = (parseInt(prevParts[0]) - parseInt(parts[0])) * 52 + (parseInt(prevParts[1]) - parseInt(parts[1]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};

// Hook into loadDashboardData to update the attendance streak badge
(function patchDashData(){
  var orig = window.loadDashboardData;
  if (typeof orig !== 'function') {
    setTimeout(patchDashData, 600);
    return;
  }
  window.loadDashboardData = async function() {
    await orig();
    // After data loads, attendance records are fetched inside loadDashboardData.
    // We re-fetch them here for the streak calc (lightweight — limit 50).
    try {
      var sb = window.geramaSupabase;
      if (!sb) return;
      var profile = JSON.parse(localStorage.getItem('gerama_profile') || '{}');
      var email = profile.email || '';
      if (!email) return;
      var res = await sb.from('attendance_records').select('marked_at').eq('student_email', email).order('marked_at', {ascending: false}).limit(50);
      var streak = window.computeAttendanceStreak(res.data || []);
      var attBox = document.getElementById('statAttendance');
      if (attBox && streak >= 2) {
        var parent = attBox.closest('.qs-box');
        if (parent && !parent.querySelector('.att-streak-badge')) {
          var badge = document.createElement('div');
          badge.className = 'att-streak-badge';
          badge.style.cssText = 'font-size:0.65rem;font-weight:800;color:#d97706;margin-top:0.15rem;';
          badge.textContent = '🔥 ' + streak + '-week streak';
          parent.appendChild(badge);
        }
      }
    } catch(e) {}
  };
})();

// ── 6. SMART GRADE SUMMARY (% band) ────────────────────────────
// After grades load on the dashboard, show a smart summary line:
// e.g. "Averaging 72% · 3 A grades · You're doing great! 💪"
window.showGradeSummaryLine = function(grades) {
  var sec = document.getElementById('gradesSection');
  if (!sec || !grades || !grades.length) return;
  if (document.getElementById('gradeSummaryLine')) return;

  var total = 0, count = 0, aCount = 0, fCount = 0;
  grades.forEach(function(g) {
    var score = parseFloat(g.score);
    var max = parseFloat(g.total_marks || g.points || 100);
    if (isNaN(score) || isNaN(max) || max <= 0) return;
    var pct = (score / max) * 100;
    total += pct; count++;
    if (pct >= 70) aCount++;
    if (pct < 50) fCount++;
  });
  if (!count) return;

  var avg = Math.round(total / count);
  var msg = avg >= 70 ? "You're doing great! 💪" : avg >= 50 ? "Keep pushing — you're almost there! 📚" : "Review your weak areas — you can do this! 🌱";
  var color = avg >= 70 ? '#059669' : avg >= 50 ? '#d97706' : '#dc2626';

  var line = document.createElement('div');
  line.id = 'gradeSummaryLine';
  line.style.cssText = 'font-size:0.78rem;font-weight:700;color:' + color + ';background:' + (avg >= 70 ? '#d1fae5' : avg >= 50 ? '#fef3c7' : '#fee2e2') + ';border-radius:10px;padding:0.45rem 0.8rem;margin-bottom:0.6rem;display:flex;align-items:center;gap:0.4rem;';
  line.innerHTML = '<i class="fas fa-chart-line"></i> Averaging <strong>' + avg + '%</strong> · ' + aCount + ' A+ · ' + msg;
  sec.insertBefore(line, sec.firstChild);
};

// Patch renderGrades to also inject the summary line
(function patchRenderGradesSummary(){
  var orig2 = window.renderGrades;
  if (typeof orig2 !== 'function') {
    setTimeout(patchRenderGradesSummary, 600);
    return;
  }
  window.renderGrades = function(grades) {
    orig2(grades);
    window.showGradeSummaryLine(grades);
  };
})();

console.log('[GERAMA] Brilliant features loaded ✅');
