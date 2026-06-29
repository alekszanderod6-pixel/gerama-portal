// Study Timer Widget - Brilliant new feature
(function() {
  'use strict';

  var STORAGE_KEY = 'gerama_study_timer';
  var COLLAPSE_KEY = 'gerama_study_timer_collapsed';
  var DISMISS_KEY = 'gerama_study_timer_dismissed_until';
  var state = {
    isRunning: false,
    seconds: 0,
    sessionCount: 0,
    totalMinutes: 0,
    isCollapsed: false
  };

  function loadState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        state = Object.assign(state, parsed);
      }
      var collapsed = localStorage.getItem(COLLAPSE_KEY);
      if (collapsed === 'true') {
        state.isCollapsed = true;
      }
    } catch (e) {}
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(COLLAPSE_KEY, state.isCollapsed ? 'true' : 'false');
  }

  function shouldShowWidget() {
    var dismissedUntil = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (dismissedUntil && Date.now() < dismissedUntil) return false;
    var hour = new Date().getHours();
    return hour >= 18 || hour < 6; // Show after 6pm or before 6am
  }

  function formatTime(totalSeconds) {
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    if (h > 0) {
      return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function updateDisplay() {
    var display = document.getElementById('studyTimerDisplay');
    var sessionDisplay = document.getElementById('studyTimerSessions');
    var totalDisplay = document.getElementById('studyTimerTotal');
    
    if (display) display.textContent = formatTime(state.seconds);
    if (sessionDisplay) sessionDisplay.textContent = state.sessionCount + ' sessions';
    if (totalDisplay) totalDisplay.textContent = Math.floor(state.totalMinutes) + ' min total';
  }

  function toggleTimer() {
    state.isRunning = !state.isRunning;
    var btn = document.getElementById('studyTimerToggle');
    if (btn) {
      btn.innerHTML = state.isRunning ? '<i class="fas fa-pause"></i> Pause' : '<i class="fas fa-play"></i> Start';
      btn.style.background = state.isRunning ? '#dc2626' : '#1B5E20';
    }
    saveState();
  }

  function resetTimer() {
    if (state.seconds > 60) {
      state.sessionCount++;
      state.totalMinutes += state.seconds / 60;
    }
    state.seconds = 0;
    state.isRunning = false;
    var btn = document.getElementById('studyTimerToggle');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-play"></i> Start';
      btn.style.background = '#1B5E20';
    }
    saveState();
    updateDisplay();
  }

  function toggleCollapse() {
    state.isCollapsed = !state.isCollapsed;
    var widget = document.getElementById('studyTimerWidget');
    var content = document.getElementById('studyTimerContent');
    var collapseBtn = document.getElementById('studyTimerCollapse');
    
    if (widget && content && collapseBtn) {
      if (state.isCollapsed) {
        content.style.display = 'none';
        collapseBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      } else {
        content.style.display = 'block';
        collapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
      }
    }
    saveState();
  }

  function dismissWidget() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + (12 * 60 * 60 * 1000)));
    var widget = document.getElementById('studyTimerWidget');
    if (widget) widget.remove();
  }

  function tick() {
    if (state.isRunning) {
      state.seconds++;
      updateDisplay();
      saveState();
    }
  }

  function buildWidget() {
    if (document.getElementById('studyTimerWidget')) return;

    // Only show widget after 6pm or before 6am
    if (!shouldShowWidget()) return;

    var style = document.createElement('style');
    style.id = 'studyTimerStyle';
    style.textContent = [
      '#studyTimerWidget{position:fixed;right:14px;bottom:92px;z-index:8090;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;padding:1rem;border-radius:18px;box-shadow:0 12px 35px rgba(27,94,32,0.3);min-width:200px;font-family:"Inter",sans-serif;transition:all 0.3s;}',
      '#studyTimerWidget.collapsed{min-width:auto;padding:0.6rem 0.8rem;}',
      '#studyTimerHeader{display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.5rem;}',
      '#studyTimerWidget h4{margin:0;font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:0.4rem;}',
      '#studyTimerCollapse{border:none;background:rgba(255,255,255,0.2);color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;}',
      '#studyTimerClose{border:none;background:rgba(255,255,255,0.2);color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:0.72rem;display:flex;align-items:center;justify-content:center;}',
      '#studyTimerCollapse:hover{background:rgba(255,255,255,0.3);}',
      '#studyTimerClose:hover{background:rgba(255,255,255,0.3);}',
      '#studyTimerContent{transition:all 0.3s;}',
      '#studyTimerContent.hidden{display:none;}',
      '#studyTimerDisplay{font-size:2rem;font-weight:800;text-align:center;margin:0.5rem 0;font-family:monospace;letter-spacing:2px;}',
      '#studyTimerStats{display:flex;justify-content:space-between;font-size:0.7rem;opacity:0.9;margin-bottom:0.7rem;}',
      '#studyTimerActions{display:flex;gap:0.5rem;}',
      '#studyTimerToggle{flex:1;border:none;background:#1B5E20;color:#fff;padding:0.5rem;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.8rem;transition:all 0.2s;}',
      '#studyTimerToggle:hover{transform:scale(1.02);}',
      '#studyTimerReset{border:none;background:rgba(255,255,255,0.2);color:#fff;padding:0.5rem 0.8rem;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.8rem;}',
      '#studyTimerReset:hover{background:rgba(255,255,255,0.3);}',
      '@media (max-width:640px){#studyTimerWidget{right:12px;bottom:78px;min-width:180px;padding:0.8rem;}#studyTimerDisplay{font-size:1.6rem;}}'
    ].join('');
    document.head.appendChild(style);

    var widget = document.createElement('div');
    widget.id = 'studyTimerWidget';
    widget.innerHTML = '' +
      '<div id="studyTimerHeader">' +
        '<h4><i class="fas fa-clock"></i> Study Timer</h4>' +
        '<div style="display:flex;align-items:center;gap:0.35rem;">' +
          '<button id="studyTimerCollapse" title="Collapse/Expand"><i class="fas fa-chevron-down"></i></button>' +
          '<button id="studyTimerClose" title="Close Study Timer" aria-label="Close Study Timer"><i class="fas fa-times"></i></button>' +
        '</div>' +
      '</div>' +
      '<div id="studyTimerContent">' +
        '<div id="studyTimerDisplay">00:00</div>' +
        '<div id="studyTimerStats">' +
          '<span id="studyTimerSessions">0 sessions</span>' +
          '<span id="studyTimerTotal">0 min total</span>' +
        '</div>' +
        '<div id="studyTimerActions">' +
          '<button id="studyTimerToggle"><i class="fas fa-play"></i> Start</button>' +
          '<button id="studyTimerReset"><i class="fas fa-redo"></i></button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(widget);

    document.getElementById('studyTimerToggle').addEventListener('click', toggleTimer);
    document.getElementById('studyTimerReset').addEventListener('click', resetTimer);
    document.getElementById('studyTimerCollapse').addEventListener('click', toggleCollapse);
    document.getElementById('studyTimerClose').addEventListener('click', dismissWidget);
  }

  function init() {
    loadState();
    buildWidget();
    if (document.getElementById('studyTimerWidget')) {
      updateDisplay();
      if (state.isCollapsed) {
        toggleCollapse();
      }
    }
    setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
