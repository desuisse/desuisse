# DeSuisse – Next.js Website

A full Next.js 14 rebuild of [desuisse.com](https://desuisse.com) with bilingual support (Albanian / English), a product admin panel, and all main pages.

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production

```bash
npm run build
npm start
```

---

## 📄 Pages

| URL | Description |
|-----|-------------|
| `/` | Home page with hero, categories, featured products |
| `/shop` | Full product shop with category filter |
| `/about` | About Us / company history |
| `/contact` | Contact form + FAQ |
| `/admin` | **Admin panel** (password protected) |

---

## 🔐 Admin Panel (`/admin`)

The original admin signs in as **Lorik** with the password held in the server-side `ADMIN_PASSWORD` environment variable. Lorik can create named admin logins on the **Administrators** tab. See [the admin guide](public/ADMIN_GUIDE_FOR_COLLEAGUE.md).

Your colleague can use the admin panel to:
- ✅ **Add** new products (name, price, category, image URL, description)
- ✅ **Edit** existing products
- ✅ **Delete** products
- ✅ **Mark as featured** (shows on homepage)
- ✅ **Set hover image** (second image shown on hover)
- ✅ **Search & filter** by category

> To change Lorik's password, update `ADMIN_PASSWORD` in the deployment environment and redeploy. Never put admin passwords in source code.

Admin photo uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` in Vercel's server environment. Set them before deploying
the signed uploader. After deployment, disable or delete the old unsigned
`desuisse_products` upload preset in Cloudinary. The old preset remains usable
until it is disabled, even after the website code stops using it.

---

## 🌐 Language Switching

The header has an **ALB | EN** switcher. The language preference is saved in the browser so it persists between visits.

---

## 🗄️ Product Storage

Products and named admin accounts are stored in **Upstash Redis**. Admin passwords are stored as bcrypt hashes. Product publisher names are assigned by the server from the signed-in admin session. The original catalogue is attributed to Lorik.

---

## 🎨 Customization

| File | What to change |
|------|----------------|
| `src/lib/translations.ts` | All Albanian & English text |
| `src/data/products.ts` | Default product list |
| `src/app/globals.css` | Colors, fonts, spacing |
| `tailwind.config.js` | Design tokens |

---

## 🖼️ Adding a Local Hero Image

Place your main ring photo at:
```
public/images/hero-ring.jpg
```

It will automatically be used as the hero background.

---

## 📦 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Cormorant Garamond** + **Montserrat** fonts (Google Fonts)
- No external database required (localStorage for products)
