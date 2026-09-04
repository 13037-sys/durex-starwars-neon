# Neon Collection — Figma Make guidelines

Paste this whole file into **Figma Make → project → Guidelines** (or into the first
prompt). Every screen Make generates for this project must follow it.

---

## Identity in one line
Durex × Star Wars "Neon Collection": a single committed **dark-neon** world — near-black
ground, one saturated neon accent at a time doing all the work (colour + glow), no soft
grey shadows. Italian UI copy.

## Fonts (Google Fonts)
- **Display / UI / labels / prices / buttons:** `Orbitron` — weights 400, 700, 900.
  Always wide tracking; usually UPPERCASE.
- **Body / descriptions / inputs:** `Space Grotesk` — weights 300, 400, 500, 700.
- Body line-height 1.6. Fallbacks: `Orbitron, sans-serif` / `Space Grotesk, system-ui, sans-serif`.

## Colour tokens — expose as CSS variables
```css
:root{
  /* surfaces */
  --bg:#05050a;            /* page */
  --bg-card:#0c0c16;       /* cards, panels, quiz option, result card */
  --bg-panel:rgba(12,12,22,.5);   /* checkout blocks over blur */
  --bg-well:rgba(5,5,10,.6);      /* input fill (→ .9 on focus) */
  --bg-footer:#030307;

  /* borders */
  --border:#1a1a2e;               /* card / panel / input edges, dividers */
  --hairline:rgba(255,255,255,.05);
  --border-subtle:rgba(255,255,255,.08);

  /* neon accents */
  --neon-blue:#00ffff;    /* Stormtrooper — default active theme */
  --neon-green:#39ff14;   /* Baby Yoda — also the success colour */
  --neon-purple:#b026ff;  /* Mace Windu */
  --neon-red:#ff003c;     /* Darth Vader */
  --neon-gold:#ffe81f;    /* Star Wars gold: logo + "✕" separator only */

  /* text */
  --text:#f0f0f5;         /* headings, key values */
  --text-2:#a0a0ba;       /* body / descriptions */
  --text-3:#8f8fa8;       /* subtitles, form labels */
  --text-4:#60607a;       /* tags, trust items */
  --text-5:#5050a0;       /* micro-labels (quiz) */
  --text-placeholder:#44445a;

  /* status */
  --success:#39ff14;
  --error:#ff4466;

  /* the one live accent — swapped per character */
  --theme-neon:var(--neon-blue);
  --theme-neon-dim:hsla(180,100%,50%,.15);   /* accent @15% alpha */
}
```

## Character themes = 4 modes
Only `--theme-neon` and `--theme-neon-dim` change. Model as a **mode set** on one
variable collection: `Stormtrooper` (#00ffff) · `Grogu` (#39ff14) ·
`MaceWindu` (#b026ff) · `DarthVader` (#ff003c). Every component reads `--theme-neon`,
never a hard-coded neon, so one mode switch recolours the whole screen.

## Type scale (px)
| Role | Font / weight | Size | Tracking | Case |
|---|---|---|---|---|
| Hero title | Orbitron 900 | 80 (56 ≤1024, 40 ≤640) | 6px | UPPER |
| Section title | Orbitron 700 | 44.8 | 2px | — |
| Success / banner H | Orbitron 900 | 28.8 | 2px | UPPER |
| Panel / cart title | Orbitron 700 | 17.6 | 2px | — |
| Hero payoff | Space Grotesk 300 | 25.6 | 1px | — |
| Body | Space Grotesk 400 | 16 | 0 | — |
| Small / helper | Space Grotesk 400 | 12.8 | 0 | — |
| Field label / eyebrow | Orbitron 700 | 10.4 | 1px | UPPER |
| Coupon code | Orbitron 900 | 35 | 4px | UPPER |

## Spacing — 4px base
4 · 8 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 60 · 80 · 100.
Component padding lives at 16–28; section rhythm 40 / 60 / 80; checkout uses 100
vertical. Lay out with fl/grid `gap`, not per-element margins.

## Radius
4 controls · 8 input/coupon · 10 line-item & buy button · 12 checkout sections ·
16 character card & banner · 20 success card · 30 pill (switch, badge) ·
40 round (HUD, play button) · 9999 dots & tracks.
Border widths: 1px hairline · 1.5px default (selected / quiz) · 2px emphasis (banner, game viewport).

## Elevation = neon glow (no grey drop-shadows)
Build every glow from `--theme-neon`. Negative spread keeps the bloom tight.
```
glow-sm    : 0 0 10px  var(--theme-neon)
glow-md    : 0 0 18px -4px var(--theme-neon)
glow-lg    : 0 0 24px -6px var(--theme-neon)      /* selected states */
glow-xl    : 0 0 40px rgba(0,0,0,.8), 0 0 20px var(--theme-neon)   /* modals */
glow-inset : inset 0 0 30px color-mix(in srgb, var(--theme-neon) 8%, transparent)
text-glow  : 0 0 8px var(--theme-neon)  (strong: add 0 0 22px; hero: 0 0 35px + 0 0 70px)
```

## Motion
- fast `0.2s ease` — button/switch hover
- normal `0.4s cubic-bezier(.25,.8,.25,1)` — cards, dots, glow fades
- slow `0.8s cubic-bezier(.25,1,.5,1)` — progress & stat-bar fill
- flip `0.7s cubic-bezier(.4,.2,.2,1)` — character card `rotateY(180deg)` on hover
- Respect `prefers-reduced-motion`.

## Component conventions
- **One filled action per screen**: accent fill + `#000` text, Orbitron 900 UPPER,
  52px tall, radius 10, `0 4px 20px var(--theme-neon-dim)`. Everything else is
  **outline** (1.5px accent border, accent text) or **ghost** (white on `rgba(255,255,255,.05)`).
- **Inputs**: dark well, 1px `--border`; focus → accent border + `0 0 0 2px rgba(0,255,255,.08)` ring + darker fill; error → `--error` border + message under the field.
- **Nav dots**: 10px, rest `rgba(255,255,255,.2)`; active = accent fill + `glow-sm` + `scale(1.3)`.
- **Stat / progress bars**: thin track (`rgba(255,255,255,.08–.1)`), accent fill with an 8–10px glow, grows from 0.
- **Character card**: 3D flip on hover. Front = full-bleed art + scanline overlay + gradient name plate glowing in the character colour + 4 corner dots. Back = accent border + `glow-lg` + inset glow, bio + stat bars.
- **Selected list rows** (checkout variants): heavy state — 1.5px accent border, 12%
  accent-mixed fill, layered accent glow, −1px lift.
- **Glass chrome** (HUD, switch wrap, drag hint): `rgba(5–12,5–12,15–22,.8)` + `backdrop-filter: blur(8px)` + faint accent hairline.
- Emoji are used as inline icons (🔦 🛡️ 🔒 ⚡ 💳). Keep them; no icon library.

## What NOT to do
- No light theme, no theme toggle — commit to dark neon.
- No pure grey (`#808080`) neutrals — they carry a blue-violet bias.
- No `box-shadow` used for plain depth — depth is glow or nothing.
- Don't hard-code a neon inside a component — always go through `--theme-neon`.
- Don't round everything to one radius; radius scales with the element's footprint.

## Reference
- `design-system/index.html` — every token + component rendered (paste into Make as the seed, or import via html.to.design).
- `design-system/tokens.json` — Tokens Studio format for Figma Variables.
- Live site: run the repo, `http://localhost:8000`.
