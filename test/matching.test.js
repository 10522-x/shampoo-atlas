import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODULES, MODULE_INGREDIENT_IDS, INGREDIENT_MODULE, EDITORIAL_ORDER_IDS, getIngredientModule } from '../src/data/modules.js';
import { classifyIngredients, getDefaultSections, getIngredientMatches, groupIngredients, hasProfileSelection } from '../src/lib/matching.js';

const ingredients = JSON.parse(readFileSync(new URL('../src/data/ingredients.json', import.meta.url), 'utf8'));
const source = JSON.parse(readFileSync(new URL('../ai_studio_code.txt', import.meta.url), 'utf8'));
const find = id => ingredients.find(ingredient => ingredient.id === id);

test('all 152 original records remain unchanged and belong to exactly one module', () => {
  assert.equal(ingredients.length, 152);
  assert.deepEqual(ingredients, source);
  const assignedIds = Object.values(MODULE_INGREDIENT_IDS).flat();
  assert.equal(new Set(assignedIds).size, 152);
  assert.equal(assignedIds.length, 152);
  assert.deepEqual([...assignedIds].sort(), ingredients.map(ingredient => ingredient.id).sort());
  assert.equal(EDITORIAL_ORDER_IDS.length, 152);
  assert.equal(Object.keys(INGREDIENT_MODULE).length, 152);
  assert.equal(getDefaultSections(ingredients).length, 6);
  assert.equal(getDefaultSections(ingredients).reduce((sum, section) => sum + section.ingredients.length, 0), 152);
});

test('non-silicones and moisturizing oils are placed by their actual display role', () => {
  assert.equal(getIngredientModule('trideceth-12').id, 'co-surfactants');
  assert.equal(getIngredientModule('c13-14-isoparaffin').id, 'formula-support');
  assert.equal(getIngredientModule('glycerin').id, 'conditioners');
  assert.equal(getIngredientModule('coconut-oil').id, 'conditioners');
});

test('cleared or unknown choices do not produce custom recommendations', () => {
  for (const profile of [{}, { scalp: '', hair: '', states: [] }, { scalp: 'unknown', states: ['unknown'] }]) {
    assert.equal(hasProfileSelection(profile), false);
    assert.deepEqual(classifyIngredients(ingredients, profile), { recommended: [], avoid: [] });
  }
});

test('a tag mentioning both fine hair and oily scalp requires both choices', () => {
  const capb = find('cocamidopropyl-betaine');
  assert.equal(classifyIngredients([capb], { hair: 'fine' }).recommended.length, 0);
  assert.deepEqual(classifyIngredients([capb], { scalp: 'oily', hair: 'fine' }).recommended, [capb]);
});

test('a conflicting avoid match wins over a positive match', () => {
  const sls = find('sodium-lauryl-sulfate');
  const profile = { scalp: 'oily', states: ['dyed'] };
  const matches = getIngredientMatches(sls, profile);
  assert.ok(matches.recommendedTags.length);
  assert.ok(matches.avoidTags.length);
  assert.deepEqual(classifyIngredients([sls], profile), { recommended: [], avoid: [sls] });
});

test('coarse dry frizzy hair tags still require coarse hair, not fine frizzy hair', () => {
  const pq10 = find('polyquaternium-10');
  assert.equal(classifyIngredients([pq10], { hair: 'fine', states: ['frizzy'] }).recommended.length, 0);
  assert.equal(classifyIngredients([pq10], { states: ['frizzy'] }).recommended.length, 0);
  assert.deepEqual(classifyIngredients([pq10], { hair: 'coarse', states: ['frizzy'] }).recommended, [pq10]);
});

test('unspecified dose, formula pH, storage, allergies and diagnoses are not inferred', () => {
  const synthetic = [
    { id: 'dose', best: [], avoid: ['细软发用量过大易显脏发感'] },
    { id: 'ph', best: [], avoid: ['配方 pH > 5.5 的体系(完全失效)'] },
    { id: 'storage', best: [], avoid: ['极度寒冷地区存放(微有低温析出)'] },
    { id: 'allergy', best: [], avoid: ['对原料杂质敏感者'] },
    { id: 'heart', best: [], avoid: ['严重心律敏感极度神经衰弱者(罕见)'] },
    { id: 'diagnosis', best: ['严重真菌感染头屑'], avoid: [] },
  ];
  assert.deepEqual(classifyIngredients(synthetic, { scalp: 'dry', hair: 'fine', states: ['sensitive', 'dandruff'] }), { recommended: [], avoid: [] });
});

test('no special contraindication and universal suitability do not become personalized matches', () => {
  const synthetic = [{ id: 'neutral', best: ['几乎所有发质(闭合毛鳞片必选)'], avoid: ['无特殊避雷发质', '几乎零避雷(安全性极佳)', '无任何刺激避雷点'] }];
  assert.deepEqual(classifyIngredients(synthetic, { scalp: 'oily', hair: 'fine', states: ['sensitive'] }), { recommended: [], avoid: [] });
});

test('dry hair text is not confused with dry scalp and desired coarseness is not a hair attribute', () => {
  const synthetic = [
    { id: 'dry-hair-only', best: ['极干燥长发'], avoid: [] },
    { id: 'fine-target', best: ['细软发求粗硬感'], avoid: [] },
  ];
  assert.equal(classifyIngredients(synthetic, { scalp: 'dry' }).recommended.length, 0);
  assert.equal(classifyIngredients(synthetic, { hair: 'coarse' }).recommended.length, 0);
  assert.deepEqual(classifyIngredients(synthetic, { hair: 'fine' }).recommended.map(ingredient => ingredient.id), ['fine-target']);
});

test('classification returns source objects, leaves input untouched and never duplicates rows', () => {
  const originalOrder = ingredients.map(ingredient => ingredient.id);
  const result = classifyIngredients(ingredients, { scalp: 'oily', hair: 'fine', states: ['dyed', 'damaged', 'sensitive'] });
  const all = [...result.recommended, ...result.avoid];
  assert.equal(new Set(all.map(ingredient => ingredient.id)).size, all.length);
  assert.ok(all.every(ingredient => ingredients.includes(ingredient)));
  assert.deepEqual(ingredients.map(ingredient => ingredient.id), originalOrder);
  const reversed = classifyIngredients([...ingredients].reverse(), { scalp: 'oily', hair: 'fine', states: ['dyed', 'damaged', 'sensitive'] });
  assert.deepEqual(result, reversed);
});

test('scalp barrier damage does not require the unrelated hair-damage choice', () => {
  const mit = find('methylisothiazolinone');
  assert.deepEqual(classifyIngredients([mit], { states: ['sensitive'] }).avoid, [mit]);
  const ales = find('ammonium-laureth-sulfate');
  assert.deepEqual(classifyIngredients([ales], { states: ['sensitive'] }).avoid, [ales]);
  const glycolic = find('glycolic-acid');
  assert.equal(classifyIngredients([glycolic], { states: ['dandruff'] }).recommended.length, 0);
  assert.deepEqual(classifyIngredients([glycolic], { scalp: 'dry', states: ['dandruff'] }).recommended, [glycolic]);
});

test('possible tangling and single-ingredient use are not treated as existing hair states', () => {
  const onlyFrizzy = { states: ['frizzy'] };
  const cocoGlucoside = find('coco-glucoside');
  const potassiumGlycinate = find('potassium-cocoyl-glycinate');
  assert.equal(classifyIngredients([cocoGlucoside, potassiumGlycinate], onlyFrizzy).avoid.length, 0);

  const decylGlucoside = find('decyl-glucoside');
  const coarse = getIngredientMatches(decylGlucoside, { hair: 'coarse' });
  const coarseAndFrizzy = getIngredientMatches(decylGlucoside, { hair: 'coarse', states: ['frizzy'] });
  assert.ok(coarse.avoidTags.length);
  assert.deepEqual(coarse, coarseAndFrizzy);
});

test('the generic dyed choice does not imply light-colored or bleached hair', () => {
  const dyed = { states: ['dyed'] };
  const selenium = find('selenium-sulfide');
  const glutamate = find('sodium-lauroyl-glutamate');
  const silicone = find('bis-aminopropyl-dimethicone');
  assert.equal(classifyIngredients([selenium], dyed).avoid.length, 0);
  assert.equal(classifyIngredients([glutamate, silicone], dyed).recommended.length, 0);

  // 原文直接适用于染后发的条目仍可匹配，不移除整个染烫选项。
  assert.deepEqual(classifyIngredients([find('sodium-lauryl-sulfate')], dyed).avoid.map(item => item.id), ['sodium-lauryl-sulfate']);
});

test('grouping uses six-module order and can preserve empty sections', () => {
  const list = [find('citric-acid'), find('sodium-laureth-sulfate'), find('panthenol')];
  const groups = groupIngredients(list);
  assert.deepEqual(groups.map(group => group.id), ['primary-surfactants', 'conditioners', 'formula-support']);
  assert.equal(groupIngredients(list, { includeEmpty: true }).length, MODULES.length);
});
