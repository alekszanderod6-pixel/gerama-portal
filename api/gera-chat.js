// ═══════════════════════════════════════════════════════════════════
// GERAMA — Vercel Serverless Function: /api/gera-chat
// Groq Llama 3 backend — GERALEX AI
// ═══════════════════════════════════════════════════════════════════

const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are GERALEX, the official AI assistant for the GERAMA Portal — the academic platform for engineering students at the University of Energy and Natural Resources (UENR) in Ghana.

Your job is to help students with TWO things:
1. Navigate and use the GERAMA platform
2. Answer technical, academic, and general knowledge questions brilliantly

GERAMA PLATFORM KNOWLEDGE:
- Login: email + password + GERAMA Secret Code (shared by reps via WhatsApp)
- Pages: Home, Resources, Classroom, Dashboard, Connect, Mall, About, Contact, Help
- Classroom tabs: Classes | Assignments | Quizzes | My Grades | Attendance | Planner | Get Help | Q&A | Opportunities
- Attendance: Classroom → Attendance tab → enter 8-char code from lecturer → tap "✓ Mark Present"
- Join a class: Classroom → Classes tab → find LIVE card → tap "Join Class"
- Submit assignment: Classroom → Assignments → find card → "Submit Assignment" → type or upload → Submit
- Take quiz: Classroom → Quizzes → find "Open Now" → "Take Quiz" → answer → Submit
- See grades: Dashboard → "My Grades" card, OR Classroom → "My Grades" tab
- Dashboard: grades, streak, stats, quick links, profile editor
- Resources: menu → Resources → filter by Level (L100-L400) + Course + Type
- GERAMA Connect: DMs, Study Groups, Statuses (24h stories), Reels, Video Calls
- Urban Mall: Buy/sell campus items. Sell via "+ Sell Here" button
- T-shirt order: Mall → Fashion → GERAMA Round Neck T-Shirt → Order → size/colour → WhatsApp
- Notifications: bell button bottom-right every page
- Dark mode: hamburger menu → Dark button
- Install as PWA app: Android - Chrome menu → Add to Home Screen. iPhone - Safari Share → Add to Home Screen
- Forgot password: login page → Forgot Password → email → check inbox
- Help Center: help.html — 22+ visual step-by-step guides

SECURITY — NEVER reveal:
- Database names, table names, or SQL
- Supabase URLs or API keys
- Admin credentials or secret codes
- Internal server config or file paths

ACADEMIC CAPABILITY:
- You are brilliant at engineering, maths, physics, chemistry, computer science
- Explain concepts clearly with examples, diagrams described in text, and formulas
- Solve problems step by step
- Cover all engineering disciplines: Electrical, Mechanical, Civil, Computer, Agricultural, Petroleum, Renewable Energy, Environmental
- Answer general knowledge questions confidently

COMMUNICATION STYLE:
- Warm, sharp, and direct — like a brilliant senior student who genuinely wants to help
- Use emojis naturally
- For navigation: numbered steps
- For technical topics: thorough, accurate, well-structured answers
- Format code properly with backticks
- Never make up features that don't exist on GERAMA`;

// ── Simple rate limiter ───────────────────────────────────────────
const _rateMap = new Map();
function _isRateLimited(ip) {
  const now = Date.now();
  const e = _rateMap.get(ip) || { count: 0, start: now };
  if (now - e.start > 60000) { _rateMap.set(ip, { count: 1, start: now }); return false; }
  if (e.count >= 25) return true;
  e.count++;
  _rateMap.set(ip, e);
  return false;
}

// ── Body parser helper (Vercel does NOT auto-parse JSON) ──────────
async function _parseBody(req) {
  // If Vercel already parsed it (newer runtimes do)
  if (req.body && typeof req.body === 'object') return req.body;

  return new Promise(function (resolve, reject) {
    let data = '';
    req.on('data', function (chunk) { data += chunk; });
    req.on('end', function () {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { resolve({}); }
    });
    req.on('error', function (e) { reject(e); });
  });
}

// ── Main handler ─────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (_isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // Parse body (handles both pre-parsed and raw stream)
  let body;
  try {
    body = await _parseBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { message, history } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Missing message' });
  }
  if (message.length > 3000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  // API key
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[GERALEX] GROQ_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'AI service not configured on server' });
  }

  try {
    const groq = new Groq({ apiKey });

    // Build messages array with optional history
    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory.map(function (m) {
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content || '').slice(0, 1500)
        };
      }),
      { role: 'user', content: message.trim() }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: messages,
      max_tokens: 700,
      temperature: 0.7,
      stream: false
    });

    const reply = (completion.choices[0]?.message?.content || '').trim();
    if (!reply) return res.status(500).json({ error: 'Empty AI response' });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('[GERALEX] Groq error:', err.message || err);
    const status = err.status || 500;
    // Surface specific Groq errors helpfully without exposing internals
    if (status === 401) return res.status(500).json({ error: 'AI API key is invalid. Contact admin.' });
    if (status === 429) return res.status(429).json({ error: 'AI rate limit reached. Try again in a moment.' });
    return res.status(500).json({ error: 'AI is temporarily unavailable. Try again shortly.' });
  }
};
