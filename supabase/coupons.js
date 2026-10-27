export function isRegisteredUser(user) {
  return !!user?.id && user.is_anonymous === false;
}

export function createCouponStore(client) {
  async function requireMember() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!isRegisteredUser(data.session?.user)) throw new Error('Sign in or register to collect coupons.');
    return data.session.user;
  }
  return {
    async list(day) {
      const user = await requireMember();
      const { data, error } = await client.from('mall_coupon_collections').select('coupon_id').eq('user_id', user.id).eq('day', day);
      if (error) throw error;
      return new Set(data.map(row => row.coupon_id));
    },
    async history(offset = 0) {
      if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid coupon page');
      const user = await requireMember();
      const { data, error } = await client.from('mall_coupon_collections')
        .select('coupon_id,day,collected_at').eq('user_id', user.id)
        .order('day', { ascending: false }).order('coupon_id', { ascending: true })
        .range(offset, offset + 30);
      if (error) throw error;
      return { rows: data.slice(0, 30), hasMore: data.length > 30 };
    },
    async collect(id, day) {
      await requireMember();
      const { data, error } = await client.rpc(day ? 'mall_collect_coupon_for_day' : 'mall_collect_coupon', day ? { coupon: id, collection_day: day } : { coupon: id });
      if (error) throw error;
      return data;
    },
  };
}
