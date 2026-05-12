import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, 'src');

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
]);

const DEFAULT_IGNORE_SUFFIXES = [
  '.lock',
  '.log',
];

const isIgnoredPath = (relativePath) => {
  const parts = relativePath.split(path.sep);
  if (parts.some((p) => DEFAULT_IGNORE_DIRS.has(p))) return true;
  return DEFAULT_IGNORE_SUFFIXES.some((s) => relativePath.endsWith(s));
};

const walk = (dirAbs, results, dirRel = '') => {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(dirAbs, ent.name);
    const rel = path.join(dirRel, ent.name);
    if (isIgnoredPath(rel)) continue;
    if (ent.isDirectory()) {
      walk(abs, results, rel);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|css|scss|md)$/.test(ent.name)) continue;
    results.push({ abs, rel: rel.split(path.sep).join('/') });
  }
};

const escapeFence = (line) => line.replaceAll('```', '`\u200b``');

const main = () => {
  if (!fs.existsSync(SRC_ROOT)) {
    console.error('Missing src/ directory at', SRC_ROOT);
    process.exit(1);
  }

  const files = [];
  walk(SRC_ROOT, files);
  files.sort((a, b) => a.rel.localeCompare(b.rel));

  const outPath = path.join(REPO_ROOT, 'context-frontend.txt');
  const out = fs.createWriteStream(outPath, { encoding: 'utf8' });

  out.write(`# Frontend Context Export\n`);
  out.write(`# Repo: ${path.basename(REPO_ROOT)}\n`);
  out.write(`# Generated: ${new Date().toISOString()}\n`);
  out.write(`# Files: ${files.length}\n\n`);

  for (const f of files) {
    const content = fs.readFileSync(f.abs, 'utf8');
    const lines = content.split(/\r?\n/);

    out.write(`\n===== FILE: src/${f.rel} =====\n`);
    for (let i = 0; i < lines.length; i += 1) {
      const ln = String(i + 1).padStart(5, ' ');
      out.write(`${ln}|${escapeFence(lines[i] ?? '')}\n`);
    }
  }

  out.end();
  out.on('close', () => {
    const stats = fs.statSync(outPath);
    console.log(`Wrote ${outPath} (${stats.size} bytes)`);
  });
};

main();
