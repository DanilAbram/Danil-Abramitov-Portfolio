# Design

Online resume for Danil Abramitov. One page, **dark only**, purple, adapted from the Anima "Split Studio" style (dark ground, large soft serif headlines, clean sans text, generous spacing). The staff **name badge** in the hero stays as the page's signature object.

## Colors

Tokens live in `css/styles.css` `:root` as semantic names. Dark only; there is no light theme.

| Token | Value | Use |
|---|---|---|
| `--bg` | #222224 | page ground |
| `--tint` | #2b2b2b | section bands, hero field |
| `--surface` | #333336 | badge, chips, icon tiles |
| `--tint-2` | #3b3b3b | secondary fills |
| `--line` | #3d3d41 | hairlines, borders |
| `--text` | #f7f7f7 | body text |
| `--text-muted` | #bbbcbd | secondary text (8.6:1) |
| `--accent` | #b4a6f7 | links, icons, greeting, highlights |
| `--accent-strong` | #6a4fd1 | button fill, badge strap (white text 5.7:1) |
| `--accent-hover` | #5a3fc0 | button hover |
| `--leaf` | #d2c8fa | light lilac highlight: title underline, focus ring, active nav (never body text) |
| `--band` | #35286f | contact band + footer (deep purple) |

No blue anywhere: the whole accent family is purple (user's choice).

## Typography

- Headlines (h1, h2, badge name, project title): **Young Serif** 400, letter-spacing -0.02em, line-height ~1.12–1.2. Free stand-in for Anima's Roslindale Deck.
- Everything else (body, h3, nav, buttons): **Mulish** 400–800. Body 1.125rem / 1.6.
- Section titles carry a 3rem × 4px purple underline. No eyebrows or section numbers (the 3 build steps are a real sequence).

## Components

- Buttons: 8px radius. `btn-primary` purple fill, white text; `btn-ghost` surface fill, line border, light text.
- Chips & tags: 6px radius.
- Cards/frames (badge, preview frame): 12px radius. Icon tiles: 8px.
- Copy button next to the email (for visitors without a mail app). Footer: email, LinkedIn and GitHub icon links + back to top.
- Websites & AI: code-drawn miniature of this site + three steps.
- Icons: inline SVG sprite, 24px grid, 1.8–1.9 stroke, round caps.

## Page structure (five full screens)

Each part is a `.screen` (min-height 100svh, vertically centred). **Page stack:** every screen except the last is sticky (`--stick` = min(0, viewport - its height), so tall pages stick only once fully read). The next screen, with 28px rounded top corners and an upward shadow, slides over it while the covered page scales down to 93% and dims (`--cover` 0..1). Scroll snapping is off while stacking is on. The nav highlight uses measured flow positions.

1. **Hero**: the greeting cycles "Hello" in 17 widely spoken languages, then "I'm Danil Abramitov", a short line about what he does, then "Contact me" (primary) and "See what I can make" (ghost, scrolls to services). Background art: inline SVG `.hero-art` with purple gradient shapes, copper `#f2c2a2` outlines and radiating lines, drawn in on load. The "Tools I use" marquee sits at the bottom.
2. **About me**: lead text, tags and a facts list (languages, education, computer), with the swinging name badge on a lanyard to the right (name, EN/UA/RU, and an "Ask me anything" link at the bottom that jumps to the contact form).
3. **What I can make for you**: two offer panels, "A website, built with AI" and "Data entry & admin help". Each has ticks and an "Ask about…" link that pre-selects that service in the form.
4. **My work**: this website as the project, with a code-drawn mini preview, chips, a "See the code on GitHub" button and three build steps.
5. **Contact** (deep purple band): title "Tell Me What Your Company Needs", intro, email, LinkedIn and GitHub links, and the **request form**. The form asks for name, email, an optional phone and business, the service (radio pills) and details. "Send request" checks the fields, then posts JSON to FormSubmit (`formsubmit.co/ajax/<email>`), which emails the request to Danil. States: spinner + "Sending…" (button disabled); a thank-you panel replacing the form (with "Send another request"); an error box with an "email it to me instead" mailto backup. A hidden honeypot field (`_honey`) stops bots.

The header is transparent over the hero and turns solid `--bg` once scrolled. It has a white pill "Contact me" CTA on desktop.

## Motion

- The hero greeting changes every 2s. Arabic is set `dir="rtl"`.
- Hero art draws in once; tools strip scrolls continuously.
- Badge swings in on load, tilts toward the pointer on fine pointers.
- Scroll: a 3px purple progress line under the header; the hero copy drifts up and fades while the background art moves slower (depth); sections rise in from a soft blur; lists inside them (tags, facts, ticks, chips, contact links, form fields) arrive one by one (70ms apart); section underlines draw in; the badge swings only when its section is reached; the site preview straightens as it scrolls into view.
- Scroll values are written as CSS variables once per animation frame (--progress, --hero-p, --work-p). All motion is off under prefers-reduced-motion.

## Layout

- Container 1120px, gutter `clamp(1rem, 4vw, 2.5rem)`, section padding `clamp(5rem, 11vw, 7.5rem)`.
- Breakpoints: 900px (nav → menu, hero stacks), 760px (single-column lists).

## Other pages

- 404.html: the same dark styling, a short message and a button back to the main page (Vercel serves it automatically).
