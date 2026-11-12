const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;
const sessions = new Map();

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}

function newSession() {
  return { step: 0, choices: {}, updatedAt: new Date().toISOString() };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/session' && req.method === 'POST') {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const session = newSession(); sessions.set(id, session);
    return json(res, 201, { id, session });
  }
  if (url.pathname.startsWith('/api/session/') && req.method === 'GET') {
    const id = url.pathname.split('/').pop();
    const session = sessions.get(id);
    return session ? json(res, 200, { id, session }) : json(res, 404, { error: 'session not found' });
  }
  if (url.pathname.startsWith('/api/session/') && url.pathname.endsWith('/step') && req.method === 'POST') {
    const id = url.pathname.split('/')[3];
    const session = sessions.get(id);
    if (!session) return json(res, 404, { error: 'session not found' });
    try {
      const payload = await readBody(req);
      const next = Number(payload.step);
      if (!Number.isInteger(next) || next < 0 || next > 7) return json(res, 400, { error: 'invalid step' });
      session.step = Math.max(session.step, next);
      if (payload.choice) session.choices[String(next)] = String(payload.choice).slice(0, 120);
      session.updatedAt = new Date().toISOString();
      return json(res, 200, { id, session });
    } catch { return json(res, 400, { error: 'invalid json' }); }
  }
  if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' });
  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const safe = path.normalize(file).replace(/^([.][.][\\/])+/, '');
  const filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) return json(res, 404, { error: 'not found' });
  const ext = path.extname(filePath); const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' }); fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => console.log(`小辣条任务网站 running at http://localhost:${PORT}`));
