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

## Vercel ပေါ်မှာ မပါသေးတာ (Phase 2)
- လူအများ တစ်ပြိုင်နက် မြင်ရခြင်းနဲ့ chat, Live staff → realtime service (ဥပမာ Supabase Realtime) လိုပါတယ်
- Visitor စာရင်းအင်း, Admin panel ကနေ data ပြင်ခြင်း → database (ဥပမာ Supabase) လိုပါတယ်
ဒီအပိုင်းတွေ မရှိတဲ့အခါ page က အလိုအလျောက် ဖျောက်ထားပါတယ်။

## သတိပြုရန်
- `api/ask.js` က ကိုယ့် API key ကို သုံးလို့ Anthropic Console မှာ လစဉ် အသုံးစရိတ် ကန့်သတ်ချက် (spend limit) သတ်မှတ်ထားပါ။
- နောက်ခံသီချင်းကို public website မှာ သုံးဖို့ မူပိုင်ခွင့် ရှိမရှိ စစ်ပါ။
