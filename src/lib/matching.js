import { MODULES, compareIngredients, getIngredientModule } from '../data/modules.js';
import { PROFILE_GROUPS } from '../data/profile-options.js';

const scalpValues = new Set(PROFILE_GROUPS.find(group => group.id === 'scalp').options.map(option => option.value));
const hairValues = new Set(PROFILE_GROUPS.find(group => group.id === 'hair').options.map(option => option.value));
const stateValues = new Set(PROFILE_GROUPS.find(group => group.id === 'states').options.map(option => option.value));

export function normalizeProfile(profile = {}) {
  return {
    scalp: scalpValues.has(profile.scalp) ? profile.scalp : '',
    hair: hairValues.has(profile.hair) ? profile.hair : '',
    states: [...new Set(Array.isArray(profile.states) ? profile.states.filter(state => stateValues.has(state)) : [])],
  };
}

export function hasProfileSelection(profile) {
  const normalized = normalizeProfile(profile);
  return Boolean(normalized.scalp || normalized.hair || normalized.states.length);
}

// 这是对源数据人群标签的保守检索，不是配方推荐算法。
// 未采集浓度、pH、已知过敏史、诊断或孔隙度，故不把这些条件推断为已满足。
// func / synergy 不参与命中；它们只在表中原文展示，以保留复配与使用条件。
const NEGATIVE_OR_UNIVERSAL = /^(?:无(?:特殊|明显|任何|\(|（)|几乎零|极少避雷|纯成分字面)|所有发质|几乎所有发质|绝大多数/;
const UNOBSERVED_CONDITION = /pH|浓度|用量|添加量|过量|未稀释|未经稀释|单独使用|易造成|导致|浅色|浅金|漂浅|漂白|原料杂质|纯度.*杂质|对.{0,24}(?:过敏|致敏|敏感)|明确.{0,16}(?:过敏|致敏)|过敏者|过敏体质|致敏体质|接触性皮炎|特应性|湿疹|脂溢性皮炎|银屑|真菌|极端顽固头屑|顽固剧痒|化疗|雄脱|雄激素|男性|毛囊萎缩|心律|神经衰弱|呼吸道|哮喘|癫痫|孕妇|哺乳|角蛋白矫正|低孔隙|低多孔|未烫染|健康无损伤|低湿度|气候|地区|存放|贮藏|贮存|冬季|雨季|运动|出汗|高频|频繁洗|每日|发蜡|造型残留|深层清洁|素食|纯素|认证|顾虑|崇尚|极简|苛求|抵触|廉价|低平价|纯天然|纯有机|香精|无硅|Sulfate|Clean Beauty|100%|眼部|黏膜/i;

function inspectSegment(sourceText) {
  const source = sourceText.trim();
  if (!source || NEGATIVE_OR_UNIVERSAL.test(source) || UNOBSERVED_CONDITION.test(source)) return null;
  // 先检查括号内的浓度等未知条件，再剥离说明；“易打结”等结果不是用户已有状态。
  const text = source.replace(/\([^)]*\)|（[^）]*）/g, '').trim();

  // 排除仅描述产品工艺或环境的条目，保留明确同时写出用户发质的源标签。
  const hasHumanAttribute = /头皮|发质|发丝|发根|发尾|沙发|细软|粗硬|油头|大油田|干敏|敏感|自然卷|卷发|毛躁|毛糙|炸毛|打结|头屑|皮屑|脱屑|受损|漂损|损伤|分叉|断发|染后|漂染|染发|烫后|漂白|漂发|漂浅/.test(text);
  if (!hasHumanAttribute) return null;

  const scalp = [];
  if (/油性|油头|油田|出油|头油|油腻|油脂亢进|皮脂溢出|油扁塌|分泌旺盛|油塌|发根油|控油型/.test(text)) scalp.push('oily');
  if (/中性|普通发质|正常发质|普通日常健康头皮|普通中性发质|健康中油性/.test(text)) scalp.push('normal');
  // “干燥发丝”不等于“干燥头皮”，干性头皮仅匹配明确部位。
  if (/(?:干性|干燥|极干|干敏).{0,7}头皮|干性(?:头屑|皮屑)|干敏(?:皮|$)/.test(text)) scalp.push('dry');

  const hair = [];
  if (/细软|极细发|细中度发丝|细发/.test(text)) hair.push('fine');
  // “细软发求粗硬感”描述期待的效果，并不代表此人发丝粗硬。
  if (/粗硬|粗发|粗直发|粗沙发|粗干(?:沙)?发/.test(text) && !/求粗硬感/.test(text)) hair.push('coarse');

  const states = [];
  if (/敏感|干敏|屏障受损|屏障薄弱|屏障薄|角质屏障薄弱|发红|泛红|刺痛|红痒|瘙痒|易痒|发痒|紧绷/.test(text)) states.push('sensitive');
  const hairText = text.replace(/屏障受损|屏障破损|皮肤受损|头皮受损/g, '');
  if (/受损|损伤|漂损|烫伤|分叉|开叉|多孔|断发|易折断|易断发/.test(hairText)) states.push('damaged');
  if (/染后|染烫|烫染|漂染|漂发|漂浅|漂白|染色|染发|烫后/.test(text)) states.push('dyed');
  if (/自然卷|卷发|卷曲/.test(text)) states.push('curly');
  if (/头屑|皮屑|脱屑/.test(text)) states.push('dandruff');
  if (/毛躁|毛糙|炸毛|沙发|乱翘|飞翘|静电|打结|缠绕|缠结/.test(text)) states.push('frizzy');

  if (!scalp.length && !hair.length && !states.length) return null;
  return { scalp, hair, states };
}

function segmentMatches(segment, profile) {
  const requirements = inspectSegment(segment);
  if (!requirements) return false;
  return (!requirements.scalp.length || requirements.scalp.includes(profile.scalp))
    && (!requirements.hair.length || requirements.hair.includes(profile.hair))
    && requirements.states.every(state => profile.states.includes(state));
}

function matchingTags(tags, profile) {
  return (Array.isArray(tags) ? tags : []).filter(tag => {
    if (typeof tag !== 'string') return false;
    // 例如“欧盟市场…；敏感头皮”分开判断，只保留确实采集到的人群条件。
    // 婴儿与敏感是原标签中明确用斜线列出的两个人群，不推断用户年龄。
    return tag.replace('婴儿/极敏感皮肤', '极敏感皮肤')
      .split(/[;；]/)
      .some(segment => segmentMatches(segment, profile));
  });
}

export function getIngredientMatches(ingredient, profile) {
  const normalized = normalizeProfile(profile);
  if (!hasProfileSelection(normalized)) return { recommendedTags: [], avoidTags: [] };
  return {
    recommendedTags: matchingTags(ingredient.best, normalized),
    avoidTags: matchingTags(ingredient.avoid, normalized),
  };
}

export function classifyIngredients(ingredients, profile) {
  const recommended = [];
  const avoid = [];
  if (!hasProfileSelection(profile)) return { recommended, avoid };

  for (const ingredient of ingredients) {
    const matches = getIngredientMatches(ingredient, profile);
    if (matches.avoidTags.length) avoid.push(ingredient);
    else if (matches.recommendedTags.length) recommended.push(ingredient);
  }
  recommended.sort(compareIngredients);
  avoid.sort(compareIngredients);
  return { recommended, avoid };
}

export function groupIngredients(ingredients, { includeEmpty = false } = {}) {
  const sorted = [...ingredients].sort(compareIngredients);
  return MODULES.map(module => ({
    ...module,
    ingredients: sorted.filter(ingredient => getIngredientModule(ingredient)?.id === module.id),
  })).filter(section => includeEmpty || section.ingredients.length);
}

export function getDefaultSections(ingredients) {
  return groupIngredients(ingredients, { includeEmpty: true });
}
