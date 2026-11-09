import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MODULES, getIngredientModule } from '../src/data/modules.js';
import { classifyIngredients, getDefaultSections, getIngredientMatches, groupIngredients, hasProfileSelection } from '../src/lib/matching.js';
import { validateIngredients } from '../src/lib/validation.js';
import { ingredientSearchText, normalizeName } from '../src/lib/names.js';
const load = name => JSON.parse(readFileSync(new URL(`../${name}`, import.meta.url),'utf8'));
const ingredients = load('src/data/ingredients.json');
const raw = load('ai_studio_code.txt');
const find = id => ingredients.find(record => record.id === id);

test('reviewed database preserves all imported identities and raw provenance', () => {
  assert.equal(ingredients.length,152);
  assert.deepEqual(ingredients.map(r=>r.id).sort(),raw.map(r=>r.id).sort());
  const revision=load('data-review/revision.json');
  assert.equal(createHash('sha256').update(readFileSync(new URL('../ai_studio_code.txt',import.meta.url))).digest('hex'),revision.rawSourceSha256);
  assert.deepEqual(validateIngredients(ingredients),{recordCount:152,moduleCount:6});
  assert.ok(ingredients.every(r=>!Object.hasOwn(r,'block')&&!Object.hasOwn(r,'rank')&&!Object.hasOwn(r,'grade')));
  const all=getDefaultSections(ingredients);
  assert.equal(all.length,6);
  assert.equal(all.flatMap(group=>group.ingredients).length,152);
});

test('formula roles are assigned explicitly and unknown modules cannot disappear silently', () => {
  assert.equal(getIngredientModule(find('cocamide-mipa')).id,'co-surfactants');
  assert.equal(getIngredientModule(find('trideceth-12')).id,'formula-support');
  assert.equal(getIngredientModule(find('polysorbate-20')).id,'formula-support');
  assert.equal(getIngredientModule(find('glycerin')).id,'conditioners');
  assert.throws(()=>groupIngredients([{...find('citric-acid'),module:'unknown'}]),/Unknown/);
  const invalid=structuredClone(ingredients);invalid[0].module='unknown';
  assert.throws(()=>validateIngredients(invalid),/Unknown module/);
  invalid[0]={...ingredients[0],id:ingredients[1].id};
  assert.throws(()=>validateIngredients(invalid),/Duplicate/);
});

test('empty or unsupported choices restore the complete default state', () => {
  for(const profile of [{},{scalp:'',hair:'',states:[]},{scalp:'unknown',states:['unknown']}]) {
    assert.equal(hasProfileSelection(profile),false);
    assert.deepEqual(classifyIngredients(ingredients,profile),{recommended:[],avoid:[]});
  }
});

test('data validation blocks display drift, unsupported evidence and ineligible recommendations', () => {
  for (const mutate of [
    record => { record.best = ['任意发质']; },
    record => { record.evidence.status = 'fully-verified'; },
    record => { record.evidence.status = record.refs.some(ref => ref.verified) ? 'unverified' : 'partially-verified'; },
    record => { record.module = 'formula-support'; record.consumerMatch = true; },
    record => { record.isDrug = true; record.consumerMatch = true; },
    record => { record.grade = 'A'; },
  ]) {
    const invalid = structuredClone(ingredients);
    mutate(invalid[0]);
    assert.throws(() => validateIngredients(invalid));
  }
});

test('multiple conditions in one reviewed rule must all be selected', () => {
  const capb=find('cocamidopropyl-betaine');
  assert.equal(getIngredientMatches(capb,{hair:'fine'}).recommendedTags.length,0);
  assert.equal(getIngredientMatches(capb,{scalp:'oily'}).recommendedTags.length,0);
  assert.equal(getIngredientMatches(capb,{scalp:'oily',hair:'fine'}).recommendedTags.length,1);
  const pq10=find('polyquaternium-10');
  assert.equal(getIngredientMatches(pq10,{states:['frizzy']}).recommendedTags.length,0);
  assert.equal(getIngredientMatches(pq10,{hair:'fine',states:['frizzy']}).recommendedTags.length,0);
  assert.ok(getIngredientMatches(pq10,{hair:'coarse',states:['frizzy']}).recommendedTags.length);
});

test('caution wins when cleaning and hair conditions conflict', () => {
  const sls=find('sodium-lauryl-sulfate');
  const profile={scalp:'oily',states:['dyed']};
  const signals=getIngredientMatches(sls,profile);
  assert.ok(signals.recommendedTags.length&&signals.avoidTags.length);
  assert.deepEqual(classifyIngredients([sls],profile),{recommended:[],avoid:[sls]});
});

test('preservatives, chelators and thickeners are not recommended for a hair type', () => {
  for(const id of ['benzyl-alcohol','tetrasodium-edta','disodium-edta','carbomer','sodium-chloride','benzoic-acid','tocopherol','trideceth-12','polysorbate-20']) {
    for(const profile of [{hair:'coarse'},{scalp:'oily'},{scalp:'normal'},{states:['damaged','dyed']}]) {
      assert.deepEqual(getIngredientMatches(find(id),profile).recommendedTags,[],id);
    }
  }
  for(const record of ingredients.filter(r=>r.module==='formula-support')) assert.equal(record.consumerMatch,false);
  assert.deepEqual(classifyIngredients([find('methylisothiazolinone')],{states:['sensitive']}).avoid.map(r=>r.id),['methylisothiazolinone']);
});

test('APG allergy is neither recommended for dermatitis nor inferred from sensitivity', () => {
  for(const id of ['decyl-glucoside','coco-glucoside','lauryl-glucoside','caprylyl-capryl-glucoside']) {
    const record=find(id);
    assert.deepEqual(getIngredientMatches(record,{scalp:'dry',states:['sensitive']}),{recommendedTags:[],avoidTags:[]});
    assert.ok(record.cautions.some(text=>/过敏/.test(text)),id);
  }
});

test('medicine and regional restrictions do not become generic scalp recommendations', () => {
  for(const id of ['ketoconazole','selenium-sulfide','zinc-pyrithione','cyclopentasiloxane','cyclohexasiloxane']) {
    const record=find(id);
    assert.deepEqual(getIngredientMatches(record,{scalp:'oily',hair:'fine',states:['dandruff']}),{recommendedTags:[],avoidTags:[]});
    assert.ok(record.regulatory.length||record.isDrug,id);
  }
  assert.ok(find('ketoconazole').isDrug);
  assert.ok(find('climbazole').regulatory.some(r=>r.region==='EU'&&r.verified));
});

test('prose, unknown dosage, allergies and universal phrases cannot create a match', () => {
  const record={...find('citric-acid'),consumerMatch:true,suitableFor:[],avoidFor:[],best:['粗硬发质','所有发质'],avoid:['敏感头皮','pH > 5.5'],cautions:['对成分过敏者'],regulatory:[{region:'EU',note:'敏感油头'}]};
  assert.deepEqual(getIngredientMatches(record,{scalp:'oily',hair:'coarse',states:['sensitive']}),{recommendedTags:[],avoidTags:[]});
  assert.throws(()=>getIngredientMatches({...record,suitableFor:[{label:'所有发质'}]},{hair:'fine'}),/Empty condition/);
  assert.throws(()=>getIngredientMatches({...record,suitableFor:[{label:'过敏',allergy:['yes']}]},{hair:'fine'}),/Unknown condition/);
});

test('hair damage and sensitivity remain distinct; dandruff never implies a diagnosis', () => {
  const original=find('cocamidopropyl-hydroxysultaine');
  assert.equal(getIngredientMatches(original,{states:['sensitive']}).recommendedTags.length,0);
  assert.ok(getIngredientMatches(original,{states:['damaged']}).recommendedTags.length);
  assert.equal(getIngredientMatches(find('salicylic-acid'),{states:['dandruff']}).recommendedTags.length,0);
  assert.ok(getIngredientMatches(find('salicylic-acid'),{scalp:'oily',states:['dandruff']}).recommendedTags.length);
});

test('shared search includes exact aliases without collapsing chemical structures', () => {
  for(const [id,name] of [['guar-hydroxypropyltrimonium-chloride','瓜儿胶羟丙基三甲基氯化铵'],['jojoba-oil','Simmondsia Chinensis (Jojoba) Seed Oil'],['climbazole','甘宝素']]) {
    assert.ok(ingredientSearchText(find(id)).includes(normalizeName(name)),name);
  }
  assert.notEqual(normalizeName('双(羟甲基)咪唑烷基脲'),normalizeName('双咪唑烷基脲'));
  assert.notEqual(normalizeName('PEG-12 Dimethicone'),normalizeName('PEG-120 Dimethicone'));
});

test('results are stable, disjoint and keep source objects without modifying input', () => {
  const order=ingredients.map(r=>r.id);
  const profile={scalp:'oily',hair:'fine',states:['dyed','damaged','sensitive']};
  const result=classifyIngredients(ingredients,profile);
  const all=[...result.recommended,...result.avoid];
  assert.equal(new Set(all.map(r=>r.id)).size,all.length);
  assert.ok(all.every(r=>ingredients.includes(r)));
  assert.deepEqual(ingredients.map(r=>r.id),order);
  assert.deepEqual(result,classifyIngredients([...ingredients].reverse(),profile));
  assert.deepEqual(groupIngredients([find('citric-acid'),find('sodium-laureth-sulfate'),find('panthenol')]).map(r=>r.id),['primary-surfactants','conditioners','formula-support']);
  assert.equal(groupIngredients([],{includeEmpty:true}).length,MODULES.length);
});
