# 04 — The 25 Slide Templates

This is the complete, fixed list. Exactly these 25, no more, no fewer, per `00-GUARDRAILS.md`.
Presented here in a sensible reading order for this document only — **the in-app picker shows
them as one flat list/grid with no section headers, grouping, or category labels.** Each one's
content fields are defined in `02-SLIDE-DATA-MODEL.md`; this file is the design brief for how
each should look and when Tyrone would reach for it. Placeholder content for every template is
bracketed and obviously fake, per guardrails.

1. **Title Cover** — the deck's opening slide: eyebrow label, large title, subtitle, who it's
   presented to, date. Full-theme-color treatment (matches the document cover page's visual
   weight, adapted to 16:9).
2. **Agenda** — title + a clean vertical list of items, numbered. Sets expectations at the start
   of a live call.
3. **Section Divider** — large centered title + optional subtitle, minimal else — a breathing-
   room moment between sections of a longer deck, same spirit as the document builder's
   section-title page if that tool exists in this repo, reimplemented simply here.
4. **Problem Statement** — title, a short body paragraph, and a few supporting points as a
   short bulleted list — for framing why a prospect should care before pitching the solution.
5. **Solution Overview** — same shape as Problem Statement (title, body, points) — the answer
   slide that typically follows it.
6. **Three-Column Highlights** — title + exactly three columns, each with its own heading and
   short body — for "three reasons," "three pillars," "three deliverables" moments.
7. **Two-Column Comparison** — title + two labeled lists side by side (e.g. "Before / After,"
   "Without ByteFlow / With ByteFlow").
8. **Process Steps** — title + 2-5 numbered steps, each with a label and short description —
   the natural home for ByteFlow's Discover/Build/Scale framing, but flexible to any step count.
9. **Timeline / Milestones** — title + a horizontal or vertical sequence of labeled dates —
   for project timelines or engagement history.
10. **Team Introduction** — title + a row of team members, each with name, role, and optional
    photo.
11. **Case Study Summary** — title + challenge / approach / result, three short blocks — the
    slide-deck version of the case study document template, condensed to fit one slide.
12. **Testimonial / Quote** — a large pull-quote with attribution (name + role/organization) —
    minimal chrome, quote is the focus.
13. **Big Stat** — one large number, a label beneath it, and an optional short supporting line
    — maximum visual weight for a single standout metric.
14. **Stats Grid** — title + 3-4 smaller stat/number pairs arranged in a row — for several
    metrics at once, lower visual weight per stat than Big Stat.
15. **Pricing / Investment** — title + a simple line-item list with amounts and a computed
    total, optional note line (e.g. payment terms) — the slide-deck companion to a proposal's
    investment section.
16. **Services Overview** — title + a list of named services with short descriptions — maps to
    ByteFlow's six practices or any subset relevant to the pitch.
17. **Full-Bleed Image** — a single image filling the slide with an optional caption — for a
    strong visual moment (a screenshot, a photo, a diagram brought in as an image).
18. **Image + Text** — an image on one side, a title and body paragraph on the other — the
    standard "show and explain" layout.
19. **Bullet List** — title + a plain bulleted list — the simplest, most general-purpose
    content slide, for anything that doesn't fit a more specific template.
20. **Chart / Graph** — title + an image field intended for a chart/graph screenshot (exported
    from wherever the underlying data lives — this template does not generate charts itself,
    it displays one) + optional caption.
21. **FAQ** — title + a list of question/answer pairs — for anticipated-objections or
    common-questions moments in a longer pitch.
22. **Roadmap / What's Next** — title + a list of phases, each with a label and short
    description — for laying out what happens after this meeting or after signing.
23. **Contact / Next Steps** — title + contact name, email, phone, website, and an optional
    short "next step" note — typically placed near the end of a deck.
24. **Thank You / Closing** — large title (typically "Thank You" or similar) + optional
    subtitle — the deck's closing slide, minimal, calm.
25. **Blank / Custom** — title + a single free-text body area — the escape hatch for anything
    the other 24 don't cover, without breaking the fixed-template model (still plain text, still
    themed, still no freeform layout).

## Design notes that apply across all 25

- Every template carries the real BYTEFLOW logo, small and consistent (e.g. a corner mark),
  except where a template is deliberately minimal (Section Divider, Testimonial, Thank You) —
  use judgment, but default to including it.
- Every template pulls its colors and fonts entirely from the deck's active theme — never a
  hardcoded color or font choice inside a template's implementation.
- Every template targets 16:9 widescreen — do not build any template around a 4:3 assumption.
- Text field length isn't hard-capped in the data model, but each template's implementation
  should handle reasonably long input gracefully (wrap, shrink-to-fit, or scroll within reason)
  rather than overflowing the slide silently — verify this for at least the text-heaviest
  templates (Problem Statement, FAQ, Services Overview) during QA.
