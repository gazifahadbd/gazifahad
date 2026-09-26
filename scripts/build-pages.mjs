import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const basePath = process.env.PAGES_BASE_PATH ?? '/fahad';
if (basePath && !/^\/[a-zA-Z0-9_/-]*$/.test(basePath)) {
  throw new Error('PAGES_BASE_PATH must be empty or a URL path starting with /.');
}
const prefix = basePath.replace(/\/+$/, '');
await mkdir(output, { recursive: true });
await cp(path.join(root, 'site'), output, { recursive: true });

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewrite(filename);
    } else if (/\.(html|css)$/.test(entry.name)) {
      const original = await readFile(filename, 'utf8');
      const updated = original
        .replace(/(\b(?:href|src|poster|content|action)\s*=\s*["'])\/(?!\/)/gi, `$1${prefix}/`)
        .replace(/(url\(\s*["']?)\/(?!\/)/gi, `$1${prefix}/`);
      await writeFile(filename, updated);
    }
  }
}
await rewrite(output);
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built GitHub Pages site in dist/ for ${prefix || '/'}`);
