# CardVault 🃏

แพลตฟอร์มซื้อ ขาย สุ่ม ประมูลการ์ดสะสม ครบจบในที่เดียว

## Features

- 🛍️ **ร้านค้า** — ซื้อการ์ดตรงได้เลย
- ✨ **สุ่มแพ็ค** — เปิดแพ็ค พร้อม animation
- 🔨 **ประมูล Real-time** — via Supabase Realtime
- 🏪 **Marketplace** — ซื้อขายระหว่างผู้ใช้
- 💰 **Wallet** — เติมเงินผ่าน Omise
- 🗂️ **คลังการ์ด** — จัดการ collection
- ⚙️ **Admin Panel** — จัดการทุกอย่าง

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Database, Auth, Realtime, Storage)
- **Tailwind CSS**
- **Omise** (Payment)
- **Vercel** (Deploy)

## การติดตั้ง

### 1. Clone & Install

```bash
npm install
```

### 2. สร้าง Supabase Project

ไปที่ [supabase.com](https://supabase.com) → New project

### 3. Run Database Schema

ไปที่ SQL Editor ใน Supabase แล้ว copy-paste ทั้งหมดจากไฟล์:
```
supabase/schema.sql
```

### 4. ตั้งค่า Environment Variables

```bash
cp .env.local.example .env.local
```

แก้ไขค่าใน `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_OMISE_PUBLIC_KEY=pkey_...
OMISE_SECRET_KEY=skey_...
```

### 5. Enable Google OAuth (ถ้าต้องการ)

Supabase Dashboard → Authentication → Providers → Google

### 6. Run Dev Server

```bash
npm run dev
```

เปิด http://localhost:3000

## สร้าง Admin User

1. สมัครสมาชิกปกติก่อน
2. ไปที่ Supabase → Table Editor → profiles
3. แก้ `role` จาก `user` เป็น `admin`

## Deploy บน Vercel

```bash
npm install -g vercel
vercel
```

ใส่ Environment Variables เดียวกันใน Vercel Dashboard

## ขยายระบบเพิ่ม

| Feature | ต้องทำอะไร |
|---------|-----------|
| Live Stream | ต่อกับ Mux.com หรือ 100ms |
| จัดส่งของจริง | เพิ่มหน้า shipping + integrate กับ Kerry/Thailand Post API |
| Flash Auction | เพิ่ม cron job หมดเวลา via Vercel Cron |
| ระบบ Rating | เพิ่ม table `reviews` |
| Push Notification | ต่อ OneSignal |

## Structure

```
src/
├── app/
│   ├── page.tsx          # Homepage
│   ├── shop/             # ร้านค้า
│   ├── pack/             # สุ่มแพ็ค
│   ├── auction/          # ประมูล
│   ├── marketplace/      # Marketplace
│   ├── dashboard/        # คลังการ์ด + wallet
│   ├── admin/            # Admin panel
│   ├── auth/             # Login/Register
│   └── api/              # API Routes
├── components/
│   ├── cards/            # CardItem component
│   └── layout/           # Navbar
├── lib/supabase/         # Supabase clients
├── types/                # TypeScript types
└── styles/               # Global CSS
```
