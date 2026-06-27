// GERALEX resources page integration
(function() {
  'use strict';

  function getPageContext() {
    var activeLevel = document.querySelector('.level-btn.active');
    var activeSem = document.querySelector('.sem-tab.active');
    var activeType = document.querySelector('.type-tab.active');
    var search = document.getElementById('courseSearchInput');

    return {
      level: activeLevel ? (activeLevel.getAttribute('data-level') || activeLevel.textContent || '').trim() : '',
      semester: activeSem ? (activeSem.getAttribute('data-sem') || activeSem.textContent || '').trim() : '',
      material_type: activeType ? (activeType.getAttribute('data-type') || activeType.textContent || '').trim() : '',
      search: search ? (search.value || '').trim() : ''
    };
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addMessage(role, text) {
    var feed = document.getElementById('geralexFeed');
    if (!feed) return;
    var bubbleClass = role === 'user' ? 'geralex-bubble user' : 'geralex-bubble ai';
    var label = role === 'user' ? 'You' : 'GERALEX';
    var html = '<div class="' + bubbleClass + '">' +
      '<div class="geralex-label">' + label + '</div>' +
      '<div class="geralex-text">' + escapeHtml(text).replace(/\n/g, '<br>') + '</div>' +
    '</div>';
    feed.insertAdjacentHTML('beforeend', html);
    feed.scrollTop = feed.scrollHeight;
  }

  function setStatus(text, kind) {
    var status = document.getElementById('geralexStatus');
    if (!status) return;
    status.textContent = text || '';
    status.style.color = kind === 'err' ? '#b91c1c' : (kind === 'ok' ? '#166534' : '#6b7280');
  }

  async function askGeralex(message) {
    var sb = window.geramaSupabase;
    if (!sb) {
      throw new Error('Supabase is not ready yet on this page.');
    }

    var payload = {
      message: message,
      page: 'resources',
      context: getPageContext()
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

  document.addEventListener('DOMContentLoaded', function() {
    var openBtn = document.getElementById('openGeralexBtn');
    var closeBtn = document.getElementById('closeGeralexBtn');
    var panel = document.getElementById('geralexPanel');
    var form = document.getElementById('geralexForm');
    var input = document.getElementById('geralexInput');
    var feed = document.getElementById('geralexFeed');

    if (!panel || !form || !input || !feed) return;

    function openPanel() {
      panel.style.display = 'block';
      if (!feed.dataset.booted) {
        addMessage('ai', 'Hello, I am GERALEX. Ask me about GERAMA resources, courses, study materials, the mall, classroom features, or public website guidance.');
        feed.dataset.booted = 'true';
      }
      setTimeout(function() { input.focus(); }, 50);
    }

    function closePanel() {
      panel.style.display = 'none';
    }

    if (openBtn) openBtn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    document.querySelectorAll('[data-geralex-prompt]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var prompt = btn.getAttribute('data-geralex-prompt') || '';
        input.value = prompt;
        openPanel();
      });
    });

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var message = (input.value || '').trim();
      if (!message) return;

      addMessage('user', message);
      input.value = '';
      input.disabled = true;
      setStatus('GERALEX is thinking...', 'info');

      try {
        var reply = await askGeralex(message);
        addMessage('ai', reply);
        setStatus('GERALEX is ready.', 'ok');
      } catch (err) {
        addMessage('ai', 'I could not respond just now. Please try again in a moment.');
        setStatus(err && err.message ? err.message : 'GERALEX request failed.', 'err');
      } finally {
        input.disabled = false;
        input.focus();
      }
    });
  });
})();
