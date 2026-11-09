import { MODULES } from '../data/modules.js';
import { PROFILE_GROUPS } from '../data/profile-options.js';
import { ingredientNames, normalizeName } from './names.js';

const modules = new Set(MODULES.map(module => module.id));
const attributes = Object.fromEntries(PROFILE_GROUPS.map(group => [group.id, new Set(group.options.map(option => option.value))]));

export function validateProfileRule(rule, location = 'profile rule') {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) throw new Error(`Invalid ${location}`);
  if (Object.keys(rule).some(key => !['label', 'scalp', 'hair', 'states'].includes(key))) throw new Error(`Unknown condition in ${location}`);
  if (typeof rule.label !== 'string' || !rule.label.trim()) throw new Error(`Missing label in ${location}`);
  let conditions = 0;
  for (const key of Object.keys(attributes)) {
    if (rule[key] === undefined) continue;
    if (!Array.isArray(rule[key]) || !rule[key].length || rule[key].some(value => !attributes[key].has(value))) throw new Error(`Invalid ${key} in ${location}`);
    conditions += rule[key].length;
  }
  if (!conditions) throw new Error(`Empty condition in ${location}`);
  return true;
}

export function validateIngredients(records) {
  if (!Array.isArray(records) || !records.length) throw new Error('Ingredient database must be a non-empty array');
  const ids = new Set();
  const orders = new Set();
  const names = new Map();
  for (const record of records) {
    if (['block', 'rank', 'grade'].some(key => Object.hasOwn(record, key))) throw new Error(`Deprecated data field for ${record.id}`);
    if (!record.id || ids.has(record.id)) throw new Error(`Duplicate or empty ingredient id: ${record.id}`);
    ids.add(record.id);
    if (!modules.has(record.module)) throw new Error(`Unknown module for ${record.id}: ${record.module}`);
    const order = `${record.module}:${record.order}`;
    if (!Number.isInteger(record.order) || record.order < 0 || orders.has(order)) throw new Error(`Invalid or duplicate order for ${record.id}`);
    orders.add(order);
    for (const key of ['cn', 'inci', 'func', 'synergy', 'src']) {
      if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Missing ${key} for ${record.id}`);
    }
    for (const key of ['best', 'avoid', 'aliases', 'abbr', 'cautions', 'typicalProduct']) {
      if (!Array.isArray(record[key]) || record[key].some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Invalid ${key} for ${record.id}`);
    }
    if (typeof record.consumerMatch !== 'boolean' || typeof record.isDrug !== 'boolean') throw new Error(`Missing matching eligibility for ${record.id}`);
    for (const field of ['suitableFor', 'avoidFor']) {
      if (!Array.isArray(record[field])) throw new Error(`Missing ${field} for ${record.id}`);
      record[field].forEach((rule, index) => validateProfileRule(rule, `${record.id}.${field}[${index}]`));
    }
    for (const [field, display] of [['suitableFor', 'best'], ['avoidFor', 'avoid']]) {
      if (JSON.stringify(record[field].map(rule => rule.label)) !== JSON.stringify(record[display])) throw new Error(`Display labels out of sync with ${field} for ${record.id}`);
    }
    if ((record.module === 'formula-support' || record.isDrug) && record.consumerMatch) throw new Error(`Ineligible consumer recommendation for ${record.id}`);
    if (!Array.isArray(record.refs) || !record.refs.length) throw new Error(`Missing references for ${record.id}`);
    for (const ref of record.refs) {
      if (!ref.title || typeof ref.verified !== 'boolean' || !ref.scope) throw new Error(`Invalid reference for ${record.id}`);
      if (ref.verified && !/^https:\/\//.test(ref.url || '')) throw new Error(`Verified reference needs HTTPS URL: ${record.id}`);
    }
    if (!Array.isArray(record.regulatory) || !['unverified', 'partially-verified'].includes(record.evidence?.status)) throw new Error(`Invalid evidence or regulatory metadata for ${record.id}`);
    if ((record.evidence.status === 'partially-verified') !== record.refs.some(ref => ref.verified)) throw new Error(`Reference status out of sync for ${record.id}`);
    for (const regulation of record.regulatory) {
      if (!regulation.region || !regulation.note || typeof regulation.verified !== 'boolean') throw new Error(`Invalid regulation for ${record.id}`);
    }
    for (const name of ingredientNames(record)) {
      const key = normalizeName(name);
      const existing = names.get(key);
      if (existing && existing !== record.id) throw new Error(`Ambiguous exact name shared by ${existing} and ${record.id}: ${name}`);
      names.set(key, record.id);
    }
  }
  return { recordCount: ids.size, moduleCount: new Set(records.map(record => record.module)).size };
}
