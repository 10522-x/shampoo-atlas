import { MODULES, compareIngredients, getIngredientModule } from '../data/modules.js';
import { PROFILE_GROUPS } from '../data/profile-options.js';
import { validateProfileRule } from './validation.js';

const options = Object.fromEntries(PROFILE_GROUPS.map(group => [group.id, new Set(group.options.map(option => option.value))]));

export function normalizeProfile(profile = {}) {
  return {
    scalp: options.scalp.has(profile.scalp) ? profile.scalp : '',
    hair: options.hair.has(profile.hair) ? profile.hair : '',
    states: [...new Set(Array.isArray(profile.states) ? profile.states.filter(state => options.states.has(state)) : [])],
  };
}

export function hasProfileSelection(profile) {
  const normalized = normalizeProfile(profile);
  return Boolean(normalized.scalp || normalized.hair || normalized.states.length);
}

function matches(rule, profile) {
  validateProfileRule(rule);
  return (!rule.scalp || rule.scalp.includes(profile.scalp))
    && (!rule.hair || rule.hair.includes(profile.hair))
    && (!rule.states || rule.states.every(state => profile.states.includes(state)));
}

// 只比较人工审校的受控条件，不从描述、法规、过敏史或配方条件推断用户属性。
export function getIngredientMatches(ingredient, profile) {
  const normalized = normalizeProfile(profile);
  if (!hasProfileSelection(normalized)) return { recommendedTags: [], avoidTags: [] };
  const labels = rules => (rules || []).filter(rule => matches(rule, normalized)).map(rule => rule.label);
  return {
    recommendedTags: ingredient.consumerMatch === true && !ingredient.isDrug ? labels(ingredient.suitableFor) : [],
    avoidTags: labels(ingredient.avoidFor),
  };
}

export function classifyIngredients(ingredients, profile) {
  const recommended = [];
  const avoid = [];
  if (!hasProfileSelection(profile)) return { recommended, avoid };
  for (const ingredient of ingredients) {
    const result = getIngredientMatches(ingredient, profile);
    if (result.avoidTags.length) avoid.push(ingredient);
    else if (result.recommendedTags.length) recommended.push(ingredient);
  }
  recommended.sort(compareIngredients);
  avoid.sort(compareIngredients);
  return { recommended, avoid };
}

export function groupIngredients(ingredients, { includeEmpty = false } = {}) {
  // 非法模块直接报错，避免新增成分被静默丢弃。
  for (const ingredient of ingredients) getIngredientModule(ingredient);
  const sorted = [...ingredients].sort(compareIngredients);
  return MODULES.map(module => ({ ...module, ingredients: sorted.filter(record => record.module === module.id) }))
    .filter(section => includeEmpty || section.ingredients.length);
}

export function getDefaultSections(ingredients) {
  return groupIngredients(ingredients, { includeEmpty: true });
}
