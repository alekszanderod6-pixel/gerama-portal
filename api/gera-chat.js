// ═══════════════════════════════════════════════════════════════════
// GERAMA — Vercel Serverless Function: /api/gera-chat
// Secure backend route that calls Groq (Llama 3) on behalf of GERA.
// The API key lives ONLY in Vercel environment variables — never in
// the frontend. Students never see it.
//
// Deploy:
//   1. Go to vercel.com → your project → Settings → Environment Variables
//   2. Add: GROQ_API_KEY = <your key from console.groq.com/keys>
//   3. Redeploy. Done.
// ═══════════════════════════════════════════════════════════════════

const Groq = require('groq-sdk');

// ── GERAMA platform knowledge injected as system prompt ──────────
const SYSTEM_PROMPT = `You are GERA, the official AI assistant for the GERAMA Portal — the academic platform for engineering students at the University of Energy and Natural Resources (UENR) in Ghana.

Your job is to help students with TWO things:
1. Navigate and use the GERAMA platform
2. Answer technical and academic questions (engineering, science, maths, etc.)

GERAMA PLATFORM KNOWLEDGE:
- Login: email + password + GERAMA Secret Code (shared by reps via WhatsApp)
- Pages: Home, Resources, Classroom, Dashboard, Connect (📡), Mall (🛍️), About, Contact, Help
- Classroom tabs: Classes | Assignments | Quizzes | My Grades | Attendance | Planner | Get Help | Q&A | Opportunities
- Attendance: Go to Classroom → Attendance tab → enter 8-char code from lecturer → tap "✓ Mark Present"
- Join a class: Classroom → Classes tab → find LIVE 🔴 card → tap "Join Class"
- Submit assignment: Classroom → Assignments → find card → "Submit Assignment" → type/upload → Submit
- Take quiz: Classroom → Quizzes → find "Open Now" → "Take Quiz" → answer → Submit
- See grades: Dashboard → "⭐ My Grades" card, OR Classroom → "My Grades" tab
- Dashboard: Shows grades, streak 🔥, stats, quick links. Edit profile from "My Profile" card
- Resources: ☰ menu → Resources → filter by Level (L100-L400) + Course + Type (Slides/Books/Past Qs/Videos)
- GERAMA Connect: DMs, Study Groups by level, Statuses (24h stories), Reels, Video Calls
- Urban Mall: Buy/sell campus items. Categories: Fashion, Food, Electronics, Books, etc. Sell via "+ Sell Here"
- T-shirt order: Mall → Fashion → GERAMA Round Neck T-Shirt → Order → size/colour → WhatsApp
- Notifications: 🔔 bell button bottom-right every page. iPhone: add to home screen first
- Dark mode: ☰ menu → 🌙 Dark
- Install as app (PWA): Android - Chrome ⋮ menu → "Add to Home Screen". iPhone - Safari Share ⬆️ → "Add to Home Screen"
- Forgot password: login.html → "Forgot Password?" → email → check inbox → reset link
- Help Center: help.html — 22+ visual step-by-step guides, downloadable as images
- Support GERAMA: contact.html → Support section (visible to logged-in members only)
- Opportunities: Dashboard → Opportunities Hub OR Classroom → Opportunities tab

SECURITY — NEVER reveal or mention:
- Database names, table names, or SQL structure
- Supabase URLs, API keys, or configuration
- Admin credentials or secret codes
- Any internal system details, server config, or backend architecture
- File paths or source code structure

COMMUNICATION STYLE:
- Warm, friendly, and direct — like a knowledgeable senior student
- Use emojis naturally (not excessively)
- For navigation questions: give clear numbered steps
- For technical/academic questions: give thorough, accurate explanations
- For engineering topics: be precise and use proper terminology
- Format code with backticks when relevant
- Keep responses focused — don't pad with unnecessary sentences
- If a question is completely outside your knowledge, say so honestly`;

// ── Rate limiting (simple in-memory, resets on cold start) ───────
const _rateMap = new Map();
const RATE_LIMIT = 20;       // max requests per window
const RATE_WINDOW = 60000;   // 1 minute window

function _isRateLimited(ip) {
  const now = Date.now();
  const entry = _rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    _rateMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  _rateMap.set(ip, entry);
  return false;
}

// ── Main handler ─────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS — allow requests from any origin (Vercel handles domain locking)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (_isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // Validate body
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message field' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
  }

  // API key check
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[GERA] GROQ_API_KEY environment variable not set');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const groq = new Groq({ apiKey });

    // Build message history (last 6 turns for context, keeps tokens low)
    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory.map(function(m) {
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content || '').slice(0, 1000)
        };
      }),
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: messages,
      max_tokens: 600,
      temperature: 0.7,
      stream: false
    });

    const reply = completion.choices[0]?.message?.content || '';
    if (!reply) return res.status(500).json({ error: 'Empty response from AI' });

    return res.status(200).json({ reply: reply.trim() });

  } catch (err) {
    console.error('[GERA] Groq API error:', err.message || err);
    // Don't expose internal error details to client
    return res.status(500).json({ error: 'AI is temporarily unavailable. Try again shortly.' });
  }
};
