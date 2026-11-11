# Design

Online resume for Danil Abramitov. One page, **dark only**, blue + purple, adapted from the Anima "Split Studio" style (dark ground, large soft serif headlines, clean sans text, generous spacing). The staff **name badge** in the hero stays as the page's signature object.

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
| `--accent` | #58a5fc | links, icons, greeting, highlights |
| `--accent-strong` | #0771b8 | button fill, badge strap (white text 5.2:1) |
| `--accent-hover` | #065f9c | button hover (white text 6.5:1) |
| `--leaf` | #a898ec | purple highlight: title underline, focus ring, active nav (never body text) |
| `--band` | #063f77 | contact band + footer |

## Typography

- Headlines (h1, h2, badge name, project title): **Young Serif** 400, letter-spacing -0.02em, line-height ~1.12–1.2. Free stand-in for Anima's Roslindale Deck.
- Everything else (body, h3, nav, buttons): **Mulish** 400–800. Body 1.125rem / 1.6.
- Section titles carry a 3rem × 4px purple underline. No eyebrows or section numbers (the 3 build steps are a real sequence).

## Components

- Buttons: 8px radius. `btn-primary` blue fill, white text; `btn-ghost` surface fill, line border, blue text.
- Chips & tags: 6px radius.
- Cards/frames (badge, preview frame): 12px radius. Icon tiles: 8px.
- Services: two-column list rows with hairline tops, not a card grid.
- Websites & AI: code-drawn miniature of this site + three steps.
- Icons: inline SVG sprite, 24px grid, 1.8–1.9 stroke, round caps.

## Motion

- Hero greeting cycles Hello / Привіт / Привет (2.6s).
- Badge swings in on load, tilts toward the pointer on fine pointers.
- Sections fade up once on scroll. All motion off under `prefers-reduced-motion`.

## Layout

- Container 1120px, gutter `clamp(1rem, 4vw, 2.5rem)`, section padding `clamp(5rem, 11vw, 7.5rem)`.
- Breakpoints: 900px (nav → menu, hero stacks), 760px (single-column lists).
