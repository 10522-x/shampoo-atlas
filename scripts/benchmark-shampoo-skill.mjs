import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analyze } from '../skills/shampoo-advisor/scripts/analyze.mjs';

const input = {
  profile: { scalp: 'oily', hair: 'fine', states: ['sensitive', 'dyed'] },
  label: { complete: true, orderPreserved: true },
  ingredients: ['水', 'SLES', 'CAPB', '氯化钠', '泛醇', '聚季铵盐-10', '甘油', '苯氧乙醇', '柠檬酸', 'EDTA二钠', '香精', '吡罗克酮乙醇胺盐', 'PEG-150 双硬脂酸酯', '乙基己基甘油', '烟酰胺'],
};
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
const measure = (count, operation) => {
  const samples = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    operation();
    samples.push(performance.now() - start);
  }
  return { runs: count, medianMs: +percentile(samples, 0.5).toFixed(3), p95Ms: +percentile(samples, 0.95).toFixed(3) };
};
for (let i = 0; i < 20; i++) analyze(input);
const warm = measure(300, () => analyze(input));
const cli = fileURLToPath(new URL('../skills/shampoo-advisor/scripts/analyze.mjs', import.meta.url));
const freshProcess = measure(20, () => {
  const result = spawnSync(process.execPath, [cli, '--stdin'], { input: JSON.stringify(input), encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
});
console.log(JSON.stringify({
  node: process.version, ingredientCount: input.ingredients.length, warm, freshProcess,
  scope: 'Local lookup and profile matching only; excludes image recognition and AI response generation.',
  outputBytes: Buffer.byteLength(JSON.stringify(analyze(input))),
}, null, 2));
