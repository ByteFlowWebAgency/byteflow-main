# 06 · Interactions & Animations

## 1. Philosophy
- **Fast:** 150–180ms (buttons, link hovers, nav)
- **Normal:** 220–300ms (cards, reveals)
- **Slow:** 600–900ms (hero entrance, gradient drift)
- **Ambient:** 15–25s (floating mesh blobs)

Easing: default `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). For entrances, `cubic-bezier(0.16, 1, 0.3, 1)`. Never use `ease-in` for UI feedback.

> Rule: if a user-triggered action would feel quicker being instant, keep it instant. Hovers are the only place 150ms is required.

## 2. Buttons
```css
.btn-primary {
  transition: transform 180ms cubic-bezier(.22,1,.36,1),
              box-shadow 180ms cubic-bezier(.22,1,.36,1);
}
.btn-primary:hover  { transform: translateY(-1px); box-shadow: 0 14px 48px -10px rgba(99,102,241,.75); }
.btn-primary:active { transform: translateY(0);    box-shadow: 0 6px 24px -8px rgba(99,102,241,.5);  }
```
Ghost: `background-color` + `border-color` transition 180ms; no lift.

## 3. Cards
```css
.card { transition: transform 220ms, border-color 220ms, background-color 220ms; }
.card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.06); }
```
The small accent tile inside can pulse on hover via `scale(1.05)` 220ms.

## 4. Navigation
Link underline: a 1px bar absolute-positioned under the text, `width: 0 → 100%`, 180ms ease-out. Don't animate color *and* underline; pick one.

Mobile menu: slide from right, translateX(100%→0), 260ms cubic-bezier(.22,1,.36,1). Backdrop fades in 0→1 over 200ms.

## 5. Scroll-triggered reveals
Framer Motion `whileInView`:
```tsx
const reveal = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
```
Use on: section headers, card grids (stagger 60ms), CTA container.

Stagger:
```ts
const container = { visible: { transition: { staggerChildren: 0.06 } } };
```

Once per view: `viewport={{ once: true, amount: 0.25 }}`.

## 6. Hero entrance (on mount)
```ts
// Badge → H1 lines → Subhead → CTAs → Showcase
initial={{ opacity: 0, y: 32 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: [0.16,1,0.3,1], delay }}
// delays: 0, 0.08, 0.22, 0.32, 0.44
```

## 7. Ambient blobs
Three absolute-positioned 520×520 radial gradient blobs behind the hero:
```css
.blob {
  position: absolute; width: 520px; height: 520px; filter: blur(90px);
  border-radius: 50%; opacity: 0.55; pointer-events: none;
}
@keyframes drift {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(40px,-30px) scale(1.08); }
}
.blob { animation: drift 22s ease-in-out infinite; }
.blob.two   { animation-duration: 26s; animation-delay: -6s; }
.blob.three { animation-duration: 30s; animation-delay: -12s; }
```
Palette: blob 1 `rgba(99,102,241,0.45)`, blob 2 `rgba(139,92,246,0.35)`, blob 3 `rgba(6,182,212,0.30)`.

## 8. Loading
- Page transitions (if added): 300ms opacity fade out → route change → 400ms fade in.
- Skeletons: `@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }` 1.5s linear infinite.

## 9. Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; animation-iteration-count: 1 !important; }
  .blob { animation: none; }
}
```

## 10. Framer Motion variants (reference)
```ts
export const variants = {
  fadeUp:     { hidden:{opacity:0,y:24}, visible:{opacity:1,y:0,transition:{duration:0.6,ease:[0.16,1,0.3,1]}} },
  fadeIn:     { hidden:{opacity:0},     visible:{opacity:1,  transition:{duration:0.5}} },
  scaleIn:    { hidden:{opacity:0,scale:0.96}, visible:{opacity:1,scale:1,transition:{duration:0.5,ease:[0.16,1,0.3,1]}} },
  stagger:    { visible:{ transition:{ staggerChildren:0.06 } } },
  heroItem:   { hidden:{opacity:0,y:32}, visible:(i=0)=>({opacity:1,y:0,transition:{duration:0.8,ease:[0.16,1,0.3,1],delay:i*0.12}}) }
};
```
