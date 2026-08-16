// Vercel serverless function — proxies OneSignal push API server-side
// Endpoint: POST /api/send-push
// Body JSON: { title, message, url?, imageUrl? }

export default async function handler(req, res) {
  // CORS headers so the admin dashboard (same domain) can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Read env var — must match the name set in Vercel Dashboard
  const restKey = process.env.ONESIGNAL_REST_KEY;
  const appId   = '9aa2964d-5435-492c-9dd8-7c873d371976';

  if (!restKey) {
    console.error('[send-push] ONESIGNAL_REST_KEY env var is not set');
    return res.status(500).json({
      error: 'ONESIGNAL_REST_KEY not configured. Go to Vercel Dashboard → Settings → Environment Variables and add it, then redeploy.'
    });
  }

  // Parse body — Vercel auto-parses JSON bodies for serverless functions
  const body = req.body || {};
  const title   = (body.title   || '').trim();
  const message = (body.message || '').trim();
  const url      = body.url      || 'https://gerama-portal.vercel.app/index.html';
  const imageUrl = body.imageUrl || null;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const payload = {
    app_id: appId,
    included_segments: ['Total Subscriptions'],
    headings: { en: title.substring(0, 100) },
    contents: { en: message.substring(0, 200) },
    url: url,
    chrome_web_icon:  'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg',
    firefox_icon:     'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg',
    chrome_web_badge: 'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg'
  };
  if (imageUrl) payload.big_picture = imageUrl;

  console.log('[send-push] Sending to OneSignal — title:', title, '| segment: Total Subscriptions');

  try {
    const osRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' + restKey
      },
      body: JSON.stringify(payload)
    });

    const text = await osRes.text();
    console.log('[send-push] OneSignal HTTP', osRes.status, '| response:', text.substring(0, 300));

    let json = {};
    try { json = JSON.parse(text); } catch (e) {
      return res.status(500).json({ error: 'OneSignal returned non-JSON: ' + text.substring(0, 200) });
    }

    if (json.errors) {
      console.error('[send-push] OneSignal errors:', json.errors);
      return res.status(400).json({ error: json.errors });
    }

    console.log('[send-push] Success — id:', json.id, '| recipients:', json.recipients);
    return res.status(200).json({
      success:    true,
      id:         json.id,
      recipients: json.recipients || 0
    });

  } catch (e) {
    console.error('[send-push] Fetch exception:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
