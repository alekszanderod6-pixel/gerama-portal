// ═══════════════════════════════════════════════════════════════════
// GERAMA AI Assistant — GERA v2
// Calls /api/gera-chat (Vercel serverless → Groq Llama 3)
// The API key never touches the browser. Fully secure.
// ═══════════════════════════════════════════════════════════════════
'use strict';

(function () {

var SKIP_PAGES = ['login.html', 'signup.html', 'reset-code.html', 'admin-dashboard.html'];
var currentPage = window.location.pathname.split('/').pop() || 'index.html';
if (SKIP_PAGES.indexOf(currentPage) !== -1) return;

// ── Conversation history (kept in memory for the session) ────────
var _history = [];
var _geraOpen = false;
var _isTyping = false;

// ── Session ID for anonymous logging ─────────────────────────────
var _sessionId = localStorage.getItem('gera_session') || (function () {
  var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('gera_session', id);
  return id;
})();

// ── Offline / navigation-only KB (instant, no network needed) ────
// Used ONLY when the API is completely unreachable (true offline)
var _offlineKB = [
  { q: ['sign up','register','join gerama','create account'],
    a: '**To sign up:** Tap "Join Free →" on the home page → fill in your email and password → enter the GERAMA Secret Code (ask your rep or WhatsApp group) → tap "Create Account". ✅' },
  { q: ['sign in','login','secret code','can\'t log in'],
    a: '**To sign in:** Enter your email, password, and the GERAMA Secret Code → tap "Sign In". If the screen shakes, the code is wrong. Tap 👁 to reveal what you typed.' },
  { q: ['forgot password','reset password','locked out'],
    a: '**Reset your password:** Go to login page → tap "Forgot Password?" → enter your email → check your inbox for a reset link. Check spam if you don\'t see it. 🔑' },
  { q: ['join class','live class','online class','classroom'],
    a: '**To join a class:** Classroom (📋 nav) → Classes tab → find the card with "LIVE 🔴" badge → tap the green "Join Class" button.' },
  { q: ['attendance','mark present','class code'],
    a: '**To mark attendance:** Classroom → ✅ Attendance tab → type the 8-character code your lecturer gives → tap "✓ Mark Present". Code expires fast — mark it immediately!' },
  { q: ['assignment','submit','homework'],
    a: '**To submit an assignment:** Classroom → Assignments tab → find your card → "Submit Assignment" → type your answer or upload a file → Submit.' },
  { q: ['quiz','take quiz','test'],
    a: '**To take a quiz:** Classroom → Quizzes tab → find "Open Now" → "Take Quiz" → answer all questions → Submit. Score shows instantly!' },
  { q: ['grades','my grades','score','results'],
    a: '**To see grades:** Dashboard → "⭐ My Grades" card, or Classroom → "My Grades" tab. The coloured bar shows your average and trend.' },
  { q: ['dashboard'],
    a: '**Your Dashboard:** ☰ menu → "My Dashboard". See grades, 🔥 streak, stats, and quick links to everything.' },
  { q: ['t-shirt','tshirt','shirt'],
    a: '**T-shirt order:** Urban Mall → 👕 Fashion → GERAMA Round Neck T-Shirt → Order → pick colour and size → "📲 Order via WhatsApp".' },
  { q: ['mall','buy','sell','urban mall'],
    a: '**Urban Mall:** ☰ menu → "🛍️ Urban Mall". Browse by category, add to cart, or tap "Order" on any product. To sell: tap "+ Sell Here".' },
  { q: ['connect','message','dm','chat'],
    a: '**GERAMA Connect:** ☰ menu → "📡 GERAMA Connect". Browse Members → tap "💬 Message" to DM anyone. Also has Groups, Reels, and Calls.' },
  { q: ['resources','materials','slides','past questions','books'],
    a: '**Study materials:** ☰ menu → "📖 Resources" → filter by Level (L100–L400) and Course → pick type (Slides / Books / Past Qs / Videos) → download.' },
  { q: ['notification','alert','bell','push'],
    a: '**Push notifications:** tap the 🔔 bell button (bottom-right, any page) → allow when prompted. Bell turns green = subscribed. iPhone: add to home screen first.' },
  { q: ['dark mode','night mode'],
    a: '**Dark mode:** ☰ menu → tap "🌙 Dark" at the bottom. Tap "☀️ Light" to switch back.' },
  { q: ['install','pwa','app','home screen'],
    a: '**Install as app:** Android → Chrome ⋮ → "Add to Home Screen". iPhone → Safari Share ⬆️ → "Add to Home Screen" → Add.' },
  { q: ['help','tutorial','guide','how to'],
    a: '**Help Center:** tap the ❓ yellow button (bottom-right) or go to help.html. 22+ visual step-by-step guides, all downloadable as images. 🎓' },
  { q: ['opportunities','internship','scholarship','nss','job'],
    a: '**Opportunities Hub:** Dashboard → "🌍 Opportunities Hub" button, or Classroom → Opportunities tab. Filter: All / Internship / NSS / Scholarship / Job.' },
  { q: ['study group','group','cohort'],
    a: '**Study groups:** GERAMA Connect → Groups tab → find your level\'s group → "→ View" to enter the chat. You can also start a group video call.' },
  { q: ['what is gerama','about gerama'],
    a: '**GERAMA** is the academic portal for engineering students at UENR — free resources, live classes, grades, connect, and a campus marketplace. All in one place. ⚙️' },
];

function _offlineAnswer(question) {
  var q = question.toLowerCase();
  var best = null, bestScore = 0;
  _offlineKB.forEach(function (item) {
    var score = 0;
    item.q.forEach(function (kw) {
      if (q.indexOf(kw) !== -1) score += kw.split(' ').length;
    });
    if (score > bestScore) { bestScore = score; best = item; }
  });
  return bestScore > 0 ? best.a : null;
}

// ── Styles ────────────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent = `
#geraAiBtn{position:fixed;bottom:200px;right:14px;z-index:7998;width:50px;height:50px;
  border-radius:50%;background:linear-gradient(135deg,#6d28d9,#7c3aed);border:none;
  cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.3rem;
  box-shadow:0 4px 20px rgba(109,40,217,0.55);transition:transform 0.2s,box-shadow 0.2s;
  animation:geraPulse 3s ease-in-out infinite;}
#geraAiBtn:hover{transform:scale(1.12);}
@keyframes geraPulse{
  0%,100%{box-shadow:0 4px 20px rgba(109,40,217,0.55);}
  50%{box-shadow:0 4px 28px rgba(109,40,217,0.9),0 0 0 8px rgba(109,40,217,0.1);}
}
#geraLabel{position:fixed;bottom:234px;right:66px;z-index:7998;
  background:linear-gradient(135deg,#6d28d9,#7c3aed);color:white;
  padding:0.3rem 0.8rem;border-radius:20px;font-size:0.72rem;font-weight:800;
  font-family:Inter,sans-serif;white-space:nowrap;pointer-events:none;
  box-shadow:0 2px 12px rgba(109,40,217,0.4);
  animation:geraLabelFade 5s ease forwards;}
@keyframes geraLabelFade{0%,65%{opacity:1;}100%{opacity:0;}}
#geraPanel{position:fixed;bottom:0;right:0;z-index:9500;
  width:min(390px,100vw);height:min(580px,92vh);
  background:white;border-radius:20px 20px 0 0;
  box-shadow:0 -8px 40px rgba(0,0,0,0.25);
  display:flex;flex-direction:column;
  transform:translateY(110%);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);}
@media(min-width:480px){#geraPanel{bottom:14px;right:14px;border-radius:20px;}}
#geraPanel.open{transform:translateY(0);}
#geraHeader{background:linear-gradient(135deg,#4c1d95,#6d28d9);padding:1rem 1.1rem;
  border-radius:20px 20px 0 0;display:flex;align-items:center;gap:0.7rem;flex-shrink:0;}
@media(min-width:480px){#geraHeader{border-radius:20px 20px 0 0;}}
#geraAvatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);
  display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
#geraHeaderText .gt{color:white;font-weight:900;font-size:0.95rem;}
#geraHeaderText .gs{color:rgba(255,255,255,0.65);font-size:0.71rem;margin-top:1px;}
.gera-online-dot{width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0;
  box-shadow:0 0 0 2px rgba(16,185,129,0.3);animation:geraOnline 2s infinite;}
@keyframes geraOnline{0%,100%{opacity:1;}50%{opacity:0.4;}}
#geraCloseBtn{background:rgba(255,255,255,0.15);border:none;color:white;width:30px;height:30px;
  border-radius:50%;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;
  justify-content:center;margin-left:auto;transition:background 0.2s;}
#geraCloseBtn:hover{background:rgba(255,255,255,0.25);}
#geraClearBtn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);
  color:rgba(255,255,255,0.7);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.68rem;
  font-weight:700;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;
  transition:all 0.2s;margin-right:0.3rem;}
#geraClearBtn:hover{background:rgba(255,255,255,0.2);color:white;}
#geraMsgs{flex:1;overflow-y:auto;padding:0.85rem;display:flex;flex-direction:column;
  gap:0.65rem;background:#f8fafc;scroll-behavior:smooth;}
.gera-msg{max-width:88%;padding:0.7rem 0.95rem;border-radius:18px;font-size:0.85rem;
  line-height:1.55;font-family:Inter,sans-serif;word-break:break-word;
  animation:geraMsgIn 0.28s ease;}
@keyframes geraMsgIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.gera-msg.bot{background:white;color:#1e2a3e;border-radius:4px 18px 18px 18px;
  align-self:flex-start;box-shadow:0 2px 10px rgba(0,0,0,0.07);}
.gera-msg.user{background:linear-gradient(135deg,#6d28d9,#7c3aed);color:white;
  border-radius:18px 4px 18px 18px;align-self:flex-end;}
.gera-msg.error{background:#fff1f1;color:#dc2626;border:1px solid #fca5a5;
  border-radius:4px 18px 18px 18px;align-self:flex-start;}
.gera-msg code{background:rgba(0,0,0,0.06);padding:0.1rem 0.35rem;border-radius:4px;
  font-family:monospace;font-size:0.82rem;}
.gera-msg pre{background:#1e2a3e;color:#e2e8f0;padding:0.7rem 0.9rem;border-radius:10px;
  font-size:0.78rem;overflow-x:auto;margin:0.4rem 0;font-family:monospace;line-height:1.5;}
.gera-msg ul,.gera-msg ol{padding-left:1.3rem;margin:0.3rem 0;}
.gera-msg li{margin-bottom:0.2rem;}
.gera-msg a{color:#7c3aed;text-decoration:underline;}
.gera-typing-wrap{background:white;border-radius:4px 18px 18px 18px;align-self:flex-start;
  padding:0.7rem 1rem;box-shadow:0 2px 10px rgba(0,0,0,0.07);}
.gera-typing{display:flex;gap:4px;align-items:center;}
.gera-typing span{width:7px;height:7px;border-radius:50%;background:#a78bfa;
  animation:geraTyp 1.1s infinite;}
.gera-typing span:nth-child(2){animation-delay:0.18s;}
.gera-typing span:nth-child(3){animation-delay:0.36s;}
@keyframes geraTyp{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}
#geraQuickBtns{padding:0.5rem 0.75rem;display:flex;gap:0.35rem;flex-wrap:wrap;
  background:#f8fafc;border-top:1px solid #f0f0f0;flex-shrink:0;}
.gera-qbtn{background:white;border:1.5px solid #e5e7eb;color:#374151;
  padding:0.28rem 0.65rem;border-radius:20px;font-size:0.7rem;font-weight:700;
  cursor:pointer;font-family:Inter,sans-serif;transition:all 0.15s;white-space:nowrap;}
.gera-qbtn:hover{background:#7c3aed;color:white;border-color:#7c3aed;transform:translateY(-1px);}
#geraInputRow{padding:0.65rem;background:white;border-top:1px solid #f1f5f9;
  display:flex;gap:0.45rem;align-items:flex-end;flex-shrink:0;}
#geraInput{flex:1;padding:0.6rem 0.95rem;border-radius:20px;border:1.5px solid #e5e7eb;
  font-size:0.87rem;font-family:Inter,sans-serif;outline:none;resize:none;
  line-height:1.45;max-height:90px;overflow-y:auto;transition:border-color 0.2s;}
#geraInput:focus{border-color:#7c3aed;}
#geraSend{width:38px;height:38px;border-radius:50%;
  background:linear-gradient(135deg,#6d28d9,#7c3aed);border:none;color:white;
  cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:transform 0.15s,opacity 0.2s;}
#geraSend:hover{transform:scale(1.1);}
#geraSend:disabled{opacity:0.45;cursor:not-allowed;transform:none;}
`;
document.head.appendChild(style);

// ── Inject HTML ───────────────────────────────────────────────────
function _injectUI() {
  if (document.getElementById('geraPanel')) return;

  // Floating button
  var btn = document.createElement('button');
  btn.id = 'geraAiBtn';
  btn.setAttribute('aria-label', 'Open GERA AI Assistant');
  btn.title = 'Ask GERA — AI assistant';
  btn.innerHTML = '🤖';
  btn.onclick = toggleGeraPanel;
  document.body.appendChild(btn);

  // Fade-in label
  var lbl = document.createElement('div');
  lbl.id = 'geraLabel';
  lbl.textContent = '✨ Ask GERA';
  document.body.appendChild(lbl);
  setTimeout(function () { if (lbl.parentNode) lbl.remove(); }, 5500);

  // Chat panel
  var panel = document.createElement('div');
  panel.id = 'geraPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'GERA AI Assistant');
  panel.innerHTML =
    '<div id="geraHeader">' +
      '<div id="geraAvatar">🤖</div>' +
      '<div id="geraHeaderText">' +
        '<div class="gt">GERA — AI Assistant</div>' +
        '<div class="gs">Powered by Llama 3 · Platform guide &amp; study help</div>' +
      '</div>' +
      '<div class="gera-online-dot"></div>' +
      '<button id="geraClearBtn" onclick="geraClearChat()" title="Clear conversation">Clear</button>' +
      '<button id="geraCloseBtn" onclick="toggleGeraPanel()" aria-label="Close">✕</button>' +
    '</div>' +
    '<div id="geraMsgs"></div>' +
    '<div id="geraQuickBtns">' +
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I join a class?\')">🖥️ Join class</button>' +
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I see my grades?\')">⭐ Grades</button>' +
      '<button class="gera-qbtn" onclick="geraAsk(\'Mark attendance\')">✅ Attendance</button>' +
      '<button class="gera-qbtn" onclick="geraAsk(\'Order a T-shirt\')">👕 T-Shirt</button>' +
      '<button class="gera-qbtn" onclick="geraAsk(\'Explain Ohm\'s law\')">⚡ Ohm\'s law</button>' +
      '<button class="gera-qbtn" onclick="geraAsk(\'What is a Laplace transform?\')">📐 Laplace</button>' +
    '</div>' +
    '<div id="geraInputRow">' +
      '<textarea id="geraInput" placeholder="Ask anything — platform help or study questions…" rows="1" aria-label="Message GERA"></textarea>' +
      '<button id="geraSend" aria-label="Send"><i class="fas fa-paper-plane"></i></button>' +
    '</div>';
  document.body.appendChild(panel);

  document.getElementById('geraSend').onclick = geraSendMsg;

  var input = document.getElementById('geraInput');
  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 90) + 'px';
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); geraSendMsg(); }
  });

  // Welcome message
  setTimeout(function () {
    _addBotMsg(
      'Hey! 👋 I\'m **GERA**, your AI assistant for GERAMA.\n\n' +
      'I can help you with:\n' +
      '• **Navigating the platform** — classes, grades, assignments, mall, connect, and more\n' +
      '• **Academic questions** — engineering, maths, physics, and science topics\n\n' +
      'What do you need? 🎓'
    );
  }, 350);
}

// ── Panel toggle ──────────────────────────────────────────────────
function toggleGeraPanel() {
  var panel = document.getElementById('geraPanel');
  if (!panel) return;
  _geraOpen = !_geraOpen;
  panel.classList.toggle('open', _geraOpen);
  if (_geraOpen) {
    setTimeout(function () {
      var inp = document.getElementById('geraInput');
      if (inp) inp.focus();
    }, 350);
  }
}

function geraClearChat() {
  _history = [];
  var msgs = document.getElementById('geraMsgs');
  if (msgs) msgs.innerHTML = '';
  _addBotMsg('Chat cleared. What would you like to know? 😊');
}

// ── Message rendering ─────────────────────────────────────────────
function _renderMarkdown(text) {
  return text
    // code blocks first
    .replace(/```(\w*)\n?([\s\S]*?)```/g, function(_, lang, code) {
      return '<pre><code>' + _escHtml(code.trim()) + '</code></pre>';
    })
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // numbered list lines
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // bullet lines
    .replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, function(m) { return '<ul>' + m + '</ul>'; })
    // links
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function _escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _addBotMsg(text) {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'gera-msg bot';
  div.innerHTML = '<p>' + _renderMarkdown(text) + '</p>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function _addUserMsg(text) {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'gera-msg user';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function _addErrorMsg(text) {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'gera-msg error';
  div.innerHTML = '⚠️ ' + _escHtml(text);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function _addTyping() {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return null;
  var div = document.createElement('div');
  div.className = 'gera-typing-wrap';
  div.id = 'geraTypingIndicator';
  div.innerHTML = '<div class="gera-typing"><span></span><span></span><span></span></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function _removeTyping() {
  var el = document.getElementById('geraTypingIndicator');
  if (el && el.parentNode) el.remove();
}

// ── Core: call /api/gera-chat ─────────────────────────────────────
async function _callAPI(userMessage) {
  var resp = await fetch('/api/gera-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      history: _history.slice(-8)   // send last 4 turns (8 messages) for context
    })
  });

  if (!resp.ok) {
    var errData = {};
    try { errData = await resp.json(); } catch (e) {}
    throw new Error(errData.error || 'Server error ' + resp.status);
  }

  var data = await resp.json();
  if (!data.reply) throw new Error('Empty response');
  return data.reply;
}

// ── Log to Supabase (anonymous, fire-and-forget) ──────────────────
function _logToSupabase(question, answer, source) {
  try {
    if (typeof window.geramaSupabase === 'undefined') return;
    window.geramaSupabase.from('gera_chat_logs').insert({
      question: question.slice(0, 500),
      answer: answer ? answer.slice(0, 1000) : null,
      answer_source: source,
      page: currentPage,
      session_id: _sessionId
    }).then(function () {}).catch(function () {});
  } catch (e) {}
}

// ── Main send ─────────────────────────────────────────────────────
async function geraSendMsg() {
  if (_isTyping) return;

  var input = document.getElementById('geraInput');
  var sendBtn = document.getElementById('geraSend');
  if (!input) return;

  var text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  _addUserMsg(text);
  _addTyping();
  _isTyping = true;
  if (sendBtn) sendBtn.disabled = true;

  var answer = null;
  var source = 'api';

  try {
    answer = await _callAPI(text);
  } catch (err) {
    // API failed — try offline KB before giving up
    var offlineAnswer = _offlineAnswer(text);
    if (offlineAnswer) {
      answer = offlineAnswer + '\n\n**(Offline mode — full AI answers available when connected)**';
      source = 'offline_kb';
    } else {
      _removeTyping();
      _isTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      _addErrorMsg('AI is temporarily unavailable. Check your connection or try the Help Center (❓ button).');
      return;
    }
  }

  // Push to history for multi-turn context
  _history.push({ role: 'user', content: text });
  _history.push({ role: 'assistant', content: answer });
  // Keep history bounded to last 20 messages
  if (_history.length > 20) _history = _history.slice(-20);

  _removeTyping();
  _isTyping = false;
  if (sendBtn) sendBtn.disabled = false;

  setTimeout(function () {
    _addBotMsg(answer);
    _logToSupabase(text, answer, source);
  }, 80);
}

// ── Public: trigger a question programmatically ───────────────────
function geraAsk(question) {
  var input = document.getElementById('geraInput');
  if (input) {
    input.value = question;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 90) + 'px';
  }
  if (!_geraOpen) toggleGeraPanel();
  setTimeout(geraSendMsg, 200);
}

// ── Init ──────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _injectUI);
} else {
  setTimeout(_injectUI, 250);
}

window.geraAsk          = geraAsk;
window.toggleGeraPanel  = toggleGeraPanel;
window.geraClearChat    = geraClearChat;

})();
