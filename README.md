# Flux Agency — Marketing Website

A production-quality, multi-page, multi-language marketing site for **Flux Agency**, a premium IT & digital solutions studio. Built with Next.js (App Router), TypeScript, Tailwind CSS, next-intl and Framer Motion.

## Stack

- **Next.js 16** (App Router, static generation per locale)
- **TypeScript**
- **Tailwind CSS v4**
- **next-intl** — i18n routing, RTL/LTR handling
- **Framer Motion** — entrance animations, Services Explorer transitions
- **lucide-react** — icon set

## Languages

- `he` — Hebrew (default)
- `ru` — Russian
- `en` — English
- `ar` — Arabic

Hebrew and Arabic are RTL. Per the client's requirement, only **text content** (headings, paragraphs, lists) follows the locale's natural reading direction — structural "chrome" (header, nav, logo, language switcher, burger menu, CTA button positions) always keeps the same physical left-to-right arrangement across all four languages. This is implemented via:

- `html[dir]` set per locale (`rtl` for he/ar, `ltr` for en/ru) — governs default content flow.
- A `.chrome-ltr` utility class (`direction: ltr`) applied to structural containers (header, footer columns, buttons, language switcher, the Services Explorer's 35/65 split, etc.) so they never mirror.
- A `<BidiBlock>` component that re-asserts the correct `dir` + text alignment for text content that lives *inside* a `chrome-ltr` ancestor (e.g. the hero headline, service card copy), since CSS `direction` is inherited and would otherwise force that text into the wrong direction too.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/he`.

```bash
npm run build   # production build (also type-checks)
npm run start   # serve the production build
npm run lint     # ESLint
```

## Project structure

```
src/
  i18n/                 next-intl routing/navigation/request config
  middleware.ts         locale detection & routing middleware
  messages/             he.json, ru.json, en.json, ar.json — all UI + page copy
  lib/
    fonts.ts             IBM Plex Sans / Hebrew / Arabic font loaders
    services-data.ts      Services Explorer category/service structure + icons
    portfolio-data.ts     Portfolio case list + image mapping
  components/
    layout/               Header, Footer, MobileMenu, LanguageSwitcher
    ui/                    Container, Button, SectionHeading, BidiBlock
    icons/                 StarOfDavid (decorative geometric mark)
    home/                  Hero, StatsBar, ServicesTeaser, PortfolioTeaser, Philosophy
    services/              ServicesExplorer, CategoryNav, ServiceGrid, ServiceCard, ServiceDetail
    portfolio/             PortfolioGrid, CaseCard
    about/                 ItemsGrid
    contact/               ContactForm
  app/
    globals.css            design tokens, RTL/chrome utilities, blueprint-grid pattern
    [locale]/
      layout.tsx           root layout (html/body, fonts, Header/Footer)
      page.tsx              Home
      services/page.tsx     Services Explorer
      portfolio/page.tsx    Portfolio
      about/page.tsx        About
      contact/page.tsx      Contact
public/images/            AI-generated hero, services-category and portfolio imagery
```

## Design system

- Background `#070B12`, surface `#0C1220`, border `rgba(255,255,255,0.08)`, text `#F5F7FA`, muted `#8A94A6`, accent `#2563EB`.
- Editorial, minimal-luxury aesthetic — huge negative space, thin geometric lines, no gradients/glossy effects.
- Fonts: IBM Plex Sans (Latin/Cyrillic), IBM Plex Sans Hebrew, IBM Plex Sans Arabic — a matched type family across all four locales.

## Services Explorer

The centerpiece interactive section (`/services`) — a 35/65 split with huge vertical category typography on the left and a dynamic right panel:

- Selecting a category animates in an asymmetric "magazine" grid of service cards, with a large low-opacity watermark of the category name behind them and a subtle blueprint grid pattern.
- Clicking a card morphs the panel (no navigation) into a service detail view: title, description, feature checklist, "Explore service" CTA and a generated architectural image.
- On mobile/tablet the same left/right structure collapses into a single column — the category list sits on top (large tap targets), and the panel below always reflects whichever category is active, satisfying the "stacked, expands on tap" requirement without a separate, divergent mobile implementation.

## Imagery

All hero, services-category and portfolio thumbnails are AI-generated (`public/images/`) — abstract, dark architectural compositions with thin blue accent lines, deliberately avoiding any literal reuse of the client's reference screenshot and avoiding a real-estate/interior-photography feel, per the brief.

## Known simplifications / open questions for the client

- **Contact details** (email, phone, address, hours) are placeholders (`hello@fluxagency.com`, Rothschild Blvd, etc.) — swap in real details.
- **Contact form** is front-end only (simulated submit with a success state); wire it up to an email/CRM endpoint before launch.
- **Portfolio case studies** (9 entries) use invented client names/descriptions consistent with the agency's positioning — replace with real case studies, metrics and (optionally) real screenshots once available.
- **Logo** is a simple geometric wordmark (accent dot + "Flux Agency"); swap in a real logo asset if the client has one.
- The Services Explorer's card-to-card "connecting lines" are represented via a shared 1px grid seam (cards sit in a bordered grid over a blueprint pattern + watermark) rather than literal per-card connector lines, to keep the interaction robust across breakpoints — happy to art-direct a literal wired-diagram version if the client wants it more literal.
