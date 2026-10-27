import { isRegisteredUser } from './coupons.js';

export function accountName(user) {
  const metadata = user?.user_metadata || {};
  for (const value of [metadata.display_name, metadata.full_name, metadata.name, user?.email?.split('@')[0]]) {
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 50);
  }
  return 'Member';
}

export async function saveProfile(client, name) {
  const displayName = typeof name === 'string' ? name.trim() : '';
  if (!displayName || displayName.length > 50) throw new Error('Name ကို ၁ မှ ၅၀ လုံးအတွင်း ထည့်ပါ။');
  const { data: session, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (!isRegisteredUser(session.session?.user)) throw new Error('Please sign in to edit your profile.');
  const { data, error } = await client.auth.updateUser({ data: { display_name: displayName } });
  if (error) throw error;
  if (!data?.user) throw new Error('Profile မသိမ်းနိုင်ပါ။ ပြန်ကြိုးစားပါ။');
  return data.user;
}
