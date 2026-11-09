import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analyze, lookup } from '../skills/shampoo-advisor/scripts/analyze.mjs';
import { getIngredientMatches } from '../src/lib/matching.js';
import { ingredientSearchText, normalizeName } from '../src/lib/names.js';

const load = relative => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const records = load('../src/data/ingredients.json');
const skillRecords = load('../skills/shampoo-advisor/data/ingredients.json');
const aliases = load('../skills/shampoo-advisor/data/aliases.json');
const manifest = load('../skills/shampoo-advisor/data/manifest.json');
const single = input => analyze(input).products[0];

test('skill snapshot preserves all records and matches its source hashes', () => {
  assert.deepEqual(skillRecords, records);
  assert.equal(manifest.recordCount, 152);
  for (const [source, meta] of Object.entries(manifest.files)) {
    const hash = file => createHash('sha256').update(readFileSync(new URL(`../${file}`, import.meta.url))).digest('hex');
    assert.equal(hash(source), meta.sha256, `${source} changed: run npm run skill:sync`);
    assert.equal(hash(`skills/shampoo-advisor/${meta.bundledPath}`), meta.bundledSha256);
  }
  const hash = createHash('sha256').update(readFileSync(new URL('../skills/shampoo-advisor/data/aliases.json', import.meta.url))).digest('hex');
  assert.equal(hash, manifest.aliasesSha256);
});

test('every original Chinese name, INCI, id and curated alias resolves without ambiguity', () => {
  for (const record of records) {
    for (const name of [record.id, record.cn, record.inci, ...(aliases[record.id] ?? [])]) {
      const found = lookup(name);
      assert.equal(found.status, 'matched', name);
      assert.equal(found.candidates[0].id, record.id, name);
    }
  }
  assert.equal(lookup('ＳＬＥＳ').candidates[0].id, 'sodium-laureth-sulfate');
  assert.equal(lookup('Polyquaternium – 10').candidates[0].id, 'polyquaternium-10');
  assert.equal(lookup('1,2-己二醇').candidates[0].id, '1-2-hexanediol');
  assert.equal(lookup('辛基/辛酸基葡糖苷').candidates[0].id, 'caprylyl-capryl-glucoside');
});

test('reviewed botanical label forms and Chinese spelling variants resolve in both lookup and website search', () => {
  const examples = [
    ['Simmondsia Chinensis (Jojoba) Seed Oil', 'jojoba-oil'],
    ['Simmondsia Chinensis Seed Oil', 'jojoba-oil'],
    ['Rosmarinus Officinalis (Rosemary) Leaf Oil', 'rosemary-leaf-oil'],
    ['Serenoa Serrulata Fruit Extract', 'saw-palmetto-extract'],
    ['Centella Asiatica Extract', 'centella-asiatica-extract'],
    ['互生叶白千层(MELALEUCA ALTERNIFOLIA)叶油', 'tea-tree-oil'],
    ['积雪草（CENTELLA ASIATICA）提取物', 'centella-asiatica-extract'],
    ['蓝桉(EUCALYPTUS GLOBULUS)叶油', 'eucalyptus-globulus-oil'],
    ['白柳(SALIX ALBA)树皮提取物', 'salix-alba-bark-extract'],
    ['辣薄荷(MENTHA PIPERITA)油', 'peppermint-oil'],
    ['瓜儿胶羟丙基三甲基氯化铵', 'guar-hydroxypropyltrimonium-chloride'],
  ];
  for (const [name, id] of examples) {
    const result = lookup(name);
    assert.equal(result.status, 'matched', name);
    assert.deepEqual(result.candidates.map(candidate => candidate.id), [id], name);
    const record = records.find(item => item.id === id);
    assert.ok(ingredientSearchText(record).includes(normalizeName(name)), `website alias search: ${name}`);
  }
});

test('conflicting plant species, unknown silicone numbers and family abbreviations never become exact matches', () => {
  const names = [
    '蓝桉(MENTHA PIPERITA)叶油',
    '互生叶白千层(CENTELLA ASIATICA)叶油',
    '积雪草(ROSMARINUS OFFICINALIS)提取物',
    'PEG/PPG-17/18 Dimethicone',
    'PEG-999 Dimethicone',
    'APG', 'DHA', 'PHA', 'Vitamin E',
  ];
  const product = single({ profile: { scalp: 'oily', hair: 'fine', states: ['sensitive'] }, ingredients: names });
  assert.equal(product.summary.matched, 0);
  for (const [position, name] of names.entries()) {
    assert.notEqual(lookup(name).status, 'matched', name);
    assert.equal(product.rows[position].id, undefined, name);
    assert.equal(product.rows[position].signal, undefined, name);
  }
  assert.equal(lookup('Dimethicone Copolyol').candidates[0].id, 'dimethicone-copolyol');
  assert.equal(lookup('PEG-12 Dimethicone').candidates[0].id, 'peg-12-dimethicone');
});

test('schema version 2 exports website review metadata without promoting it to a product verdict', () => {
  assert.equal(manifest.schemaVersion, 2);
  const result = analyze({
    profile: { scalp: 'oily', hair: 'coarse', states: ['dandruff', 'sensitive'] },
    ingredients: records.map(record => record.inci),
  }, { full: true });
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.products[0].summary.matched, records.length);
  for (const [position, row] of result.products[0].rows.entries()) {
    const source = records[position];
    for (const field of ['refs', 'evidence', 'regulatory', 'isDrug', 'cautions', 'consumerMatch', 'typicalProduct']) {
      assert.ok(Object.hasOwn(row, field), `${source.id}: missing ${field}`);
      assert.deepEqual(row[field], source[field], `${source.id}: changed ${field}`);
      assert.deepEqual(row.record[field], source[field], `${source.id}: full record changed ${field}`);
    }
  }
  const byId = new Map(result.products[0].rows.map(row => [row.id, row]));
  const drug = byId.get('ketoconazole');
  assert.equal(drug.isDrug, true);
  assert.equal(drug.consumerMatch, false);
  assert.notEqual(drug.signal, 'support');
  assert.ok(drug.regulatory.length > 0);
  assert.ok(drug.cautions.length > 0);
  assert.equal(byId.get('benzyl-alcohol').consumerMatch, false);
  assert.notEqual(byId.get('benzyl-alcohol').signal, 'support');
});

test('all matched product rows preserve website classifications across representative profiles', () => {
  const profiles = [{}, { hair: 'fine' }, { scalp: 'oily', hair: 'fine' }, { scalp: 'oily', states: ['dyed', 'sensitive'] }, { scalp: 'dry', hair: 'coarse', states: ['sensitive', 'damaged', 'frizzy', 'dandruff', 'curly'] }];
  for (const profile of profiles) {
    const output = single({ profile, ingredients: records.map(record => record.inci) });
    assert.equal(output.summary.matched, 152);
    for (const [i, row] of output.rows.entries()) {
      const expected = getIngredientMatches(records[i], profile);
      assert.deepEqual(row.matchedTags, expected);
      assert.equal(row.signal, expected.avoidTags.length ? 'caution' : expected.recommendedTags.length ? 'support' : 'neutral');
      assert.equal(row.position, i + 1);
      assert.equal(row.synergy, records[i].synergy);
      assert.equal(row.src, records[i].src);
    }
  }
});

test('blurred names and near spellings never become confirmed ingredients', () => {
  const result = single({ profile: { scalp: 'oily' }, ingredients: [
    { name: 'SLS', uncertain: true }, 'Sodium Laureth Sulfat', '聚季铵盐-1', '香精', '水',
  ] });
  assert.equal(result.summary.matched, 0);
  assert.equal(result.rows[0].status, 'uncertain');
  assert.equal(result.rows[0].candidates[0].id, 'sodium-lauryl-sulfate');
  assert.ok(result.rows[1].candidates.some(candidate => candidate.id === 'sodium-laureth-sulfate'));
  assert.equal(result.rows[2].status, 'unlisted');
  assert.equal(result.rows[3].status, 'unlisted');
  assert.ok(result.rows.every(row => row.signal === undefined));
  assert.equal(result.label.complete, null);
});

test('internal structural parentheses cannot be deleted to create exact chemical aliases', () => {
  assert.equal(lookup('双咪唑烷基脲').status, 'unlisted');
  assert.equal(lookup('Bis-Dimonium Methosulfate').status, 'unlisted');
  assert.equal(lookup('双(羟甲基)咪唑烷基脲').candidates[0].id, 'diazolidinyl-urea');
  const row = single({ profile: { hair: 'fine', states: ['frizzy'] }, ingredients: ['聚季铵盐-10'] }).rows[0];
  assert.ok(!row.matchedTags.recommendedTags.includes('粗干沙发'));
});

test('explicit personal avoid names are separate from profile matching and respect uncertainty', () => {
  const result = single({
    profile: { scalp: 'oily' }, avoidIngredients: ['甲基异噻唑啉酮', '香精', '氯化钠', '柠檬酸'],
    label: { complete: false, orderPreserved: true },
    ingredients: ['MIT', '香精', '香精衍生物', { name: '氯化钠', uncertain: true }, { name: '甲基异噻…', uncertain: true }],
  });
  assert.equal(result.rows[0].explicitAvoid, true);
  assert.equal(result.rows[0].signal, 'caution');
  assert.equal(result.rows[1].explicitAvoid, true);
  assert.equal(result.rows[2].explicitAvoid, undefined);
  assert.deepEqual(result.explicitAvoidStatus.map(item => item.status), ['present', 'present', 'uncertain', 'not_confirmed']);
  assert.deepEqual(result.explicitAvoidStatus[0].possiblePositions, [5]);
  assert.equal(result.summary.caution, 2);
});

test('batch results retain order, source fields, micro-ingredient sections and duplicate rows', () => {
  const input = { profile: { scalp: 'oily', hair: 'fine', states: ['dyed'] }, products: [
    { name: 'A', label: { complete: true, orderPreserved: true }, ingredients: ['SLS', 'CAPB', 'SLS', { name: '泛醇', section: '其他微量成分' }] },
    { name: 'B', ingredients: ['水', 'SCI'] },
  ] };
  const original = structuredClone(input);
  const result = analyze(input, { full: true });
  assert.deepEqual(input, original);
  assert.equal(result.products.length, 2);
  assert.equal(result.products[0].summary.matched, 4);
  assert.equal(result.products[0].summary.uniqueMatched, 3);
  assert.deepEqual(result.products[0].rows[0].record, records.find(record => record.id === 'sodium-lauryl-sulfate'));
  assert.equal(result.products[0].rows[0].signal, 'caution');
  assert.equal(result.products[0].rows[3].section, '其他微量成分');
  assert.equal(result.products[1].label.complete, null);
});

test('invalid profiles and malformed inputs fail instead of silently dropping user information', () => {
  for (const input of [
    { profile: { scalp: 'oil' }, ingredients: ['SLS'] },
    { profile: { states: ['pregnant'] }, ingredients: ['SLS'] },
    { profile: { state: ['sensitive'] }, ingredients: ['SLS'] },
    { ingredients: [''] }, { ingredients: '水、SLS' }, { ingredients: [] },
    { ingredients: [{ name: '水', uncertain: 'false' }] },
    { ingredients: ['水'], label: { complete: 'true' } },
    { products: [], ingredients: ['SLS'] }, { ingredients: ['SLS'], ignored: true },
  ]) assert.throws(() => analyze(input));
});

test('CLI runs outside the project, accepts UTF-8 BOM stdin and reports input errors', () => {
  const script = fileURLToPath(new URL('../skills/shampoo-advisor/scripts/analyze.mjs', import.meta.url));
  const run = (args, input) => spawnSync(process.execPath, [script, ...args], { input, encoding: 'utf8', cwd: process.env.TEMP || process.cwd() });
  const output = run(['--stdin'], '\uFEFF' + JSON.stringify({ profile: { scalp: 'oily' }, ingredients: ['水', 'SLES'] }));
  assert.equal(output.status, 0, output.stderr);
  assert.equal(JSON.parse(output.stdout).products[0].summary.matched, 1);
  const lookupResult = run(['--lookup', 'SLS']);
  assert.equal(lookupResult.status, 0, lookupResult.stderr);
  assert.equal(JSON.parse(lookupResult.stdout).status, 'matched');
  const invalid = run(['--stdin'], '{broken');
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, '');
  assert.ok(JSON.parse(invalid.stderr).error);
});
