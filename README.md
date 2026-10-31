# Mainflow School — Website

Modern, responsive website for **Mainflow School**, Ngong, Kajiado County, Kenya.

Built with **Next.js (App Router) + React + TypeScript + Tailwind CSS v4**. No other runtime
dependencies — fonts are self-hosted, icons are inline SVG.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Other scripts: `npm run typecheck`.

## Pages

| URL            | Purpose                                                               |
| -------------- | --------------------------------------------------------------------- |
| `/`            | Home — hero, welcome, feature cards, academics & gallery previews, CTA |
| `/about`       | Introduction, history, philosophy, vision, mission, values, leadership |
| `/academics`   | Curriculum, grades, teaching approach, learning areas, assessments     |
| `/admissions`  | Steps, documents, visits, FAQs and the **working enquiry form**        |
| `/school-life` | Everyday school life                                                   |
| `/gallery`     | Filterable photo gallery with full-screen lightbox                     |
| `/contact`     | Verified contact details, map/directions link, contact form            |
| `/admin`       | Password-protected staff dashboard                                     |
| `/login`       | Staff sign-in (friendly alias of `/admin`)                             |
| `/sitemap.xml` | SEO sitemap · `/robots.txt` robots rules                               |

## Admin dashboard (`/admin`, alias `/login`)

Staff sign-in is available at **`/login`** (also linked as “Staff” in the navigation bar and
“Staff login” in the footer). Environment variables (see `.env.example`):

- `ADMIN_PASSWORD` — seeds the first staff account (`admin`) on first use, min 8 characters
- `SESSION_SECRET` — min 16 characters, keep random (signs session cookies)
- Sessions are HMAC-signed, http-only cookies that expire after 8 hours.
- Login attempts are rate-limited (5 per 15 minutes per IP).

### Staff accounts & profiles

The dashboard uses **individual staff accounts** with scrypt-hashed passwords (never plaintext):

- **My Profile** — every staff member can view their account and change their own full name and
  password (current password required for any change).
- **Staff accounts** (administrators only) — create accounts, assign roles, deactivate/activate,
  reset passwords and delete accounts. Guards prevent removing the last active administrator,
  and nobody can delete or deactivate their own account.
- **Roles:** `admin` = full access including staff management; `editor` = website content and
  photographs. Accounts are stored in `data/staff.json` (gitignored).

From the dashboard staff can edit: school contact info, About text, academics content,
admissions steps/documents, FAQs, **announcements** (gold top bar), **fee items**,
**photograph uploads** (with mandatory consent confirmation), and view/respond to
**admissions enquiries** (personal data — keep confidential).

## How enquiries are handled (real submissions)

1. Form → `POST /api/enquiries` (validated, honeypot + rate limiting).
2. Stored in `data/enquiries.json` → visible in the admin dashboard (**always**).
3. Optionally forwarded by email/webhook if configured:
   - `FORM_WEBHOOK_URL` — any JSON webhook (Make/Zapier/CRM), or
   - `RESEND_API_KEY` + `RESEND_FROM` + `RESEND_TO` — transactional email via Resend.

Without any email provider configured, submissions still genuinely persist server-side and are
listed in the dashboard — the form is never a fake success message.

> Deployment note: `data/` is a local filesystem store, ideal for a VPS, VM or any host with a
> persistent disk. On serverless platforms (Vercel/Netlify/Cloudflare) the filesystem is ephemeral —
> point the store in `src/lib/enquiries.ts` / `src/lib/store.ts` at a database (e.g. Turso/D1/Postgres)
> before going live there.

## Content integrity rules (important)

The site must never invent facts about the school. Rules baked into the content:

- **Verified & published:** phone numbers `0725 958 589`, `0722 751 770`; email
  `mainflowp@yahoo.com`.
- **Reported, needs confirmation:** postal address (P.O. Box 1199, Ngong Hills, 00208).
- **Location details removed by school instruction:** the website no longer publishes a street/road
  location, directions or a map link. Re-add them in the dashboard once the school confirms the
  exact address (the schema fields were removed; restore `locationLine`/`roadNote`/`directionsQuery`
  in `src/lib/content-schema.ts` if wanted again). Ngong/Kajiado wording remains only in SEO
  metadata and general prose.
- **School-confirmed (per the school's instruction):** the Competency-Based Education (**CBE**)
  curriculum, classes from early years through **Grade 9**, and the co-curricular activities listed
  on the School Life page (all editable in the dashboard).
- **Never stated without confirmation:** curriculum details beyond CBE, fees, staff names, school
  history dates, awards, results, testimonials.
- **Photography:** the gallery uses clearly-labelled *illustrations* labelled "photo to be added" —
  never stock or AI imagery presented as real school photographs. Real photos can be uploaded via
  the dashboard; the upload form requires written-permission confirmation before publishing.
- **WhatsApp button** is hidden until an official WhatsApp number is entered in the dashboard.

See `docs/VERIFICATION_CHECKLIST.md` for the pre-launch checklist.

## SEO

- Title/description per page, keyword targets: "Mainflow School", "Mainflow School
  Ngong", "private primary schools in Ngong".
- `School` JSON-LD structured data (verified contact details only), OpenGraph/Twitter cards,
  canonical URLs, sitemap, robots.
- Set `NEXT_PUBLIC_SITE_URL` to the real domain before launch.

## Accessibility & responsiveness

- Semantic landmarks, skip link, focus-visible outlines, keyboard-operable menu and lightbox
  (Esc / arrow keys), aria labels on interactive icons.
- Mobile-first layout tested from 360 px phones through tablets to wide desktops; animations
  respect `prefers-reduced-motion`.
