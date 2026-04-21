# ByteFlow Design Documentation — Fluid Innovation

Complete implementation-ready spec for rebuilding the ByteFlow marketing site in Next.js 14 (App Router) + Tailwind + Framer Motion.

## Read in this order
1. [00 · Design Overview](./00_DESIGN_OVERVIEW.md) — vision and principles
2. [01 · Color System](./01_COLOR_SYSTEM.md) — palette, gradients, semantics
3. [02 · Typography](./02_TYPOGRAPHY.md) — type scale, headings, body
4. [03 · Spacing & Layout](./03_SPACING_LAYOUT.md) — grid, section rhythm
5. [04 · Components](./04_COMPONENTS.md) — every UI atom + molecule
6. [05 · Page Structure](./05_PAGE_STRUCTURE.md) — homepage section-by-section
7. [06 · Interactions & Animations](./06_INTERACTIONS_ANIMATIONS.md) — motion system
8. [07 · Tech Stack](./07_TECH_STACK.md) — deps, Tailwind config, globals.css
9. [08 · File Structure](./08_FILE_STRUCTURE.md) — directory tree, aliases
10. [09 · Content & Copy](./09_CONTENT_COPY.md) — all site copy
11. [10 · Implementation Guide](./10_IMPLEMENTATION_GUIDE.md) — step-by-step build
12. [11 · Asset Requirements](./11_ASSETS_REQUIREMENTS.md) — logo, icons, images

## Quick facts
- **Direction:** Fluid Innovation (dark canvas, ambient mesh gradients, glass surfaces)
- **Canvas:** `#0B0F1F`, brand gradient `#6366F1 → #8B5CF6 → #06B6D4`
- **Display font:** Plus Jakarta Sans 300–700
- **Max content width:** 1200px; side padding 16–64px fluid
- **Section rhythm:** 120px vertical between majors (down to ~72 on mobile)
- **Motion:** 180ms hovers, 600ms reveals, 22s ambient blob drift

Every spec is exact — hex values, pixel values, Tailwind classes, transition curves — so the docs support a one-shot rebuild without guesswork.
