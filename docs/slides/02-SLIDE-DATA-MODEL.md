# 02 — Slide Data Model

Implement in `lib/slides/types.ts`. A deck is an ordered list of slide instances; each slide
instance references one of the 25 fixed template types and holds only that template's content
fields — no layout data, no styling data (that's template + theme, both fixed/shared).

```ts
export type SlideTemplateId =
  | "titleCover" | "agenda" | "sectionDivider" | "problemStatement" | "solutionOverview"
  | "threeColumn" | "twoColumnComparison" | "processSteps" | "timeline" | "teamIntro"
  | "caseStudySummary" | "testimonial" | "bigStat" | "statsGrid" | "pricingInvestment"
  | "servicesOverview" | "fullBleedImage" | "imageAndText" | "bulletList" | "chartImage"
  | "faq" | "roadmap" | "contactNextSteps" | "thankYouClosing" | "blankCustom";
// Exactly these 25. See 04-SLIDE-LIBRARY.md for what each looks like and is for.

export interface SlideBase { id: string; templateId: SlideTemplateId; }

// One content interface per template — plain strings/arrays only, no rich text, no styling.
export interface TitleCoverContent { eyebrow?: string; title: string; subtitle?: string; presentedTo?: string; date?: string; }
export interface AgendaContent { title: string; items: string[]; }
export interface SectionDividerContent { title: string; subtitle?: string; }
export interface ProblemStatementContent { title: string; body: string; points: string[]; }
export interface SolutionOverviewContent { title: string; body: string; points: string[]; }
export interface ThreeColumnContent { title: string; columns: [ColumnItem, ColumnItem, ColumnItem]; }
export interface ColumnItem { heading: string; body: string; }
export interface TwoColumnComparisonContent { title: string; leftHeading: string; leftItems: string[]; rightHeading: string; rightItems: string[]; }
export interface ProcessStepsContent { title: string; steps: { number: number; label: string; description: string }[]; } // 2-5 steps
export interface TimelineContent { title: string; milestones: { label: string; date: string }[]; }
export interface TeamIntroContent { title: string; members: { name: string; role: string; photoDataUrl?: string }[]; }
export interface CaseStudySummaryContent { title: string; challenge: string; approach: string; result: string; }
export interface TestimonialContent { quote: string; attributionName: string; attributionRole: string; }
export interface BigStatContent { statNumber: string; statLabel: string; supportingText?: string; }
export interface StatsGridContent { title: string; stats: { number: string; label: string }[]; } // 3-4 stats
export interface PricingInvestmentContent { title: string; lineItems: { label: string; amount: number }[]; total?: number; note?: string; }
export interface ServicesOverviewContent { title: string; services: { name: string; description: string }[]; }
export interface FullBleedImageContent { imageDataUrl: string; caption?: string; }
export interface ImageAndTextContent { imageDataUrl: string; title: string; body: string; }
export interface BulletListContent { title: string; bullets: string[]; }
export interface ChartImageContent { title: string; chartImageDataUrl: string; caption?: string; }
export interface FaqContent { title: string; qaPairs: { question: string; answer: string }[]; }
export interface RoadmapContent { title: string; phases: { label: string; description: string }[]; }
export interface ContactNextStepsContent { title: string; contactName: string; email: string; phone?: string; website?: string; nextStepNote?: string; }
export interface ThankYouClosingContent { title: string; subtitle?: string; }
export interface BlankCustomContent { title: string; freeText: string; }

// Discriminated union tying template id to its content shape — implement with a mapped/union
// type so the editor can be fully type-safe per slide (a switch on templateId narrows content).
export type SlideContent =
  | { templateId: "titleCover"; content: TitleCoverContent }
  | { templateId: "agenda"; content: AgendaContent }
  | { templateId: "sectionDivider"; content: SectionDividerContent }
  // ...one union member per template, same pattern, covering all 25.

export type Slide = SlideBase & SlideContent;

export interface Deck {
  id: string;
  name: string;               // internal name shown in the decks list
  createdAt: string;
  updatedAt: string;
  themeId: string;             // same convention as every other themed artifact in this suite;
                                // falls back to "classic" with a visible note if deleted
  slides: Slide[];              // any number, any order, any template repeated any number of
                                 // times — no structural ceiling
}
```

## Rules

- **No rich text anywhere** — every text field above is a plain string or string array. Enforce
  this at the type level (plain `string`, not an HTML type) so there's no temptation to sneak in
  a rich-text editor for "just one field."
- **Images**: `FileReader`-to-data-URL on the client, same pattern used elsewhere in this suite
  (audit screenshots, document-builder image blocks) — no upload endpoint, no storage service.
- **IDs**: `crypto.randomUUID()` throughout.
- **Defaults** (`lib/slides/defaults.ts`): a new deck starts with one `titleCover` slide,
  bracketed placeholder content, `themeId: "classic"`. No real data anywhere, per guardrails.
- **`pricingInvestment`'s `total`**: if omitted, compute it as the sum of `lineItems` amounts at
  render/export time rather than trusting a stored value that could drift — same principle as
  the proposal tool's totals math, implemented fresh here since this tool has no dependency on
  document-builder/proposal code (see `01-CONTEXT-AND-SCOPE.md`).

## Storage (`lib/slides/storage.ts`)

Same adapter shape as other localStorage-backed tools in this suite: list/get/save/delete under
a distinct key prefix (`bf-slides:`), plus JSON export/import per deck with full validation
(every slide's `templateId` must be one of the 25; every content field validated against its
expected shape) on import. Autosave requirements are in `00-GUARDRAILS.md`.
