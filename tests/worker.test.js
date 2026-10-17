import { describe, it, expect, vi } from 'vitest';
import { handleRequest } from '../worker/src/handler.js';

const SITE = 'https://maksimvaz.github.io';
const env = {
  ALLOWED_ORIGINS: `${SITE},http://localhost:8765`,
  TELEGRAM_BOT_TOKEN: 'test-token',
  TELEGRAM_CHAT_ID: '42',
};

const post = (body, origin = SITE) =>
  new Request('https://notify.example/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const okTelegram = () => vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));

describe('worker handleRequest', () => {
  it('answers CORS preflight for the site', async () => {
    const res = await handleRequest(new Request('https://notify.example/', { method: 'OPTIONS', headers: { Origin: SITE } }), env, okTelegram());
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(SITE);
  });

  it('rejects other origins', async () => {
    const tg = okTelegram();
    const res = await handleRequest(post({ message: 'hi' }, 'https://evil.example'), env, tg);
    expect(res.status).toBe(403);
    expect(tg).not.toHaveBeenCalled();
  });

  it('rejects non-POST methods', async () => {
    const res = await handleRequest(new Request('https://notify.example/', { headers: { Origin: SITE } }), env, okTelegram());
    expect(res.status).toBe(405);
  });

  it.each([['not json'], [{}], [{ message: '' }], [{ message: 'x'.repeat(1001) }], [{ message: 42 }]])(
    'rejects invalid body %#',
    async (body) => {
      const res = await handleRequest(post(body), env, okTelegram());
      expect(res.status).toBe(400);
    },
  );

  it('sends the message to Telegram', async () => {
    const tg = okTelegram();
    const res = await handleRequest(post({ message: 'Я згодна 🍁' }), env, tg);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(SITE);
    const [url, init] = tg.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage');
    expect(JSON.parse(init.body)).toEqual({ chat_id: '42', text: 'Я згодна 🍁' });
  });

  it('reports Telegram failure as 502', async () => {
    const tg = vi.fn(async () => new Response('{"ok":false}', { status: 400 }));
    const res = await handleRequest(post({ message: 'hi' }), env, tg);
    expect(res.status).toBe(502);
  });

  it('fails clearly when secrets are missing', async () => {
    const res = await handleRequest(post({ message: 'hi' }), { ALLOWED_ORIGINS: SITE }, okTelegram());
    expect(res.status).toBe(500);
  });
});
