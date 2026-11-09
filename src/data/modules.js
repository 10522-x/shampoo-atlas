// 展示顺序是本项目的编辑顺序，不是市场使用频率或功效排名。
export const MODULES = Object.freeze([
  { id: 'primary-surfactants', name: '主表面活性剂', title: '主表面活性剂', shortName: '清洁主力', english: 'Primary surfactants', description: '负责带走油脂与污垢，洗感取决于整套清洁体系。' },
  { id: 'co-surfactants', name: '辅助／两性表面活性剂', title: '辅助／两性表面活性剂', shortName: '清洁搭档', english: 'Co-surfactants', description: '与主表活复配，调整泡沫、稠度与洗感。' },
  { id: 'film-formers', name: '硅油与成膜聚合物', title: '硅油与成膜聚合物', shortName: '顺滑成膜', english: 'Silicones & film formers', description: '帮助减少摩擦，改善发丝顺滑与光泽。' },
  { id: 'conditioners', name: '阳离子调理剂、蛋白与保湿成分', title: '阳离子调理剂、蛋白与保湿成分', shortName: '发丝调理', english: 'Conditioners, proteins & humectants', description: '帮助保湿、减少静电，让发丝更容易梳理。' },
  { id: 'scalp-actives', name: '头皮活性物与去屑成分', title: '头皮活性物与去屑成分', shortName: '头皮护理', english: 'Scalp actives', description: '分别用于去屑、角质护理与头皮调理。' },
  { id: 'formula-support', name: '防腐、酸碱调节与配方辅助成分', title: '防腐、酸碱调节与配方辅助成分', shortName: '配方辅助', english: 'Preservation & formula support', description: '帮助维持防腐、酸碱、稳定性与产品质地。' },
]);

const MODULE_BY_ID = new Map(MODULES.map(module => [module.id, module]));
const MODULE_ORDER = new Map(MODULES.map((module, index) => [module.id, index]));

// 分组与组内顺序直接由数据库条目的 module / order 决定。
export function getIngredientModule(ingredient) {
  const module = MODULE_BY_ID.get(ingredient?.module);
  if (!module) throw new Error('Unknown ingredient module: ' + String(ingredient?.id ?? ingredient));
  return module;
}

export function compareIngredients(first, second) {
  getIngredientModule(first);
  getIngredientModule(second);
  return MODULE_ORDER.get(first.module) - MODULE_ORDER.get(second.module)
    || first.order - second.order
    || first.id.localeCompare(second.id);
}
