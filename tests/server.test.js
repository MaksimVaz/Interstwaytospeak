import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createAppServer } from '../server/app.js';

const SITE = 'https://maksimvaz.github.io';
const env = { ALLOWED_ORIGINS: SITE, TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' };
const telegram = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));

let server;
let base;

beforeAll(async () => {
  server = createAppServer(env, telegram);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('http server', () => {
  it('responds to health checks', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
  });

  it('forwards POST to the handler and returns CORS headers', async () => {
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: SITE },
      body: JSON.stringify({ message: 'Я згодна 🍁' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe(SITE);
    expect(JSON.parse(telegram.mock.calls[0][1].body).text).toBe('Я згодна 🍁');
  });

  it('rejects oversized bodies', async () => {
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: SITE },
      body: JSON.stringify({ message: 'x'.repeat(20_000) }),
    });
    expect(res.status).toBe(413);
  });
});
