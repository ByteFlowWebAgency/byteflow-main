# 08 · File Structure

## Directory tree
```
byteflow-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Homepage
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── about/page.tsx
│   │   ├── work/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── services/page.tsx
│   │   └── contact/page.tsx
│   ├── components/
│   │   ├── ui/                       # Atoms
│   │   │   ├── Button.tsx
│   │   │   ├── Eyebrow.tsx
│   │   │   ├── GradientText.tsx
│   │   │   ├── Pill.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   └── Icon.tsx
│   │   ├── chrome/                   # Nav + footer
│   │   │   ├── Navigation.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── Footer.tsx
│   │   ├── sections/                 # Page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── HeroShowcase.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── WhyByteFlow.tsx
│   │   │   └── FinalCTA.tsx
│   │   ├── cards/
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── ValueCard.tsx
│   │   │   └── StepCard.tsx
│   │   └── motion/
│   │       ├── Reveal.tsx
│   │       └── AmbientBlobs.tsx
│   ├── content/
│   │   ├── services.ts
│   │   ├── values.ts
│   │   ├── steps.ts
│   │   └── nav.ts
│   ├── lib/
│   │   ├── cn.ts                    # clsx + twMerge wrapper
│   │   └── motion.ts                # shared variants
│   └── types/
│       └── index.ts
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-image.png
│   └── fonts/                       # self-host fallback if needed
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## Component organization
**Atomic-ish.** Atoms in `ui/`, molecules in `cards/` and `chrome/`, organisms in `sections/`. Each section composes one or more cards; each page composes sections.

## Naming
- Components: `PascalCase.tsx`, one component per file
- Content data: `kebab-case.ts` exporting a named const: `export const SERVICES = [...]`
- Hooks: `useThing.ts` in `src/lib/`
- Types: colocate per-component; shared in `src/types/index.ts`

## Imports — path aliases
`tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/ui/*": ["src/components/ui/*"],
      "@/sections/*": ["src/components/sections/*"],
      "@/content/*": ["src/content/*"],
      "@/lib/*": ["src/lib/*"]
    }
  }
}
```

Example:
```ts
import { Button } from '@/ui/Button';
import { Hero } from '@/sections/Hero';
import { SERVICES } from '@/content/services';
import { cn } from '@/lib/cn';
```

## Barrel exports
Avoid deep barrel files — they defeat Next's tree-shaking. Only barrel `ui/` if >8 atoms; otherwise import explicitly.

## `lib/cn.ts`
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```
