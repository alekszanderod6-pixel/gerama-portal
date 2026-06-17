// ═══════════════════════════════════════════════════════════════════════
// GERAMA Portal — Supabase Edge Function: send-notification
// Relays transactional emails via Brevo HTTPS API.
// The Brevo API key is stored as a Supabase secret (never in frontend code).
//
// Deploy:
//   supabase secrets set BREVO_API_KEY=<your_key>
//   supabase functions deploy send-notification
//
// Invoke from frontend:
//   supabaseClient.functions.invoke('send-notification', { body: { ... } })
// ═══════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const SENDER = {
  name:  'GERAMA UENR',
  email: 'gerama.uenr@gmail.com',   // must be verified in Brevo dashboard
};

// CORS headers — allow calls from your deployed domain and localhost
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── 1. Validate request ───────────────────────────────────────────
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { to, subject, htmlContent, textContent } = body as {
      to:          string | string[];
      subject:     string;
      htmlContent?: string;
      textContent?: string;
    };

    if (!to || !subject || (!htmlContent && !textContent)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and htmlContent or textContent' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Normalise recipients ───────────────────────────────────────
    const recipients = (Array.isArray(to) ? to : [to]).map((email: string) => ({ email }));

    // ── 3. Read API key from Supabase secret ──────────────────────────
    const apiKey = Deno.env.get('BREVO_API_KEY');
    if (!apiKey) {
      console.error('[GERAMA] BREVO_API_KEY secret not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // ── 4. Build Brevo payload ────────────────────────────────────────
    const payload: Record<string, unknown> = {
      sender:  SENDER,
      to:      recipients,
      subject: subject,
    };
    if (htmlContent) payload.htmlContent = htmlContent;
    if (textContent) payload.textContent = textContent;

    // ── 5. POST to Brevo v3 API ───────────────────────────────────────
    const brevoRes = await fetch(BREVO_API_URL, {
      method:  'POST',
      headers: {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      apiKey,
      },
      body: JSON.stringify(payload),
    });

    const brevoData = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error('[GERAMA] Brevo error:', brevoData);
      return new Response(
        JSON.stringify({ error: 'Brevo delivery failed', detail: brevoData }),
        { status: brevoRes.status, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GERAMA] Email sent via Brevo:', brevoData.messageId, '→', recipients.map(r => r.email).join(', '));

    return new Response(
      JSON.stringify({ success: true, messageId: brevoData.messageId }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[GERAMA] Edge Function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
