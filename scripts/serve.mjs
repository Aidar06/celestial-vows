import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.woff2':'font/woff2'};

function sendFile(file, request, response) {
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) return response.writeHead(404).end('Not found');
    const extension = path.extname(file).toLowerCase();
    const cacheControl = file.startsWith(path.join(root, 'assets') + path.sep)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';
    const headers = {'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': cacheControl};
    const range = request.headers.range;
    if (extension === '.mp4' && range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : stat.size - 1;
      if (!match || start > end || end >= stat.size) {
        return response.writeHead(416, {'Content-Range': `bytes */${stat.size}`}).end();
      }
      response.writeHead(206, {...headers, 'Accept-Ranges':'bytes', 'Content-Range':`bytes ${start}-${end}/${stat.size}`, 'Content-Length':end - start + 1});
      if (request.method === 'HEAD') return response.end();
      return fs.createReadStream(file, {start, end}).pipe(response);
    }
    headers['Content-Length'] = stat.size;
    if (extension === '.mp4') headers['Accept-Ranges'] = 'bytes';
    response.writeHead(200, headers);
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
