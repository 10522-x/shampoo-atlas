#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { getIngredientMatches, hasProfileSelection, normalizeProfile } from './lib/matching.mjs';
import { getIngredientModule } from './lib/modules.mjs';
import { PROFILE_GROUPS } from './lib/profile-options.mjs';

const readData = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const records = readData('ingredients.json');
const aliases = readData('aliases.json');
const manifest = readData('manifest.json');
const byId = new Map(records.map(record => [record.id, record]));
const index = new Map();

// 保留数字、逗号与斜杠，防止把不同聚合物编号或不同化学名合并。
export function normalizeName(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[\s\u200b\uFEFF\-‐‑‒–—﹣－]/gu, '');
}

function variants(record) {
  const result = new Set([record.id, record.cn, record.inci, ...(aliases[record.id] ?? [])]);
  for (const value of [record.cn, record.inci]) {
    // 只去掉末尾说明；内部括号可能是化学结构，必须保留。
    result.add(value.replace(/\s*(?:\([^()]*\)|（[^（）]*）)\s*$/u, '').trim());
    for (const match of value.matchAll(/\(([A-Z][A-Z0-9-]{1,11})\)/g)) result.add(match[1]);
  }
  return [...result].filter(Boolean);
}

for (const id of Object.keys(aliases)) {
  if (!byId.has(id)) throw new Error(`Alias references unknown ingredient: ${id}`);
}
for (const record of records) {
  for (const name of variants(record)) {
    const key = normalizeName(name);
    if (!index.has(key)) index.set(key, new Set());
    index.get(key).add(record.id);
  }
}

function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

const identity = id => {
  const { cn, inci } = byId.get(id);
  return { id, cn, inci };
};

export function lookup(name) {
  if (typeof name !== 'string' || !name.trim()) throw new Error('Ingredient name must be a non-empty string.');
  const key = normalizeName(name.trim());
  const exact = [...(index.get(key) ?? [])];
  if (exact.length) return { input: name, status: exact.length === 1 ? 'matched' : 'ambiguous', candidates: exact.map(identity) };
  const scores = new Map();
  const fragment = key.replace(/(?:[?？…⋯]|\.{2,})+$/gu, '');
  for (const [alias, ids] of index) {
    let score = Infinity;
    if (fragment.length >= 3 && (alias.includes(fragment) || fragment.includes(alias))) {
      score = 2 + Math.abs(alias.length - fragment.length) / Math.max(alias.length, fragment.length);
    }
    if (key.length >= 5 && Math.abs(alias.length - key.length) <= 2) {
      const distance = editDistance(alias, key);
      if (distance <= (key.length >= 10 ? 2 : 1)) score = Math.min(score, distance);
    }
    if (Number.isFinite(score)) for (const id of ids) scores.set(id, Math.min(scores.get(id) ?? Infinity, score));
  }
  const suggestions = [...scores].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([id]) => identity(id));
  return { input: name, status: 'unlisted', candidates: suggestions };
}

function object(value, location) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${location} must be an object.`);
}

function keys(value, allowed, location) {
  object(value, location);
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  if (unknown.length) throw new Error(`Unknown ${location} field(s): ${unknown.join(', ')}`);
}

function nonempty(value, location) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${location} must be a non-empty string.`);
  return value.trim();
}

function validateProfile(value = {}) {
  keys(value, ['scalp', 'hair', 'states'], 'profile');
  for (const group of PROFILE_GROUPS) {
    const input = value[group.id];
    const allowed = new Set(group.options.map(option => option.value));
    if (input === undefined) continue;
    if (group.id === 'states') {
      if (!Array.isArray(input) || input.some(state => !allowed.has(state))) throw new Error('profile.states contains an invalid value.');
    } else if (input !== '' && !allowed.has(input)) throw new Error(`Invalid profile.${group.id}: ${String(input)}`);
  }
  return normalizeProfile(value);
}

function validateLabel(value = {}) {
  keys(value, ['complete', 'orderPreserved'], 'label');
  for (const key of Object.keys(value)) if (typeof value[key] !== 'boolean') throw new Error(`label.${key} must be boolean.`);
  return { complete: value.complete ?? null, orderPreserved: value.orderPreserved ?? null };
}

function parseIngredient(value, i) {
  if (typeof value === 'string') return { name: nonempty(value, `ingredients[${i}]`), uncertain: false };
  keys(value, ['name', 'uncertain', 'section'], `ingredients[${i}]`);
  const name = nonempty(value.name, `ingredients[${i}].name`);
  if (value.uncertain !== undefined && typeof value.uncertain !== 'boolean') throw new Error(`ingredients[${i}].uncertain must be boolean.`);
  return {
    name,
    uncertain: value.uncertain ?? false,
    ...(value.section === undefined ? {} : { section: nonempty(value.section, `ingredients[${i}].section`) }),
  };
}

function compileAvoidNames(names = []) {
  if (!Array.isArray(names)) throw new Error('avoidIngredients must be an array.');
  return names.map((name, i) => {
    name = nonempty(name, `avoidIngredients[${i}]`);
    const ids = [...(index.get(normalizeName(name)) ?? [])];
    // 歧义的避开名不能任意展开为多个具体成分。
    return { name, key: normalizeName(name), id: ids.length === 1 ? ids[0] : null, ambiguous: ids.length > 1 };
  });
}

function evidenceRow(item, position, profile, avoidNames, full) {
  const found = lookup(item.name);
  const row = { position, input: item.name, ...(item.section === undefined ? {} : { section: item.section }) };
  if (item.uncertain || found.status !== 'matched') {
    const uncertain = item.uncertain || found.status === 'ambiguous';
    const explicitAvoid = !uncertain && avoidNames.some(avoid => !avoid.ambiguous && avoid.key === normalizeName(item.name));
    return { ...row, status: item.uncertain ? 'uncertain' : found.status, candidates: found.candidates, ...(explicitAvoid ? { explicitAvoid: true, signal: 'caution' } : {}) };
  }
  const record = byId.get(found.candidates[0].id);
  const matchedTags = getIngredientMatches(record, profile);
  const explicitAvoid = avoidNames.some(avoid => !avoid.ambiguous && (avoid.id === record.id || avoid.key === normalizeName(item.name)));
  const signal = explicitAvoid || matchedTags.avoidTags.length ? 'caution' : matchedTags.recommendedTags.length ? 'support' : 'neutral';
  const module = getIngredientModule(record);
  return {
    ...row, status: 'matched', id: record.id, cn: record.cn, inci: record.inci,
    module: { id: module.id, name: module.name }, signal, explicitAvoid, matchedTags,
    func: record.func, synergy: record.synergy, src: record.src, sourceGrade: record.grade,
    ...(full ? { record } : {}),
  };
}

function analyzeProduct(product, profile, avoidNames, full) {
  keys(product, ['name', 'ingredients', 'label'], 'product');
  if (!Array.isArray(product.ingredients) || !product.ingredients.length) throw new Error('ingredients must be a non-empty array.');
  const label = validateLabel(product.label);
  const name = product.name === undefined ? '' : nonempty(product.name, 'product.name');
  const items = product.ingredients.map(parseIngredient);
  const rows = items.map((item, i) => evidenceRow(item, i + 1, profile, avoidNames, full));
  const count = status => rows.filter(row => row.status === status).length;
  const summary = {
    total: rows.length, matched: count('matched'), uniqueMatched: new Set(rows.filter(row => row.status === 'matched').map(row => row.id)).size,
    unlisted: count('unlisted'), uncertain: count('uncertain'), ambiguous: count('ambiguous'),
    support: rows.filter(row => row.signal === 'support').length,
    caution: rows.filter(row => row.signal === 'caution').length,
    neutral: rows.filter(row => row.signal === 'neutral').length,
  };
  const explicitAvoidStatus = avoidNames.map(avoid => {
    const positions = rows.filter(row => !avoid.ambiguous && ['matched', 'unlisted'].includes(row.status)
      && (row.id === avoid.id && avoid.id !== null || normalizeName(row.input) === avoid.key)).map(row => row.position);
    const possiblePositions = rows.filter(row => ['uncertain', 'ambiguous'].includes(row.status)
      && (normalizeName(row.input) === avoid.key || avoid.id && row.candidates?.some(candidate => candidate.id === avoid.id))).map(row => row.position);
    return { name: avoid.name, status: positions.length ? 'present' : possiblePositions.length || avoid.ambiguous ? 'uncertain' : 'not_confirmed', positions, possiblePositions };
  });
  const limitations = [];
  if (label.complete !== true) limitations.push(label.complete === false ? '成分表不完整，不能判断未拍到的部分。' : '尚未确认成分表是否完整。');
  if (label.orderPreserved !== true) limitations.push('成分顺序未确认，不能据此分析配方排列。');
  if (summary.unlisted) limitations.push(`${summary.unlisted} 个条目未收录；未收录不等于不安全，资料覆盖不完整。`);
  if (summary.uncertain || summary.ambiguous) limitations.push('存在模糊或歧义条目，候选未参与人群匹配；如影响关键结论需补图。');
  if (!hasProfileSelection(profile)) limitations.push('没有可用于匹配的用户属性，目前仅提供成分资料。');
  if (explicitAvoidStatus.some(item => item.status !== 'present')) limitations.push('未确认出现的个人避开项，不代表产品确定不含该成分。');
  limitations.push('标签匹配是单成分线索；不等于整瓶适配、实际浓度、pH、刺激性或功效结论。');
  limitations.push('资料来源简称与原始分级保留，原始文献尚未逐条核验。');
  return { name, label, summary, rows, explicitAvoidStatus, limitations };
}

export function analyze(input, { full = false } = {}) {
  keys(input, ['profile', 'avoidIngredients', 'products', 'name', 'ingredients', 'label'], 'input');
  const profile = validateProfile(input.profile);
  const avoidNames = compileAvoidNames(input.avoidIngredients);
  let products;
  if (input.products !== undefined) {
    if (['name', 'ingredients', 'label'].some(key => Object.hasOwn(input, key))) throw new Error('Do not mix products with single-product fields.');
    if (!Array.isArray(input.products) || !input.products.length) throw new Error('products must be a non-empty array.');
    products = input.products;
  } else {
    products = [{ ingredients: input.ingredients, ...(input.name === undefined ? {} : { name: input.name }), ...(input.label === undefined ? {} : { label: input.label }) }];
  }
  return {
    schemaVersion: 1,
    database: { recordCount: records.length, sha256: manifest.databaseSha256, version: manifest.version },
    profile,
    products: products.map(product => analyzeProduct(product, profile, avoidNames, full)),
  };
}

const HELP = `Shampoo Atlas — Node.js 18+, no npm dependencies\nUsage:\n  node analyze.mjs --input input.json [--full] [--pretty]\n  node analyze.mjs --stdin [--full] [--pretty]\n  node analyze.mjs --lookup "ingredient name" [--pretty]\n`;

function main(args) {
  if (args.length === 0 || args.length === 1 && ['--help', '-h'].includes(args[0])) {
    process.stdout.write(HELP);
    return;
  }
  let mode, value, full = false, pretty = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--input', '--stdin', '--lookup'].includes(arg)) {
      if (mode) throw new Error('Choose exactly one of --input, --stdin and --lookup.');
      mode = arg;
      if (arg !== '--stdin') {
        value = args[++i];
        if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.`);
      }
    } else if (arg === '--full') full = true;
    else if (arg === '--pretty') pretty = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!mode) throw new Error('Provide --input, --stdin or --lookup.');
  const result = mode === '--lookup' ? lookup(value)
    : analyze(JSON.parse(readFileSync(mode === '--stdin' ? 0 : value, 'utf8').replace(/^\uFEFF/u, '')), { full });
  process.stdout.write(`${JSON.stringify(result, null, pretty ? 2 : 0)}\n`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 1;
  }
}
