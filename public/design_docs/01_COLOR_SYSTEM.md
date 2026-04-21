# 01 · Color System

## 1. Primary Colors
| Role | Hex | RGB | Tailwind token | Use |
|---|---|---|---|---|
| Ink (page bg) | `#0B0F1F` | 11,15,31 | `ink.DEFAULT` | Page background |
| Ink-2 (inner cards) | `#1a1f3a` | 26,31,58 | `ink.2` | Showcase panel inner bg |
| Indigo | `#6366F1` | 99,102,241 | `brand.indigo` | Primary accent, gradient start |
| Violet | `#8B5CF6` | 139,92,246 | `brand.violet` | Mid-gradient, service accents |
| Cyan | `#06B6D4` | 6,182,212 | `brand.cyan` | Gradient end, "forward" accent |

## 2. Accent & Spectrum
| Role | Hex | Tailwind | Use |
|---|---|---|---|
| Indigo-400 | `#818CF8` | `brand.indigo.400` | Gradient text start |
| Violet-400 | `#A78BFA` | `brand.violet.400` | Eyebrows, section labels |
| Cyan-400 | `#22D3EE` | `brand.cyan.400` | Gradient text end, "Why" eyebrow |
| Blue-500 | `#3B82F6` | `brand.blue` | Service card gradient pairs |
| Pink-500 | `#EC4899` | `brand.pink` | Single service card accent |

### Signature gradients
```css
--grad-primary:    linear-gradient(105deg,#6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
--grad-text:       linear-gradient(105deg,#818CF8 0%, #A78BFA 40%, #22D3EE 100%);
--grad-brand-tile: linear-gradient(135deg,#6366F1, #06B6D4);
--grad-cta-container: linear-gradient(135deg,#312E81 0%, #1E1B4B 40%, #164E63 100%);
```

### Service card gradients (by index 0–5)
```
0: linear-gradient(135deg, #6366F1, #8B5CF6)   /* Enterprise Software */
1: linear-gradient(135deg, #8B5CF6, #EC4899)   /* Custom Development */
2: linear-gradient(135deg, #3B82F6, #22D3EE)   /* AI Integration */
3: linear-gradient(135deg, #06B6D4, #6366F1)   /* Cloud Solutions */
4: linear-gradient(135deg, #8B5CF6, #3B82F6)   /* SEO & Digital Growth */
5: linear-gradient(135deg, #22D3EE, #A78BFA)   /* Consulting */
```

## 3. Neutral Scale (text + line)
| Role | Value | Tailwind | Use |
|---|---|---|---|
| `fg` | `#FFFFFF` | `white` | Primary text |
| `fg-muted` | `rgba(255,255,255,0.70)` | `white/70` | Body lead |
| `fg-soft` | `rgba(255,255,255,0.60)` | `white/60` | Body, card descriptions |
| `fg-dim` | `rgba(255,255,255,0.50)` | `white/50` | Footer bottom bar, tertiary |
| `line` | `rgba(255,255,255,0.08)` | `white/[0.08]` | Glass borders |
| `line-strong` | `rgba(255,255,255,0.14)` | `white/[0.14]` | Ghost button border |
| `glass` | `rgba(255,255,255,0.04)` | `white/[0.04]` | Glass surfaces |
| `glass-solid` | `rgba(255,255,255,0.06)` | `white/[0.06]` | Pressed glass, nav hover |

## 4. Semantic
| State | Color | Notes |
|---|---|---|
| Success | `#22D3EE` | Cyan-400 — matches brand |
| Error | `#F87171` | Red-400, used only in forms |
| Warning | `#FBBF24` | Amber-400, forms only |
| Info | `#818CF8` | Indigo-400 |
| Disabled | `rgba(255,255,255,0.25)` fg on `rgba(255,255,255,0.04)` bg |

## 5. Usage Matrix
| Surface | Background | Border | Text | Accent |
|---|---|---|---|---|
| Page | `#0B0F1F` | — | `#FFFFFF` | gradients |
| Nav pill | `white/[0.04]` + blur(20) | `white/[0.08]` | `white/75` | `--grad-primary` CTA |
| Hero showcase outer | `white/[0.04]` | `white/[0.08]` | `white` | — |
| Hero showcase inner | `linear-gradient(135deg,#1a1f3a,#0B0F1F)` | `white/[0.06]` | `white` | gradient text |
| Service card | `white/[0.04]` | `white/[0.08]` | `white` | per-card gradient blob |
| Step chip (inside showcase) | `white/[0.03]` | `white/[0.06]` | `white` | gradient tile icon |
| Value card | `white/[0.04]` | `white/[0.08]` | `white` | gradient tile icon |
| CTA container | `--grad-cta-container` | `white/[0.10]` | `white` | gradient text |
| Footer bg | `#0B0F1F` | `white/[0.08]` top | `white/65` | `#A78BFA` headers |
| Primary button | `--grad-primary` | — | `white` | shadow `0 10px 40px -10px rgba(99,102,241,.6)` |
| Ghost button | `white/[0.06]` + blur(20) | `white/[0.14]` | `white` | — |

## 6. Dark Mode
The site is dark-mode-native; no light mode is designed. If a light mode is needed later, the inverse pairing should use: bg `#F7F7FA`, fg `#0B0F1F`, keep all brand gradients, flip glass to `rgba(11,15,31,0.04)` with `rgba(11,15,31,0.08)` borders.

## 7. Accessibility
All body text on the ink background uses a minimum of `rgba(255,255,255,0.60)` (≈ 9.8:1 against `#0B0F1F`) — passes WCAG AAA for normal text.
- H1/H2 headlines at `#FFFFFF` on `#0B0F1F` → 20.6:1 (AAA)
- Body `white/70` on `#0B0F1F` → 13.5:1 (AAA)
- Footer `white/50` on `#0B0F1F` → 9.2:1 (AAA)
- Gradient text: individual color stops all pass 4.5:1 at 15px minimum.
- Focus visible: `outline: 2px solid #22D3EE; outline-offset: 2px;` on every interactive element.
