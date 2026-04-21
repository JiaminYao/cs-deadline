# 📅 CS Deadline

**Track computer science conference deadlines with live countdowns, timezone awareness, and smart filtering — built for researchers submitting to CORE / CSRankings venues.**

A free, fast, static site that pulls deadline data from WikiCFP and ccf-deadlines, cross-references CORE 2023 rankings and CSRankings, and shows you exactly when your next submission is due — in *your* timezone.

👉 **[Visit Now — No sign-up required!](https://csdeadline.pages.dev)**

## 🚀 How to Use

1. 👀 **Browse** — Open the site and see the next upcoming deadline with a live countdown
2. 🔍 **Filter** — Narrow by domain, CORE rank, organizer, or CSRankings — combine freely
3. 🌏 **Pick your timezone** — Auto-detect or choose from 12 presets; every deadline renders in your local time
4. ⭐ **Favorite** — Star the conferences you care about to pin them
5. 📆 **Add to calendar** — One-click export to iCal / Google / Yahoo / Outlook
6. 🔗 **Share** — All filters sync to the URL; share a filtered view with one link

## ✨ Features

- ⏱️ Live D/H/M/S countdown with urgency color coding (safe → soon → urgent → critical → expired)
- 🌐 Timezone-aware deadlines — stored in original conference timezone (AoE, UTC, PST…), rendered in yours
- 🏆 CORE 2023 ranks (A★ / A / B / C / Non-CORE) + CSRankings indicators
- 🏷️ Multi-domain tagging for cross-disciplinary venues
- 🔎 Fuzzy search by title or full name
- 📋 Filter by domain, rank, organizer, CSRankings — all URL-synced and shareable
- ⭐ Local favorites to pin conferences you follow
- 📆 One-click calendar export (iCal / Google / Yahoo / Outlook)
- 📝 Abstract deadline notes for conferences with two-stage submissions
- 📦 Collapsible Past Events section for recent history
- 🌙 Dark mode + mobile responsive

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Static Export) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v3 |
| Icons | lucide-react |
| Search | Fuse.js (fuzzy matching) |
| Calendar | `ics` package + Google / Yahoo / Outlook URL builders |
| Theming | next-themes |
| Data | Static JSON bundled at build time (no backend) |
| Data sources | [CORE Portal](https://portal.core.edu.au/conf-ranks/) (ICORE2023), [CSRankings](https://csrankings.org) by Emery Berger, [WikiCFP](http://www.wikicfp.com), [ccf-deadlines](https://github.com/ccfddl/ccf-deadlines) (MIT). See [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md). |
| Hosting | Cloudflare Pages |

⭐ If you enjoyed this project, give it a star! It means a lot!
