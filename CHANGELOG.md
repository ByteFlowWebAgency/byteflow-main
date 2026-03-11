# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-10

### Added
- New dark design system with CSS custom properties (indigo, purple, cyan palette)
- Syne, DM Mono, and DM Sans fonts via `next/font/google`
- SVG noise overlay texture via `body::before` pseudo-element
- `Nav` component with BYTEFLOW logo image, nav links, and "Get in Touch" CTA
- `Hero` component with animated background orbs, grid overlay, eyebrow, H1 with gradient word, stats bar, and scroll indicator
- `Services` component with 6 service cards and staggered ScrollReveal animations
- `Why` component with two-column layout and 2×2 why-cards grid
- `CtaBand` component for homepage call-to-action section
- `ScrollReveal` client component using IntersectionObserver (no animation libraries)
- `Work` component (internal, /work returns 404 pending future prompt)
- `/services` page with 6-service row layout and CTA section
- `/about` page with story grid, 4-step approach cards, values grid, and CTA
- `/contact` page with two-column layout and controlled contact form
- Auto-updating copyright year in footer via `getCurrentYear()`
- BYTEFLOW_LOGO.png used in nav and footer

### Changed
- Migrated from old design system to new dark theme with gradient accents
- Footer reduced to 3 columns (brand + Services + Connect); removed About column
- Footer bottom bar simplified to copyright only
- Nav logo reduced in size for a slimmer header

### Removed
- `Navbar`, `CTABanner`, `PortfolioCard`, `PortfolioGrid`, `ServiceCard`, `ServiceGrid`, `StatsStrip`, `TeamCard`, `WhyByteflow` components
- `src/hooks/`, `src/lib/`, `src/types/` directories
- `/portfolio` route
- Custom cursor (`CustomCursor` component removed from layout)
- "byte by byte." tagline, "Intelligent Technology Solutions" footer text, "Case Studies" link

## [Unreleased]

### Added

### Changed

### Fixed
