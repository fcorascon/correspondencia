const http = require('http');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/uploads';
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // Upload: POST /object/:bucket/*
  if (req.method === 'POST' && pathname.startsWith('/object/')) {
    const rest = pathname.replace('/object/', '');
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) { res.writeHead(400); return res.end('Bad path'); }
    const bucket = rest.slice(0, slashIdx);
    const filePath = rest.slice(slashIdx + 1);
    const dir = path.join(UPLOAD_DIR, bucket, path.dirname(filePath));
    fs.mkdirSync(dir, { recursive: true });
    const fullPath = path.join(UPLOAD_DIR, bucket, filePath);
    const writeStream = fs.createWriteStream(fullPath);
    req.pipe(writeStream);
    writeStream.on('finish', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ path: filePath, Key: `${bucket}/${filePath}` }));
    });
    writeStream.on('error', () => {
      res.writeHead(500);
      res.end('Write error');
    });
    return;
  }

  // Download: GET /object/public/:bucket/*
  if (req.method === 'GET' && pathname.startsWith('/object/public/')) {
    const rest = pathname.replace('/object/public/', '');
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) { res.writeHead(400); return res.end('Bad path'); }
    const bucket = rest.slice(0, slashIdx);
    const filePath = rest.slice(slashIdx + 1);
    const fullPath = path.join(UPLOAD_DIR, bucket, filePath);
    if (!fs.existsSync(fullPath)) { res.writeHead(404); return res.end('Not found'); }
    const stream = fs.createReadStream(fullPath);
    res.writeHead(200);
    stream.pipe(res);
    stream.on('error', () => { res.writeHead(500); res.end('Read error'); });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => console.log(`Storage server listening on ${PORT}`));
