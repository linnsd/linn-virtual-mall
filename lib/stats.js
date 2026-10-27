const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const metric = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1e9 ? value : 0;

// All visitor data is untrusted, including the values of numeric-looking metrics.
export function renderVisitorStats(input) {
  const rows = (Array.isArray(input) ? input : []).filter(r => record(r) && typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day));
  const days = new Map(), corners = new Map(), prizes = new Map(), asks = [];
  const totals = { coupons: 0, draws: 0, drives: 0, flights: 0, sits: 0 };
  let phone = 0;
  function addMetrics(target, data) {
    if (!record(data)) return;
    for (const [key, value] of Object.entries(data)) target.set(key, (target.get(key) || 0) + metric(value));
  }
  for (const r of rows) {
    days.set(r.day, (days.get(r.day) || 0) + 1);
    addMetrics(corners, r.corners); addMetrics(prizes, r.prizes);
    for (const key of Object.keys(totals)) totals[key] += metric(r[key]);
    if (r.device === 'phone') phone++;
    if (Array.isArray(r.asks)) asks.push(...r.asks.filter(record));
  }
  function bars(data, limit = 8) {
    const entries = [...data].sort((a, b) => b[1] - a[1]).slice(0, limit), max = Math.max(1, ...entries.map(x => x[1]));
    return entries.length ? entries.map(([key, value]) => `<div class="bar"><span>${escapeHtml(key)}</span><i style="width:${Math.round(value / max * 100)}%"></i><b>${value}</b></div>`).join('') : '<p class="mm">No data yet</p>';
  }
  asks.sort((a, b) => (typeof b.at === 'number' && Number.isFinite(b.at) ? b.at : 0) - (typeof a.at === 'number' && Number.isFinite(a.at) ? a.at : 0));
  return `<h3>Visits per day (${rows.length} total, ${phone} on phones)</h3>${bars(new Map([...days].sort()), 7)}
    <h3>Most visited corners</h3>${bars(corners)}
    <h3>What customers ask the AI staff</h3>${asks.length ? '<ol class="qs">' + asks.slice(0, 20).map(a => `<li>${escapeHtml(a.q)} <span class="mm">· ${escapeHtml(a.staff)}, ${escapeHtml(a.site)}</span></li>`).join('') + '</ol>' : '<p class="mm">No questions yet</p>'}
    <h3>Engagement</h3><p>Coupons found: <b>${totals.coupons}</b> · Lucky draws: <b>${totals.draws}</b> · Car rides: <b>${totals.drives}</b> · Flights: <b>${totals.flights}</b> · Times seated: <b>${totals.sits}</b></p>
    <h3>Lucky draw results</h3>${bars(prizes)}`;
}
