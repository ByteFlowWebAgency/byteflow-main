# 05 · Page Structure

## Homepage — top-to-bottom

### 1. Navigation
- Fixed pill, centered, top 20px, z-50. Spec in `04_COMPONENTS.md › Navigation`.
- Sticky: always visible; no scroll hide/reveal.
- Mobile: collapses to glass hamburger.

### 2. Hero
```
Wrapper:  padding 140px 64px 80px · relative · z-1
Inner:    max-w 1200, mx-auto
```
Content order:
1. **Eyebrow pill** — 40×? pill, bg `white/[0.04]`, border `white/[0.08]`, text `"✦  Enterprise software, delivered beautifully"`, 13/500 white/80, padding `8 18`, radius 999. Margin-bottom 28.
2. **H1** — `Where strategy meets <grad>pixel-perfect</grad> execution.` 92/700/-3.5/lh 1. Max-w 1100.
3. **Subhead** — 22/white-65, max-w 720, margin-top 28.
4. **CTA row** — primary "Start a project →" + ghost "See our work". Margin-top 44. Gap 14.
5. **Showcase panel** — see below. Margin-top 80.

#### Hero showcase panel (the "ByteFlow Way")
```
Outer:   glass radius 32, padding 28
Inner:   radius 20 / bg linear-gradient(135deg,#1a1f3a,#0B0F1F)
         border white/[0.06] / padding 40 48 / column flex
Header row:  eyebrow "THE BYTEFLOW WAY" (left) + "A three-phase engagement" (right, muted)
Title:       40/700/-1.4/lh 1.1, gradient-text on "first byte", max-w 780, margin-bottom 36
Steps grid:  3 columns, gap 16, each Step Card
```

### 3. Services Section
```
Padding:    120 64 120
Header row: space-between, align-items flex-end, gap 48, margin-bottom 56
  Left:  eyebrow "WHAT WE DO" 13/600 #A78BFA → H2 64/700/-2.5
         "End-to-end capabilities, <grad>delivered with care.</grad>"
  Right: 17/white-60 · max-w 340 · "Six integrated practices, one senior team."
Grid:       3 columns, gap 18
Cards:      6 Service Cards (see 04_COMPONENTS)
```

### 4. "Why ByteFlow" Section
```
Padding:  120 64
Header:   eyebrow "WHY BYTEFLOW" → H2 72/700/-3
          "Senior partners, <grad>end-to-end</grad>, on every engagement."
Grid:     2 columns, gap 18
Cards:    4 Value Cards
```

### 5. Final CTA
```
Outer wrapper: py 64, px 64
Inner container: max-w 1100, radius 40, padding 96 64
                 bg linear-gradient(135deg,#312E81,#1E1B4B 40%,#164E63)
                 radial overlay top-center (violet)
Content center-aligned:
  Eyebrow "READY TO SHIP" 13/600 #22D3EE
  H2 76/700/-3 "Let's build something <grad>worth shipping.</grad>" max-w 900
  Lead 22/white-65 max-w 640 margin-top 24
  Buttons row margin-top 44: primary + ghost
```

### 6. Footer
Spec in `04_COMPONENTS.md › Footer`.

Columns:
- **ByteFlow** — logo, tagline, social pills (LinkedIn, GitHub, Twitter)
- **Services** — Enterprise Software, Custom Dev, AI Integration, Cloud, SEO, Consulting
- **Company** — About, Case studies, Careers, Contact
- **Resources** — Blog, Changelog, Privacy, Terms

Bottom bar: `© 2025 ByteFlow Solutions, LLC.` left · `Privacy · Terms · Security` right.

---

## Responsive rules (applies to every section)

| Breakpoint | Changes |
|---|---|
| ≥1280 | as specified |
| 1024–1279 | side padding 48; H2 scale step down; Services 3-col; Why 2-col |
| 768–1023 | side padding 32; H1 60; H2 44; Services 2-col; Why 2-col; showcase steps 1 col |
| <768 | side padding 20; H1 44; H2 34; all grids 1-col; CTA inner pad 56 24; remove "A three-phase engagement" subtitle |

---

## Additional pages (not yet designed — structural shell only)

### About
Hero (compact, 100/140 padding) → Founders block (2-col photo/bio) → Timeline (single column, numbered year markers) → CTA → Footer.

### Work / Case Studies index
Hero (eyebrow + title) → Filter chips (pill row) → 2-col grid of case study cards (image 16:9, 28 radius, title/client below) → Footer.

### Case Study detail
Hero (project title 92/700, client + year + services row) → Hero image full-bleed — respects 1200 max → 2-column prose (problem/outcome) → Image gallery (1-up, 2-up) → Results stats row (3-up) → Related cases → CTA.

### Contact
Split screen — left 40% dark panel with eyebrow + H1 + list of contact modes; right 60% form card on glass.
