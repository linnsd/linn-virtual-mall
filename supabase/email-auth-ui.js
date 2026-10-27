import { sendAccountEmail, updateRecoveryPassword } from './auth.js';

export function createEmailAuthDialog({ client, pageUrl, onBack, onComplete }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'auth-dialog'; dialog.setAttribute('aria-labelledby', 'emailAuthTitle');
  dialog.innerHTML = `<form class="auth-form">
    <div class="auth-header"><span class="auth-mark" aria-hidden="true">L</span><span class="auth-brand">LINN IT MALL</span><button type="button" class="auth-close" data-close aria-label="Close email help">×</button></div>
    <div class="auth-intro"><h2 id="emailAuthTitle"></h2><p data-description></p></div>
    <div class="auth-fields">
      <label data-email-field>Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" required></label>
      <label data-password-field>New password<input name="newPassword" type="password" autocomplete="new-password" minlength="6" placeholder="Password အသစ်" required></label>
      <label data-confirm-field>Confirm password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="6" placeholder="Password အသစ် ပြန်ထည့်ပါ" required></label>
      <p class="auth-note" data-password-note>Password အနည်းဆုံး ၆ လုံး သုံးပါ။</p>
    </div>
    <p class="auth-message" role="status" aria-live="polite"></p>
    <button type="submit" class="auth-primary"></button>
    <button type="button" class="auth-google" data-complete hidden>Continue to mall →</button>
    <button type="button" class="auth-guest" data-back>Back to login</button>
  </form>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form'), find = selector => dialog.querySelector(selector);
  const status = find('[role="status"]'), submit = find('[type="submit"]'), complete = find('[data-complete]');
  let mode = 'forgot', busy = false, finished = false, cooldownUntil = 0;
  function close() {
    if (busy) return;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    form.elements.newPassword.value = form.elements.confirmPassword.value = '';
    if (finished) onComplete(); else onBack();
  }
  function render() {
    const reset = mode === 'reset';
    find('#emailAuthTitle').textContent = reset ? 'Set a new password' : mode === 'resend' ? 'Confirm your email' : 'Forgot password?';
    find('[data-description]').textContent = reset ? 'Password အသစ်ထည့်ပြီး account ပြန်ဝင်နိုင်ပါတယ်။' : mode === 'resend' ? 'Register လုပ်ထားတဲ့ email ကို confirmation link ပြန်ပို့ပါမယ်။' : 'သင့် email ကို password reset link ပို့ပေးပါမယ်။';
    for (const selector of ['[data-password-field]', '[data-confirm-field]', '[data-password-note]']) find(selector).hidden = !reset;
    find('[data-email-field]').hidden = reset;
    form.elements.email.disabled = reset;
    form.elements.newPassword.disabled = form.elements.confirmPassword.disabled = !reset;
    submit.textContent = reset ? 'Save new password' : mode === 'resend' ? 'Resend confirmation email' : 'Send reset link';
    submit.hidden = false; complete.hidden = true; find('[data-back]').hidden = false;
  }
  find('[data-close]').onclick = close; find('[data-back]').onclick = close;
  complete.onclick = close;
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  form.onsubmit = async event => {
    event.preventDefault(); if (busy || finished) return;
    if (mode !== 'reset' && Date.now() < cooldownUntil) {
      status.textContent = `Email ထပ်ပို့ရန် ${Math.ceil((cooldownUntil - Date.now()) / 1000)} စက္ကန့် စောင့်ပါ။`; return;
    }
    busy = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    for (const button of dialog.querySelectorAll('[data-close], [data-back]')) button.disabled = true;
    status.textContent = mode === 'reset' ? 'Password ပြောင်းနေပါသည်…' : 'Email ပို့နေပါသည်…';
    try {
      if (mode === 'reset') {
        await updateRecoveryPassword(client, form.elements.newPassword.value, form.elements.confirmPassword.value);
        finished = true; status.textContent = 'Password အသစ် သိမ်းပြီးပါပြီ။';
        form.elements.newPassword.value = form.elements.confirmPassword.value = '';
        form.elements.newPassword.disabled = form.elements.confirmPassword.disabled = true;
        find('[data-password-field]').hidden = find('[data-confirm-field]').hidden = find('[data-password-note]').hidden = true;
        submit.hidden = true; complete.hidden = false; find('[data-back]').hidden = true;
      } else {
        await sendAccountEmail(client, mode, form.elements.email.value, pageUrl);
        cooldownUntil = Date.now() + 60000;
        status.textContent = 'ဒီ email အတွက် ပို့နိုင်တဲ့ link ရှိရင် inbox ထဲ ရောက်လာပါမယ်။ Spam folder ကိုလည်း စစ်ပါ။ Link မရရင် ၁ မိနစ်နောက် ပြန်ပို့နိုင်ပါတယ်။';
      }
    } catch (error) { status.textContent = error.message || 'မအောင်မြင်ပါ။ ပြန်ကြိုးစားပါ။'; }
    finally {
      busy = false; submit.disabled = false; form.setAttribute('aria-busy', 'false');
      for (const button of dialog.querySelectorAll('[data-close], [data-back]')) button.disabled = false;
    }
  };
  return {
    open(action, email = '', verified = false) {
      if (busy) return;
      mode = action === 'reset' && !verified ? 'forgot' : action;
      finished = false; render(); form.elements.email.value = email;
      form.elements.newPassword.value = form.elements.confirmPassword.value = '';
      status.textContent = action === 'reset' && !verified ? 'Reset link သက်တမ်းကုန်သွားနိုင်ပါတယ်။ Email ထည့်ပြီး link အသစ် ပြန်တောင်းပါ။' : '';
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal(); else { dialog.classList.add('fallback-dialog'); dialog.setAttribute('open', ''); }
      }
    },
  };
}
