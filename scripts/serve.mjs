import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.ttf':'font/ttf'};

function sendFile(file, request, response) {
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) return response.writeHead(404).end('Not found');
    response.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control':'no-cache'});
    if (request.method === 'HEAD') return response.end();
    fs.createReadStream(file).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const candidate = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!candidate.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (pathname !== '/' && !path.extname(pathname)) return sendFile(path.join(root, 'index.html'), request, response);
  sendFile(candidate, request, response);
});

server.listen(Number(process.env.PORT || 4174), '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));
