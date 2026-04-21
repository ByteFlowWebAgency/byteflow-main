# 04 · Components

## Button

### Variants
| Variant | Background | Border | Text | Shadow |
|---|---|---|---|---|
| Primary | `linear-gradient(105deg,#6366F1,#8B5CF6 50%,#06B6D4)` | none | white | `0 10px 40px -10px rgba(99,102,241,.6)` |
| Ghost | `rgba(255,255,255,0.06)` + `backdrop-filter: blur(20px)` | `1px solid rgba(255,255,255,0.14)` | white | none |
| Subtle (nav links) | transparent | none | `rgba(255,255,255,0.75)` | none |

### Sizes
| Size | Padding | Font | Radius | Height |
|---|---|---|---|---|
| sm (nav CTA) | `11px 22px` | 14/600 | 999 (pill) | 40 |
| md (default) | `16px 28px` | 15.5/600 | 999 | 52 |
| lg (hero, CTA) | `20px 36px` | 17/600 | 999 | 64 |

### States
- **Default:** as above
- **Hover:** `translateY(-1px)`; primary shadow → `0 14px 48px -10px rgba(99,102,241,.75)`; ghost bg → `rgba(255,255,255,0.10)`
- **Active:** `translateY(0)`; shadow −20%
- **Disabled:** opacity 0.4, cursor not-allowed, no hover transform
- **Loading:** replace label with 16px spinner, width preserved via `min-width`
- **Focus:** `outline: 2px solid #22D3EE; outline-offset: 3px;`

### Tailwind class strings
```
// Primary
"inline-flex items-center gap-2 px-7 py-4 rounded-full text-[15.5px] font-semibold text-white
 bg-[linear-gradient(105deg,#6366F1,#8B5CF6_50%,#06B6D4)]
 shadow-[0_10px_40px_-10px_rgba(99,102,241,.6)]
 hover:-translate-y-px hover:shadow-[0_14px_48px_-10px_rgba(99,102,241,.75)]
 transition-all duration-200 ease-out"

// Ghost
"inline-flex items-center gap-2 px-7 py-4 rounded-full text-[15.5px] font-semibold text-white
 bg-white/[0.06] backdrop-blur-xl border border-white/[0.14]
 hover:bg-white/[0.10] transition-all duration-200"
```

### React
```tsx
export function Button({ variant='primary', size='md', children, ...p }) {
  const base = 'inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200 ease-out';
  const sizes = { sm:'px-[22px] py-[11px] text-[14px]', md:'px-7 py-4 text-[15.5px]', lg:'px-9 py-5 text-[17px]' };
  const variants = {
    primary:'text-white bg-[linear-gradient(105deg,#6366F1,#8B5CF6_50%,#06B6D4)] shadow-[0_10px_40px_-10px_rgba(99,102,241,.6)] hover:-translate-y-px',
    ghost:  'text-white bg-white/[0.06] backdrop-blur-xl border border-white/[0.14] hover:bg-white/[0.10]'
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]}`} {...p}>{children}</button>;
}
```

---

## Card — Service

```
Background: rgba(255,255,255,0.04)
Border:     1px solid rgba(255,255,255,0.08)
Radius:     28px
Padding:    28px
Backdrop:   blur(20px)
Accent:     48×48 rounded-14 gradient tile, top-left of card
```
Hover: `translateY(-4px)`, border → `rgba(255,255,255,0.16)`, bg → `rgba(255,255,255,0.06)`, 220ms ease-out.

```tsx
<div className="group relative rounded-[28px] p-7 bg-white/[0.04] backdrop-blur-xl
                border border-white/[0.08] hover:-translate-y-1 hover:border-white/[0.16]
                hover:bg-white/[0.06] transition-all duration-200">
  <div className="h-12 w-12 rounded-[14px] bg-[linear-gradient(135deg,#6366F1,#8B5CF6)] mb-5" />
  <h3 className="text-[22px] font-bold tracking-[-0.6px] leading-[1.15]">Title</h3>
  <p className="mt-3 text-[14.5px] leading-[1.55] text-white/60">Description…</p>
</div>
```

---

## Card — Value ("Why ByteFlow")

Same glass recipe as Service card but:
- Padding `28 28`
- Title 600 weight (not 700)
- Accent tile 44×44, radius 12, per-card gradient

---

## Card — Step (inside showcase)

```
Background: rgba(255,255,255,0.03)
Border:     1px solid rgba(255,255,255,0.06)
Radius:     18px
Padding:    24px 22px
Layout:     column / gap 14
Header row: 44×44 gradient tile + 22px/600 title, gap 14
Body:       14px / white-60 / line-height 1.55
```

---

## Navigation

Sticky top, centered pill.
```
Position:   fixed, top 20, left 50%, translateX(-50%), z-50
Background: rgba(11,15,31,0.60) + backdrop-filter: blur(20px)
Border:     1px solid rgba(255,255,255,0.08)
Radius:     999
Padding:    12 16 12 24
Layout:     logo → links (gap 32) → CTA (sm primary)
Logo:       28×28 gradient rounded-9 + "ByteFlow" 17/700 -0.5
Links:      15 / 500 / color white/75 → white on hover, 180ms
```
Mobile (<768): hide links, replace with hamburger → full-screen glass overlay, logo top-left, CTA bottom center.

---

## Form Inputs (contact page, spec for future use)

```
Wrapper:  column gap 6
Label:    13 / 600 / uppercase / tracking 1.2 / color #A78BFA
Input:    h 52 / px 20 / radius 14 / bg rgba(255,255,255,.04)
          border 1px rgba(255,255,255,.12) / color white / 16px/400
Focus:    border #8B5CF6, shadow 0 0 0 3px rgba(139,92,246,.25)
Error:    border #F87171, helper text #F87171 13/500
Helper:   13 / 400 / color white/50
```

---

## Section patterns

### Hero
- Padding: `140 64 80 64` (desktop)
- Layout: max-w 1200, single column
- Heading max-w 1100, subhead max-w 720
- Showcase panel below, full-width of container

### Stats (legacy — removed from current design)
Kept here only as a reference component in case stats return; previously 3-up cards with 44/700 gradient numerals.

### CTA Section
```
Outer wrapper: px 64 / py 64, centered
Inner:         max-w 1100, radius 40, padding 96 64
Background:    linear-gradient(135deg,#312E81,#1E1B4B 40%,#164E63)
Border:        1px solid rgba(255,255,255,0.10)
Overlay:       radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.22), transparent 60%)
Content:       centered — H2 76/700, lead 22/white-65, primary + ghost buttons
```

---

## Footer

```
Background: #0B0F1F
Top border: 1px solid rgba(255,255,255,0.08)
Padding:    64 64 32 64 (desktop)
Grid:       1.4fr 1fr 1fr 1fr, gap 48
Col 1:      logo + 17/400 tagline + social pills
Col 2-4:    13/600 uppercase #A78BFA header → links
Bottom bar: 28 top padding, border-top rgba(255,255,255,0.08)
            13/400 white/50 left · 13/500 white/50 right (legal links)
```

Social pills: 38×38 circle, bg `white/[0.04]`, border `white/[0.08]`, icon 16px; hover bg `--grad-primary`, border transparent.

---

## Icons

Library: **Lucide-react** (`npm i lucide-react`).
Default size 20, stroke-width 1.6, color `currentColor`. Use `ArrowRight`, `Check`, `Menu`, `X`, `Github`, `Linkedin`, `Twitter`, `Globe`, `Zap`, `Cloud`, `Code`, `Cpu`, `Search`, `Sparkles`.

---

## Dividers

Minimal. Use `border-top 1px solid rgba(255,255,255,0.08)` only in footer and occasionally between services groupings. Never on hero or CTA.

---

## Loading

Spinner: 16×16, 2px stroke, `--grad-primary` via conic-gradient mask, 800ms linear infinite. Skeleton: `bg-white/[0.04]` with 1.5s shimmer `linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`.

---

## Modal / Overlay (reserved)
Full-screen `rgba(11,15,31,0.85)` + `backdrop-filter: blur(12px)`. Dialog: max-w 560, bg `linear-gradient(135deg,#1a1f3a,#0B0F1F)`, border `white/[0.08]`, radius 24, padding 32.
