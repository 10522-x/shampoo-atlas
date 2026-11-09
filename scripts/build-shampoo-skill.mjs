import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateIngredients } from '../src/lib/validation.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'skills', 'shampoo-advisor');
mkdirSync(target, { recursive: true });
copyFileSync(path.join(root, 'LICENSE'), path.join(target, 'LICENSE'));
const sources = [
  ['src/data/ingredients.json', 'data/ingredients.json'],
  ['src/data/modules.js', 'scripts/lib/modules.mjs'],
  ['src/data/profile-options.js', 'scripts/lib/profile-options.mjs'],
  ['src/lib/matching.js', 'scripts/lib/matching.mjs'],
  ['src/lib/names.js', 'scripts/lib/names.mjs'],
  ['src/lib/validation.js', 'scripts/lib/validation.mjs'],
];
const digest = buffer => createHash('sha256').update(buffer).digest('hex');
const data = JSON.parse(readFileSync(path.join(root, sources[0][0]), 'utf8'));
const raw = JSON.parse(readFileSync(path.join(root, 'ai_studio_code.txt'), 'utf8'));
validateIngredients(data);
if (raw.some(record => !data.some(item => item.id === record.id))) throw new Error('原始导入成分存在未说明的缺失，停止同步。');
const files = {};
for (const [source, destination] of sources) {
  const from = path.join(root, source);
  const to = path.join(target, destination);
  mkdirSync(path.dirname(to), { recursive: true });
  const original = readFileSync(from);
  if (source.startsWith('src/lib/')) {
    const rewritten = original.toString('utf8')
      .replace("'../data/modules.js'", "'./modules.mjs'")
      .replace("'../data/profile-options.js'", "'./profile-options.mjs'")
      .replace("'./names.js'", "'./names.mjs'")
      .replace("'./validation.js'", "'./validation.mjs'");
    writeFileSync(to, rewritten);
  } else copyFileSync(from, to);
  files[source] = { sha256: digest(original), bundledPath: destination, bundledSha256: digest(readFileSync(to)) };
}
writeFileSync(path.join(target, 'data/aliases.json'), `${JSON.stringify(Object.fromEntries(data.filter(record => record.aliases.length).map(record => [record.id, record.aliases])), null, 2)}\n`);
const aliases = readFileSync(path.join(target, 'data/aliases.json'));
const manifest = {
  schemaVersion: 2,
  version: `2-${digest(Buffer.concat([...sources.map(([source]) => readFileSync(path.join(root, source))), aliases])).slice(0, 12)}`,
  recordCount: data.length,
  databaseSha256: files['src/data/ingredients.json'].sha256,
  aliasesSha256: digest(aliases),
  source: 'Shampoo Atlas / src/data/ingredients.json; original import retained in ai_studio_code.txt',
  rawSourceSha256: digest(readFileSync(path.join(root, 'ai_studio_code.txt'))),
  evidenceStatus: 'Reviewed schema; reference verification is scoped per record. Unverified references remain explicitly marked.',
  files,
};
writeFileSync(path.join(target, 'data/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced ${data.length} records to skills/shampoo-advisor (${manifest.version}).`);
