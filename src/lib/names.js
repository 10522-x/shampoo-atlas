// 名称归一化只处理字形、空格和连接号，保留数字、斜杠及化学结构括号。
export function normalizeName(value) {
  return String(value).normalize('NFKC').toLowerCase().replace(/[\s\u200b\uFEFF\-‐‑‒–—﹣－]/gu, '');
}

export function ingredientNames(record) {
  return [...new Set([record.id, record.cn, record.inci, ...(record.aliases || []), ...(record.abbr || [])].filter(Boolean))];
}

export function ingredientSearchText(record) {
  return normalizeName([
    ...ingredientNames(record), record.func, ...(record.best || []), ...(record.avoid || []),
    ...(record.cautions || []), record.synergy, record.src,
    ...(record.regulatory || []).map(item => `${item.region} ${item.note}`),
  ].join(' '));
}
