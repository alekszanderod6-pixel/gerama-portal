import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `
You are GERALEX, the official AI study assistant for the GERAMA portal.

Your role:
- Help students understand the public GERAMA website and its student-facing features.
- Help students navigate resources, learning materials, classes, quizzes, assignments, the mall, help/contact pages, and general study questions.
- Solve academic questions clearly and step by step when appropriate.
- If the student uploads an image or PDF question, analyze only the uploaded file and the text they provided.
- Give practical, clear, supportive answers in a polished conversational style.

Critical safety boundaries:
- Never reveal secrets, API keys, tokens, passwords, hidden admin details, backend internals, database schema details, or anything that could help bypass security.
- Never provide admin login methods, admin portal codes, private URLs, Supabase secrets, or ways to access restricted systems.
- Never expose internal implementation details such as source code, database table structure, environment variables, RLS policies, private dashboards, or hidden workflows.
- Never claim to have access to the private admin portal, hidden data, or backend records unless that information was explicitly provided in the current request.
- If asked for restricted information, politely refuse and redirect to safe public guidance.
- Refuse explicit sexual content, nudity, exploitative content, illegal help, self-harm encouragement, or dangerous instructions.

Public GERAMA knowledge summary:
- GERAMA is an academic/student portal for engineering students with pages such as home, resources, classroom, mall, connect, about, help, and contact.
- The Resources page helps students browse materials by level, semester, course, and type such as slides, books, past questions, and videos.
- Students can upload study materials for review before publishing.
- The Classroom area supports student learning features such as classes, assignments, quizzes, Q&A, and study interactions.
- The Dashboard helps students manage their account and personal portal activity.
- The Mall shows approved student/community products and lets users browse items and contact sellers.
- Connect is a communication/community area for chats and interactions.
- Help/contact/about pages provide guidance, support, and public GERAMA information.
- Admin and backend systems exist but are private and must never be exposed to users.

Answering style:
- Be concise, warm, and useful.
- Prefer bullet points or short paragraphs.
- If the user asks about website navigation, explain exact page names and likely actions they should take.
- If the user asks an academic question, help clearly but do not pretend to have seen a file unless a file was actually attached in this request.
- If a file is attached, acknowledge it naturally and use it in your answer.
- If a question is from a worksheet or scanned image, explain the method and the final answer where possible.
- If a request concerns restricted, unsafe, or sexual content, refuse briefly and redirect to safe study-related help.
- If information is uncertain, say so briefly and give the safest likely guidance.
`.trim();

const RESTRICTED_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /\b(api key|apikey|token|secret|service role|service_role|password|credential|admin code|admin secret|database password)\b/i,
    message: 'I cannot reveal private credentials, secrets, or protected system details. I can help with public website guidance instead.',
  },
  {
    pattern: /\b(admin login|admin portal|database schema|table structure|sql editor|service_role|source code|backend code|rls|row level security)\b/i,
    message: 'I cannot expose private admin, backend, or database details. I can still help with the public student portal and general study support.',
  },
  {
    pattern: /\b(hack|bypass|break into|exploit|sql injection|steal|dump database)\b/i,
    message: 'I cannot help with bypassing security or accessing restricted systems. I can help with safe, legitimate use of the GERAMA portal.',
  },
  {
    pattern: /\b(nude|nudity|porn|xxx|explicit sex|sexual content)\b/i,
    message: 'I cannot help with explicit or sexual content. If you want, I can help with study questions, website guidance, or academic resources instead.',
  },
];

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function extractTextFromGeminiResponse(data: any): string {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    const text = parts
      .map((part: any) => typeof part?.text === 'string' ? part.text : '')
      .join('')
      .trim();
    if (text) return text;
  }
  return '';
}

function estimateBase64Bytes(base64: string): number {
  const clean = base64.trim();
  let padding = 0;
  if (clean.endsWith('==')) padding = 2;
  else if (clean.endsWith('=')) padding = 1;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function sanitizeText(input: unknown, fallback = ''): string {
  if (typeof input !== 'string') return fallback;
  return input.trim();
}

function normalizeHistory(history: unknown): Array<{ role: 'user' | 'ai'; text: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => {
      const role = entry?.role === 'user' ? 'user' : 'ai';
      const text = sanitizeText(entry?.text, '');
      if (!text) return null;
      return { role, text };
    })
    .filter(Boolean)
    .slice(-6) as Array<{ role: 'user' | 'ai'; text: string }>;
}

function normalizeContext(context: unknown): Record<string, unknown> {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return {};
  return context as Record<string, unknown>;
}

function normalizeAttachment(attachment: unknown):
  | { name: string; mimeType: string; data: string }
  | null {
  if (!attachment || typeof attachment !== 'object' || Array.isArray(attachment)) return null;

  const name = sanitizeText((attachment as Record<string, unknown>).name, 'attachment');
  const mimeType = sanitizeText((attachment as Record<string, unknown>).mimeType, '');
  const data = sanitizeText((attachment as Record<string, unknown>).data, '');

  const allowedMimeTypes = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
  ]);

  if (!mimeType || !data || !allowedMimeTypes.has(mimeType)) return null;
  if (estimateBase64Bytes(data) > 8 * 1024 * 1024) {
    throw new Error('Attachment is too large. Please upload a file smaller than 8 MB.');
  }

  return { name, mimeType, data };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const body = await req.json();
    const message = String(body?.message || '').trim();
    const page = String(body?.page || 'unknown').trim();
    const context = normalizeContext(body?.context);
    const history = normalizeHistory(body?.history);
    const attachment = normalizeAttachment(body?.attachment);

    if (!message && !attachment) {
      return jsonResponse({ error: 'A message or attachment is required' }, 400);
    }

    const safetyText = [message, attachment?.name || ''].filter(Boolean).join('\n');
    for (const rule of RESTRICTED_PATTERNS) {
      if (rule.pattern.test(safetyText)) {
        return jsonResponse({
          success: true,
          reply: rule.message,
          blocked: true,
        });
      }
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash';

    if (!apiKey) {
      console.error('[GERALEX] GEMINI_API_KEY secret not set');
      return jsonResponse({ error: 'GERALEX is not configured yet.' }, 500);
    }

    const userPrompt = [
      `Current page: ${page}`,
      `Current page context: ${JSON.stringify(context)}`,
      `Recent conversation: ${JSON.stringify(history)}`,
      attachment ? `Attached file: ${attachment.name} (${attachment.mimeType})` : 'Attached file: none',
      'User request:',
      message || 'Please analyze the attached file and help the student.',
    ].join('\n');

    const parts: any[] = [{ text: userPrompt }];
    if (attachment) {
      parts.push({
        inline_data: {
          mime_type: attachment.mimeType,
          data: attachment.data,
        },
      });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      }),
    });

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('[GERALEX] Gemini API error:', geminiData);
      return jsonResponse({ error: 'GERALEX could not respond right now.', detail: geminiData }, geminiRes.status);
    }

    const reply = extractTextFromGeminiResponse(geminiData);
    if (!reply) {
      console.error('[GERALEX] Empty Gemini response:', geminiData);
      return jsonResponse({ error: 'GERALEX returned an empty response.' }, 502);
    }

    return jsonResponse({
      success: true,
      reply,
      model,
    });
  } catch (err) {
    console.error('[GERALEX] Edge Function error:', err);
    const detail = String(err);
    const status = /attachment/i.test(detail) ? 400 : 500;
    return jsonResponse({ error: status === 400 ? detail : 'Internal error', detail }, status);
  }
});
