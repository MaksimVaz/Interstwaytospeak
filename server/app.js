// Node HTTP adapter around the Fetch-style handler — no dependencies needed
import { createServer } from 'node:http';
import { handleRequest } from './handler.js';

const MAX_BODY_BYTES = 10_000;

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createAppServer(env, fetchImpl = fetch) {
  return createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
        return;
      }

      const body = req.method === 'POST' ? await readBody(req) : undefined;
      if (body === null) {
        res.writeHead(413, { 'Content-Type': 'application/json' }).end('{"ok":false,"error":"body too large"}');
        return;
      }

      const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: body?.length ? body : undefined,
      });
      const response = await handleRequest(request, env, fetchImpl);

      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'application/json' }).end('{"ok":false,"error":"internal error"}');
    }
  });
}
