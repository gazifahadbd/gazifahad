import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.join(PACKAGE_ROOT, 'site');
const MIME_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);
const HTML_POLICY = [
  "default-src 'self' data:",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self'",
  "connect-src 'none'",
  "frame-src 'none'",
  "media-src 'self' data:",
  "object-src 'none'",
  "worker-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function helpText() {
  return [
    'Usage: npm run serve -- [options]',
    '',
    'Options:',
    '  --host <hostname>  Hostname to listen on (default: localhost)',
    '  --port <number>    Port to listen on (default: 3000)',
    '  --help             Show this help',
  ].join('\n');
}

export function parseArgs(argv = process.argv.slice(2)) {
  const options = { host: 'localhost', port: 3000, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument !== '--host' && argument !== '--port') {
      throw new Error(`Unknown option: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}.`);
    index += 1;
    if (argument === '--host') options.host = value;
    if (argument === '--port') options.port = Number(value);
  }
  if (!options.host.trim()) throw new Error('--host cannot be empty.');
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65_535) {
    throw new Error('--port must be an integer from 0 to 65535.');
  }
  return options;
}

function insideRoot(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function resolveRequestFile(requestPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(requestPath);
  } catch {
    return { error: 400 };
  }
  if (pathname.includes('\0') || pathname.includes('\\')) return { error: 400 };

  const root = await realpath(SITE_ROOT);
  const relative = pathname.replace(/^\/+/, '');
  let candidate = path.resolve(root, relative);
  if (!insideRoot(root, candidate)) return { error: 403 };

  try {
    const candidateStats = await stat(candidate);
    if (candidateStats.isDirectory()) candidate = path.join(candidate, 'index.html');
  } catch {
    if (!path.extname(candidate)) candidate = path.join(candidate, 'index.html');
  }

  try {
    const resolved = await realpath(candidate);
    if (!insideRoot(root, resolved)) return { error: 403 };
    const fileStats = await stat(resolved);
    if (!fileStats.isFile()) return { error: 404 };
    return { filePath: resolved, fileStats };
  } catch {
    return { error: 404 };
  }
}

function setCommonHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
}

function sendBuffer(request, response, statusCode, body, contentType) {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', contentType);
  response.setHeader('Content-Length', buffer.byteLength);
  response.end(request.method === 'HEAD' ? undefined : buffer);
}

async function sendNotFound(request, response) {
  try {
    const body = await readFile(path.join(SITE_ROOT, '404.html'));
    response.setHeader('Content-Security-Policy', HTML_POLICY);
    sendBuffer(request, response, 404, body, 'text/html; charset=utf-8');
  } catch {
    sendBuffer(request, response, 404, 'Page not found.', 'text/plain; charset=utf-8');
  }
}

async function sendFile(request, response, filePath, fileStats) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES.get(extension) ?? 'application/octet-stream';
  let start = 0;
  let end = fileStats.size - 1;
  let statusCode = 200;

  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range.trim());
    if (!match) {
      response.statusCode = 416;
      response.setHeader('Content-Range', `bytes */${fileStats.size}`);
      response.end();
      return;
    }
    if (match[1]) start = Number(match[1]);
    if (match[2]) end = Number(match[2]);
    if (!match[1] && match[2]) {
      start = Math.max(fileStats.size - Number(match[2]), 0);
      end = fileStats.size - 1;
    }
    if (start > end || start >= fileStats.size) {
      response.statusCode = 416;
      response.setHeader('Content-Range', `bytes */${fileStats.size}`);
      response.end();
      return;
    }
    end = Math.min(end, fileStats.size - 1);
    statusCode = 206;
  }

  response.statusCode = statusCode;
  response.setHeader('Content-Type', contentType);
  response.setHeader('Content-Length', end - start + 1);
  response.setHeader('Accept-Ranges', 'bytes');
  response.setHeader('Cache-Control', extension === '.html' ? 'no-cache' : 'public, max-age=3600');
  if (extension === '.html') response.setHeader('Content-Security-Policy', HTML_POLICY);
  if (statusCode === 206) response.setHeader('Content-Range', `bytes ${start}-${end}/${fileStats.size}`);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(filePath, { start, end });
  stream.on('error', (error) => response.destroy(error));
  stream.pipe(response);
}

export function createWebsiteServer() {
  return http.createServer(async (request, response) => {
    setCommonHeaders(response);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      sendBuffer(request, response, 405, 'Method not allowed.', 'text/plain; charset=utf-8');
      return;
    }

    let requestUrl;
    try {
      requestUrl = new URL(request.url ?? '/', 'http://localhost');
    } catch {
      sendBuffer(request, response, 400, 'Bad request.', 'text/plain; charset=utf-8');
      return;
    }
    const result = await resolveRequestFile(requestUrl.pathname);
    if (result.error === 400) {
      sendBuffer(request, response, 400, 'Bad request.', 'text/plain; charset=utf-8');
      return;
    }
    if (result.error === 403) {
      sendBuffer(request, response, 403, 'Forbidden.', 'text/plain; charset=utf-8');
      return;
    }
    if (result.error) {
      await sendNotFound(request, response);
      return;
    }
    await sendFile(request, response, result.filePath, result.fileStats);
  });
}

export async function startWebsiteServer({ host = 'localhost', port = 3000 } = {}) {
  const server = createWebsiteServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({ host, port }, resolve);
  });
  return { server, address: server.address() };
}

async function main() {
  let options;
  try {
    options = parseArgs();
  } catch (error) {
    console.error(`Error: ${error.message}\n\n${helpText()}`);
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    console.log(helpText());
    return;
  }

  try {
    const { server, address } = await startWebsiteServer(options);
    const actualPort = typeof address === 'object' && address ? address.port : options.port;
    console.log('Gazi Fahad Website — Standalone Edition');
    console.log(`Ready at http://localhost:${actualPort}`);
    console.log('Keep this window open. Press Ctrl+C to stop the website.');
    const close = () => server.close(() => process.exit(0));
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${options.port} is already in use. Stop the other server or use --port 3001.`);
    } else {
      console.error(`Unable to start the website: ${error.message}`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
