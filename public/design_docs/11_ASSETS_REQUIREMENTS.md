# 11 · Asset Requirements

## 1. Logo
| File | Format | Dimensions | Notes |
|---|---|---|---|
| `public/logo.svg` | SVG | viewBox 0 0 32 32 for mark; 0 0 140 32 for lockup | Mark is a rounded-9 tile with `--grad-primary` fill + ByteFlow wordmark in Jakarta 700 |
| `public/logo-mark.svg` | SVG | 32×32 | Mark only |
| `public/logo-lockup-dark.svg` | SVG | 140×32 | Default — white wordmark, gradient mark |
| `public/logo-lockup-light.svg` | SVG | 140×32 | For light surfaces (future) — ink wordmark, gradient mark |
| `public/apple-touch-icon.png` | PNG | 180×180 | Mark on ink bg, safe-area 20% |

Minimum clear space: half mark height on all sides. Min legible size: 20px mark, 88px lockup.

## 2. Imagery (current design = none required)
The Fluid Innovation direction deliberately uses **no photography or illustration on the homepage**. All visual weight comes from typography + ambient gradient blobs + glass geometry. This is intentional — resist adding decorative images.

### For secondary pages when work begins
| Location | Dimensions | Aspect | Count | Notes |
|---|---|---|---|---|
| Case study hero | 2400×1350 | 16:9 | 1 per case | Product screenshot, dark chrome preferred; export WebP + AVIF |
| Case study gallery | 1600×1200 | 4:3 | 3–6 per case | 1-up and 2-up layouts |
| Case study thumb (work index) | 1200×900 | 4:3 | 1 per case | |
| About — founders | 800×1000 | 4:5 | 2 | Portraits on neutral bg; desaturate slightly to match palette |
| OG share image | 1200×630 | — | 1 | Ink bg, lockup, H1 echo, gradient blob |

All photography: 85 max JPEG quality, export AVIF primary + WebP fallback.

## 3. Icons
Lucide-react, stroke 1.6, size 20 default. Required set for the homepage:

| Use | Lucide name |
|---|---|
| Service 1 — Enterprise Software | `Building2` |
| Service 2 — Custom Development | `Code` |
| Service 3 — AI Integration | `Sparkles` |
| Service 4 — Cloud Solutions | `CloudLightning` |
| Service 5 — SEO & Digital Growth | `TrendingUp` |
| Service 6 — Consulting | `Compass` |
| Value 1 — Senior-only team | `Users` |
| Value 2 — Written, not vibed | `FileText` |
| Value 3 — Cloud-native by default | `Cloud` |
| Value 4 — Built to be handed over | `Handshake` |
| Nav CTA / arrow motifs | `ArrowRight` |
| Mobile menu | `Menu` / `X` |
| Social | `Linkedin`, `Github`, `Twitter` (or custom X SVG) |

Reserve a `components/ui/Icon.tsx` wrapper so we can swap the library later without touching every site.

Note: the current homepage renders accents as solid gradient tiles *without* an inner icon — this is intentional for the Fluid Innovation look. The mapping above is included for teams that want to add icons inside the tiles on secondary pages or in a future tweaks pass.

## 4. Favicons
| File | Size |
|---|---|
| `favicon.ico` | 32×32 multi-res |
| `icon.svg` | any (scalable) |
| `apple-touch-icon.png` | 180×180 |
| `icon-192.png` | 192×192 |
| `icon-512.png` | 512×512 |

Generate with [realfavicongenerator.net](https://realfavicongenerator.net) or `pwa-asset-generator`. Seed: `logo-mark.svg` on ink background. Keep 20% safe area.

## 5. Fonts
No self-hosting required — Plus Jakarta Sans and JetBrains Mono load via `next/font/google`. If an airgapped deploy ever needs self-hosted fonts, download the WOFF2 variants (latin subset) for weights 300/400/500/600/700 Jakarta and 400/500 JetBrains Mono → `public/fonts/` → swap `next/font/google` for `next/font/local`.

## 6. Motion assets
None — all motion is CSS + Framer Motion. No Lottie, no video.

## 7. File naming
- All assets lowercase, kebab-case
- Include dimensions in thumb/hero variants only when multiple sizes coexist (`hero@1x.webp`, `hero@2x.webp`)
- Originals in `design-assets/` (not deployed); optimized outputs in `public/`
