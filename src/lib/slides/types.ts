// Data shapes for the Presentations tool (docs/slides/02-SLIDE-DATA-MODEL.md). A deck is an
// ordered list of slide instances; each instance references one of exactly 25 fixed template
// types and holds only that template's content fields — no layout data, no styling data (that's
// template + theme, both fixed/shared, never per-slide). Every text field is a plain string or
// string array — no rich text, ever (docs/slides/00-GUARDRAILS.md).

export type SlideTemplateId =
  | 'titleCover'
  | 'agenda'
  | 'sectionDivider'
  | 'problemStatement'
  | 'solutionOverview'
  | 'threeColumn'
  | 'twoColumnComparison'
  | 'processSteps'
  | 'timeline'
  | 'teamIntro'
  | 'caseStudySummary'
  | 'testimonial'
  | 'bigStat'
  | 'statsGrid'
  | 'pricingInvestment'
  | 'servicesOverview'
  | 'fullBleedImage'
  | 'imageAndText'
  | 'bulletList'
  | 'chartImage'
  | 'faq'
  | 'roadmap'
  | 'contactNextSteps'
  | 'thankYouClosing'
  | 'blankCustom';
// Exactly these 25. See docs/slides/04-SLIDE-LIBRARY.md for what each looks like and is for.

export interface SlideBase {
  id: string;
}

export interface TitleCoverContent {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  presentedTo?: string;
  date?: string;
}

export interface AgendaContent {
  title: string;
  items: string[];
}

export interface SectionDividerContent {
  title: string;
  subtitle?: string;
}

export interface ProblemStatementContent {
  title: string;
  body: string;
  points: string[];
}

export interface SolutionOverviewContent {
  title: string;
  body: string;
  points: string[];
}

export interface ColumnItem {
  heading: string;
  body: string;
}

export interface ThreeColumnContent {
  title: string;
  columns: [ColumnItem, ColumnItem, ColumnItem];
}

export interface TwoColumnComparisonContent {
  title: string;
  leftHeading: string;
  leftItems: string[];
  rightHeading: string;
  rightItems: string[];
}

export interface ProcessStep {
  id: string;
  number: number;
  label: string;
  description: string;
}

/** 2-5 steps, enforced by the editor UI (add disabled at 5, remove disabled at 2). */
export interface ProcessStepsContent {
  title: string;
  steps: ProcessStep[];
}

export interface Milestone {
  id: string;
  label: string;
  date: string;
}

export interface TimelineContent {
  title: string;
  milestones: Milestone[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoDataUrl?: string;
}

export interface TeamIntroContent {
  title: string;
  members: TeamMember[];
}

export interface CaseStudySummaryContent {
  title: string;
  challenge: string;
  approach: string;
  result: string;
}

export interface TestimonialContent {
  quote: string;
  attributionName: string;
  attributionRole: string;
}

export interface BigStatContent {
  statNumber: string;
  statLabel: string;
  supportingText?: string;
}

export interface Stat {
  id: string;
  number: string;
  label: string;
}

/** 3-4 stats, enforced by the editor UI (add disabled at 4, remove disabled at 3). */
export interface StatsGridContent {
  title: string;
  stats: Stat[];
}

export interface PricingLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface PricingInvestmentContent {
  title: string;
  lineItems: PricingLineItem[];
  /**
   * If omitted (or stale), compute as the sum of lineItems' amounts at render/export time
   * rather than trusting a stored value that could drift — see lib/slides/pricing.ts.
   */
  total?: number;
  note?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
}

export interface ServicesOverviewContent {
  title: string;
  services: Service[];
}

export interface FullBleedImageContent {
  imageDataUrl: string;
  caption?: string;
}

export interface ImageAndTextContent {
  imageDataUrl: string;
  title: string;
  body: string;
}

export interface BulletListContent {
  title: string;
  bullets: string[];
}

export interface ChartImageContent {
  title: string;
  chartImageDataUrl: string;
  caption?: string;
}

export interface QaPair {
  id: string;
  question: string;
  answer: string;
}

export interface FaqContent {
  title: string;
  qaPairs: QaPair[];
}

export interface RoadmapPhase {
  id: string;
  label: string;
  description: string;
}

export interface RoadmapContent {
  title: string;
  phases: RoadmapPhase[];
}

export interface ContactNextStepsContent {
  title: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  nextStepNote?: string;
}

export interface ThankYouClosingContent {
  title: string;
  subtitle?: string;
}

export interface BlankCustomContent {
  title: string;
  freeText: string;
}

// Discriminated union tying template id to its content shape — a switch on templateId narrows
// content everywhere this type is used (editor field UI, preview renderer, pptx generators).
export type SlideContent =
  | { templateId: 'titleCover'; content: TitleCoverContent }
  | { templateId: 'agenda'; content: AgendaContent }
  | { templateId: 'sectionDivider'; content: SectionDividerContent }
  | { templateId: 'problemStatement'; content: ProblemStatementContent }
  | { templateId: 'solutionOverview'; content: SolutionOverviewContent }
  | { templateId: 'threeColumn'; content: ThreeColumnContent }
  | { templateId: 'twoColumnComparison'; content: TwoColumnComparisonContent }
  | { templateId: 'processSteps'; content: ProcessStepsContent }
  | { templateId: 'timeline'; content: TimelineContent }
  | { templateId: 'teamIntro'; content: TeamIntroContent }
  | { templateId: 'caseStudySummary'; content: CaseStudySummaryContent }
  | { templateId: 'testimonial'; content: TestimonialContent }
  | { templateId: 'bigStat'; content: BigStatContent }
  | { templateId: 'statsGrid'; content: StatsGridContent }
  | { templateId: 'pricingInvestment'; content: PricingInvestmentContent }
  | { templateId: 'servicesOverview'; content: ServicesOverviewContent }
  | { templateId: 'fullBleedImage'; content: FullBleedImageContent }
  | { templateId: 'imageAndText'; content: ImageAndTextContent }
  | { templateId: 'bulletList'; content: BulletListContent }
  | { templateId: 'chartImage'; content: ChartImageContent }
  | { templateId: 'faq'; content: FaqContent }
  | { templateId: 'roadmap'; content: RoadmapContent }
  | { templateId: 'contactNextSteps'; content: ContactNextStepsContent }
  | { templateId: 'thankYouClosing'; content: ThankYouClosingContent }
  | { templateId: 'blankCustom'; content: BlankCustomContent };

export type Slide = SlideBase & SlideContent;

export interface Deck {
  id: string;
  /** Internal name shown in the decks list. */
  name: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Same convention as every other themed artifact in this suite — falls back to "classic"
   * with a visible note if the referenced theme no longer exists.
   */
  themeId: string;
  /** Any number, any order, any template repeated any number of times — no structural ceiling. */
  slides: Slide[];
}

/** The 25 ids in the fixed display order used by the slide-template picker. */
export const SLIDE_TEMPLATE_IDS: readonly SlideTemplateId[] = [
  'titleCover',
  'agenda',
  'sectionDivider',
  'problemStatement',
  'solutionOverview',
  'threeColumn',
  'twoColumnComparison',
  'processSteps',
  'timeline',
  'teamIntro',
  'caseStudySummary',
  'testimonial',
  'bigStat',
  'statsGrid',
  'pricingInvestment',
  'servicesOverview',
  'fullBleedImage',
  'imageAndText',
  'bulletList',
  'chartImage',
  'faq',
  'roadmap',
  'contactNextSteps',
  'thankYouClosing',
  'blankCustom',
];

export const SLIDE_TEMPLATE_ID_SET: ReadonlySet<SlideTemplateId> = new Set(SLIDE_TEMPLATE_IDS);
