export const EMPTY_PROFILE = Object.freeze({ scalp: '', hair: '', states: Object.freeze([]) });

export const PROFILE_GROUPS = Object.freeze([
  { id: 'scalp', name: '头皮', label: '头皮', type: 'single', options: [
    { id: 'oily', value: 'oily', label: '偏油' },
    { id: 'normal', value: 'normal', label: '中性' },
    { id: 'dry', value: 'dry', label: '偏干' },
  ] },
  { id: 'hair', name: '发质', label: '发质', type: 'single', options: [
    { id: 'fine', value: 'fine', label: '细软' },
    { id: 'coarse', value: 'coarse', label: '粗硬' },
  ] },
  { id: 'states', name: '当前状态', label: '当前状态', type: 'multiple', options: [
    { id: 'sensitive', value: 'sensitive', label: '容易敏感' },
    { id: 'damaged', value: 'damaged', label: '发丝受损' },
    { id: 'dyed', value: 'dyed', label: '染烫后' },
    { id: 'curly', value: 'curly', label: '自然卷' },
    { id: 'dandruff', value: 'dandruff', label: '有头屑' },
    { id: 'frizzy', value: 'frizzy', label: '毛躁打结' },
  ] },
]);

export function createEmptyProfile() {
  return { scalp: '', hair: '', states: [] };
}
