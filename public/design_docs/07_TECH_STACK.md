# 07 · Tech Stack

## 1. Framework & Core
```json
{
  "name": "byteflow-web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "framer-motion": "11.11.11",
    "lucide-react": "0.454.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.5.4"
  },
  "devDependencies": {
    "@types/node": "20.16.11",
    "@types/react": "18.3.11",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.20",
    "eslint": "9.13.0",
    "eslint-config-next": "14.2.15",
    "postcss": "8.4.47",
    "tailwindcss": "3.4.14",
    "typescript": "5.6.3"
  }
}
```
Uses Next **App Router** (no `pages/` directory).

## 2. Styling — Tailwind
`tailwind.config.ts` (complete, paste-ready):
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0B0F1F', 2: '#1a1f3a' },
        brand: {
          indigo: { DEFAULT: '#6366F1', 400: '#818CF8', 500: '#6366F1' },
          violet: { DEFAULT: '#8B5CF6', 400: '#A78BFA', 500: '#8B5CF6' },
          cyan:   { DEFAULT: '#06B6D4', 400: '#22D3EE', 500: '#06B6D4' },
          blue:   '#3B82F6',
          pink:   '#EC4899',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(105deg,#6366F1 0%,#8B5CF6 50%,#06B6D4 100%)',
        'grad-text':    'linear-gradient(105deg,#818CF8 0%,#A78BFA 40%,#22D3EE 100%)',
        'grad-cta':     'linear-gradient(135deg,#312E81 0%,#1E1B4B 40%,#164E63 100%)',
      },
      boxShadow: {
        'brand-glow':   '0 10px 40px -10px rgba(99,102,241,0.6)',
        'brand-glow-h': '0 14px 48px -10px rgba(99,102,241,0.75)',
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      screens: { '3xl': '1536px' },
      maxWidth: { container: '1200px', narrow: '1100px' },
    },
  },
  plugins: [],
};
export default config;
```

`src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
html, body { background: #0B0F1F; color: #fff; }
body { font-family: var(--font-jakarta), system-ui, sans-serif; -webkit-font-smoothing: antialiased; }

.grad-text {
  background: linear-gradient(105deg,#818CF8 0%,#A78BFA 40%,#22D3EE 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.glass {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}
@keyframes drift { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,-30px) scale(1.08);} }
.blob { position:absolute; width:520px; height:520px; border-radius:50%; filter:blur(90px); opacity:.55; pointer-events:none; animation:drift 22s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .blob { animation: none; } *{ transition-duration:0ms!important; animation-duration:0ms!important;} }
```

## 3. Fonts
```ts
// src/app/layout.tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
const jakarta = Plus_Jakarta_Sans({ subsets:['latin'], weight:['300','400','500','600','700'], variable:'--font-jakarta', display:'swap' });
const mono    = JetBrains_Mono({ subsets:['latin'], weight:['400','500'],                       variable:'--font-mono',    display:'swap' });
// <html className={`${jakarta.variable} ${mono.variable}`}>
```

## 4. Icons
`npm i lucide-react`. Import by name: `import { ArrowRight } from 'lucide-react';`. Default props: `size={18}` for inline, `size={20}` for standalone.

## 5. Images
Use `next/image` always.
```tsx
<Image src="/hero/mesh.webp" alt="" width={1600} height={900} priority />
```
Export `images.formats: ['image/avif','image/webp']` in `next.config.mjs`.

## 6. next.config.mjs
```js
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'images.byteflow.com' }],
  },
  experimental: { optimizePackageImports: ['lucide-react', 'framer-motion'] },
};
```

## 7. Deployment
Vercel. Build command `next build`, install `npm ci`, Node 20. Env vars: `NEXT_PUBLIC_SITE_URL`, `CONTACT_WEBHOOK_URL`. Enable Web Analytics + Speed Insights from the Vercel dashboard. Set `Cache-Control: public, max-age=31536000, immutable` for `/_next/static`.
