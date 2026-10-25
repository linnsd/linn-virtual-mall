export function initialQuality({ touch = false, memory, cores, saveData = false, preference } = {}) {
  if (saveData || (memory > 0 && memory <= 2) || (cores > 0 && cores <= 2) || preference === 'low') return 'low';
  if (preference === 'hd') return 'hd';
  return touch || preference === 'lite' ? 'lite' : 'hd';
}
export function renderBudget(quality, { width = 1, height = 1, dpr = 1 } = {}) {
  const cap = quality === 'low' ? 420000 : quality === 'lite' ? 850000 : 2600000;
  const ratio = Math.min(dpr || 1, quality === 'hd' ? 2 : quality === 'lite' ? 1 : 0.75, Math.sqrt(cap / Math.max(1, width * height)));
  return { ratio: Math.max(0.1, ratio), fps: quality === 'hd' ? 60 : 30 };
}
export function lowerQuality(quality) { return quality === 'hd' ? 'lite' : 'low'; }
