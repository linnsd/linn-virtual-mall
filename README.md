# Linn IT Mall · Vercel deploy

## ပါဝင်တာများ
- `index.html` – Mall တစ်ခုလုံး (3D, ဆိုင် ၂ ဆိုင်, ကား, မြေပုံ, မြန်မာ/English)
- `assets/` – 3D model (.glb), poster, နံရံပုံ, သီချင်း
- `data/contact.json` – Viber / Messenger / ဖုန်းနံပါတ်
- `data/catalog.json` – တကယ့်ပစ္စည်းစာရင်း (Claude ထဲက Admin ကနေ import လုပ်ထားတာကို ဒီမှာ ထည့်နိုင်)
- `data/repair-status.json` – Job number အလိုက် ပြုပြင်ရေး အခြေအနေ (နာမည်၊ ဖုန်းနံပါတ် မထည့်ပါနဲ့)
- `api/ask.js` – AI ဝန်ထမ်းအတွက် Claude API ကို ခေါ်တဲ့ serverless function

## Deploy လုပ်နည်း (GitHub နဲ့)
1. ဒီ folder ကို GitHub repository အသစ်ထဲ upload/push လုပ်ပါ။
2. vercel.com → Add New → Project → အဲဒီ repo ကို Import လုပ်ပါ။ Framework: **Other**၊ Build command နဲ့ Output directory ကို ဗလာထားပါ။
3. Settings → Environment Variables:
   - `ANTHROPIC_API_KEY` = Anthropic Console (console.anthropic.com) ကရတဲ့ API key
   - `ALLOWED_ORIGIN` = `https://mall.linn.com.mm` (domain ချိတ်ပြီးမှ ထည့်ပါ)
   - (ရွေးချယ်နိုင်) `ANTHROPIC_MODEL`
4. Deploy နှိပ်ပါ။ `https://<project>.vercel.app` ရပါမယ်။

## Deploy လုပ်နည်း (Vercel CLI နဲ့)
```
npm i -g vercel
cd linn-it-mall
vercel            # ပထမဆုံးအကြိမ် project ဆောက်
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## ကိုယ်ပိုင် domain
Vercel → Project → Settings → Domains → `mall.linn.com.mm` ထည့်ပါ။
DNS မှာ `mall` အတွက် CNAME → `cname.vercel-dns.com` ထည့်ပါ။

## Data ပြင်နည်း
`data/*.json` ကို ပြင်ပြီး GitHub ကို push လုပ်ရင် Vercel က အလိုအလျောက် ပြန် deploy လုပ်ပါတယ်။

## Supabase setup (Phase 2 — database / login)

Project: `https://purmadxwvtruxdtrsutg.supabase.co`

Public URL / Publishable key ကို `api/config.js` မှာ ထည့်ထားပြီးပါပြီ။ Secret key မလိုပါ။ Vercel Environment Variables မှာ `SUPABASE_URL` နဲ့ `SUPABASE_PUBLISHABLE_KEY` ထည့်ပြီးလည်း override လုပ်နိုင်ပါတယ်။ ပြောင်းပြီးရင် redeploy လုပ်ပါ။

1. Supabase Dashboard → SQL Editor မှာ [001_initial.sql](supabase/001_initial.sql) ကို run ပါ။ ပထမဆုံး setup အတွက် တစ်ကြိမ်ပဲ run ပါ။
2. [002_seed.sql](supabase/002_seed.sql) ကို run ပါ။ လက်ရှိ JSON data တွေ database ထဲ ထည့်ပေးပြီး ရှိပြီးသား data ကို မပြောင်းပါ။ Customer ကို ပြသနိုင်တဲ့ repair data သာ ထည့်ပါ။
3. Authentication → Sign In / Providers မှာ **Anonymous Sign-Ins** ဖွင့်ပါ။ Guest visitor stats အတွက် လိုပါတယ်။ Production မတင်ခင် Auth rate limits / CAPTCHA နဲ့ anonymous account cleanup ကို စီစဉ်ပါ။ CAPTCHA enforcement ဖွင့်ရင် frontend မှာ CAPTCHA token ပို့တဲ့ UI ထပ်ချိတ်ရပါမယ်။
4. Authentication → Users → Add user မှာ ကိုယ့် Admin email/password နဲ့ confirmed user တစ်ယောက်ဆောက်ပါ။ Public sign-up UI မရှိပါ။ Staff account တွေလည်း ဒီနေရာကပဲ ဆောက်ပါ။
5. အဲဒီ user ရဲ့ UUID ကို အစားထိုးပြီး SQL Editor မှာ run ပါ:

```sql
insert into public.mall_roles (user_id, role)
values ('REPLACE_WITH_AUTH_USER_UUID', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

Staff အတွက် `'admin'` နေရာမှာ `'staff'` သုံးပါ။ Role ပြင်တာကို browser က လုပ်လို့မရပါ။

6. Vercel ကို redeploy လုပ်ပါ။ **Staff login** ကနေ ဝင်ပါ။ Admin ဆိုရင် ⚙ Admin နဲ့ 📊 buttons ပေါ်ပါမယ်။ Role ပြောင်းပြီးရင် page reload လုပ်ပါ။
7. Admin က Contact save / Catalog import / Repair save လုပ်ပြီး browser အသစ်ကနေ ပြန်ဖတ်စမ်းပါ။ Guest အနေနဲ့ ဝင်ပြီး ၁၅ စက္ကန့်လောက် လှုပ်ရှားပါ။ Admin stats မှာ visit session ပေါ်လာသင့်ပါတယ်။

Local မှာ `/api/config` ပါ run ဖို့ `npx vercel dev` သုံးပါ။ Static-only server မှာ Supabase ချိတ်ဆက်မှု မရပါ။ ချိတ်မရရင် mall က JSON data နဲ့ ဆက်ဖွင့်နိုင်ပါတယ်။

### လက်ရှိပါဝင်မှုနဲ့ ကန့်သတ်ချက်

- Admin: contact, catalog, repair status ပြင်နိုင်၊ visitor stats ကြည့်နိုင်။ Staff: login ဝင်ပြီး Live staff duty ဖွင့်နိုင်ပေမယ့် Admin data ပြင်မရပါ။
- Stats က visit sessions ဖြစ်ပြီး unique လူဦးရေ မဟုတ်ပါ။ Last 7 days မှာ အများဆုံး 1,000 sessions ကို ပြထားပါတယ်။ Guest data ဖြစ်လို့ analytics က ခန့်မှန်းစာရင်းပါ။
- Guest က ကိုယ့် visit session ကိုပဲ ရေး/ဖတ်နိုင်ပါတယ်။ Admin က stats အားလုံးဖတ်နိုင်ပါတယ်။ AI မေးခွန်းစာသားတွေလည်း stats ထဲ ပါတာကြောင့် access နဲ့ retention ကို စီမံပါ။
- Repair status ကို job number အတိအကျနဲ့ lookup လုပ်နိုင်ပါတယ်။ Job number က password မဟုတ်လို့ နာမည်၊ ဖုန်း၊ ကိုယ်ရေးအချက်အလက် မသိမ်းပါနဲ့။ Public repair list ကို database က တိုက်ရိုက်ဖတ်မရပါ။
- 3D asset ဖိုင်တွေကို `assets/` ကနေ ဆက်စီမံပါ။ Browser upload မချိတ်ထားသေးပါ။
- Multiplayer၊ public chat နဲ့ Live staff duty အတွက် အောက်က Realtime setup ကို ဆက်လုပ်ပါ။
- Automated checks: `node --test tests/*.test.js`။ Live RLS / login စမ်းသပ်မှုကို SQL setup ပြီးမှ လုပ်နိုင်ပါမယ်။

## Supabase Realtime setup (multiplayer / chat / Live staff)

Database setup `001_initial.sql` ပြီးသားဆိုရင် အဲဒီဖိုင်ကို ထပ် run ဖို့ မလိုပါ။

1. Supabase → SQL Editor မှာ [003_realtime.sql](supabase/003_realtime.sql) ကို run ပါ။ ဒီ migration ကို ပြန် run နိုင်ပါတယ်။
2. Supabase → Realtime Settings မှာ **Allow public access** ကို **OFF** လုပ်ပါ။ Private channels နဲ့ RLS permissions ကို သုံးထားပါတယ်။ ဒီ project မှာ public realtime channel သုံးတဲ့ တခြား app ရှိရင် setting က အဲဒီ app ကိုပါ သက်ရောက်ပါတယ်။
3. **Anonymous Sign-Ins** ဖွင့်ထားပါ။ Guest တွေလည်း authenticated anonymous session နဲ့ ဝင်ရပါတယ်။ Database tables မှာ Realtime replication ဖွင့်ဖို့ မလိုပါ — Broadcast / Presence ကို သုံးပါတယ်။
4. Local မှာ `npx vercel dev` ပြန် run ပါ။ Vercel ပေါ်အတွက် code ကို deploy လုပ်ပါ။

### စမ်းသပ်နည်း

- Normal browser နဲ့ Incognito window ကို ဖွင့်ပြီး နာမည်မတူတဲ့ guest နှစ်ယောက်နဲ့ mall ထဲဝင်ပါ။ Online count ၂ ဖြစ်ပြီး တစ်ယောက်ကိုတစ်ယောက် မြင်ရပါမယ်။ Browser နှစ်မျိုး သို့မဟုတ် device နှစ်ခုလည်း သုံးနိုင်ပါတယ်။
- လမ်းလျှောက်၊ ကားစီး၊ ထိုင်၊ emoji နဲ့ chat ပို့ကြည့်ပါ။ Enter နှိပ်ပြီး စာရေး၊ Enter နဲ့ပို့ပါ။ **Chat က public ဖြစ်ပြီး mall ထဲရှိသူအားလုံး မြင်ရပါတယ်။** Private staff conversation မပါသေးပါ။ Chat history ကို database မှာ မသိမ်းပါ။
- Normal browser မှာ Staff login ဝင်ပါ။ `mall_roles` မှာ `staff` သို့မဟုတ် `admin` role ရှိရပါမယ်။ Staff / ⚙ Admin ဖွင့်ပြီး name ထည့်၊ **I'm on duty as Linn staff** ကို ဖွင့်ပါ။ Mall ထဲဝင်ပြီးရင် တခြား guest က Linn Staff badge နဲ့ online staff button ကို မြင်ရပါမယ်။
- Guest က `@staff မေးချင်ပါတယ်` ပို့ပါ။ Staff tab မှာ toast နဲ့ အသံ alert ရပါမယ်။ Browser background/closed ဖြစ်နေရင် notification သို့မဟုတ် push notification မပို့ပါ။
- Duty ပိတ်ရင် badge ပြုတ်ရပါမယ်။ Staff tab ပိတ်ရင် offline ဖြစ်ရပါမယ်။ Refresh ပြန်လုပ်ရင် duty ကို ပြန်ဖွင့်ရပါမယ်။
- Network ကို ခဏပိတ်ပြီး ပြန်ဖွင့်ပါ။ Online status က reconnect ပြပြီး connection ရတဲ့အခါ idle avatar ပါ ပြန်ပေါ်ရပါမယ်။ မချိတ်ဆက်သေးခင် chat ပို့မရပါ။

### Online count ၁ ပဲဖြစ်နေရင်

ဒီ code မှာ private channel join မလုပ်ခင် `realtime.setAuth(session.access_token)` ကို await လုပ်ထားပါတယ်။ Local server ကို restart လုပ်ပြီး browser နှစ်ခုလုံး hard refresh လုပ်ပါ။ Guest နှစ်ယောက်လုံး **Enter Shop 1** နှိပ်ပြီး ဝင်ထားရပါမယ်။ SQL `003_realtime.sql` run ပြီးသားဆိုရင် ဒီ authentication fix အတွက် SQL ထပ် run ဖို့ မလိုပါ။

### Implementation / limits

- Presence က online discovery နဲ့ ၅ စက္ကန့်ခြား avatar snapshot အတွက်ပါ။ လှုပ်ရှားမှုတွေကို အများဆုံး တစ်စက္ကန့် ၅ ကြိမ် Broadcast လုပ်ပြီး browser မှာ လှုပ်ရှားမှု ချောမွေ့အောင် ဖြည့်ပြပါတယ်။
- Tab တစ်ခုချင်းစီအတွက် account ပိုင် private peer channel သုံးပါတယ်။ Lobby ထဲက နာမည်/Staff flag ကို မယုံဘဲ peer channel မှာ publish လုပ်ခွင့်ရှိသူကိုသာ render လုပ်ပါတယ်။ Staff channel မှာ စာပို့ခွင့်ကို SQL က role နဲ့စစ်ပါတယ်။
- Permissions က channel join / token refresh မှာ စစ်တာပါ။ Role ပြောင်းပြီးရင် affected browser တွေကို sign out / sign in လုပ်ပါ။ Role revoke လုပ်တာက ရှိပြီးသား channel permissions ကို ချက်ချင်း မပိတ်နိုင်ပါ။
- Shared lobby ဖြစ်လို့ local နဲ့ deployed site က project တူရင် တစ်ခန်းတည်းကို ဝင်ပါတယ်။ Online count က tab sessions အရေအတွက် ဖြစ်ပါတယ်။
- Peer တစ်ယောက်အတွက် channel တစ်ခုစီ subscribe လုပ်တာကြောင့် လူနည်းတဲ့ mall အတွက် အခြေခံ implementation ပါ။ လူအများကြီး တစ်ပြိုင်နက်သုံးမယ့်အခါ room ခွဲခြင်း၊ Supabase channel/message quotas နဲ့ load testing လိုပါတယ်။ Chat throttle က client ဘက်မှာသာ ဖြစ်ပြီး server-side anti-spam မပါသေးပါ။
- တခြား `realtime.messages` policies ရှိရင် mall topics မှာ ကျယ်ပြန့်တဲ့ write access ပေးမထားကြောင်း စစ်ပါ။ Permissive RLS policies တွေက OR နဲ့ ပေါင်းအလုပ်လုပ်ပါတယ်။

Checks: `node --test tests/*.test.js`။ [realtime-rls.sql](tests/realtime-rls.sql) က empty disposable local PostgreSQL အတွက်ပဲ ဖြစ်ပြီး **Supabase project ထဲ မ run ပါနဲ့**။ Local fixture က Supabase auth/topic helper တွေကို အစားထိုးထားလို့ hosted Realtime service နဲ့ browser စမ်းသပ်မှုကို setup ပြီးမှ ဆက်လုပ်ရပါမယ်။

## သတိပြုရန်
- `api/ask.js` က ကိုယ့် API key ကို သုံးလို့ Anthropic Console မှာ လစဉ် အသုံးစရိတ် ကန့်သတ်ချက် (spend limit) သတ်မှတ်ထားပါ။
- နောက်ခံသီချင်းကို public website မှာ သုံးဖို့ မူပိုင်ခွင့် ရှိမရှိ စစ်ပါ။
