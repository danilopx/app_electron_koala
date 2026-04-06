const http = require('http');
const fs = require('fs');
const path = require('path');

const host = process.env.KOALA_DEV_HOST || '127.0.0.1';
const port = Number(process.env.KOALA_DEV_PORT || 4301);
const distDir = path.join(__dirname, '..', 'dist', 'Koala');
const indexFile = path.join(distDir, 'index.html');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8',
      });
      response.end(error.code === 'ENOENT' ? 'Arquivo nao encontrado.' : 'Erro ao ler arquivo.');
      return;
    }

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(data);
  });
}

function resolveRequestPath(urlPathname) {
  const normalizedPath = decodeURIComponent(urlPathname.split('?')[0]);
  const relativePath = normalizedPath === '/' ? '/index.html' : normalizedPath;
  const requestedPath = path.normalize(path.join(distDir, relativePath));

  if (!requestedPath.startsWith(distDir)) {
    return null;
  }

  return requestedPath;
}

const server = http.createServer((request, response) => {
  const requestedPath = resolveRequestPath(request.url || '/');

  if (!requestedPath) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Requisicao invalida.');
    return;
  }

  fs.stat(requestedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(response, requestedPath);
      return;
    }

    fs.access(indexFile, fs.constants.F_OK, (indexError) => {
      if (indexError) {
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Build Angular ainda nao esta pronto. Aguarde a primeira compilacao.');
        return;
      }

      sendFile(response, indexFile);
    });
  });
});

server.listen(port, host, () => {
  console.log(`[dev-server] Servindo dist/Koala em http://${host}:${port}`);
});
