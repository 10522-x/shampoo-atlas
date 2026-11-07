import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'skills', 'shampoo-advisor');
const sources = [
  ['src/data/ingredients.json', 'data/ingredients.json'],
  ['src/data/modules.js', 'scripts/lib/modules.mjs'],
  ['src/data/profile-options.js', 'scripts/lib/profile-options.mjs'],
  ['src/lib/matching.js', 'scripts/lib/matching.mjs'],
];
const digest = buffer => createHash('sha256').update(buffer).digest('hex');
const data = JSON.parse(readFileSync(path.join(root, sources[0][0]), 'utf8'));
const raw = JSON.parse(readFileSync(path.join(root, 'ai_studio_code.txt'), 'utf8'));
if (JSON.stringify(data) !== JSON.stringify(raw)) throw new Error('网站数据与原始数据不一致，停止同步。');
const files = {};
for (const [source, destination] of sources) {
  const from = path.join(root, source);
  const to = path.join(target, destination);
  mkdirSync(path.dirname(to), { recursive: true });
  const original = readFileSync(from);
  if (source.endsWith('matching.js')) {
    const rewritten = original.toString('utf8')
      .replace("'../data/modules.js'", "'./modules.mjs'")
      .replace("'../data/profile-options.js'", "'./profile-options.mjs'");
    writeFileSync(to, rewritten);
  } else copyFileSync(from, to);
  files[source] = { sha256: digest(original), bundledPath: destination, bundledSha256: digest(readFileSync(to)) };
}
const aliases = readFileSync(path.join(target, 'data/aliases.json'));
const manifest = {
  schemaVersion: 1,
  version: `1-${digest(Buffer.concat([...sources.map(([source]) => readFileSync(path.join(root, source))), aliases])).slice(0, 12)}`,
  recordCount: data.length,
  databaseSha256: files['src/data/ingredients.json'].sha256,
  aliasesSha256: digest(aliases),
  source: 'Shampoo Atlas / ai_studio_code.txt',
  evidenceStatus: 'Source references retained verbatim; not individually verified.',
  files,
};
writeFileSync(path.join(target, 'data/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced ${data.length} records to skills/shampoo-advisor (${manifest.version}).`);
