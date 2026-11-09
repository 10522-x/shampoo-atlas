import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateIngredients } from '../src/lib/validation.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = name => path.join(root, name);
const load = name => JSON.parse(readFileSync(file(name), 'utf8'));
const hash = name => createHash('sha256').update(readFileSync(file(name))).digest('hex');
const records = load('src/data/ingredients.json');
const result = validateIngredients(records);
const manifest = load('skills/shampoo-advisor/data/manifest.json');
const revision = load('data-review/revision.json');
if (hash('ai_studio_code.txt') !== revision.rawSourceSha256) throw new Error('原始导入快照发生变化，请核对来源记录');
if (manifest.schemaVersion !== 2 || manifest.recordCount !== records.length) throw new Error('Skill schema/count is out of sync');
if (hash('src/data/ingredients.json') !== manifest.databaseSha256) throw new Error('Database changed: run npm run skill:sync');
for (const [source, meta] of Object.entries(manifest.files)) {
  if (hash(source) !== meta.sha256 || hash(`skills/shampoo-advisor/${meta.bundledPath}`) !== meta.bundledSha256) throw new Error(`Snapshot changed: ${source}; run npm run skill:sync`);
}
const expectedAliases = Object.fromEntries(records.filter(record => record.aliases.length).map(record => [record.id, record.aliases]));
if (JSON.stringify(expectedAliases) !== JSON.stringify(load('skills/shampoo-advisor/data/aliases.json'))) throw new Error('Alias snapshot is out of sync');
if (hash('skills/shampoo-advisor/data/aliases.json') !== manifest.aliasesSha256) throw new Error('Alias manifest hash is out of sync');
console.log(`Validated ${result.recordCount} ingredients, ${result.moduleCount} modules and skill snapshot hashes.`);
