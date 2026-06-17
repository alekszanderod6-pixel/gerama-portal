// ═══════════════════════════════════════════════════════════════════
// GERAMA AI Study Assistant — "GERA"
// A floating AI chatbot that knows the entire GERAMA platform.
// Uses the Gemini API (window.__GEMINI_KEY__) via ai-config.js.
// Falls back to a smart keyword-based answer engine if no API key.
// ═══════════════════════════════════════════════════════════════════
'use strict';

(function () {

var SKIP_PAGES = ['login.html', 'signup.html', 'reset-code.html', 'admin-dashboard.html'];
var currentPage = window.location.pathname.split('/').pop() || 'index.html';
if (SKIP_PAGES.indexOf(currentPage) !== -1) return;

// ── GERAMA knowledge base for fallback answers ──────────────────
var KB = [
  { q: ['sign up','register','create account','join gerama','new account'],
    a: 'To sign up: Visit the portal → tap "Join Free" → enter your email, create a password, and get your GERAMA Secret Code from your rep or WhatsApp group → tap "Create Account". Then complete your profile on the Dashboard! 🎉' },
  { q: ['sign in','login','log in','secret code','can\'t login'],
    a: 'To sign in: Enter your email, password, and the GERAMA Secret Code → tap "Sign In". If the screen shakes, the secret code is wrong. Tap 👁 to check what you typed. Don\'t have the code? Ask on the GERAMA WhatsApp group.' },
  { q: ['forgot password','reset password','locked out'],
    a: 'Reset your password: Go to login.html → tap "Forgot Password?" → enter your email → check your inbox for a reset link → click it and set a new password. Check your spam folder if you don\'t see the email! 🔑' },
  { q: ['join class','live class','online class','zoom','google meet','classroom'],
    a: 'To join a live class: Go to Classroom (📋 in nav) → you\'re on the Classes tab → find a card with "LIVE 🔴" → tap the green "Join Class" button. For upcoming classes, tap "🔔 Remind me" to get a 15-minute alert!' },
  { q: ['attendance','mark present','attendance code','class code'],
    a: 'To mark attendance: Classroom → "✅ Attendance" tab → enter the 8-character code your lecturer shares during class → tap "✓ Mark Present". The code expires fast — mark it immediately when your lecturer shares it!' },
  { q: ['assignment','submit assignment','homework','deadline'],
    a: 'To submit an assignment: Classroom → "Assignments" tab → find your assignment card → tap "Submit Assignment" → type your answer or drag-and-drop a file → tap Submit. Watch the deadline badge — it turns red when less than 24 hours remain!' },
  { q: ['quiz','take quiz','test','mcq','exam'],
    a: 'To take a quiz: Classroom → "Quizzes" tab → find an "Open Now" quiz → tap "Take Quiz" → answer all questions → Submit. Your score appears immediately. Quizzes are timed, so answer quickly!' },
  { q: ['grades','my grades','score','marks','results','gpa','average'],
    a: 'To see your grades: Go to Dashboard → scroll to "⭐ My Grades" card, OR Classroom → "My Grades" tab. The grade summary bar shows your average % and trend. The sparkline arrow shows if you\'re improving 📈 or declining 📉.' },
  { q: ['dashboard','my dashboard','profile','stats','streak'],
    a: 'Your Dashboard is your personal hub! Open ☰ menu → "My Dashboard". See your grades, attendance stats, 🔥 day streak, and quick links to Resources, Assignments, Quizzes, and Connect. Update your profile from the "My Profile" card.' },
  { q: ['t-shirt','tshirt','shirt','order shirt'],
    a: 'To order the GERAMA T-shirt: Go to Urban Mall → tap "👕 Fashion" category → find "GERAMA Round Neck T-Shirt" → tap "Order" → select colour and size (S/M/L/XL/XXL) → set qty and delivery location → tap "📲 Order via WhatsApp". Sizes sell out fast, order early!' },
  { q: ['mall','buy','shop','sell','marketplace','urban mall'],
    a: 'The Urban Mall is GERAMA\'s student marketplace! Go to "🛍️ Urban Mall" in the menu. Browse by category (Fashion, Food, Electronics, Books, etc.), add to cart, or order directly via WhatsApp. To sell: tap "+ Sell Here" and submit your product.' },
  { q: ['sell','list product','become seller'],
    a: 'To sell on the mall: Urban Mall → tap "+ Sell Here" (gold button) → fill in product name, category, price, description, up to 3 photos, your WhatsApp number → tap "✈ Submit for Review". Admin reviews within 24 hours. Once approved, it\'s live!' },
  { q: ['connect','dm','message','chat','classmate'],
    a: 'GERAMA Connect is your messaging hub! Go to "📡 GERAMA Connect" in the menu. Browse Members → tap "💬 Message" on anyone\'s card to DM them. React to messages with emojis by long-pressing or hovering a message!' },
  { q: ['study group','group','cohort','l100','l200','l300','l400'],
    a: 'To join a study group: GERAMA Connect → "Groups" tab → find your level\'s group → tap "→ View" to enter the group chat. You can also start a group video call from there! 👥' },
  { q: ['status','stories','24 hour','post status'],
    a: 'To post a status: GERAMA Connect → tap the "+ Add Status" circle (first in the stories bar at top) → type text, add a photo 📷, or change background 🎨 → tap "Post". Statuses disappear after 24 hours. View others\' statuses by tapping their ring.' },
  { q: ['resources','materials','slides','past questions','books','download','study materials'],
    a: 'To find study materials: Open ☰ menu → "📖 Resources" → filter by your Level (L100, L200...) and Course → choose type: Slides, Books, Past Questions, or Videos → tap to preview or download. You can also upload your own materials!' },
  { q: ['notifications','alerts','push','bell','subscribe'],
    a: 'To enable push notifications: Look for the 🔔 bell button at the bottom-right of any page → tap it → allow the browser permission prompt. The bell turns green = you\'re subscribed! On iPhone, add GERAMA to your home screen first (Share ⬆️ → "Add to Home Screen").' },
  { q: ['dark mode','night mode','theme'],
    a: 'To enable dark mode: Open the ☰ menu → tap "🌙 Dark" button at the bottom of the drawer. To go back to light, tap "☀️ Light". Your preference is saved automatically.' },
  { q: ['install','pwa','app','home screen','android','iphone'],
    a: 'To install GERAMA as an app: Android → tap "⬇ Install App" banner or Chrome menu (⋮) → "Add to Home Screen". iPhone → tap Share ⬆️ in Safari → "Add to Home Screen" → "Add". Then open from your home screen — it works like a real app!' },
  { q: ['internship','scholarship','nss','job','opportunity','career'],
    a: 'To find opportunities: Dashboard → tap "🌍 Opportunities Hub" (big green button) OR Classroom → "Opportunities" tab. Filter by: All · Internship · NSS · Scholarship · Job. New listings added regularly!' },
  { q: ['reels','video reels','short video'],
    a: 'Reels are short student videos! Go to GERAMA Connect → "Reels" tab. Watch, like 👍, comment 💬, or share 📤 any reel. Lecturers and students upload educational reels there.' },
  { q: ['planner','study plan','schedule','calendar'],
    a: 'The Study Planner is in Classroom → "📅 Planner" tab. See all upcoming deadlines, add study sessions, and set reminders. A yellow ! badge on the Planner tab means something needs attention.' },
  { q: ['profile photo','upload photo','change photo','avatar'],
    a: 'To change your profile photo: Dashboard → "My Profile" card → tap the photo circle → select an image from your device. It saves automatically to your profile across all devices!' },
  { q: ['help','tutorial','guide','how to','how do i'],
    a: 'Check the GERAMA Help Center! Tap the ❓ help button (yellow, bottom-right of any page) or go to help.html. There are 22+ step-by-step visual guides you can download as images and share with classmates. 🎓' },
  { q: ['what is gerama','about gerama','gerama meaning'],
    a: 'GERAMA stands for the GERAMA Portal — the academic resources and community platform for UENR engineering students. It has Resources, Classroom, Dashboard, Connect, and the Urban Mall. Your one-stop student hub! ⚙️' },
  { q: ['wifi','internet','offline','not loading'],
    a: 'If GERAMA isn\'t loading: check your internet connection. If you installed GERAMA as an app (PWA), some pages work offline. Try refreshing with a long-press on refresh. If still stuck, clear your browser cache or ask on GERAMA Connect.' },
];

// ── INJECT STYLES ────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent = [
  '#geraAiBtn{position:fixed;bottom:200px;right:14px;z-index:7998;width:50px;height:50px;border-radius:50%;',
  'background:linear-gradient(135deg,#6d28d9,#7c3aed);border:none;cursor:pointer;',
  'display:flex;align-items:center;justify-content:center;font-size:1.3rem;',
  'box-shadow:0 4px 20px rgba(109,40,217,0.55);transition:transform 0.2s,box-shadow 0.2s;',
  'font-family:inherit;animation:geraPulse 3s ease-in-out infinite;}',
  '#geraAiBtn:hover{transform:scale(1.12);box-shadow:0 6px 28px rgba(109,40,217,0.7);}',
  '@keyframes geraPulse{0%,100%{box-shadow:0 4px 20px rgba(109,40,217,0.55);}50%{box-shadow:0 4px 28px rgba(109,40,217,0.9),0 0 0 8px rgba(109,40,217,0.12);}}',
  '#geraLabel{position:fixed;bottom:232px;right:66px;z-index:7998;',
  'background:linear-gradient(135deg,#6d28d9,#7c3aed);color:white;',
  'padding:0.3rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:800;',
  'font-family:Inter,sans-serif;white-space:nowrap;pointer-events:none;',
  'box-shadow:0 2px 12px rgba(109,40,217,0.4);',
  'animation:geraLabelFade 4s ease-in-out forwards;}',
  '@keyframes geraLabelFade{0%,60%{opacity:1;transform:translateX(0);}100%{opacity:0;transform:translateX(10px);}pointer-events:none;}',
  '#geraPanel{position:fixed;bottom:0;right:0;z-index:9500;',
  'width:min(380px,100vw);height:min(560px,90vh);',
  'background:white;border-radius:20px 20px 0 0;',
  'box-shadow:0 -8px 40px rgba(0,0,0,0.25);',
  'display:flex;flex-direction:column;',
  'transform:translateY(110%);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);}',
  '@media(min-width:480px){#geraPanel{bottom:14px;right:14px;border-radius:20px;}}',
  '#geraPanel.open{transform:translateY(0);}',
  '#geraHeader{background:linear-gradient(135deg,#6d28d9,#4c1d95);padding:1rem 1.1rem;',
  'border-radius:20px 20px 0 0;display:flex;align-items:center;gap:0.7rem;flex-shrink:0;}',
  '@media(min-width:480px){#geraHeader{border-radius:20px 20px 0 0;}}',
  '#geraAvatar{width:38px;height:38px;border-radius:50%;',
  'background:rgba(255,255,255,0.2);display:flex;align-items:center;',
  'justify-content:center;font-size:1.2rem;flex-shrink:0;}',
  '#geraHeaderText .gt{color:white;font-weight:900;font-size:0.92rem;}',
  '#geraHeaderText .gs{color:rgba(255,255,255,0.7);font-size:0.72rem;}',
  '#geraStatusDot{width:8px;height:8px;border-radius:50%;background:#10b981;',
  'flex-shrink:0;box-shadow:0 0 0 2px rgba(16,185,129,0.3);}',
  '#geraMsgs{flex:1;overflow-y:auto;padding:0.8rem;display:flex;flex-direction:column;gap:0.6rem;',
  'background:#f8fafc;}',
  '.gera-msg{max-width:85%;padding:0.65rem 0.9rem;border-radius:18px;font-size:0.84rem;',
  'line-height:1.5;font-family:Inter,sans-serif;animation:geraMsgIn 0.3s ease;}',
  '@keyframes geraMsgIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}',
  '.gera-msg.bot{background:white;color:#1e2a3e;border-radius:4px 18px 18px 18px;',
  'align-self:flex-start;box-shadow:0 2px 8px rgba(0,0,0,0.08);}',
  '.gera-msg.user{background:linear-gradient(135deg,#6d28d9,#7c3aed);color:white;',
  'border-radius:18px 4px 18px 18px;align-self:flex-end;}',
  '.gera-typing{display:flex;gap:4px;padding:0.6rem 0.9rem;}',
  '.gera-typing span{width:7px;height:7px;border-radius:50%;background:#9ca3af;',
  'animation:geraTyp 1.2s infinite;}',
  '.gera-typing span:nth-child(2){animation-delay:0.2s;}',
  '.gera-typing span:nth-child(3){animation-delay:0.4s;}',
  '@keyframes geraTyp{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}',
  '#geraQuickBtns{padding:0.5rem 0.8rem;display:flex;gap:0.4rem;flex-wrap:wrap;',
  'background:#f8fafc;border-top:1px solid #f1f5f9;flex-shrink:0;}',
  '.gera-qbtn{background:white;border:1.5px solid #e5e7eb;color:#374151;',
  'padding:0.3rem 0.65rem;border-radius:20px;font-size:0.72rem;font-weight:700;',
  'cursor:pointer;font-family:Inter,sans-serif;transition:all 0.15s;white-space:nowrap;}',
  '.gera-qbtn:hover{background:#6d28d9;color:white;border-color:#6d28d9;}',
  '#geraInputRow{padding:0.65rem;background:white;border-top:1px solid #f1f5f9;',
  'display:flex;gap:0.5rem;align-items:flex-end;flex-shrink:0;}',
  '#geraInput{flex:1;padding:0.6rem 0.9rem;border-radius:20px;',
  'border:1.5px solid #e5e7eb;font-size:0.87rem;font-family:Inter,sans-serif;',
  'outline:none;resize:none;line-height:1.4;max-height:80px;overflow-y:auto;}',
  '#geraInput:focus{border-color:#7c3aed;}',
  '#geraSend{width:38px;height:38px;border-radius:50%;',
  'background:linear-gradient(135deg,#6d28d9,#7c3aed);',
  'border:none;color:white;cursor:pointer;font-size:0.9rem;',
  'display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.15s;}',
  '#geraSend:hover{transform:scale(1.1);}',
  '#geraCloseBtn{background:rgba(255,255,255,0.15);border:none;color:white;',
  'width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:0.85rem;',
  'display:flex;align-items:center;justify-content:center;margin-left:auto;}'
].join('');
document.head.appendChild(style);

// ── INJECT HTML ──────────────────────────────────────────────────
function _injectUI() {
  // Floating button
  var btn = document.createElement('button');
  btn.id = 'geraAiBtn';
  btn.setAttribute('aria-label', 'Open GERA AI Assistant');
  btn.title = 'Ask GERA — your AI study assistant';
  btn.innerHTML = '🤖';
  btn.onclick = toggleGeraPanel;
  document.body.appendChild(btn);

  // "Ask me anything" label (fades after 4s)
  var lbl = document.createElement('div');
  lbl.id = 'geraLabel';
  lbl.textContent = '✨ Ask GERA';
  document.body.appendChild(lbl);
  setTimeout(function(){ if (lbl.parentNode) lbl.remove(); }, 4500);

  // Chat panel
  var panel = document.createElement('div');
  panel.id = 'geraPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'GERA AI Assistant');
  panel.innerHTML = [
    '<div id="geraHeader">',
      '<div id="geraAvatar">🤖</div>',
      '<div id="geraHeaderText">',
        '<div class="gt">GERA — Study Assistant</div>',
        '<div class="gs">Powered by AI · Knows GERAMA inside-out</div>',
      '</div>',
      '<div id="geraStatusDot"></div>',
      '<button id="geraCloseBtn" onclick="toggleGeraPanel()" aria-label="Close assistant">✕</button>',
    '</div>',
    '<div id="geraMsgs"></div>',
    '<div id="geraQuickBtns">',
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I join a class?\')">🖥️ Join class</button>',
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I see my grades?\')">⭐ Grades</button>',
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I mark attendance?\')">✅ Attendance</button>',
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I order a T-shirt?\')">👕 T-Shirt</button>',
      '<button class="gera-qbtn" onclick="geraAsk(\'How do I reset my password?\')">🔑 Password</button>',
      '<button class="gera-qbtn" onclick="geraAsk(\'What is the GERAMA Mall?\')">🛍️ Mall</button>',
    '</div>',
    '<div id="geraInputRow">',
      '<textarea id="geraInput" placeholder="Ask anything about GERAMA…" rows="1" aria-label="Message GERA"></textarea>',
      '<button id="geraSend" onclick="geraSendMsg()" aria-label="Send message"><i class="fas fa-paper-plane"></i></button>',
    '</div>'
  ].join('');
  document.body.appendChild(panel);

  // Auto-resize textarea
  document.getElementById('geraInput').addEventListener('input', function(){
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });
  document.getElementById('geraInput').addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); geraSendMsg(); }
  });

  // Show welcome message
  setTimeout(function(){
    _geraBotMsg('Hey! 👋 I\'m **GERA**, your GERAMA study assistant.\n\nI know everything about this platform — ask me how to join a class, find your grades, submit assignments, order a T-shirt, or anything else. What do you need help with? 🎓');
  }, 400);
}

var _geraOpen = false;

function toggleGeraPanel() {
  var panel = document.getElementById('geraPanel');
  if (!panel) return;
  _geraOpen = !_geraOpen;
  panel.classList.toggle('open', _geraOpen);
  if (_geraOpen) {
    setTimeout(function(){ document.getElementById('geraInput').focus(); }, 300);
  }
}

// ── Message rendering ──────────────────────────────────────────
function _geraBotMsg(text) {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'gera-msg bot';
  // Simple markdown: **bold**, newlines
  div.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function _geraUserMsg(text) {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'gera-msg user';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function _geraTyping() {
  var msgs = document.getElementById('geraMsgs');
  if (!msgs) return null;
  var div = document.createElement('div');
  div.className = 'gera-msg bot gera-typing-wrap';
  div.innerHTML = '<div class="gera-typing"><span></span><span></span><span></span></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ── Local knowledge base answer ───────────────────────────────
function _kbAnswer(question) {
  var q = question.toLowerCase();
  var best = null, bestScore = 0;
  KB.forEach(function(item) {
    var score = 0;
    item.q.forEach(function(kw) {
      if (q.indexOf(kw) !== -1) score += kw.split(' ').length;
    });
    if (score > bestScore) { bestScore = score; best = item; }
  });
  return bestScore > 0 ? best.a : null;
}

// ── Gemini API call ──────────────────────────────────────────
var _GERAMA_CONTEXT = [
'You are GERA, a helpful AI study assistant for the GERAMA Portal — the academic platform for engineering students at UENR (University of Energy and Natural Resources) in Ghana.',
'You know everything about the GERAMA platform and help students navigate it.',
'',
'KEY FACTS ABOUT GERAMA:',
'- Login requires: email + password + GERAMA Secret Code (shared by reps)',
'- Pages: Home (index.html), Resources, Classroom, Dashboard, Connect, Mall, About, Contact, Help (help.html)',
'- Classroom tabs: Classes, Assignments, Quizzes, My Grades, Attendance, Planner, Get Help, Q&A, Opportunities',
'- Attendance: Students enter 8-char code from lecturer in Classroom > Attendance tab',
'- Dashboard: Shows grades, stats, 🔥 streak, quick links, profile editor',
'- Resources: Materials filtered by Level (L100-L400) and course (slides, books, past questions, videos)',
'- Connect tabs: Members, Messages (DMs), Groups (study groups by level), Reels, Calls',
'- Mall (Urban Mall): Browse/buy/sell. Categories: Fashion, Food, Electronics, Books, Beauty, Health, Home, Accessories, Services. T-shirt: Fashion > GERAMA Round Neck T-Shirt > Order > select size/colour > WhatsApp',
'- Selling: Mall > "+ Sell Here" > fill form > admin reviews in 24h',
'- Notifications: 🔔 bell button bottom-right, OneSignal push. iOS needs PWA (Add to Home Screen first)',
'- Dark mode: ☰ menu > 🌙 Dark button',
'- PWA install: Android - Chrome install prompt, iOS - Safari Share > Add to Home Screen',
'- Opportunities Hub: Dashboard or Classroom > Opportunities tab. Types: Internship, NSS, Scholarship, Job',
'- Help Center: help.html has 22+ visual step-by-step guides, downloadable as images',
'',
'COMMUNICATION STYLE:',
'- Be friendly, warm, and concise. Use emojis naturally.',
'- Give numbered steps when explaining how to do something.',
'- If unsure, suggest the Help Center (help.html) or GERAMA Connect.',
'- Keep answers under 150 words. Never make up features that don\'t exist.',
'- You are talking to a UENR engineering student.',
].join('\n');

async function _geminiAnswer(question) {
  var key = window.__GEMINI_KEY__;
  if (!key) return null;
  try {
    var payload = {
      contents: [{
        parts: [{
          text: _GERAMA_CONTEXT + '\n\nStudent question: ' + question + '\n\nAnswer helpfully and concisely:'
        }]
      }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.6 }
    };
    var resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    if (!resp.ok) return null;
    var data = await resp.json();
    var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
               data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
               data.candidates[0].content.parts[0].text;
    return text ? text.trim() : null;
  } catch (e) { return null; }
}

// ── Session ID for anonymous logging ─────────────────────────
var _geraSessionId = localStorage.getItem('gera_session') || (function(){
  var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('gera_session', id);
  return id;
})();

// ── Log question to Supabase (anonymous) ──────────────────────
function _geraLog(question, answer, source) {
  try {
    if (typeof window.geramaSupabase === 'undefined') return;
    window.geramaSupabase.from('gera_chat_logs').insert({
      question: question.slice(0, 500),
      answer: answer ? answer.slice(0, 1000) : null,
      answer_source: source || 'kb',
      page: currentPage,
      session_id: _geraSessionId
    }).then(function(){}).catch(function(){});
  } catch(e) {}
}

// ── Main send function ────────────────────────────────────────
async function geraSendMsg() {
  var input = document.getElementById('geraInput');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';

  _geraUserMsg(text);
  var typingEl = _geraTyping();

  // Try Gemini first, fall back to KB, fall back to generic
  var answer = null;
  try { answer = await _geminiAnswer(text); } catch(e) {}
  if (!answer) answer = _kbAnswer(text);
  if (!answer) {
    answer = 'I\'m not sure about that one! 🤔 Try checking the **Help Center** (tap the ❓ button), or ask your classmates on **GERAMA Connect**. You can also browse the guides at help.html for step-by-step instructions.';
  }

  if (typingEl && typingEl.parentNode) typingEl.remove();

  var source = 'fallback';
  if (!answer && window.__GEMINI_KEY__) source = 'gemini';
  else if (_kbAnswer(text)) source = 'kb';

  setTimeout(function(){
    _geraBotMsg(answer);
    _geraLog(text, answer, source);
  }, 200);
}

function geraAsk(question) {
  var input = document.getElementById('geraInput');
  if (input) { input.value = question; }
  if (!_geraOpen) toggleGeraPanel();
  setTimeout(geraSendMsg, 150);
}

// ── Init ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _injectUI);
} else {
  setTimeout(_injectUI, 300);
}

// Expose globally for quick-buttons on other pages
window.geraAsk = geraAsk;
window.toggleGeraPanel = toggleGeraPanel;

})();
