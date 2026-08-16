// Vercel serverless function — proxies OneSignal push API server-side
// so the browser doesn't hit CORS restrictions.
// Endpoint: POST /api/send-push
// Body: { title, message, url, imageUrl }

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const restKey = process.env.ONESIGNAL_REST_KEY;
  const appId   = '9aa2964d-5435-492c-9dd8-7c873d371976';

  if (!restKey) {
    return res.status(500).json({ error: 'OneSignal REST key not configured on server.' });
  }

  const { title, message, url, imageUrl } = req.body || {};

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required.' });
  }

  const payload = {
    app_id: appId,
    included_segments: ['Total Subscriptions'],
    headings:  { en: String(title).substring(0, 100) },
    contents:  { en: String(message).substring(0, 200) },
    url: url || 'https://gerama-portal.vercel.app/index.html',
    chrome_web_icon: 'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg',
    firefox_icon:    'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg',
    chrome_web_badge:'https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/images/geramalogo.jpg'
  };

  if (imageUrl) payload.big_picture = imageUrl;

  try {
    const osRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + restKey
      },
      body: JSON.stringify(payload)
    });

    const json = await osRes.json();

    if (json.errors) {
      console.error('[send-push] OneSignal errors:', json.errors);
      return res.status(400).json({ error: json.errors });
    }

    return res.status(200).json({
      success: true,
      id: json.id,
      recipients: json.recipients || 0
    });

  } catch (e) {
    console.error('[send-push] Exception:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
