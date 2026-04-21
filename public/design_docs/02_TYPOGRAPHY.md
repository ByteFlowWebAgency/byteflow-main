# 02 · Typography

## 1. Font Families
| Role | Family | Weights | Fallback | Load via |
|---|---|---|---|---|
| Display + Body | **Plus Jakarta Sans** | 300, 400, 500, 600, 700 | `system-ui, -apple-system, "Segoe UI", sans-serif` | `next/font/google` |
| Mono (optional code blocks) | **JetBrains Mono** | 400, 500 | `ui-monospace, Menlo, monospace` | `next/font/google` |

```ts
// src/app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300','400','500','600','700'],
  variable: '--font-jakarta',
  display: 'swap',
});
```

## 2. Type Scale
| Token | px | rem | Tailwind | Line-height | Tracking | Weight | Use |
|---|---|---|---|---|---|---|---|
| `text-xs` | 11 | 0.6875 | `text-[11px]` | 1 | 1.2 / uppercase | 600 | Badges |
| `text-sm` | 13 | 0.8125 | `text-[13px]` | 1.5 | 1.2 / uppercase | 600 | Eyebrows |
| `text-base` | 15 | 0.9375 | `text-[15px]` | 1.55 | 0 | 400 | Body |
| `text-md` | 17 | 1.0625 | `text-[17px]` | 1.55 | 0 | 400 | Body lead secondary |
| `text-lg` | 20 | 1.25 | `text-[20px]` | 1.5 | 0 | 400 | CTA body |
| `text-xl` | 22 | 1.375 | `text-[22px]` | 1.5 | -0.3 | 400/700 | Lead / card title |
| `text-2xl` | 28 | 1.75 | `text-[28px]` | 1.15 | -0.8 | 700 | Showcase title (sm) |
| `text-3xl` | 40 | 2.5 | `text-[40px]` | 1.1 | -1.4 | 700 | Showcase title (lg) |
| `text-4xl` | 44 | 2.75 | `text-[44px]` | 1 | -1.5 | 700 | Stat number |
| `text-5xl` | 64 | 4 | `text-[64px]` | 1.02 | -2.5 | 700 | Section H2 |
| `text-6xl` | 68 | 4.25 | `text-[68px]` | 1 | -2 | 700 | Hero showcase number |
| `text-7xl` | 72 | 4.5 | `text-[72px]` | 0.98 | -3 | 700 | Why H2 |
| `text-8xl` | 76 | 4.75 | `text-[76px]` | 1 | -3 | 700 | CTA H2 |
| `text-9xl` | 92 | 5.75 | `text-[92px]` | 1 | -3.5 | 700 | Hero H1 |

## 3. Headings
```
H1 (Hero)
  Plus Jakarta Sans 700 · 92px / line-height 1 · letter-spacing -3.5px
  Color: #FFFFFF · gradient-text span for punctuation word
  Tailwind: text-[92px] font-bold leading-none tracking-[-3.5px] text-white

H2 (Section — Services)
  Plus Jakarta Sans 700 · 64px / 1.02 · -2.5px
  Tailwind: text-[64px] font-bold leading-[1.02] tracking-[-2.5px]

H2 (Section — Why)
  Plus Jakarta Sans 700 · 72px / 0.98 · -3px

H2 (CTA)
  Plus Jakarta Sans 700 · 76px / 1 · -3px

H3 (Card title)
  Plus Jakarta Sans 700 · 22px / 1.15 · -0.6px
  Tailwind: text-[22px] font-bold leading-[1.15] tracking-[-0.6px]

H3 (Value card title)
  Plus Jakarta Sans 600 · 22px / 1.15 · -0.5px

H4 (Step title)
  Plus Jakarta Sans 600 · 22px / 1 · -0.5px
```

## 4. Body
```
Body lead (hero subhead, CTA body)
  22px / 400 / line-height 1.5 / color white/65
  Tailwind: text-[22px] leading-[1.5] text-white/65

Body (card description)
  14.5px / 400 / line-height 1.55 / color white/60
  Tailwind: text-[14.5px] leading-[1.55] text-white/60

Body (footer tagline)
  15px / 400 / line-height 1.55 / color white/55

Link (inline, muted)
  14–15px / 600 / color #A78BFA
  Hover: color #22D3EE, underline 1px offset
```

## 5. Specialized
```
Eyebrow
  13px / 600 / uppercase / letter-spacing 1.2 / color #A78BFA or #22D3EE
  Tailwind: text-[13px] font-semibold uppercase tracking-[1.2px] text-violet-400

Badge (pill label "NEW" etc. — currently unused, reserved)
  11px / 700 / letter-spacing 0.3 / uppercase / white on gradient pill

Stat label
  14px / 400 / line-height 1 / color white/55

Footer section title
  13px / 600 / uppercase / letter-spacing 1.0 / color #A78BFA

Footer link
  15px / 400 / color white/65 / padding 6px 0
```

## 6. Gradient text utility
```css
.grad-text {
  background: linear-gradient(105deg, #818CF8 0%, #A78BFA 40%, #22D3EE 100%);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
}
```
**Rule:** apply to 1–3 words max per heading — never a full sentence.

## 7. Responsive
Drop the display scale at breakpoints:
| Token | ≥1280 | 1024–1279 | 640–1023 | <640 |
|---|---|---|---|---|
| Hero H1 | 92 | 76 | 60 | 44 |
| Section H2 | 64–76 | 56 | 44 | 34 |
| Showcase number | 40 | 36 | 32 | 28 |
| Body lead | 22 | 20 | 18 | 17 |

Tailwind pattern:
```
text-[44px] sm:text-[60px] lg:text-[76px] xl:text-[92px]
```
