# Linn IT Mall · Vercel deploy

## ပါဝင်တာများ
- `index.html` – Mall တစ်ခုလုံး (3D, Shop 1 / Shop 3 / Shop 2 / Shop 4 / Shop 5 ဆိုင် ၅ ဆိုင်, ကား, မြေပုံ, မြန်မာ/English)
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

### Online ပြုတ်ပြုတ်သွားရင်

- ယခင် ၅ စက္ကန့်ခြား `track()` snapshot က live test မှာ စက္ကန့် ၃၀ ခန့်အကြာ `Client presence rate limit exceeded` ဖြစ်ပြီး peer channel ပိတ်သွားတာကို တွေ့ထားပါတယ်။ ယခု Presence ကို join/rejoin အတွက်သာသုံးပြီး moving / idle state ကို Broadcast နဲ့ ပို့ပါတယ်။
- Unexpected `CLOSED` / `CHANNEL_ERROR` / `TIMED_OUT` မှာ ပိတ်သွားတဲ့ SDK channel ကို ဖယ်ရှားပြီး bounded backoff နဲ့ အသစ်ပြန်ဖွင့်ပါတယ်။ Retry Presence calls တွေကိုလည်း socket တစ်ခုလုံးအတွက် ၃၁ စက္ကန့်အတွင်း အများဆုံး ၄ ကြိမ်နဲ့ ကန့်ထားပါတယ်။
- Token refresh ကို private channels ဆီ ပို့ပြီး worker ရနိုင်တဲ့ browser မှာ heartbeat ကို worker ကနေ ပို့ပါတယ်။ Mobile OS က tab/browser ကို suspend လုပ်ထားချိန် အမြဲ online ဖြစ်နေမယ်လို့တော့ အာမခံလို့ မရပါ။
- Live validation မှာ guest နှစ်ယောက်ကို ၉၅ စက္ကန့်ကျော် movement/idle စမ်းပြီး online ဆက်ရှိနေပါတယ်။ Test channel ကို တမင်ပိတ်ပြီး ~၂ စက္ကန့်အတွင်း ပြန်ချိတ်နိုင်တာလည်း စမ်းထားပါတယ်။
- Code update ပြီး browser tab အဟောင်းတွေကို ပိတ်ကာ ပြန်ဖွင့်ပါ။ SQL / Supabase rate-limit settings ပြောင်းစရာမလိုပါ။ Console မှာ `Mall realtime` diagnostics တွေက server error message ကို ပြပေးပြီး token / chat text မထည့်ပါ။

### Online count ၁ ပဲဖြစ်နေရင်

ဒီ code မှာ private channel join မလုပ်ခင် `realtime.setAuth(session.access_token)` ကို await လုပ်ထားပါတယ်။ Local server ကို restart လုပ်ပြီး browser နှစ်ခုလုံး hard refresh လုပ်ပါ။ Guest နှစ်ယောက်လုံး **Enter Shop 1** နှိပ်ပြီး ဝင်ထားရပါမယ်။ SQL `003_realtime.sql` run ပြီးသားဆိုရင် ဒီ authentication fix အတွက် SQL ထပ် run ဖို့ မလိုပါ။

### Implementation / limits

- Presence က online discovery / join အတွက်ပဲဖြစ်ပြီး timer နဲ့ ထပ်မပို့ပါ။ Idle avatar အတွက် ၂ စက္ကန့်ခြား Broadcast heartbeat သုံးပါတယ်။ လှုပ်ရှားမှုတွေကို အများဆုံး တစ်စက္ကန့် ၅ ကြိမ် Broadcast လုပ်ပြီး browser မှာ လှုပ်ရှားမှု ချောမွေ့အောင် ဖြည့်ပြပါတယ်။
- Tab တစ်ခုချင်းစီအတွက် account ပိုင် private peer channel သုံးပါတယ်။ Lobby ထဲက နာမည်/Staff flag ကို မယုံဘဲ peer channel မှာ publish လုပ်ခွင့်ရှိသူကိုသာ render လုပ်ပါတယ်။ Staff channel မှာ စာပို့ခွင့်ကို SQL က role နဲ့စစ်ပါတယ်။
- Permissions က channel join / token refresh မှာ စစ်တာပါ။ Role ပြောင်းပြီးရင် affected browser တွေကို sign out / sign in လုပ်ပါ။ Role revoke လုပ်တာက ရှိပြီးသား channel permissions ကို ချက်ချင်း မပိတ်နိုင်ပါ။
- Shared lobby ဖြစ်လို့ local နဲ့ deployed site က project တူရင် တစ်ခန်းတည်းကို ဝင်ပါတယ်။ Online count က tab sessions အရေအတွက် ဖြစ်ပါတယ်။
- Peer တစ်ယောက်အတွက် channel တစ်ခုစီ subscribe လုပ်တာကြောင့် လူနည်းတဲ့ mall အတွက် အခြေခံ implementation ပါ။ လူအများကြီး တစ်ပြိုင်နက်သုံးမယ့်အခါ room ခွဲခြင်း၊ Supabase channel/message quotas နဲ့ load testing လိုပါတယ်။ Chat throttle က client ဘက်မှာသာ ဖြစ်ပြီး server-side anti-spam မပါသေးပါ။
- တခြား `realtime.messages` policies ရှိရင် mall topics မှာ ကျယ်ပြန့်တဲ့ write access ပေးမထားကြောင်း စစ်ပါ။ Permissive RLS policies တွေက OR နဲ့ ပေါင်းအလုပ်လုပ်ပါတယ်။

Checks: `node --test tests/*.test.js`။ [realtime-rls.sql](tests/realtime-rls.sql) က empty disposable local PostgreSQL အတွက်ပဲ ဖြစ်ပြီး **Supabase project ထဲ မ run ပါနဲ့**။ Local fixture က Supabase auth/topic helper တွေကို အစားထိုးထားလို့ hosted Realtime service နဲ့ browser စမ်းသပ်မှုကို setup ပြီးမှ ဆက်လုပ်ရပါမယ်။

## Parking

ဆိုင်တစ်ဆိုင်စီရဲ့ ရှေ့ညာဘက်မှာ numbered parking bays ၃ ခုနဲ့ **P PARKING** ဆိုင်းဘုတ် ပါပါတယ်။ Linn ကားက ပထမ bay မှာ ရပ်ပြီး ကျန် bay နှစ်ခုမှာ parked cars ပါပါတယ်။ **Shops → Customer parking / Linn car** ကနေ directions ရှာနိုင်ပါတယ်။ Manual driving မှာ bay အနီး 3.2m အတွင်း၊ အမြင့် 0.2m အောက်၊ အရှိန် 1.5m/s အောက် ရောက်မှ **Park here** ပေါ်ပါတယ်။ မူလဆိုင်မှာလည်း ပြန်ရပ်ပြီး ဆင်းနိုင်ပါတယ်။

Auto-drive route endpoints ကို parking bays နဲ့ ချိတ်ထားပြီး ကားမှဆင်းတဲ့ player position ကို hull အပြင်မှာ ထားပါတယ်။ ပုံမှန် traffic က parking endpoints ထဲ မဝင်ဘဲ main road ပေါ်မှာပဲ လှည့်ပတ်ပါတယ်။ Parking က local scene ပဲဖြစ်ပြီး reservation / တကယ့်ကားနေရာလွတ် စာရင်း မပါပါ။

## Driving collisions / mobile graphics

- Manual driving မှာ ကား body အပြည့်ရဲ့ rotated hull နဲ့ နံရံ၊ သစ်ပင်၊ parked cars၊ traffic cars နဲ့ တခြား guest ကားတွေကို စစ်ပါတယ်။ Frame rate ကျတဲ့အခါ collision ကျော်မသွားဖို့ လှုပ်ရှားမှုကို အဆင့်ငယ်တွေနဲ့ တွက်ပါတယ်။ တိုက်မိရင် အရှိန်လျော့၊ အနည်းငယ် ပြန်ကန်/ဘေးတိုက်လျှောပြီး reverse နဲ့ ပြန်ထွက်နိုင်ပါတယ်။ Steering က အရှိန်မြင့်ရင် လျော့ပြီး braking / body lean / camera impact feedback ပါပါတယ်။
- Traffic က ရှေ့ကားကို ရှောင်ရပ်ပြီး လမ်းကြောင်းသွား/ပြန် lane offsets ကို ပြင်ထားပါတယ်။ Auto drive ကလည်း ယာဉ်ရှေ့ပိတ်နေရင် စောင့်ပါတယ်။ Fly mode ကို ဆက်ထားပြီး အမြင့်ကွာရင် ground cars နဲ့ မတိုက်ပါ။
- Physics က lightweight browser simulation ပါ။ Shared authoritative physics server မရှိလို့ multiplayer ကားတစ်စီးကို တခြားသူက တိုက်တွန်းရွှေ့တာ၊ vehicle damage / deformation တို့ မပါပါ။ Traffic simulation က client တစ်ခုချင်းစီမှာ သီးခြားပါ။

Graphics button ကို နှိပ်ပြီး **HD → Lite → Low** ပြောင်းနိုင်ပါတယ်။ Touch device / ဖုန်း screen သေးရင် Lite နဲ့ စပြီး memory/core နည်းတဲ့ device သို့မဟုတ် Save Data ဖွင့်ထားရင် Low နဲ့ စပါတယ်။ FPS ကျနေရင် အလိုအလျောက် တစ်ဆင့် လျှော့ပါတယ်။

| Mode | Drawing buffer budget | Target FPS |
|---|---|---|
| HD | အများဆုံး 2.6 million pixels | 60 |
| Lite | အများဆုံး 0.85 million pixels | 30 |
| Low | အများဆုံး 0.42 million pixels | 30 |

ဒီကိန်းတွေက render cap / target ပဲဖြစ်ပြီး ဖုန်းအားလုံးမှာ အဲဒီ FPS ရမယ်လို့ အာမခံတာ မဟုတ်ပါ။ Phone startup မှာ anti-aliasing ပိတ်၊ အဝေးက Staff တွေကို hide လုပ်၊ background model parsing ကို sequential လုပ်ထားပါတယ်။ Low startup မှာ NPC/Staff GLB တွေ မတင်ပါ။ UI blur လျှော့ပြီး tab background ရောက်ရင် render/update နားပါတယ်။ WebGL မရရင် online shop link ပြပြီး context ပျောက်ရင် Low graphics နဲ့ reload လုပ်နိုင်ပါတယ်။

Logo / standee ပုံတွေကို HTML ထဲက base64 အစား content-hashed asset files အဖြစ် ခွဲထားလို့ browser က သီးခြား cache လုပ်နိုင်ပါတယ်။ Catalog / Admin setup ကလည်း 3D model အားလုံး loading ပြီးတဲ့အထိ မစောင့်တော့ပါ။

Mobile toolbar က **⋯** ထဲမှာ extra controls ထည့်ထားပြီး chat / reactions ကို လိုမှ ဖွင့်ပါတယ်။ Minimap အစား Map button သုံးပါ။ Joystick နဲ့ မောင်းပြီး **Brake** ကို ဖိထားရင် ရပ်နိုင်ပါတယ်။ Fly mode မှာ **↑ / ↓** နဲ့ အမြင့်ပြောင်းပါ။ LAN HTTP / browser အဟောင်းတွေမှာ `randomUUID` မရှိလည်း guest IDs ဆောက်နိုင်တဲ့ fallback ပါပါတယ်။ Safe areas၊ portrait/landscape နဲ့ keyboard ဖွင့်ချိန် layout ကို ထည့်ထားပါတယ်။

Validation: `node --test tests/*.test.js`။ Collision / reverse recovery / thin-wall sweep / altitude / brake / render-budget regression tests ပါပါတယ်။ Browser resize simulation နဲ့ တကယ့် Android/iOS GPU performance စမ်းတာကို ခွဲသတ်မှတ်ပါ။ Device အဟောင်း၊ browser အဟောင်း၊ WebGL ပိတ်ထားတဲ့ ဖုန်းတိုင်းမှာ 3D ရမယ်လို့ မယူဆပါနဲ့။

### ဆက်ဖြည့်သင့်သေးတာများ

- `data/catalog.json` က လောလောဆယ် `{}` ဖြစ်ပြီး contact info တွေလည်း ဗလာပါ။ Admin က တကယ့် product/stock/contact ထည့်ဖို့လိုပါတယ်။ Sample repair job နဲ့ lucky draw reward တွေကို တကယ့်ဝန်ဆောင်မှုလို မသုံးသင့်သေးပါ။
- Public chat အတွက် server-side spam/rate limiting၊ moderation၊ report/mute နဲ့ retention policy ဆက်ထည့်သင့်ပါတယ်။ Staff သီးသန့် conversation နဲ့ push notification လည်း မပါသေးပါ။
- `api/ask.js` ရဲ့ rate limit က instance memory ပဲဖြစ်တာကြောင့် public traffic များလာရင် shared rate limiter / spend controls လိုပါတယ်။
- Visitor stats က session-based ဖြစ်ပြီး last 7 days 1,000 rows cap ရှိပါတယ်။ လူများလာရင် database aggregate / pagination၊ anonymous account cleanup နဲ့ analytics retention ထည့်ဖို့လိုပါတယ်။
- Production မတင်ခင် တကယ့် mid/low-range Android Chrome၊ iPhone Safari၊ network reconnect နဲ့ server quotas/load ကို စမ်းပါ။ Room/channel အရေအတွက်များလာရင် room ခွဲပြီး Realtime architecture ကို ချဲ့ရပါမယ်။

## သတိပြုရန်
- `api/ask.js` က ကိုယ့် API key ကို သုံးလို့ Anthropic Console မှာ လစဉ် အသုံးစရိတ် ကန့်သတ်ချက် (spend limit) သတ်မှတ်ထားပါ။
- နောက်ခံသီချင်းကို public website မှာ သုံးဖို့ မူပိုင်ခွင့် ရှိမရှိ စစ်ပါ။

### Realistic 3D အဝတ်အစားအရောင်
- ဝင်ခါနီး Character setup ရှိ **တကယ့်လူပုံ 3D** မှာ အင်္ကျီနဲ့ ဘောင်းဘီ / စကတ် အရောင်ကို သီးခြားရွေးနိုင်ပါတယ်။ **မူလ · Original** နဲ့ တစ်ပိုင်းချင်း မူလ texture အရောင် ပြန်ထားနိုင်ပါတယ်။
- ကျား/မ ပြောင်းရင် ရွေးထားတဲ့အရောင်တွေ ဆက်ရှိပြီး online guest တွေဆီလည်း realtime ပို့ပါတယ်။ SQL ထပ် run ဖို့ မလိုပါ။
- လက်ရှိ bundled guest models ရဲ့ အဝတ်အစားနေရာအတွက် mask သုံးထားပါတယ်။ Guest GLB အသစ်အစားထိုးရင် model ရဲ့အဝတ်အစားနဲ့ mask ကို ပြန်စစ်ပါ။

### Background music playlist
- Mall ထဲဝင်ချိန် ပေးထားသော သီချင်း ၃ ပုဒ်ကို အစဉ်လိုက်ဖွင့်ပြီး နောက်ဆုံးပုဒ်ပြီးလျှင် ပထမပုဒ်ကနေ ပြန်ပတ်ပါတယ်။
- **⏭ ကျော်ရန် / Skip song** ခလုတ်နဲ့ နောက်တစ်ပုဒ်ပြောင်းနိုင်ပါတယ်။ Mobile မှာ **⋯** menu ထဲကနေ သုံးနိုင်ပါတယ်။ **သီချင်း / Music** နဲ့ ပိတ်/ပြန်ဖွင့်နိုင်ပြီး ပိတ်ထားချိန် ကျော်လျှင် အသံပြန်မဖွင့်ပါ။
- Playlist စာရင်းက `lib/playlist.js` ရဲ့ `MALL_TRACKS` ဖြစ်ပြီး audio files က `assets/music/` မှာရှိပါတယ်။ လက်ရှိပုဒ်ပဲ load လုပ်ပါတယ်။ ဖိုင်အသစ်အစားထိုးရင် immutable cache ကြောင့် filename version ကိုပါ ပြောင်းပါ။

### Scene performance diagnostics and batching

ပုံမှန် URL မှာ optimization အလိုအလျောက် ဖွင့်ထားပါတယ်။ FPS / draw calls စစ်ဖို့ URL နောက်မှာ `?perf=1` ထည့်ပြီး **Performance** panel ကို ဖွင့်ပါ။ Standing / Walking / Driving / Multiplayer scenario ရွေး၊ **Reset** နှိပ်ပြီး တူညီတဲ့ လမ်းကြောင်းနဲ့ စမ်းနိုင်ပါတယ်။ **Export JSON** က လက်ရှိ sample window ကို စက်ထဲ download လုပ်ပေးပါတယ်။ Server ဆီ telemetry မပို့ပါ။

- Optimized comparison: `http://localhost:3000/?perf=1`
- Unoptimized comparison: `http://localhost:3000/?perf=1&cull=0&batch=0`
- နောက်ဆုံး rendered frames 240 ခုအထိ FPS၊ frame p95၊ CPU update/render submission time၊ >50ms frames၊ draw calls / triangles နဲ့ GPU-loaded geometry / texture **အရေအတွက်** ပြပါတယ်။ CPU timings က GPU render duration မဟုတ်ပါ။ Background tab ကနေ ပြန်ဝင်ချိန်နဲ့ quality / viewport ပြောင်းချိန်မှာ samples ပြန်စပါတယ်။

Static fixtures တွေကို နေရာအလိုက် 12m zones နဲ့ ခွဲထားပြီး camera frustum အပြင်က zones တွေကို render မလုပ်ပါ။ ဆိုင်ထဲမှာ camera နဲ့ player နှစ်ခုလုံးရှိမှသာ အထပ်နှစ်ဆင့်ကျော်က interior fixtures တွေကို hide ပါတယ်။ အနီးက အထပ်တစ်ဆင့်၊ facade၊ slabs၊ အမိုးတွေကို ထိန်းထားပြီး overview၊ ကားမောင်းချိန်၊ escalator well အနီးနဲ့ lift/escalator စီးချိန်မှာ floor restriction မသုံးပါ။

တူညီတဲ့ material သုံးတဲ့ opaque box fixtures တွေကို zone တစ်ခုချင်းစီမှာ unit-box `InstancedMesh` နဲ့ ပေါင်းဆွဲပါတယ်။ တံခါးရွေ့ခြင်းနဲ့ overview အမိုးဖျောက်ခြင်းကို သီးခြားထိန်းထားပါတယ်။ မီးပုံးရဲ့ opaque ribs / caps / tassels တွေလည်း instancing သုံးပြီး sway transform ကို လိုက်ပြောင်းပါတယ်။ Transparent glass၊ lantern body နဲ့ glow တွေက မူလ sorting ကို ဆက်သုံးပါတယ်။

Validation: `node --test tests/*.test.js` — frame statistics၊ diagnostics flags၊ floor visibility နဲ့ batching exclusions ကို စစ်ပါတယ်။ FPS တိုးတက်မှုက device / viewport / graphics setting / online guests ပေါ် မူတည်ပါတယ်။ အရင်/အပြီးတိုင်းတဲ့အခါ setting တူတူ၊ assets loading ပြီးချိန်နဲ့ peer count နီးစပ်တဲ့အချိန်ကို သုံးပါ။

Chrome local sample (2026-10-25, Shop 2 မထည့်မီ), Shop 1 ရှေ့ initial standing view၊ assets loading ပြီးနောက် rendered frames 240 ခု:

| Viewport / mode | Optimization | Draw calls / frame | CPU / frame | FPS / frame p95 |
|---|---|---:|---:|---|
| 1280 × 720 / HD | Off | 3518 | 6.2 ms | 60.0 / 17.3 ms |
| 1280 × 720 / HD | On | 2140 | 5.7 ms | 60.0 / 17.1 ms |
| 390 × 844 / Lite | Off | 366 | 2.7 ms | 30.0 / 34.0 ms |
| 390 × 844 / Lite | On | 228 | 2.0 ms | 30.0 / 33.7 ms |

ဒီတိုင်းတာမှုက Chrome desktop ပေါ်မှာ ဖြစ်ပြီး phone viewport ကိုပဲ emulate လုပ်ထားပါတယ်။ Physical phone CPU/GPU test မဟုတ်ပါ။ Live remote peers အရေအတွက်က desktop 1 → 2၊ phone viewport 2 → 1 ဖြစ်လို့ timing / triangles တွေမှာ network guest ပြောင်းလဲမှုလည်း ပါနိုင်ပါတယ်။ FPS cap ရှိပြီး အရင်ကတည်းက target FPS ရတဲ့စက်မှာ ပိုမြင့်တဲ့ FPS ထက် render ဝန်လျော့တာကို ပြပါတယ်။ Walking / overview / driving to Shop 3 ကို browser မှာ စမ်းပြီး Three.js r128 နဲ့ instance world bounds၊ animated transforms၊ movable doors နဲ့ roof visibility ကို သီးခြားစစ်ထားပါတယ်။


## Shop 2 · Thapyagone

- **No.117, Thapyagone Quarter, Naypyitaw**။ Character setup မှာ ဆိုင်ရွေးနိုင်ပြီး Shop 2 ကို တိုက်ရိုက်စမ်းရန် `http://localhost:3000/?shop=2` ကို ဖွင့်ပါ။ `?shop=1` / `?shop=3` လည်း ရပါတယ်။
- Shop 2 က **တစ်ထပ်တည်း** ဖြစ်ပြီး IT ဘယ်ဘက်၊ Service အလယ်၊ Mobile & Electronics ညာဘက်ကို အတွင်း aisle ကနေ ကူးသွားနိုင်ပါတယ်။ အရှေ့ဝင်ပေါက် ၃ ခု၊ ထိုင်စောင့်ရန်၊ staff နဲ့ parking ပါပြီး lift / escalator မပါပါ။
- မျက်နှာစာကို actual shop ပုံအတိုင်း အပြာရောင် portal / အနိမ့်အမြင့်ရှိသော roof cap၊ rooftop LINN ဆိုင်းဘုတ်၊ အဖြူရောင် IT SOLUTION / SERVICES / MOBILE & ELECTRONIC panel ၃ ခုဖြင့် ဆောက်ထားပါတယ်။ အတွင်း layout ကို prototype ပုံအတိုင်း ဆက်ထားပါတယ်။ အပေါ်က panel များမှာ signage သာဖြစ်ပြီး နောက်တစ်ထပ် မပါပါ။ IT cashier / gaming / laptop islands ဘယ်ဘက်၊ mobile နှင့် computer reception ကောင်တာ ၂ ခု အလယ်ဝင်ပေါက်ရှေ့ဘက်၊ waiting sofas အလယ်အတွင်းဘက်၊ repair benches နောက်ဘက်၊ Mobile cashier / brand bays / ဖုန်း display island ၃ တန်း / accessory wall ညာဘက် ပါပါတယ်။ Cutaway ပုံကို နောက်တစ်ထပ်အဖြစ် မဆောက်ထားပါ။ Photo board / photo dialog မပါပါ။
- Area map မှာ **Shop 3 ↔ Shop 2 · Taungnyo Road** လမ်းကြောင်းကို ခရမ်းရောင်နဲ့ ပြထားပါတယ်။ ပေးထားတဲ့ route screenshot ကို အခြေခံပြီး virtual world အတွက် အကွာအဝေးချုံ့ထားတဲ့ လမ်းကြောင်းပါ။ Live GPS / traffic navigation မဟုတ်ပါ။
- Shop 3 ကားမှာ Shop 1 / Shop 2 ကို **ကိုယ်တိုင်မောင်း / အလိုအလျောက်မောင်း** ရွေးနိုင်ပါတယ်။ Shop 2 မှ Shop 3 ပြန်သွားနိုင်ပြီး Shop 1 ↔ Shop 2 ကို Shop 3 မှာ တစ်ဆင့်ပြောင်းစီးရပါတယ်။ Auto drive မှာ သွား/ပြန် lane ခွဲထားပြီး parking နားမှာ lane offset ကို တဖြည်းဖြည်း ပြန်ညှိပါတယ်။
- Shop 2 multiplayer presence နဲ့ map floor ကို `lib/sites.js` ရဲ့ site/floor စာရင်းနဲ့ validate လုပ်ပါတယ်။ Existing SQL setup ပြီးထားရင် SQL ထပ် run ဖို့ မလိုပါ။ Deploy ပြီးရင် clients အားလုံး refresh လုပ်ပါ။

Validation: `node --test tests/*.test.js`။ Site/floor validation၊ entrance clearance၊ route endpoints / return direction၊ auto-drive lane offsets နဲ့ Shop 2 realtime broadcasts ကို စစ်ထားပါတယ်။


## Shop 4 · Myoma Market

- **Pa.(231), Myoma Market, Naypyitaw**။ Setup ဆိုင်ရွေးရာမှ Shop 4 ရွေးနိုင်ပြီး တိုက်ရိုက်စမ်းရန် `http://localhost:3000/?shop=4` ကို ဖွင့်ပါ။
- မျက်နှာစာကို actual photo အခြေခံ အဖြူရောင် LINN logo panel၊ ငွေရောင် diagonal diamond brand panel၊ မှန်ဝင်ပေါက် ၂ ခုဖြင့် ဆောက်ထားပါတယ်။ Photo board မထည့်ထားပါ။
- Shop 4 ကို ဆိုင်သေးအချိုး **မျက်နှာစာ 11m × အတွင်းအလျား 24m** ဖြင့် ဆောက်ထားပါတယ်။ အရင် 34m အကျယ် showroom ထက် ကျဉ်းပြီး အတွင်းသို့ ရှည်ဝင်သွားပါတယ်။ မြင့်သော မျက်နှာစာအောက်မှာ **တစ်ထပ်တည်း၊ zone ၄ ခု** ပါပါတယ်။ ရှေ့ဘယ်ဘက် Mobile/Accessories၊ နောက်ဘယ်ဘက် Mobile/Computer/Printer Service နဲ့ customer waiting၊ ရှေ့ညာဘက် Computer/IT၊ နောက်ညာဘက် TV/Audio/Home Appliances ပါပါတယ်။ Upper facade သည် signage ဖြစ်ပြီး နောက်တစ်ထပ်၊ lift၊ escalator မပါပါ။
- Service panel၊ ထိုင်နိုင်သော waiting seats၊ product corners၊ staff၊ coupons၊ customer parking နဲ့ multiplayer location ပါပါတယ်။ ရှိပြီးသား catalog/admin နဲ့ Supabase SQL ကို ဆက်သုံးပါတယ်။ SQL အသစ် run ရန် မလိုပါ။ Clients အားလုံး refresh လုပ်ရန် လိုပါတယ်။
- **Shop 2 ↔ Shop 4** ကို manual/auto ကားဖြင့် သွားနိုင်ပါတယ်။ Area map မှာ Taungnyo Road / Myoma Market route ကို စိမ်းပြာရောင်နဲ့ ပြထားပြီး ပေးထားသော route screenshot ကို virtual world အတွက် အကွာအဝေးချုံ့၍ အခြေခံထားပါတယ်။ Lake နဲ့ market approach သည် virtual landmarks ဖြစ်ပြီး live GPS / traffic times မဟုတ်ပါ။
- Shop 1 → Shop 4 ကို Shop 3၊ Shop 2 မှာ တစ်ဆင့်စီ ပြောင်းစီးရပါတယ်။ Navigation က ဆိုင်အဆင့်များစွာရှိသော လမ်းကြောင်းကို ရှာနိုင်ပါတယ်။ Shop 4 မှ Shop 2 ကို ပြန်မောင်းနိုင်ပါတယ်။ Auto ကားသည် လမ်းဆုံသို့ ရောက်လာမည့် traffic ကို ကြိုစောင့်ပြီး၊ နောက်က လိုက်လာသည့် ကားကြောင့် ရှေ့ကားက ပြန်ရပ်စောင့်ခြင်းကို ရှောင်ထားပါတယ်။ Route traffic ကို ဆိုင်အနီးလမ်းဆုံများမှ ခွာထားပြီး city street traffic ကို သီးခြားထားပါတယ်။

Validation: `node --test tests/*.test.js` တွင် Shop 4 entrance/floor validation၊ zone ၄ ခုနှင့် waiting area လမ်းလျှောက်ရောက်နိုင်မှု၊ several-hop routing၊ realtime shop transfer စစ်ထားပါတယ်။ Actual Three.js r128 curve တွင် လမ်းကြောင်းတစ်ခုလျှင် သွား/ပြန် sample 2001 ခုစီ car hull ကို shop buildings / parked vehicles မတိုက်အောင် သီးခြားစစ်ထားပါတယ်။ Physical phone GPU test မဟုတ်ပါ။

Shop 4 browser verification: Shop 2 → Shop 4 auto ခရီးကို Skip မသုံးဘဲ ရောက်နိုင်ခြင်း၊ right IT entrance / product drawer၊ left entrance မှ rear Service panel သို့ တိုက်ရိုက်လမ်းလျှောက်ခြင်း၊ waiting seat ထိုင်/ထခြင်း၊ 390×844 Lite viewport နဲ့ mobile controls ကို စမ်းထားပါတယ် (ကျယ်သော layout မူကွဲပေါ်က checks)။ Narrow layout အတွက် entrance/aisle/standing clearance regression checks ကို ပြန်စစ်ပါတယ်။ Traffic ကို စတင်ချိန် ၅ မျိုးဖြင့် သွား/ပြန် simulation စမ်းပြီးပါပြီ။ Native Shop 4 → Shop 2 browser ခရီးအပြည့်ကို နောက်ဆုံးပြင်ပြီးနောက် ထပ်မစမ်းရသေးပါ။

Narrow Shop 4 verification: အလယ် aisle ကနေ rear Service counter သို့ လမ်းလျှောက်ရောက်နိုင်ခြင်း၊ Service panel၊ two-seat waiting bench ထိုင်/ထခြင်းကို browser မှာ ပြန်စမ်းထားပါတယ်။ Floor map၊ walking/car collision bounds နဲ့ scene culling တို့သည် 11×24m footprint ကို သုံးပါတယ်။


## Shop 5 · Ottarathiri Premium Hall

- **No.OS-16, Nyarna Dipa Quarter, Ottarathiri Township**။ Setup ဆိုင်ရွေးရာမှ Shop 5 ရွေးနိုင်ပြီး တိုက်ရိုက်စမ်းရန် `http://localhost:3000/?shop=5` ကို ဖွင့်ပါ။
- ပေးထားသော actual exterior ကို အခြေခံ၍ အပြာရောင် portal frame၊ rooftop LINN ဆိုင်းဘုတ်၊ IT SOLUTIONS / SERVICES / MOBILE & ELECTRONICS အဖြူရောင် panel၊ ညာဘက် dark logo panel နဲ့ glass facade ဆောက်ထားပါတယ်။ Photo board မပါပါ။
- Prototype အတိုင်း **38×26m တစ်ထပ်တည်း hall** ဖြစ်ပြီး ရှေ့ဘယ် Samsung၊ ရှေ့ညာ iPhone၊ mobile/accessories islands၊ ရှေ့ဘက် waiting tables ၂ ဝိုင်း၊ ဘယ်ဘက် mobile display ၆ ခု၊ ညာဘက် laptops၊ အလယ်ဘယ် Server Room / WC၊ အလယ်ညာ Gaming / Office၊ နောက်ညာ Washing Machine / Refrigerator၊ နောက်အလယ် TV wall နဲ့ နောက်ဘယ် Service counter / waiting tables ၂ ဝိုင်း ပါပါတယ်။
- **ဝင်ပေါက် ၃ ခု** (Mobile / central automatic glass / IT) နဲ့ Server Room / WC / Gaming / Office ဝင်ပေါက်များ ပါပါတယ်။ နောက်ဘက် gallery ကို 0.45m မြင့်ထားပြီး အလယ် သုံးထစ်လှေကားကနေ တက်/ဆင်းလျှင် avatar နဲ့ camera အမြင့်ပါ လိုက်ပြောင်းပါတယ်။ Floor index သည် တစ်ထပ်တည်းဖြစ်နေပါတယ်။
- Central glass doors သည် local visitor သို့မဟုတ် တူညီသော Shop 5 ထဲက remote guest ဝင်ပေါက်နား ရောက်လာလျှင် အလိုအလျောက်ဖွင့်ပြီး ရှင်းသွားလျှင် ပိတ်ပါတယ်။ Door glass၊ frame နဲ့ handles ကို static batching မှ ချန်ထားပါတယ်။
- Existing catalog၊ Service panel၊ ထိုင်နိုင်သော waiting seats၊ staff၊ coupons၊ parking နဲ့ realtime ကို ဆက်သုံးထားပါတယ်။ Supabase SQL အသစ် run ရန် မလိုပါ။ Deploy ပြီးလျှင် clients အားလုံး refresh လုပ်ပါ။
- **Shop 3 ↔ Shop 5** manual/auto ကားလမ်းကို ပေးထားသော route screenshot အခြေခံ Railway Road → Ottarathiri Road ပုံစံဖြင့် virtual world ထဲ အကွာအဝေးချုံ့၍ ဆောက်ထားပါတယ်။ Area map မှာ ရွှေဝါရောင်နဲ့ ပြထားပါတယ်။ Live GPS / traffic time မဟုတ်ပါ။ အခြားဆိုင်များမှ Shop 3 မှာ ကားပြောင်းစီးနိုင်ပါတယ်။

Validation: `node --test tests/*.test.js` တွင် hall corners / WC / office doorway reachability၊ waiting-seat clearance၊ local/remote automatic doors၊ Shop 5 realtime location နဲ့ route transfers ကို စစ်ထားပါတယ်။ Three.js r128 မှာ parking endpoints၊ parked cars နဲ့ main/annex buildings မထိစေရန် route sample 2001 ခုစီ၊ သွား/ပြန် နှစ်ဖက်စစ်ထားပြီး traffic simulation ကို စတင်ချိန် ၂ မျိုးဖြင့် စစ်ထားပါတယ်။ Physical phone CPU/GPU test မဟုတ်ပါ။

Previous Shop 5 browser verification (before the interior rearrangement): automatic glass entrance ဖြတ်ဝင်ခြင်း၊ iPhone product drawer၊ Office/WC doorway များမှ အတွင်းဝင်ခြင်းနဲ့ 390×844 Lite mobile controls ကို စမ်းထားပါတယ်။ ကားလမ်းမှာ Shop 5 → Shop 3 ရောက်ရှိမှုနဲ့ Shop 5 ပြန်ဝင်နိုင်မှုကို browser UI မှ စစ်ထားပါတယ်။ Room reachability / local+remote door state ကို automated tests ဖြင့်ပါ စစ်ပါတယ်။

Latest Shop 5 interior: reference floor plan အတိုင်း ပြန်စီပြီး entrance ၃ ခု၊ rooms / product corners၊ chair stand-up clearance၊ အလယ်တည့်တည့် လျှောက်လမ်းနဲ့ raised gallery stair heights ကို automated tests ဖြင့် စစ်ထားပါတယ် (60 tests passing)။ Browser တွင် central entrance → TV gallery လမ်းလျှောက်ခြင်းနဲ့ လှေကား တက်/ဆင်း စမ်းထားပါတယ်။ Shop 5 အပေါ်စီး view သည် floor plan ကို ရှေ့မှမြင့်မြင့် ကြည့်နိုင်ရန် ချိန်ထားပြီး upper fascia / room roofs ကို ဖျောက်ထားပါတယ်။

## Traffic နဲ့ parking ကားပုံစံများ

- Sedan / hatchback / SUV / pickup ၄ မျိုး၊ paint အရောင် ၁၂ မျိုးကို စုစုပေါင်း ၄၈ မူကွဲအဖြစ် ရောစပ်ထားပါတယ်။ Traffic နဲ့ parking ကားတွေမှာ ရှေ့နောက်တစ်ဆက်တည်း ပုံစံ / အရောင် မထပ်အောင် စီထားပါတယ်။ Remote guest ကားအတွက် peer ID အပေါ်မူတည်ပြီး တည်ငြိမ်တဲ့ appearance သုံးပါတယ်။
- `car_body.glb` က Linn မောင်းနိုင်တဲ့ကားအတွက် ဖြစ်ပါတယ်။ Traffic / parking ကားတွေကို model တစ်ခုတည်းနဲ့ ထပ်မအစားထိုးတော့ပါ။ `lib/vehicles.js` သည် lightweight geometry / materials မျှဝေသုံးပြီး per-car texture / model downloads အသစ် မလိုပါ။
- Existing parking / lane collision footprint အတွင်း ကားအားလုံး ဆံ့ပါတယ်။ SUV roof အမြင့်ကို flying-car collision တွင်ပါ ထည့်စစ်ထားပါတယ်။
- Validation: tests ၆၃ ခု အောင်မြင်၊ Three.js r128 ဖြင့် မူကွဲ ၄၈ ခု၏ actual mesh bounds / wheels / geometry reuse စစ်ပြီး parking view ကို browser မှာ ကြည့်စစ်ထားပါတယ်။

## လမ်းပတ်ဝန်းကျင်နှင့် ဆိုင်ကယ်စီးခြင်း

- Inter-shop လမ်းကြောင်း ၄ ခုတွင် အိမ်တန်း၊ ဆိုင်ခန်း၊ လမ်းမီး၊ လမ်းဘေးလျှောက်လမ်းနှင့် edge lines ဖြည့်ထားပါတယ်။ Roads / junctions / ဆိုင်ဝင်း / မြစ် / ရှိပြီးသားအဆောက်အဦးများကို ရှောင်ပြီး နေရာချထားပါတယ်။ Area map မှာလည်း အိမ်နဲ့ ဆိုင်ကယ်နေရာတွေ ပြပါတယ်။ ဤပတ်ဝန်းကျင်သည် ချုံ့ထားသော virtual town ဖြစ်ပါတယ်။
- ဆိုင်တိုင်း၏ car parking ဘယ်ဘက် **MOTORBIKE** နေရာသို့ သွားပါ။ **ကိုယ်တိုင်စီး** သို့မဟုတ် **အလိုအလျောက်စီး** ကို ရွေးနိုင်ပါတယ်။ Shop 3 မှ Shop 1 / 2 / 5၊ Shop 2 မှ Shop 4 သို့ ဆက်သွားနိုင်ပါတယ်။
- ကိုယ်တိုင်စီးရန် W/S မောင်း/နောက်ဆုတ်၊ A/D ကွေ့၊ Space ဘရိတ် သို့မဟုတ် mobile joystick / brake ကို သုံးပါ။ ဆိုင်ကယ်နေရာအနီး အရှိန်လျှော့၍ **ဒီမှာ ရပ်မည် (E)** ဖြင့် ဆင်းနိုင်ပါတယ်။ **Skip ride** က ရွေးထားသော destination သို့ ခရီးကျော်ပေးပါတယ်။ ဆိုင်ကယ်ကို ပျံသန်းစနစ် မထည့်ထားပါ။
- Narrow bike collision hull၊ traffic avoidance နှင့် မြစ်/အဆောက်အဦး collision ကို သုံးထားပါတယ်။ Multiplayer presence တွင် `v: 'bike'` ကို စစ်ပြီး ပို့/ပြသပါတယ်။ Client အားလုံး refresh လုပ်ရန် လိုပါတယ်။ SQL ပြင်ရန် မလိုပါ။

### Vehicle detail နှင့် wheel motion

- Existing textured `bike_body.glb` ကို ride stations မှာ သုံးပြီး ရှေ့/နောက် rounded tyre / rim meshes သီးခြားလည်ခြင်း၊ ရှေ့ဘီးကွေ့ခြင်းနှင့် ကွေ့ချိန် lean ပါပါတယ်။ Rigged rider ၏ knees / torso pose နှင့် two-bone arm IK ကို handlebars အတွက် ချိန်ထားပါတယ်။
- Parking / traffic ကား ၄ မျိုးတွင် curved body / wheel arches၊ rounded tyres၊ alloy spokes / brake discs၊ window reflections၊ grille / LED lights၊ SUV roof rails နှင့် pickup cargo bed ထည့်ထားပါတယ်။ Geometry / materials / reflection map မျှဝေသုံးထားပါတယ်။
- Main Linn car ၏ single-mesh GLB ကို wheel regions ခွဲပြီး မူရင်း UV/material များကို ထိန်းထားပါတယ်။ Travel distance / tyre radius အလိုက် wheel angle တွက်၍ နောက်ဆုတ်လျှင် ပြောင်းပြန်လည်ပြီး ရပ်လျှင် ရပ်ပါတယ်။ Auto/manual steering နဲ့ remote vehicle wheel motion ပါ ချိတ်ထားပါတယ်။
- Validation: Native browser တွင် Shop 5 → Shop 3 ဆိုင်ကယ် auto ခရီးအပြည့်၊ manual throttle / brake / reverse / source parking စမ်းထားပါတယ်။ လမ်းကြောင်း ၄ ခု သွား/ပြန်ကို real Three.js samples 2001 ခုစီဖြင့် buildings / parked cars မထိကြောင်း စစ်ထားပါတယ်။ Vehicle variants ၄၈ ခု actual geometry bounds နှင့် supplied GLB wheel partitions / rolling / steering ကိုလည်း စစ်ထားပါတယ်။

Latest verification: `node --test tests/*.test.js` တွင် tests 70 ခု အောင်မြင်ပါတယ်။ Quantized / interleaved GLB attributes ကို float coordinates အဖြစ် ပြောင်းခြင်း၊ radius အလိုက် wheel rotation၊ reverse / zero speed နှင့် front-only steering regression checks ပါပါတယ်။

Final native check: updated textured motorcycle ဖြင့် Shop 5 → Shop 3 auto arrival ကို ထပ်စမ်းပြီး manual motorcycle / car throttle, steering and braking တွင် app error မတွေ့ပါ။ Manual ride ၏ ခရီးကျော်ခလုတ်ကို **Skip ride** ဟု အမှန်တကယ်လုပ်ဆောင်ချက်နှင့် ကိုက်ညီအောင် ပြထားပါတယ်။

## Guest / Registered users and coupon collection

- Guest အနေနဲ့ account မလိုဘဲ shop ရွေးပြီး ဝင်ကြည့်နိုင်ပါတယ်။ Entry screen သို့မဟုတ် toolbar မှ **Login / Register** ကို သုံးပြီး email/password account ဖွင့်နိုင်ပါတယ်။ ရှိပြီးသား Staff/Admin accounts လည်း ဒီ login ကိုပဲ သုံးပါ။
- Supabase SQL Editor မှာ `supabase/004_member_coupons.sql` ကို run ပါ။ Email provider / new user signups ကို ဖွင့်ထားပြီး Site URL နဲ့ confirmation redirect URL ကို deployed site အတွက် သတ်မှတ်ပါ။ Anonymous Sign-Ins ကိုလည်း Guest realtime/stats အတွက် ဆက်ဖွင့်ထားပါ။ Email confirmation ဖွင့်ထားရင် inbox ထဲက link နှိပ်ပြီး login ပြန်ဝင်ပါ။
- Registered user တွေသာ coupon collect လုပ်နိုင်ပါတယ်။ Collection ကို account + UTC day အလိုက် database မှာ သိမ်းပြီး device ပြောင်းလည်း ပြန်ဖတ်နိုင်ပါတယ်။ Guest/local browser coupon history အဟောင်းကို member account ထဲ မကူးပါ။ Daily duplicate collection ကို database primary key က တားပေးပြီး RLS က ကိုယ့် account coupon တွေကိုပဲ ဖတ်ခွင့်ပေးပါတယ်။ Sign out ကို My account မှာ လုပ်နိုင်ပါတယ်။
- Collection RPC က registered session နဲ့ known coupon ID ကို စစ်ပါတယ်။ Movement ကို browser က တွက်တာဖြစ်လို့ physical proximity ကို server က အတည်မပြုပါ။ Reward က existing demo voucher သာဖြစ်ပြီး real redemption မပါပါ။
- Manual checks: Guest ဖြင့် ဝင်၍ coupon နားသွားရင် login prompt ပေါ်ပြီး collection မတိုးရပါ။ Register / confirm / login ပြီး coupon collect လုပ်ပါ။ Reload / အခြား device မှာ same account နဲ့ ဝင်လျှင် ယနေ့ collection ပြန်ပေါ်ရပါမယ်။ Account မတူရင် collection သီးခြားဖြစ်ရပါမယ်။ Existing Staff/Admin permissions ကိုလည်း ပြန်စစ်ပါ။

Validation: `node --test tests/*.test.js` — 73 tests passed. `tests/coupons-rls.sql` passed in a disposable local PostgreSQL database (guest denial, account isolation, duplicates, invalid IDs, direct writes). Live Supabase email confirmation / browser signup remains to be checked after applying the migration.

## Google / Gmail account sign-in

Login နဲ့ Register dialog နှစ်ခုလုံးမှာ **Continue with Google** ပါပါတယ်။ Google account အသစ်ကို ပထမဆုံးဝင်ချိန် Supabase က register လုပ်ပေးပြီး နောက်တစ်ခါဆို same account နဲ့ login ဝင်ပေးပါတယ်။ Registered-user coupon rules ကို ဆက်သုံးပါတယ်။ Existing browser Supabase SDK ကိုပဲ သုံးထားပြီး Google SDK / library အသစ် မထည့်ထားပါ။

Setup (SQL အသစ် မလိုပါ):

1. Google Cloud / Google Auth Platform မှာ OAuth consent screen (branding/audience) ပြင်ပြီး OAuth client ကို **Web application** နဲ့ ဖန်တီးပါ။ Testing mode ဆိုရင် စမ်းမယ့် Google account ကို Test users ထဲ ထည့်ပါ။
2. **Authorized JavaScript origins** မှာ actual deployed site origin (ဥပမာ `https://mall.linn.com.mm`) ကို ထည့်ပါ။ **Authorized redirect URIs** မှာ Supabase Dashboard → Authentication → Sign In / Providers → Google မှ callback URL ကို copy ထည့်ပါ။ လက်ရှိ default project URL အတွက် `https://purmadxwvtruxdtrsutg.supabase.co/auth/v1/callback` ဖြစ်ပါတယ်။ `SUPABASE_URL` project မတူလျှင် အဲဒီ project callback ကို သုံးပါ။
3. Supabase Dashboard → Authentication → Sign In / Providers → **Google** ကို enable လုပ်ပြီး Google Client ID နဲ့ Client Secret ကို အဲဒီ provider settings ထဲ ထည့်၊ Save လုပ်ပါ။ Client Secret ကို frontend code သို့မဟုတ် public environment variable ထဲ မထည့်ပါနဲ့။
4. Supabase → Authentication → URL Configuration မှာ **Site URL** ကို deployed site URL ထားပြီး **Redirect URLs** မှာ app URL (trailing slash ပါအောင်၊ ဥပမာ `https://mall.linn.com.mm/`) ကို ခွင့်ပြုပါ။ Local test အတွက် local app URL/port ကိုလည်း ထည့်ပါ။ App က current origin + pathname ဆီ ပြန်ပို့ပြီး query/hash ကို မကူးပါ။
5. Code deploy ပြီး **Continue with Google** နှိပ် → account ရွေး → consent ပြီး mall ဆီ ပြန်ရောက်လျှင် **My account** နဲ့ coupon collect ကို စမ်းပါ။ Sign out / same Google account ဖြင့် ပြန်ဝင်ပြီး saved coupons ပြန်ပေါ်ရပါမယ်။ Cancel ဖြစ်ရင် login dialog မှာ retry message ပေါ်ပါမယ်။

Reference: [Supabase Google sign-in setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google?platform=web), [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

Validation: `node --test tests/*.test.js` — 76 tests passed, including Google OAuth request, safe return URL, provider failure/retry, and cancellation detection. Live Google consent / callback requires the provider configuration above and has not been verified yet.

## Account settings / profile / coupon history

- Login ပြီးရင် saved `display_name` → Google `full_name` / `name` → email ရှေ့ပိုင်း အစဉ်အတိုင်း character name ကို auto ဖြည့်ပါတယ်။ Avatar / realtime name က existing 14-character limit ကို ဆက်သုံးပါတယ်။
- **Account settings → Profile** မှာ display name ကို 1–50 characters အတွင်း ပြင်ပြီး Save profile လုပ်နိုင်ပါတယ်။ Supabase Auth user metadata မှာ သိမ်းပြီး character label ကို ချက်ချင်းပြောင်းပေးပါတယ်။ Email ကို read-only ပြထားပြီး Google/email login ကို ဖော်ပြပါတယ်။ Metadata ကို staff/admin permission အတွက် မသုံးပါ။ SQL migration အသစ် မလိုပါ။
- **My coupons** မှာ ရက်ဟောင်းအပါအဝင် account ရဲ့ collected coupons ကို ဆိုင်၊ floor၊ UTC date နဲ့ ကြည့်နိုင်ပါတယ်။ 30 ခုစီ Load more သုံးပြီး Refresh နဲ့ ပြန်ဖတ်နိုင်ပါတယ်။ HUD coupon count ကို နှိပ်ရင်လည်း coupon history တိုက်ရိုက်ဖွင့်ပါတယ်။ Existing RLS ကို ဆက်သုံးပါတယ်။
- **Logout** နှိပ်လျှင် Supabase sign-out အောင်မြင်ပြီး page reload လုပ်ပါတယ်။ Account မရှိရင် existing Guest flow ကို ဆက်သုံးနိုင်ပါတယ်။
- Validation: profile-name fallbacks, successful metadata save, invalid names / guest / failed save rejection, owner-scoped history pagination နှင့် existing tests ကို run ပါ။ Native browser desktop/390px sample-account preview မှာ profile save → character name update၊ history 30 → 35 pagination နဲ့ logout callback ကို စမ်းထားပါတယ်။ Live account writes မစမ်းထားပါ။

## Security fixes: stats, daily coupons and shared AI quotas

Deploy မလုပ်မီ Supabase SQL Editor မှာ **`supabase/005_security_daily_quota.sql`** ကို run ပါ (004 ပြီးမှ)။ ပြန် run လည်း safe ဖြစ်ပါတယ်။ Hosted Supabase မှာ `tests/*sql` fixture တွေကို မ run ပါနဲ့။

- **Admin stats XSS:** visitor metrics ကို bounded non-negative integer အဖြစ်သာ aggregate လုပ်ပြီး labels/questions ကို HTML escape လုပ်ပါတယ်။ Malformed legacy rows ကိုလည်း safe render လုပ်ပါတယ်။ New database constraint က metric/dictionary values မှားနေတဲ့ write အသစ်တွေကို တားပြီး ရှိပြီးသား row တွေကြောင့် migration မကျအောင် `NOT VALID` သုံးထားပါတယ်။ Code deploy ပြီး Admin browser တွေကို refresh လုပ်ပါ။
- **Daily coupons:** UTC midnight (မြန်မာအချိန် မနက် 06:30) မှာ HUD / collected mesh state ကို အလိုအလျောက် ပြန်ဖတ်ပါတယ်။ Background tab က ပြန်လာရင်လည်း sync လုပ်ပါတယ်။ Stale loads / claims ကို generation guard နဲ့ ပယ်ပြီး RPC က expected collection date ကို server date နဲ့ စစ်ပါတယ်။ Collection load ခဏကျရင် 10 seconds နောက် retry လုပ်ပါတယ်။ Analytics day နဲ့ daily draw date ကိုလည်း rotate လုပ်ပါတယ်။
- **Shared AI quotas:** database transaction / advisory lock နဲ့ server instances အားလုံးအတွက် limit ကို atomic reserve လုပ်ပါတယ်။ Default **IP တစ်ခုလျှင် 12 requests/minute၊ site တစ်ခုလုံး 120/minute၊ 1,000/day (UTC)** ဖြစ်ပါတယ်။ Request failed/upstream failed လည်း reservation ကို မပြန်လျှော့ပါ။ Global limit က IP ပြောင်းသုံးတာကိုပါ ကန့်သတ်ပါတယ်။ Fixed calendar windows ဖြစ်ပြီး sliding window မဟုတ်ပါ။ Daily request cap ဖြစ်ပြီး exact dollar budget မဟုတ်ပါ။

Vercel → Settings → Environment Variables မှာ server-only values ထည့်ပြီး redeploy လုပ်ပါ:

- `SUPABASE_URL`: browser သုံးနေတဲ့ project URL (လက်ရှိ default `https://purmadxwvtruxdtrsutg.supabase.co`)။
- `SUPABASE_SECRET_KEY`: Supabase Project Settings → API Keys မှ **secret key** (`sb_secret_…`)။ Legacy `SUPABASE_SERVICE_ROLE_KEY` လည်း fallback အနေနဲ့ ရပါတယ်။ ဒီ key တွေကို public config / frontend / git ထဲ မထည့်ပါနဲ့။
- `AI_RATE_LIMIT_SALT` (optional): stable server-only random value; မထည့်ရင် secret key ကို HMAC salt အဖြစ် သုံးပါတယ်။ Database မှာ raw IP မသိမ်းပါ။ Windows အဟောင်းတွေကို 1–2 UTC days အတွင်း reservation လုပ်ချိန် cleanup လုပ်ပါတယ်။
- ရှိပြီးသား `ANTHROPIC_API_KEY` ကို ဆက်သုံးပါတယ်။ Quota config ပျောက်/DB ကျရင် **503** ပြန်ပြီး paid AI call မပို့ပါ။ Limit ပြည့်ရင် **429 + Retry-After** ပြန်ပါတယ်။ Database call timeout 5 seconds၊ AI upstream timeout 20 seconds ပါပါတယ်။ Non-Vercel reverse proxy သုံးရင် `x-forwarded-for` ကို proxy က trusted client IP နဲ့ overwrite လုပ်ပေးရပါမယ်။

Limits ပြောင်းရန် SQL Editor မှာ (browser roles မပြင်နိုင်ပါ):

```sql
update public.mall_ai_quota_config
set ip_per_minute = 12, global_per_minute = 120, global_per_day = 1000
where id = true;
```

Verification: `node --test tests/*.test.js` ဖြင့် real Admin click-handler XSS regression, malformed metrics, UTC rollover / stale network responses, date-bound coupon RPC, quota denial/outage/secret validation နှင့် existing tests အားလုံးကို စစ်ပါတယ်။ `tests/security-quota.sql` ကို disposable local PostgreSQL မှာ စမ်းပြီး migration re-run, legacy data, RLS/role denial, date guards, IP/minute/day limits အောင်မြင်ပါတယ်။ Concurrent local test မှာ clients 20 ခုအနက် shared daily limit 5 ခုသာ admit ဖြစ်ပါတယ်။ Live deployment / secret configuration / paid provider calls မစမ်းထားပါ။
