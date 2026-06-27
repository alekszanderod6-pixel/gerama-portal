(function() {
  'use strict';

  var currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var skipPages = ['login.html', 'signup.html', 'reset-code.html', 'admin-dashboard.html'];
  if (skipPages.indexOf(currentPage) !== -1) return;

  var HISTORY_KEY = 'geralex_history_' + currentPage;
  var SESSION_KEY = 'geralex_session_id';
  var MAX_HISTORY_ITEMS = 10;
  var MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
  var ALLOWED_MIME_TYPES = {
    'application/pdf': true,
    'image/png': true,
    'image/jpeg': true,
    'image/jpg': true,
    'image/webp': true,
    'image/gif': true
  };

  var state = {
    isOpen: false,
    sending: false,
    history: [],
    attachment: null,
    sessionId: getOrCreateSessionId()
  };

  function getOrCreateSessionId() {
    var existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    var created = 'geralex-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, created);
    return created;
  }

  function loadHistory() {
    try {
      var parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function(item) {
        return item && (item.role === 'user' || item.role === 'ai') && typeof item.text === 'string';
      }).slice(-MAX_HISTORY_ITEMS);
    } catch (err) {
      return [];
    }
  }

  function persistHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(-MAX_HISTORY_ITEMS)));
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getPageLabel() {
    return currentPage.replace('.html', '') || 'home';
  }

  function getSuggestedPrompts() {
    var byPage = {
      'index.html': [
        'What can I do on GERAMA?',
        'Guide me through the portal',
        'How do I get started as a student?'
      ],
      'resources.html': [
        'Help me find materials for my level',
        'How do I upload study material?',
        'Which resource type should I use to revise?'
      ],
      'classroom.html': [
        'Explain the classroom tabs to me',
        'How do I join my class or submit work?',
        'Help me plan my study for this week'
      ],
      'dashboard.html': [
        'Explain my dashboard to me',
        'How can I use GERAMA better every day?',
        'What should I check first here?'
      ],
      'connect.html': [
        'How do I use GERAMA Connect safely?',
        'How do I send messages or media?',
        'What can I do on this page?'
      ],
      'mall.html': [
        'How do I browse and buy items here?',
        'How do student sellers post products?',
        'Help me use the mall safely'
      ],
      'help.html': [
        'Summarize the help page for me',
        'What should I do if I get stuck?',
        'Show me the most important tutorials'
      ]
    };
    return byPage[currentPage] || [
      'What can I do on this page?',
      'Guide me through GERAMA',
      'Help me study better today'
    ];
  }

  function getPageContext() {
    var profile = {};
    try {
      profile = JSON.parse(localStorage.getItem('gerama_profile') || '{}');
    } catch (err) {}

    var headings = Array.prototype.slice.call(document.querySelectorAll('h1, h2, h3'))
      .map(function(el) { return (el.textContent || '').trim(); })
      .filter(Boolean)
      .slice(0, 10);

    var activeLabels = Array.prototype.slice.call(document.querySelectorAll('.active, .tab-btn.active, .tab.active, .level-btn.active, .sem-tab.active, .type-tab.active'))
      .map(function(el) { return (el.textContent || '').trim(); })
      .filter(Boolean)
      .slice(0, 8);

    return {
      page: getPageLabel(),
      title: document.title || '',
      headings: headings,
      active_labels: activeLabels,
      profile: {
        name: profile.name || '',
        program: profile.program || '',
        level: profile.level || ''
      }
    };
  }

  function buildWidget() {
    if (document.getElementById('geralexWidget')) return;

    var style = document.createElement('style');
    style.id = 'geralexWidgetStyle';
    style.textContent = [
      '#geralexLauncher{position:fixed;right:14px;bottom:196px;z-index:8100;border:none;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;box-shadow:0 12px 32px rgba(27,94,32,0.35);cursor:pointer;font-size:1.3rem;font-weight:800;}',
      '#geralexWidget{position:fixed;right:14px;bottom:264px;z-index:8101;width:min(380px,calc(100vw - 24px));max-height:min(72vh,640px);display:none;flex-direction:column;background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:24px;box-shadow:0 24px 60px rgba(15,23,42,0.22);overflow:hidden;}',
      '#geralexWidget.open{display:flex;}',
      '.geralex-head{padding:1rem 1rem 0.8rem;background:linear-gradient(135deg,#0a2f1f,#1B5E20);color:#fff;}',
      '.geralex-title{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;}',
      '.geralex-title h3{margin:0;font-size:1rem;font-weight:800;}',
      '.geralex-title button{border:none;background:rgba(255,255,255,0.14);color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;}',
      '.geralex-sub{margin-top:0.45rem;font-size:0.8rem;line-height:1.45;color:rgba(255,255,255,0.84);}',
      '.geralex-prompts{display:flex;gap:0.45rem;overflow:auto;padding:0.75rem 1rem;background:#f8fafc;border-bottom:1px solid #e5e7eb;}',
      '.geralex-prompt{border:none;background:#fff;color:#1f2937;padding:0.55rem 0.8rem;border-radius:999px;font-size:0.76rem;white-space:nowrap;cursor:pointer;border:1px solid #e5e7eb;}',
      '.geralex-feed{padding:1rem;overflow:auto;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);display:flex;flex-direction:column;gap:0.7rem;min-height:220px;}',
      '.geralex-msg{max-width:88%;padding:0.8rem 0.9rem;border-radius:18px;font-size:0.9rem;line-height:1.5;word-break:break-word;}',
      '.geralex-msg.user{align-self:flex-end;background:#1B5E20;color:#fff;border-bottom-right-radius:6px;}',
      '.geralex-msg.ai{align-self:flex-start;background:#fff;color:#1f2937;border:1px solid #e5e7eb;border-bottom-left-radius:6px;}',
      '.geralex-status{padding:0 1rem 0.7rem;font-size:0.78rem;color:#6b7280;background:#fff;}',
      '.geralex-attachment{display:none;align-items:center;justify-content:space-between;gap:0.6rem;margin:0 1rem 0.7rem;padding:0.65rem 0.8rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;font-size:0.8rem;color:#1e3a8a;}',
      '.geralex-attachment.show{display:flex;}',
      '.geralex-attachment button{border:none;background:transparent;color:#1d4ed8;cursor:pointer;font-weight:700;}',
      '.geralex-form{padding:0 1rem 1rem;background:#fff;}',
      '.geralex-input-wrap{border:1px solid #d1d5db;border-radius:18px;padding:0.6rem;background:#fff;}',
      '.geralex-input-wrap textarea{width:100%;min-height:74px;max-height:160px;resize:vertical;border:none;outline:none;font:inherit;color:#111827;background:transparent;}',
      '.geralex-actions{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-top:0.7rem;}',
      '.geralex-left-actions{display:flex;align-items:center;gap:0.55rem;font-size:0.76rem;color:#6b7280;}',
      '.geralex-file-btn{display:inline-flex;align-items:center;gap:0.35rem;border:none;background:#f3f4f6;color:#111827;border-radius:999px;padding:0.55rem 0.8rem;cursor:pointer;font-weight:700;}',
      '.geralex-send-btn{border:none;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;border-radius:999px;padding:0.7rem 1rem;cursor:pointer;font-weight:800;min-width:90px;}',
      '.geralex-note{margin-top:0.55rem;font-size:0.72rem;color:#6b7280;line-height:1.4;}',
      '@media (max-width:640px){#geralexLauncher{bottom:132px;right:12px;width:54px;height:54px;}#geralexWidget{right:12px;left:12px;bottom:194px;width:auto;max-height:68vh;}}'
    ].join('');
    document.head.appendChild(style);

    var prompts = getSuggestedPrompts().map(function(text) {
      return '<button type="button" class="geralex-prompt" data-geralex-prompt="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
    }).join('');

    var shell = document.createElement('div');
    shell.innerHTML = '' +
      '<button id="geralexLauncher" aria-label="Open GERALEX" title="Ask GERALEX">AI</button>' +
      '<section id="geralexWidget" aria-label="GERALEX assistant">' +
      '  <div class="geralex-head">' +
      '    <div class="geralex-title">' +
      '      <h3>GERALEX AI</h3>' +
      '      <button type="button" id="geralexCloseBtn" aria-label="Close GERALEX">x</button>' +
      '    </div>' +
      '    <div class="geralex-sub">Ask about the portal, study topics, or upload one image/PDF question. Private admin details stay protected.</div>' +
      '  </div>' +
      '  <div class="geralex-prompts">' + prompts + '</div>' +
      '  <div class="geralex-feed" id="geralexFeed"></div>' +
      '  <div class="geralex-status" id="geralexStatus">GERALEX is ready.</div>' +
      '  <div class="geralex-attachment" id="geralexAttachmentBox">' +
      '    <span id="geralexAttachmentName"></span>' +
      '    <button type="button" id="geralexRemoveAttachment">Remove</button>' +
      '  </div>' +
      '  <form class="geralex-form" id="geralexForm">' +
      '    <div class="geralex-input-wrap">' +
      '      <textarea id="geralexInput" placeholder="Ask GERALEX anything about GERAMA or your study problem..."></textarea>' +
      '    </div>' +
      '    <div class="geralex-actions">' +
      '      <div class="geralex-left-actions">' +
      '        <label class="geralex-file-btn" for="geralexFileInput">Attach PDF/Image</label>' +
      '        <input id="geralexFileInput" type="file" accept="application/pdf,image/*" hidden>' +
      '      </div>' +
      '      <button type="submit" class="geralex-send-btn" id="geralexSendBtn">Send</button>' +
      '    </div>' +
      '    <div class="geralex-note">Supports one image or PDF per question. Avoid uploading private or sensitive files.</div>' +
      '  </form>' +
      '</section>';

    while (shell.firstChild) {
      document.body.appendChild(shell.firstChild);
    }
  }

  function addMessage(role, text, skipPersist) {
    var feed = document.getElementById('geralexFeed');
    if (!feed) return;
    var item = document.createElement('div');
    item.className = 'geralex-msg ' + (role === 'user' ? 'user' : 'ai');
    item.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    feed.appendChild(item);
    feed.scrollTop = feed.scrollHeight;

    if (!skipPersist) {
      state.history.push({ role: role, text: String(text || '') });
      state.history = state.history.slice(-MAX_HISTORY_ITEMS);
      persistHistory();
    }
  }

  function setStatus(text, type) {
    var status = document.getElementById('geralexStatus');
    if (!status) return;
    status.textContent = text || '';
    status.style.color = type === 'error' ? '#b91c1c' : (type === 'ok' ? '#166534' : '#6b7280');
  }

  function renderHistory() {
    var feed = document.getElementById('geralexFeed');
    if (!feed) return;
    feed.innerHTML = '';

    if (!state.history.length) {
      addMessage('ai', 'Hello, I am GERALEX. I can guide you through GERAMA, help with study questions, and review one uploaded image or PDF at a time.', true);
      return;
    }

    state.history.forEach(function(entry) {
      addMessage(entry.role, entry.text, true);
    });
  }

  function openWidget() {
    var widget = document.getElementById('geralexWidget');
    var input = document.getElementById('geralexInput');
    if (!widget) return;
    widget.classList.add('open');
    state.isOpen = true;
    setTimeout(function() {
      if (input) input.focus();
    }, 30);
  }

  function closeWidget() {
    var widget = document.getElementById('geralexWidget');
    if (!widget) return;
    widget.classList.remove('open');
    state.isOpen = false;
  }

  function estimateBase64Bytes(base64) {
    var length = (base64 || '').length;
    var padding = 0;
    if (length >= 2 && base64.slice(-2) === '==') padding = 2;
    else if (length >= 1 && base64.slice(-1) === '=') padding = 1;
    return Math.floor(length * 3 / 4) - padding;
  }

  function updateAttachmentUi() {
    var box = document.getElementById('geralexAttachmentBox');
    var name = document.getElementById('geralexAttachmentName');
    if (!box || !name) return;
    if (!state.attachment) {
      box.classList.remove('show');
      name.textContent = '';
      return;
    }
    var sizeMb = (state.attachment.size / (1024 * 1024)).toFixed(2);
    name.textContent = state.attachment.name + ' (' + sizeMb + ' MB)';
    box.classList.add('show');
  }

  function clearAttachment() {
    state.attachment = null;
    var input = document.getElementById('geralexFileInput');
    if (input) input.value = '';
    updateAttachmentUi();
  }

  function readFileAsBase64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() {
        var result = String(reader.result || '');
        var comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = function() {
        reject(new Error('Could not read the selected file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelection(file) {
    if (!file) return;
    if (!ALLOWED_MIME_TYPES[file.type]) {
      clearAttachment();
      setStatus('Only images and PDF files are supported right now.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      clearAttachment();
      setStatus('Please upload a file smaller than 8 MB.', 'error');
      return;
    }

    var base64 = await readFileAsBase64(file);
    if (estimateBase64Bytes(base64) > MAX_FILE_SIZE_BYTES) {
      clearAttachment();
      setStatus('The selected file is too large after encoding.', 'error');
      return;
    }

    state.attachment = {
      name: file.name || 'attachment',
      mimeType: file.type,
      size: file.size,
      data: base64
    };
    updateAttachmentUi();
    setStatus('Attachment added. Ask your question and send.', 'ok');
  }

  async function askGeralex(message, historySnapshot) {
    var sb = window.geramaSupabase;
    if (!sb) throw new Error('Supabase is not ready yet.');

    var payload = {
      message: message,
      page: getPageLabel(),
      sessionId: state.sessionId,
      context: getPageContext(),
      history: Array.isArray(historySnapshot) ? historySnapshot.slice(-6) : state.history.slice(-6),
      attachment: state.attachment ? {
        name: state.attachment.name,
        mimeType: state.attachment.mimeType,
        data: state.attachment.data
      } : null
    };

    var result = await sb.functions.invoke('geralex-chat', { body: payload });
    if (result.error) {
      throw new Error(result.error.message || 'Function invocation failed.');
    }
    if (!result.data || !result.data.reply) {
      throw new Error('GERALEX did not return a reply.');
    }
    return result.data.reply;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (state.sending) return;

    var input = document.getElementById('geralexInput');
    var sendBtn = document.getElementById('geralexSendBtn');
    if (!input || !sendBtn) return;

    var message = (input.value || '').trim();
    if (!message && !state.attachment) {
      setStatus('Type a question or attach a file first.', 'error');
      return;
    }

    if (!message && state.attachment) {
      message = 'Please solve and explain the uploaded question clearly.';
    }

    state.sending = true;
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    var priorHistory = state.history.slice(-6);
    addMessage('user', message);
    if (state.attachment) {
      addMessage('user', 'Attached file: ' + state.attachment.name, true);
    }

    input.value = '';
    setStatus('GERALEX is thinking...', 'info');

    try {
      var reply = await askGeralex(message, priorHistory);
      addMessage('ai', reply);
      setStatus('GERALEX is ready.', 'ok');
      clearAttachment();
    } catch (err) {
      addMessage('ai', 'I could not respond just now. Please try again in a moment.');
      setStatus(err && err.message ? err.message : 'GERALEX request failed.', 'error');
    } finally {
      state.sending = false;
      input.disabled = false;
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
      input.focus();
    }
  }

  function bindEvents() {
    var launcher = document.getElementById('geralexLauncher');
    var closeBtn = document.getElementById('geralexCloseBtn');
    var form = document.getElementById('geralexForm');
    var fileInput = document.getElementById('geralexFileInput');
    var removeBtn = document.getElementById('geralexRemoveAttachment');

    if (launcher) launcher.addEventListener('click', openWidget);
    if (closeBtn) closeBtn.addEventListener('click', closeWidget);
    if (form) form.addEventListener('submit', onSubmit);
    if (removeBtn) removeBtn.addEventListener('click', clearAttachment);

    if (fileInput) {
      fileInput.addEventListener('change', function(event) {
        var file = event.target && event.target.files ? event.target.files[0] : null;
        handleFileSelection(file).catch(function(err) {
          clearAttachment();
          setStatus(err && err.message ? err.message : 'Could not process the selected file.', 'error');
        });
      });
    }

    document.querySelectorAll('[data-geralex-prompt]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var input = document.getElementById('geralexInput');
        if (input) {
          input.value = btn.getAttribute('data-geralex-prompt') || '';
          openWidget();
          input.focus();
        }
      });
    });
  }

  function init() {
    buildWidget();
    state.history = loadHistory();
    renderHistory();
    updateAttachmentUi();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
