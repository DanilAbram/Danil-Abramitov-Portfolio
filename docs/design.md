# Plan: Danil Abramitov — online resume website (white & green)

## Context
Danil wants a personal website to show recruiters/employers instead of a paper resume. It must look polished in white and green, be built with plain HTML/CSS/JS, and contain About Me, What I Can Do, and social/contact links. All content comes from `C:\Users\abram\Documents\Личные Доки\Danil Abramitov Resume.pdf`. Project folder `C:\Users\abram\Desktop\Fisrt P` is empty (no git, no existing code).

Decisions made with the user:
- Audience: **employers / recruiters** (job hunting: client service, customer support, admin roles).
- Style: **looks like a modern website** (one-page scroll), not a paper-sheet replica — info taken from the CV.
- Socials: **LinkedIn, GitHub, Email**. URLs not given yet → clearly marked placeholders (`TODO: your LinkedIn URL`).
- Privacy: **email only** on the page; phone stays only inside the downloadable PDF.

My calls (user can correct): English copy; no photo yet — "DA" monogram avatar with a marked spot to swap in a photo; free hosting later via GitHub Pages; no frameworks, no build step.

## Approaches considered
1. **One-page scrolling site (chosen)** — sticky nav, hero, stacked sections. Feels like a real website, fast, easy to host, recruiter sees everything in one scroll.
2. Paper-sheet replica (two-column "resume on screen") — rejected by user; wanted a website feel.
3. Multi-page site — overkill for this amount of content; more clicks for recruiters.

## File structure
```
Fisrt P/
  index.html
  css/styles.css
  js/main.js
  assets/Danil-Abramitov-Resume.pdf   (copied from Documents)
  assets/favicon.svg                   ("DA" monogram, green)
  docs/design.md                       (this design, saved as the spec)
```

## Visual design
- Palette (CSS custom properties on `:root`): white `#FFFFFF` base, soft mint surface `#F1F8F4`, primary forest green `#166534`, accent `#22A355`, deep text `#0F2419`, muted text `#4B5E53`, borders `#D9E8DF`. Green is used for headings accents, buttons, icons, timeline line, chips — never large blocks of saturated green behind body text (keeps it "white & green", calm and professional).
- Type (Google Fonts): **Manrope** for headings, **Source Sans 3** for body. Fluid sizes with `clamp()`.
- Feel: generous whitespace, rounded 14–16px cards, subtle shadows, thin green rules echoing the CV's section dividers.
- Final pass with **impeccable** (critique/polish/audit) and **ui-ux-pro-max** rules for contrast, spacing and accessibility.

## Page sections (content from CV, tightened)
1. **Sticky nav** — "DA" monogram · About · What I Can Do · Experience · Skills · Contact · [Download CV] button. Hamburger menu on mobile.
2. **Hero** — "Hi, I'm Danil Abramitov"; tagline "Client Service · Customer Support · Administrative & Computer Skills"; line "Ottawa · Fluent in English, Ukrainian & Russian"; buttons [Contact me] [Download CV]; 3 quick-fact tiles: "Serving customers since 2023", "3 languages", "High School Diploma 2026".
3. **About Me** — first-person rewrite of the Professional Summary (2 short paragraphs) + Relevant Strengths as small tags (Reliable, Calm & respectful, Detail-oriented, Quick learner…).
4. **What I Can Do for Your Team** — 6 cards with simple inline SVG icons: Customer Service · Clear Communication & Active Listening · Accuracy & Data Entry · Organization & Prioritization · Computer & Office Skills · Multilingual Support (UA/RU/EN).
5. **Experience** — vertical green timeline: Independent Grocer — Grocery Clerk (May 2026–Present), FreshCo — Grocery Clerk (Jun 2023–Oct 2024); 3–4 strongest bullets each.
6. **Skills & Education** — Core skills chips, Computer skills chips (Word, Excel, Email/Outlook, PDFs, Internet research, File management, Online systems & data entry), Languages with level labels (Native/Fluent/Fluent), Education card (Bell High School, Ottawa — Diploma 2026).
7. **Contact** — "Let's work together" CTA; email (mailto + "Copy email" button), LinkedIn, GitHub (placeholders), Download CV.
8. **Footer** — name, © year (JS), back-to-top.

## JavaScript (`js/main.js`, small, no libraries)
- Mobile nav toggle (aria-expanded, closes on link click / Esc).
- Active nav link highlight via IntersectionObserver.
- Scroll-reveal fade-up for sections; disabled under `prefers-reduced-motion`.
- "Copy email" button with "Copied!" feedback (Clipboard API, fallback to mailto).
- Footer year.

## Quality bar
Semantic HTML (header/nav/main/section/footer, one h1), alt/aria labels, visible focus states, WCAG AA contrast, responsive at 375 / 768 / 1280+, meta description + Open Graph tags for nice link previews, print stylesheet that hides nav/buttons.

## Execution (per user: Sonnet 5.5 agents for small tasks, Opus 5.5 for bigger ones)
1. Save memory of the agent-model preference; save this design to `docs/design.md`.
2. **Sonnet 5.5 subagent**: create folders, copy CV PDF into `assets/`, make `favicon.svg`.
3. **Opus 5.5 (me)**: build `index.html` + `css/styles.css` — the main design work, guided by impeccable / ui-ux-pro-max.
4. **Sonnet 5.5 subagent**: write `js/main.js` to the spec above.
5. **Opus 5.5 (me)**: impeccable polish/audit pass on the result.

## Verification
- Open `index.html` in the built-in browser pane (static server via `.claude/launch.json`, e.g. `npx serve` or `python -m http.server`).
- Screenshots at desktop and mobile (375px) widths; check nav toggle, copy-email, Download CV link, smooth scroll, reveal animations.
- Read console for errors; confirm no phone number appears in page text.
- Check contrast of green-on-white text and focus outlines via keyboard Tab-through.
- Tell Danil what placeholders remain (LinkedIn URL, GitHub URL, optional photo).
