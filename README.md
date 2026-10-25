# BOOK-TIIS — Maktabaddaada Dijitaalka ah (Your Digital Library)

BOOK-TIIS waa mareeg maktabad dijitaal ah oo casri ah oo loogu talagalay daabacaadda, iibinta, iyo akhriska buugaagta Af-Soomaaliga. Waxay u dhisan tahay si heer sare ah iyadoo adeegsanaysa **React**, **TypeScript**, **Tailwind CSS**, **Vite**, **Supabase** (Auth, Database, Row Level Security, iyo Private PDF Storage), iyo bixinta tooska ah ee **EVC Plus**.

---

## 🎨 Tilmaamaha Astaanta (Brand Guidelines)
- **Magaca:** BOOK-TIIS
- **Hal-ku-dhegga:** Your Digital Library / Maktabaddaada Dijitaalka ah
- **Midabbada Rasmiga ah:**
  - Dark Green: `#087A43`
  - Fresh Green: `#12A85A`
  - Pale Green: `#EAF7EF`
  - White: `#FFFFFF`
- **Lambarka Lacag-bixinta EVC Plus:** `0613424271`

---

## 🚀 1. Sida Loo Sameeyo Mashruuc Supabase Cusub (Create Supabase Project)

1. Booqo bogga [supabase.com](https://supabase.com) oo sameyso koonto bilaash ah ama gal.
2. Riix badhanka **"New Project"**.
3. Dooro:
   - **Name:** `book-tiis-library`
   - **Database Password:** Dooro furaha sirta ah ee xooggan oo meel ku kaydso.
   - **Region:** Dooro gobolka kuugu dhow (tusaale, *Frankfurt (eu-central-1)* ama *London*).
4. Riix **"Create new project"** oo sug 1-2 daqiiqo inta database-ku diyaar ka noqonayo.

---

## 🔑 2. Habaynta Environment Variables (Configure Environment Variables)

1. Supabase Dashboard-ka dhexdiisa, tag:
   - **Project Settings** (icon-ka qalabka ee hoose) ➔ **API**.
2. Koobiyeey labadan xog:
   - **Project URL:** `https://your-project-id.supabase.co`
   - **Project API Keys:** Dooro furaha **anon** ama **publishable key**.
3. Ku dar faylka `.env` ama habka deegaanka ee martigelintaada:

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-actual-anon-or-publishable-key"
```

*(Fiiro gaar ah: Haddii aadan weli gelin furayaashan, BOOK-TIIS wuxuu si otomaatig ah ugu shaqeynayaa habka Interactive Demo Mode oo wata buugaag diyaar ah iyo tijaabo buuxda!)*

---

## 🗄️ 3. Sida Loo Shaqaysiiyo SQL Migrations & RLS (Run SQL Migrations)

Faylka dhameystiran ee SQL wuxuu ku jiraa xididka mashruuca: `/supabase/schema.sql`.

1. Supabase Dashboard-ka, dhanka bidix ka dooro **SQL Editor**.
2. Riix **"New Query"**.
3. Nuqul ka qaad (Copy) dhammaan waxa ku jira faylka `/supabase/schema.sql` oo ku dheji SQL Editor-ka.
4. Riix badhanka cagaaran ee **"Run"**.

Kani wuxuu si toos ah u dhisayaa:
- `profiles` table oo xidhiidh la leh `auth.users`
- `books` table oo wata qiimayaasha, bilaash/lacag, iyo faafinta
- `orders` table oo diiwaangeliya dalabaadka
- `payment_requests` table oo kaydiya tixraacyada EVC Plus
- `reading_progress` table oo xusuusta bogga u dambeeyay ee qofku marayey
- **Row Level Security (RLS) Policies** adag oo ilaaliya xogta
- **Triggers** otomaatig ah oo profile cusub u abuuraya qof kasta oo isdiiwaangeliya
- Buugaag sample ah oo Af-Soomaali ah (Seed Data)

---

## 📦 4. Habaynta Supabase Storage (Configure Storage Buckets)

BOOK-TIIS wuxuu adeegsadaa laba buckets oo kala duwan:

1. **`book-covers`** (Public):
   - Tag **Storage** ➔ **New bucket**.
   - Magaca geli: `book-covers`.
   - Hubi in **Public bucket** uu shaqaynayo (ON).
   - Riix **Save bucket**.

2. **`book-pdfs`** (Private - Amni sare):
   - Tag **Storage** ➔ **New bucket**.
   - Magaca geli: `book-pdfs`.
   - Hubi in **Public bucket** uu dansan yahay (OFF / Private).
   - Riix **Save bucket**.

*(Xeerarka amniga ee SQL schema waxay hubinayaan in kaliya maamulaha iyo qofka buugga iibsaday ee lacagtiisa la xaqiijiyay ay heli karaan faylka PDF-ka iyadoo la adeegsanayo Short-lived Signed URLs).*

---

## 🛡️ 5. Sida Loo Siisto Doorka Maamulaha (Grant Admin Role to Administrator)

**MUHIIM:** Sababo ammaan awgood, doorka maamulaha (`role = 'admin'`) lagama beddeli karo dhanka biraawsarka ama xogta uu soo qoro isticmaaluhu. Dhammaan dadka isdiiwaangeliya waxay ku bilaabmaan doorka `customer`. Maamulaha waxaa lagu dalacsiin karaa kaliya **Supabase SQL Editor**:

### Tusaale: Akoonka Maamulaha Cusub (`Xusenaadan11@gmail.com`)
1. Koontada ku sameyso adigoo adeegsanaya foomka **Sign Up** ee BOOK-TIIS ama haddii ay horey u jirtay dib-u-deji furaha sirta ah (Forgot Password).
2. Tag **Supabase Dashboard** ➔ **SQL Editor** ➔ **New Query**.
3. Ku dheji oo kici (Run) koodhkan SQL ee badbaadada leh:

```sql
-- 1. U yeel doorka admin akoonka Xusenaadan11@gmail.com
INSERT INTO public.profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Maamule'), 'admin'
FROM auth.users
WHERE LOWER(email) = 'xusenaadan11@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- 2. Hubi in doorku noqday admin
SELECT p.id, u.email, p.full_name, p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE LOWER(u.email) = 'xusenaadan11@gmail.com';
```

4. Hadda dib ugu noqo BOOK-TIIS oo gal akoonkaaga ama riix badhanka **"Dib u hubi Doorka Maamulka"** (Refresh Role). Waxaad toos u arki doontaa badhanka **"Maamulka"** oo kuu furaya Admin Dashboard-ka buuxa.

---

## 💳 6. Qulqulka Lacag-bixinta EVC Plus (Payment Workflow)

1. Macaamilku wuxuu dooranayaa buug lacag ah.
2. Nidaamku wuxuu abuurayaa dalab leh xaaladda `pending`.
3. Macaamilka waxaa loo soo bandhigayaa lambarka EVC Plus ee **0613424271** iyo qiimaha buugga.
4. Fariinta tilmaamaha:
   > *"Fadlan lacagta ugu dir lambarka EVC Plus ee kore. Kadib geli Transaction ID-gaaga oo gudbi codsiga. Buugga waxaa laguu furayaa marka maamulka xaqiijiyo lacagta."*
5. Macaamilku wuxuu gelinayaa Transaction ID-ga (tusaale, `TX98231` ama `0612345678`).
6. Codsiga waxaa lagu kaydiyaa `payment_requests` isagoo ah `pending`.
7. Maamuluhu wuxuu ka eegayaa qaybta **"Maamulka ➔ Xaqiijinta EVC Plus"**, markuu xaqiijiyo in lacagtu soo dhacdayna wuxuu riixayaa **"Aqbal oo Fur Buugga"**.
8. Dalabku wuxuu noqonayaa `paid`, macaamilkuna wuxuu buugga ka helayaa **"Maktabaddayda"** isagoo toos u akhrisan kara PDF-ka.

---

## 🧪 7. Tijaabinta Nidaamka (Testing Checklist)

1. **Galitaanka & Diiwaangelinta:**
   - Tijaabi sameysashada koonto cusub, galitaan, iyo ka bixid.
2. **Baadhis & Miirid (Search & Filters):**
   - Baadh buugaagta adoo adeegsanaya qoraalka iyo qaybaha kala duwan (Diinta, Taariikh, Ganacsi, iwm.).
3. **Akhriska Buugaagta Bilaashka ah:**
   - Riix buug bilaash ah sida "Diiwaanka Gabayada Soomaaliyeed" ➔ riix "Akhri Buugga Hadda" ➔ tijaabi rogidda bogagga iyo keydinta meesha aad maraysay.
4. **Iibsashada & Gudbinta EVC Plus:**
   - Xulo buug lacag ah ➔ riix "Iibso Buuggan" ➔ koobiyeey lambarka `0613424271` ➔ geli Transaction ID ➔ xaqiiji in codsigu galay xaaladda *Pending*.
5. **Maamulka & Xaqiijinta:**
   - Gal koontada Maamulaha ➔ fur Qeybta Maamulka ➔ arag tirakoobka ➔ aqbal codsigii EVC Plus ➔ hubi inuu u furmay macaamilka.
6. **Kudarida & Wax ka bedelka Buugaagta:**
   - Ku dar buug cusub, geli sawir jeldi ah iyo PDF, beddel qiimaha ama ka dhig bilaash.

---

## 🚢 8. Sida Loo Kiciyo loona Daabaco (Run and Deploy)

### Horumarinta Maxalliga ah (Local Development)
```bash
# Soo deji dependencies
npm install

# Kici server-ka tijaabada
npm run dev
```

### Dhismaha Wax-soo-saarka (Production Build)
```bash
npm run build
```

Codsigani waa mid diyaar u ah daabacaadda Cloud Run, Vercel, Netlify, ama server kasta oo taageera Vite & React.
