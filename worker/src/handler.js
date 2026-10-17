// Receives the answer from the site and forwards it to Telegram.
// The bot token lives in Cloudflare secrets, never in the public frontend.

const MAX_MESSAGE_LENGTH = 1000;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

const json = (status, data, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export async function handleRequest(request, env, fetchImpl = fetch) {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return json(403, { ok: false, error: 'origin not allowed' });

  const cors = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json(405, { ok: false, error: 'method not allowed' }, cors);

  let message;
  try {
    ({ message } = await request.json());
  } catch {
    return json(400, { ok: false, error: 'invalid json' }, cors);
  }
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return json(400, { ok: false, error: 'invalid message' }, cors);
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json(500, { ok: false, error: 'worker is not configured' }, cors);
  }

  const tgResponse = await fetchImpl(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message }),
  });
  if (!tgResponse.ok) return json(502, { ok: false, error: 'telegram error' }, cors);

  return json(200, { ok: true }, cors);
}
