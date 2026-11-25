# Design

Online resume for Danil Abramitov. One page, **dark only**, in Danil's five blues, adapted from the Anima "Split Studio" style (dark ground, large soft serif headlines, clean sans text, generous spacing). The staff **name badge** in the hero stays as the page's signature object.

## Colors

Tokens live in `css/styles.css` `:root` as semantic names. Dark only; there is no light theme.

| Token | Value | Use |
|---|---|---|
| `--bg` | #08171E | night: page ground |
| `--tint` | #042B44 | navy: What I make ground, chips |
| `--surface` | #0d2f42 | badge, icon tiles |
| `--tint-2` | #14405a | secondary fills |
| `--line` | #1c4358 | hairlines, borders |
| `--text` | #f3f9fb | body text (17:1) |
| `--text-muted` | #b5d0dc | secondary text (11:1, 9:1 on navy) |
| `--accent` | #71B7D5 | sky: links, icons, greeting, highlights (8:1) |
| `--accent-strong` | #096B90 | lake: button fill, badge strap (white text 6:1) |
| `--accent-hover` | #075977 | button hover |
| `--leaf` | #A1CCDC | ice: title underline, focus ring; on the lake band only for the large title |
| `--band` | #096B90 | lake: contact band, footer, Next project |
| `--ink` / `--ink-muted` | #042B44 / #3d6074 | text and fills on the light form card |
| `--card` / `--card-line` | #f1f8fb / #c3dce7 | form card and its borders |

The palette is Danil's choice (2026-11-25): #042B44, #096B90, #A1CCDC, #08171E, #71B7D5. It replaced the purple; every other colour is a lighter or darker step of these five. Red appears only in form errors.

## Typography

- Headlines (h1, h2, badge name, project title): **Young Serif** 400, letter-spacing -0.02em, line-height ~1.12–1.2. Free stand-in for Anima's Roslindale Deck.
- Everything else (body, h3, nav, buttons): **Mulish** 400–800. Body 1.125rem / 1.6.
- Section titles carry a 3rem × 4px ice underline. No eyebrows or section numbers (the 3 build steps are a real sequence).

## Components

- Buttons: 8px radius. `btn-primary` lake fill, white text; `btn-ghost` surface fill, line border, light text.
- Chips & tags: 6px radius.
- Cards/frames (badge, preview frame): 12px radius. Icon tiles: 8px.
- Copy button next to the email (for visitors without a mail app). Footer: email, LinkedIn and GitHub icon links + back to top.
- Websites & AI: project screenshots (Sage, Bunker 7) + three steps.
- Icons: **coolicons v5.3** (line / round, MIT, credit in `CREDITS.md`), drawn once in an inline SVG sprite (`<symbol id="i-…">`, reused with `<use>`). 24px grid, 2px stroke, round caps, `currentColor`. Ids: i-chat, i-check, i-tick, i-list, i-monitor, i-table, i-sparkle, i-phone-check, i-mail, i-linkedin, i-github, i-arrow-up/down/right, i-send, i-menu, i-close, i-copy, i-translate, i-book, i-external. The mobile menu button swaps menu/close; Copy swaps copy/tick; external links get a small i-external mark.

## Page structure (five full screens)

Each part is a `.screen` (min-height 100svh, vertically centred). **Page stack:** every screen except the last is sticky (`--stick` = min(0, viewport - its height), so tall pages stick only once fully read). The next screen, with 28px rounded top corners and an upward shadow, slides over it while the covered page scales down to 93% and dims (`--cover` 0..1). Scroll snapping is off while stacking is on. The nav highlight uses measured flow positions.

1. **Hero**: the greeting cycles "Hello" in 17 widely spoken languages, then "I'm Danil Abramitov", a short line about what he does, then "Contact me" (primary) and "See my work" (ghost, scrolls to My work). Background art: inline SVG `.hero-art` with lake-blue gradient shapes, ice outlines and radiating lines that grow and fade in on load. The "Tools I use" marquee sits at the bottom.
2. **About me**: lead text, tags and a facts list (languages, education, computer, open to), with the swinging name badge on a lanyard to the right (round photo `assets/danil-avatar.webp`, a 256px face crop of `assets/danil-source.jpg`, with a lake-blue ring, name, EN/UA/RU, and an "Ask me anything" link at the bottom that jumps to the contact form).
3. **My work**: heading with filter pills (All, Websites, AI, Games) and a project count. Cards: the first project is a wide row (8:5 picture + serif title, tags, one sentence, "View project", live link, GitHub); more sit two per row, and one left alone becomes a mirrored wide row. The whole card opens a full-screen project page (`dialog#case`, address `#work/sage`, `#work/bunker-7`): back bar with previous/next, picture gallery, the challenge, how it works, features, the result, details, "Start a project with me" (closes the page and opens the form), "Next project" band. Pressing a card makes its picture fly and grow into the project page (0.7s) while the background and text fade in; closing flies it back; next/previous slides sideways; none of it runs under reduced motion. Then three build steps. To add a project: one `li.project` + one `article.case-page`. Pictures are in `assets/work/` as WebP, 1280 and 720 wide (card pictures also 576).
4. **What I can make for you** (`--tint` ground): big two-tone title ("for you" in `--accent`), one short line and an outlined pill "Start a project" on the left; a ruled list on the right (Websites, Mobile apps, AI tools: line icon, serif name, one sentence). "Start a project" opens the contact form with that answer already chosen.
5. **Contact** (lake band): big two-tone title "Get in touch", a short line and ruled rows (email with Copy, LinkedIn, GitHub) on the left; the **form** on a light card (`--card`, `--ink`, 22px radius, white fields 12px, pill choices and button in `--ink`) on the right. Questions: what's this about (Start a project / Just get in touch), what to make (only for a project: Website, Mobile app, AI tool, Not sure yet), name, email or phone (one is enough), details. "Send message" checks the fields, then posts JSON to FormSubmit (`formsubmit.co/ajax/<email>`), which emails it to Danil. States: spinner + "Sending…" (button disabled); a thank-you panel replacing the form (with "Send another message"); an error box with an "email it to me instead" mailto backup. A hidden honeypot field (`_honey`) stops bots.

The header has no logo, only the name (first name alone at 345px and below). It is transparent over the hero; once scrolled it becomes a floating "liquid glass" pill (`.site-header::before`: backdrop blur, darkened so white text stays readable, light rim, soft shadow). In Chromium at 900px and up, the `#liquid` SVG filter also bends what is behind the edges; `drawGlass` in `main.js` draws its map. Phones and other browsers get the blur only; the phone menu is a matching glass panel. Without backdrop support, or with reduced transparency, it is solid `--surface`. It has a white pill "Contact me" CTA at every size.

## Motion

- The hero greeting changes every 2s. Arabic is set `dir="rtl"`.
- Hero art grows and fades in once (1.2s, transform and opacity only); tools strip scrolls continuously.
- Badge swings in on load, tilts toward the pointer on fine pointers.
- Scroll: a 3px sky progress line under the header; the hero copy drifts up and fades while the background art moves slower (depth); sections rise in from a soft blur; lists inside them (tags, facts, contact links) arrive one by one (70ms apart); section underlines draw in; the badge swings only when its section is reached; the site preview straightens as it scrolls into view.
- Scroll values are written as CSS variables once per animation frame (--progress, --hero-p, --cover). All motion is off under prefers-reduced-motion.

## Layout

- Container 1120px, gutter `clamp(1rem, 4vw, 2.5rem)`, section padding `clamp(5rem, 11vw, 7.5rem)`.
- Breakpoints: 900px (nav → menu, hero stacks), 760px (single-column lists).

## Search and sharing

- Canonical link, Open Graph and Twitter tags, `assets/share.png` (1200×630), ProfilePage JSON-LD, `robots.txt`, `sitemap.xml`. Change the address in all of them if a custom domain is added.

## Other pages

- 404.html: the same dark styling, a short message and a button back to the main page (Vercel serves it automatically).
