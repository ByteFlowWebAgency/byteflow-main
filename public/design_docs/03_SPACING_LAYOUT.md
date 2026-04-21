# 03 · Spacing & Layout

## 1. Spacing Scale (4px base)
| Token | px | Tailwind | Primary use |
|---|---|---|---|
| `space-0` | 0 | `0` | — |
| `space-1` | 4 | `1` | hairline |
| `space-2` | 8 | `2` | icon-gap |
| `space-3` | 12 | `3` | button inner gap |
| `space-4` | 16 | `4` | card internal, footer link padding |
| `space-5` | 20 | `5` | inner card padding |
| `space-6` | 24 | `6` | card inner padding |
| `space-7` | 28 | `7` | glass panel padding |
| `space-8` | 32 | `8` | side padding (mobile), inner card padding |
| `space-10` | 40 | `10` | small section gap |
| `space-11` | 44 | `11` | subhead bottom margin |
| `space-12` | 48 | `12` | footer column gap |
| `space-14` | 56 | `14` | services header bottom margin |
| `space-16` | 64 | `16` | page side padding (desktop) |
| `space-18` | 72 | `18` | why-section grid gap |
| `space-24` | 96 | `24` | CTA vertical padding |
| `space-30` | 120 | `30` | services + why vertical padding |

## 2. Layout Grid
| Breakpoint | Width | Container max | Side padding | Columns | Gutter |
|---|---|---|---|---|---|
| xs (mobile) | <640 | 100% | 20 | 1 | 16 |
| sm | 640–1023 | 100% | 32 | 1–2 | 18 |
| md | 1024–1279 | 1024 | 48 | 2–3 | 18 |
| lg | 1280–1535 | 1200 | 64 | 3 | 18 |
| xl | ≥1536 | 1200 | 64 | 3 | 18 |

Container pattern:
```tsx
<div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-16">...</div>
```

## 3. Section Spacing (vertical padding top/bottom)
| Section | Top | Bottom |
|---|---|---|
| Hero | 56 | 80 |
| Services | 120 | 120 |
| Why | 120 | 120 |
| CTA (outer wrapper) | 64 | 64 |
| CTA (inner rounded container) | 96 top / 96 bottom, 64 side |
| Footer | 64 | 32 |

Mobile override: reduce all of these by ~40% — Hero `40/56`, Services/Why `72/72`, CTA outer `32/32`, inner `56/56`.

## 4. Component Spacing
| Component | Internal padding | Gap |
|---|---|---|
| Primary button | `16 28` | — |
| Small CTA button (nav) | `11 22` | — |
| Nav pill | `12 16 12 24` | links 4 |
| Glass card (service) | `28 28` | — |
| Value card | `28 28` | column gap 16 |
| Step card (in showcase) | `24 22` | 16 grid gap |
| Showcase outer | `28` | — |
| Showcase inner | `40 48` | — |
| CTA container | `96 64` | — |
| Stat card (legacy — no longer used) | `20 24` | — |
| Footer col gap | — | `48` |
| Footer bottom bar padding-top | `28` | — |

## 5. Whitespace Philosophy
Airy. Sections breathe at 96–120px vertical; content caps at 1200px wide so lines are never overwhelming. Cards carry ≥28px internal padding. The page should never feel busy — a scroll reveals one clear idea at a time, layered on light.

## 6. Responsive Spacing
Apply a linear `clamp` for the biggest vertical rhythms so the site doesn't jolt at breakpoints:
```css
.section-pad {
  padding-block: clamp(56px, 8vw, 120px);
  padding-inline: clamp(20px, 5vw, 64px);
}
```
Grid gaps shrink from 18→14→12 as viewport narrows. Card padding shrinks from 28→24→20.
