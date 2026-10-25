// Adapts the mall's existing document interface to Supabase tables with RLS.
export function createDatabase(client) {
  const checked = async query => {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };
  const snapshot = row => ({ exists: row != null, data: () => row });
  return {
    doc(path) {
      const [group, id, extra] = path.split('/');
      if (!id || extra || !['config', 'catalog', 'repairStatus', 'stats'].includes(group)) throw new Error('Invalid document');
      return {
        async get() {
          if (group === 'repairStatus') return snapshot(await checked(client.rpc('mall_repair_lookup', { job_id: id })));
          const table = group === 'stats' ? 'mall_visits' : 'mall_documents';
          const row = await checked(client.from(table).select('data').eq('id', group === 'stats' ? id : path).maybeSingle());
          return snapshot(row?.data ?? null);
        },
        async set(data) {
          if (group === 'stats') {
            const { data: session, error } = await client.auth.getSession();
            if (error) throw error;
            if (!session.session) throw new Error('Visitor authentication unavailable');
            await checked(client.from('mall_visits').upsert({ id, owner_id: session.session.user.id, data }));
          } else {
            await checked(client.from('mall_documents').upsert({ id: path, data }));
          }
        },
      };
    },
    collection(name) {
      if (name !== 'stats') throw new Error('Invalid collection');
      return {
        where(field, operator, since) {
          if (field !== 'day' || operator !== '>=') throw new Error('Invalid filter');
          return { limit(count) { return { async get() {
            const rows = await checked(client.from('mall_visits').select('data').gte('day', since).order('id').limit(Math.min(count, 1000)));
            return { docs: rows.map(row => snapshot(row.data)) };
          } }; } };
        },
      };
    },
  };
}
