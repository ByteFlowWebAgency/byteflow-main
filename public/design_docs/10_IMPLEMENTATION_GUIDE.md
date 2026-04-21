# 10 · Implementation Guide

## 1. Setup
```bash
npx create-next-app@14.2.15 byteflow-web \
  --ts --tailwind --app --src-dir --import-alias "@/*" --eslint

cd byteflow-web
npm i framer-motion@11.11.11 lucide-react@0.454.0 clsx@2.1.1 tailwind-merge@2.5.4
```
Delete the boilerplate `src/app/page.tsx` content. Replace `tailwind.config.ts` with the block in `07_TECH_STACK.md › Styling`. Replace `src/app/globals.css` with the block in the same doc.

## 2. Build order

### Step 1 — Config & fonts
- Paste Tailwind config
- Paste `globals.css`
- Update `src/app/layout.tsx` with the `next/font` imports and attach both variables to `<html>`

### Step 2 — Atoms (`src/components/ui/`)
Build in this order: `Button.tsx`, `Eyebrow.tsx`, `GradientText.tsx`, `Pill.tsx`, `GlassCard.tsx`. Each is ≤40 lines.

### Step 3 — Chrome (`src/components/chrome/`)
`Navigation.tsx` (fixed pill), `MobileMenu.tsx`, `Footer.tsx`.

### Step 4 — Cards (`src/components/cards/`)
`ServiceCard.tsx`, `ValueCard.tsx`, `StepCard.tsx`.

### Step 5 — Sections (`src/components/sections/`)
`Hero.tsx` + `HeroShowcase.tsx` → `Services.tsx` → `WhyByteFlow.tsx` → `FinalCTA.tsx`.

### Step 6 — Content (`src/content/`)
Copy the data objects out of `09_CONTENT_COPY.md` into `services.ts`, `values.ts`, `steps.ts`, `nav.ts`.

### Step 7 — Compose the homepage
```tsx
// src/app/page.tsx
import { Hero } from '@/sections/Hero';
import { Services } from '@/sections/Services';
import { WhyByteFlow } from '@/sections/WhyByteFlow';
import { FinalCTA } from '@/sections/FinalCTA';
import { AmbientBlobs } from '@/components/motion/AmbientBlobs';

export default function Home() {
  return (
    <>
      <AmbientBlobs />
      <Hero />
      <Services />
      <WhyByteFlow />
      <FinalCTA />
    </>
  );
}
```
Navigation and Footer live in `layout.tsx`.

### Step 8 — Motion
Add `Reveal` wrapper, wire Framer Motion `whileInView` on section headers and card grids. Add `AmbientBlobs` behind the hero.

### Step 9 — Polish
- Focus rings (see 01_COLOR)
- Reduced-motion media query
- Meta tags, OG image
- `robots.txt`, `sitemap.ts`

## 3. Common Patterns

### New section
```tsx
// src/components/sections/MySection.tsx
import { Eyebrow } from '@/ui/Eyebrow';
import { GradientText } from '@/ui/GradientText';
import { Reveal } from '@/components/motion/Reveal';

export function MySection() {
  return (
    <section className="py-[120px] px-6 sm:px-8 lg:px-16 relative z-[1]">
      <div className="mx-auto max-w-container">
        <Reveal>
          <Eyebrow>HEADER</Eyebrow>
          <h2 className="mt-4 text-[64px] font-bold leading-[1.02] tracking-[-2.5px]">
            Title with <GradientText>emphasis</GradientText>.
          </h2>
        </Reveal>
        {/* …content… */}
      </div>
    </section>
  );
}
```

### Responsive
Mobile-first. Use the base class for mobile; add `sm:`, `md:`, `lg:`, `xl:` for larger.
```
text-[44px] sm:text-[60px] lg:text-[76px] xl:text-[92px]
px-5 sm:px-8 lg:px-16
py-[72px] lg:py-[120px]
```

### Animation
```tsx
import { motion } from 'framer-motion';
import { variants } from '@/lib/motion';

<motion.div variants={variants.fadeUp} initial="hidden"
  whileInView="visible" viewport={{ once:true, amount:0.25 }}>
  …
</motion.div>
```

### Gradient text
```tsx
<span className="grad-text">emphasis word</span>
```
(`.grad-text` lives in `globals.css`.)

## 4. Troubleshooting

**Fonts flash / FOUT** — confirm `display:'swap'` on every `next/font` call; attach both variables to `<html>`, not `<body>`.

**Tailwind arbitrary values not compiling** — check `content` globs in `tailwind.config.ts` match your `src/` path; restart `npm run dev` after config changes.

**Backdrop-filter looks wrong in Safari** — ensure both `backdrop-filter` and `-webkit-backdrop-filter` are present. `GlassCard` already includes both.

**Gradient text appears as a solid color** — element must have `color: transparent` AND `background-clip: text`. Remove any parent `color` override.

**Framer Motion hydration warnings** — mark motion-heavy sections `"use client"` at the top of the file.

**Layout shift from ambient blobs** — wrap blobs in `pointer-events:none; position:absolute; overflow:hidden` on the parent; the parent needs `position:relative`.

## 5. Testing checklist
- [ ] Breakpoints: 360, 390, 768, 1024, 1280, 1440, 1920
- [ ] Chrome, Safari (incl. iOS 16+), Firefox, Edge
- [ ] Lighthouse ≥ 95 on desktop, ≥ 90 on mobile
- [ ] LCP < 2.5s, CLS < 0.05
- [ ] Keyboard: every interactive has a visible focus ring; tab order matches visual order
- [ ] Screen reader: H1 reads without gradient punctuation breaking semantics
- [ ] `prefers-reduced-motion` disables blob drift and framer reveals
- [ ] Color contrast: all body copy ≥ 4.5:1
- [ ] 404 page uses brand system
- [ ] Meta tags + OG image verified in share debuggers
