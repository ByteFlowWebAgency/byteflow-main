// Display metadata for the 25 fixed slide templates — names/descriptions per
// docs/slides/04-SLIDE-LIBRARY.md, used by the flat "Add slide" picker and the slide rail's
// labeled entries. Order here is the picker's display order (same as SLIDE_TEMPLATE_IDS) —
// a flat list/grid, never grouped or categorized, per docs/slides/00-GUARDRAILS.md.

import type { SlideTemplateId } from './types';

export const TEMPLATE_LABELS: Record<SlideTemplateId, { name: string; description: string }> = {
  titleCover: { name: 'Title Cover', description: "The deck's opening slide — eyebrow, title, subtitle, presented to, date." },
  agenda: { name: 'Agenda', description: 'A numbered list of topics for the call.' },
  sectionDivider: { name: 'Section Divider', description: 'A breathing-room moment between sections.' },
  problemStatement: { name: 'Problem Statement', description: 'Title, body, and supporting points framing the opportunity.' },
  solutionOverview: { name: 'Solution Overview', description: 'The answer slide that follows a problem statement.' },
  threeColumn: { name: 'Three-Column Highlights', description: 'Title plus exactly three columns.' },
  twoColumnComparison: { name: 'Two-Column Comparison', description: 'Before/after or without/with, side by side.' },
  processSteps: { name: 'Process Steps', description: '2–5 numbered steps, each with a label and description.' },
  timeline: { name: 'Timeline / Milestones', description: 'A sequence of labeled dates.' },
  teamIntro: { name: 'Team Introduction', description: 'A row of team members with name, role, optional photo.' },
  caseStudySummary: { name: 'Case Study Summary', description: 'Challenge / approach / result, condensed to one slide.' },
  testimonial: { name: 'Testimonial / Quote', description: 'A large pull-quote with attribution.' },
  bigStat: { name: 'Big Stat', description: 'One large number with a label — maximum visual weight.' },
  statsGrid: { name: 'Stats Grid', description: '3–4 smaller stat/number pairs in a row.' },
  pricingInvestment: { name: 'Pricing / Investment', description: 'Line items with amounts and a computed total.' },
  servicesOverview: { name: 'Services Overview', description: 'A list of named services with short descriptions.' },
  fullBleedImage: { name: 'Full-Bleed Image', description: 'A single image filling the slide, optional caption.' },
  imageAndText: { name: 'Image + Text', description: 'An image on one side, title and body on the other.' },
  bulletList: { name: 'Bullet List', description: 'The simplest, most general-purpose content slide.' },
  chartImage: { name: 'Chart / Graph', description: 'Displays a pre-made chart/graph screenshot.' },
  faq: { name: 'FAQ', description: 'Anticipated questions and answers.' },
  roadmap: { name: "Roadmap / What's Next", description: 'Phases for what happens after this meeting.' },
  contactNextSteps: { name: 'Contact / Next Steps', description: 'Contact details and an optional next-step note.' },
  thankYouClosing: { name: 'Thank You / Closing', description: "The deck's closing slide, minimal and calm." },
  blankCustom: { name: 'Blank / Custom', description: "The escape hatch for anything the other 24 don't cover." },
};
