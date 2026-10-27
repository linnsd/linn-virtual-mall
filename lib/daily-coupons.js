export const utcDay = date => date.toISOString().slice(0, 10);

// A generation prevents yesterday's pending loads/claims from changing today's UI.
export function createDailyCoupons({ store, now = () => new Date(), onChange = () => {}, onDayChange = () => {} }) {
  let day = utcDay(now()), ids = new Set(), ready = false, generation = 0, loading = null, retryAfter = 0;
  const pending = new Map();
  const emit = () => onChange({ day, ids: new Set(ids), ready });
  function rollover() {
    const current = utcDay(now());
    if (current === day) return;
    day = current; ids = new Set(); ready = false; generation++; retryAfter = 0;
    pending.clear(); onDayChange(day); emit();
  }
  return {
    get ready() { return ready; },
    isPending(id) { return pending.has(id); },
    async refresh(force = false) {
      rollover();
      if (!force && ready) return;
      if (loading?.generation === generation) return loading.promise;
      if (!force && now().getTime() < retryAfter) return;
      const job = { generation, promise: null }, requestDay = day;
      loading = job;
      job.promise = (async () => {
        try {
          const loaded = await store.list(requestDay);
          rollover();
          if (generation !== job.generation) return;
          ids = new Set(loaded); ready = true; emit();
        } catch (error) {
          rollover();
          if (generation !== job.generation) return;
          retryAfter = now().getTime() + 10000;
          throw error;
        } finally { if (loading === job) loading = null; }
      })();
      return job.promise;
    },
    async collect(id) {
      rollover();
      if (!ready || pending.has(id) || ids.has(id)) return null;
      const token = { generation, day }; pending.set(id, token);
      try {
        const added = await store.collect(id, token.day);
        rollover();
        if (token.generation !== generation) return null;
        ids.add(id); emit();
        return { added, count: ids.size, day };
      } finally { if (pending.get(id) === token) pending.delete(id); }
    },
  };
}
