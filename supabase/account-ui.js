import { accountName, saveProfile } from './profile.js';

// Native dialog and small DOM updates; no images, UI library or rendering loop.
export function createAccountSettings({ client, getUser, couponStore, onProfileSaved, onSignOut }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'auth-dialog account-dialog';
  dialog.setAttribute('aria-labelledby', 'accountTitle');
  dialog.innerHTML = `<div class="auth-form">
    <div class="auth-header"><span class="auth-mark" aria-hidden="true">L</span><span class="auth-brand">LINN IT MALL</span><button type="button" class="auth-close" data-close aria-label="Close account settings">×</button></div>
    <div class="auth-intro"><h2 id="accountTitle">Account settings</h2><p>Profile နဲ့ စုထားတဲ့ coupon တွေကို စီမံရန်</p></div>
    <div class="account-summary"><span class="account-avatar" aria-hidden="true"></span><div><strong data-name></strong><span data-email></span></div></div>
    <div class="auth-tabs" role="group" aria-label="Account settings sections"><button type="button" data-profile-tab aria-pressed="true">Profile</button><button type="button" data-coupons-tab aria-pressed="false">My coupons</button></div>
    <form data-profile class="account-profile">
      <div class="auth-fields"><label>Display name<input name="displayName" autocomplete="nickname" maxlength="50" required></label><p class="auth-note">Character name မှာ ရှေ့ဆုံး ၁၄ လုံးကို ပြပေးပါမယ်။</p><label>Email address<input name="accountEmail" type="email" readonly></label><p class="auth-note" data-provider></p></div>
      <p class="auth-message" role="status" aria-live="polite" data-profile-status></p>
      <button type="submit" class="auth-primary">Save profile</button>
    </form>
    <section data-coupons hidden aria-label="Collected coupons">
      <div class="account-coupon-heading"><div><h3>Your coupon collection</h3><p class="auth-note">ဆိုင်နဲ့ ရက်စွဲအလိုက် · UTC</p></div><button type="button" class="account-refresh">Refresh</button></div>
      <p class="auth-note">Demo coupon များဖြစ်ပြီး တကယ့် voucher အသုံးပြုခွင့် မပါသေးပါ။</p>
      <p class="auth-message" role="status" aria-live="polite" data-coupon-status></p>
      <ul class="account-coupon-list" tabindex="0" aria-label="Coupon history"></ul><button type="button" class="auth-google" data-more hidden>Load more</button>
    </section>
    <div class="account-footer"><span class="auth-note">ပြီးရင် ဆိုင်ထဲ ဆက်လည်နိုင်ပါတယ်။</span><button type="button" class="account-logout">Logout</button></div>
    <p class="auth-message" role="status" aria-live="polite" data-logout-status></p>
  </div>`;
  document.body.append(dialog);
  const find = selector => dialog.querySelector(selector);
  const profile = find('[data-profile]'), coupons = find('[data-coupons]');
  const profileStatus = find('[data-profile-status]'), couponStatus = find('[data-coupon-status]');
  const profileTab = find('[data-profile-tab]'), couponsTab = find('[data-coupons-tab]');
  const more = find('[data-more]'), refresh = find('.account-refresh'), list = find('.account-coupon-list');
  let offset = 0, loading = false;

  function renderUser() {
    const user = getUser(), name = accountName(user);
    find('[data-name]').textContent = name;
    find('[data-email]').textContent = user.email || '';
    find('.account-avatar').textContent = Array.from(name)[0].toUpperCase();
    profile.elements.displayName.value = name;
    profile.elements.accountEmail.value = user.email || '';
    find('[data-provider]').textContent = user.app_metadata?.providers?.includes('google') ? 'Google account ဖြင့် ဝင်ထားသည်' : 'Email account ဖြင့် ဝင်ထားသည်';
  }
  async function loadCoupons(reset = false) {
    if (loading) return;
    loading = true; more.disabled = refresh.disabled = true;
    couponStatus.textContent = 'Coupon တွေ ဖတ်နေပါသည်…';
    try {
      const pageOffset = reset ? 0 : offset;
      const { rows, hasMore } = await couponStore.history(pageOffset);
      if (reset) list.replaceChildren();
      for (const row of rows) {
        const item = document.createElement('li'), icon = document.createElement('span'), text = document.createElement('div');
        const title = document.createElement('strong'), detail = document.createElement('span');
        const [site, floor] = row.coupon_id.split('-');
        icon.className = 'account-ticket'; icon.textContent = '🎟'; icon.setAttribute('aria-hidden', 'true');
        title.textContent = `Shop ${site} · ${floor === '0' ? 'Ground floor' : `Floor ${floor}`}`;
        detail.textContent = `${row.day} · ${row.coupon_id}`;
        text.append(title, detail); item.append(icon, text); list.append(item);
      }
      offset = pageOffset + rows.length; more.hidden = !hasMore; more.textContent = 'Load more';
      couponStatus.textContent = offset ? `${offset} coupons ပြထားပါသည်${hasMore ? ' · နောက်ထပ် ကြည့်နိုင်ပါသည်' : ''}။` : 'Coupon မစုရသေးပါ။ ဆိုင်ထဲက ရွှေရောင် coupon တွေကို လိုက်ရှာပါ။';
    } catch (error) {
      couponStatus.textContent = 'Coupon တွေ မဖတ်နိုင်ပါ။ Refresh နှိပ်ပြီး ပြန်ကြိုးစားပါ။';
    } finally { loading = false; more.disabled = refresh.disabled = false; }
  }
  function showSection(section) {
    const isCoupons = section === 'coupons';
    profile.hidden = isCoupons; coupons.hidden = !isCoupons;
    profileTab.setAttribute('aria-pressed', String(!isCoupons)); couponsTab.setAttribute('aria-pressed', String(isCoupons));
    if (isCoupons) loadCoupons(true);
  }
  dialog.addEventListener('keydown', event => event.stopPropagation());
  find('[data-close]').onclick = () => {
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  };
  profileTab.onclick = () => showSection('profile'); couponsTab.onclick = () => showSection('coupons');
  more.onclick = () => loadCoupons(); refresh.onclick = () => loadCoupons(true);
  profile.onsubmit = async event => {
    event.preventDefault();
    const save = profile.querySelector('[type="submit"]');
    save.disabled = true; profileStatus.textContent = 'Profile သိမ်းနေပါသည်…';
    try {
      const user = await saveProfile(client, profile.elements.displayName.value);
      onProfileSaved(user); renderUser(); profileStatus.textContent = 'Profile သိမ်းပြီးပါပြီ။';
    } catch (error) { profileStatus.textContent = error.message || 'Profile မသိမ်းနိုင်ပါ။ ပြန်ကြိုးစားပါ။'; }
    finally { save.disabled = false; }
  };
  find('.account-logout').onclick = async () => {
    const logout = find('.account-logout'), status = find('[data-logout-status]');
    logout.disabled = true; status.textContent = 'Logging out…';
    try {
      const { error } = await client.auth.signOut(); if (error) throw error;
      onSignOut();
    } catch (error) { status.textContent = error.message || 'Logout မလုပ်နိုင်ပါ။ ပြန်ကြိုးစားပါ။'; logout.disabled = false; }
  };
  return {
    open(section = 'profile') {
      renderUser(); profileStatus.textContent = ''; find('[data-logout-status]').textContent = '';
      showSection(section);
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else { dialog.classList.add('fallback-dialog'); dialog.setAttribute('open', ''); }
      }
    },
  };
}
