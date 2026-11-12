// Servidor local do KOALA PLAYER: entrega o app e funciona como proxy para listas e streams.
// Uso: node server.js   (depois abra http://localhost:8080)
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const agents = { 'http:': new http.Agent({ keepAlive: true }), 'https:': new https.Agent({ keepAlive: true, rejectUnauthorized: false }) };
const PORT = process.env.PORT || 8080;
const PROXY = '/proxy?url=';
const page = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .replace('name="sintonia-proxy" content=""', 'name="sintonia-proxy" content="' + PROXY + '"');

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, OPTIONS'
};

function relay(target, req, res, depth) {
  let url;
  try { url = new URL(target); } catch (e) { res.writeHead(400, CORS); return res.end('Endereço inválido'); }
  const lib = url.protocol === 'https:' ? https : http;
  const headers = { 'user-agent': req.headers['user-agent'] || 'Mozilla/5.0' };
  if (req.headers.range) headers.range = req.headers.range;

  const up = lib.get(url, { headers, agent: agents[url.protocol] }, (r) => {
    if ([301, 302, 303, 307, 308].includes(r.statusCode) && r.headers.location && depth < 5) {
      r.resume();
      return relay(new URL(r.headers.location, url).href, req, res, depth + 1);
    }
    const type = r.headers['content-type'] || 'application/octet-stream';
    const out = Object.assign({}, CORS, { 'content-type': type });
    const looksText = /mpegurl|text|json/i.test(type) || /\.m3u8?(\?|$)/i.test(url.pathname + url.search);

    if (!looksText) {
      for (const k of ['content-length', 'content-range', 'accept-ranges']) if (r.headers[k]) out[k] = r.headers[k];
      res.writeHead(r.statusCode, out);
      return r.pipe(res);
    }

    let body = '';
    r.setEncoding('utf8');
    r.on('data', (d) => { body += d; });
    r.on('end', () => {
      // Só reescreve playlists HLS (com tags #EXT-X-). Listas M3U comuns passam como estão.
      if (/#EXT-X-/.test(body)) {
        const abs = (u) => PROXY + encodeURIComponent(new URL(u, url).href);
        body = body.split(/\r?\n/).map((l) => {
          const t = l.trim();
          if (!t) return l;
          if (t.startsWith('#')) return l.replace(/URI="([^"]+)"/g, (_, u) => 'URI="' + abs(u) + '"');
          return abs(t);
        }).join('\n');
      }
      res.writeHead(r.statusCode, out);
      res.end(body);
    });
  });
  up.on('error', (e) => { res.writeHead(502, CORS); res.end('Falha ao acessar o servidor: ' + e.message); });
  req.on('close', () => up.destroy());
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (u.pathname === '/proxy') {
    const target = u.searchParams.get('url');
    if (!target) { res.writeHead(400, CORS); return res.end('Faltou o parâmetro url'); }
    return relay(target, req, res, 0);
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page);
}).listen(PORT, () => console.log('KOALA PLAYER em http://localhost:' + PORT));