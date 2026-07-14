'use client';

// Read-only, themed, 16:9 preview for all 25 slide templates — one render function per
// template, same order as lib/slides/pptxGenerators.ts so the two are easy to cross-check.
// docs/slides/03-EDITOR-SCREEN.md: "the canvas shows honest 16:9 slide proportions so what
// Tyrone sees is close to what the .pptx produces." Colors/fonts come entirely from
// ThemedDocument's CSS custom properties — never hardcoded here.

import Image from 'next/image';
import ThemedDocument from '@/components/internal-tools/themes/ThemedDocument';
import type { Theme } from '@/components/internal-tools/themes/themeTypes';
import { computePricingTotal } from '@/lib/slides/pricing';
import type {
  AgendaContent,
  BigStatContent,
  BlankCustomContent,
  BulletListContent,
  CaseStudySummaryContent,
  ChartImageContent,
  ContactNextStepsContent,
  FaqContent,
  FullBleedImageContent,
  ImageAndTextContent,
  PricingInvestmentContent,
  ProblemStatementContent,
  ProcessStepsContent,
  RoadmapContent,
  SectionDividerContent,
  ServicesOverviewContent,
  Slide,
  SolutionOverviewContent,
  StatsGridContent,
  TeamIntroContent,
  TestimonialContent,
  ThankYouClosingContent,
  ThreeColumnContent,
  TimelineContent,
  TitleCoverContent,
  TwoColumnComparisonContent,
} from '@/lib/slides/types';
import styles from './slideCanvas.module.css';

const LOGO = (
  <Image
    src="/BYTEFLOW_LOGO.png"
    alt=""
    width={200}
    height={196}
    unoptimized
    className={styles.logo}
  />
);

/**
 * Wraps every template's content in the shared 16:9 canvas + corner logo. Every template
 * carries the logo, uniformly, with no per-template exceptions — matching
 * lib/slides/pptxMasters.ts, where the logo is baked into the shared slide master and
 * therefore applies to every exported slide the same way. Keeping the preview's logo
 * policy identical avoids a preview/export mismatch (docs/slides/03-EDITOR-SCREEN.md).
 */
function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.canvas}>
      <div className={styles.pad}>{children}</div>
      {LOGO}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className={styles.bulletList}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// ---- 1. titleCover ---------------------------------------------------------------------------

function TitleCoverSlide({ content }: { content: TitleCoverContent }) {
  return (
    <Canvas>
      <div className={styles.centered} style={{ alignItems: 'flex-start', textAlign: 'left' }}>
        {content.eyebrow && (
          <p className={styles.muted} style={{ fontSize: '0.75em', fontWeight: 700, letterSpacing: '0.08em' }}>
            {content.eyebrow}
          </p>
        )}
        <h1 className={styles.title} style={{ fontSize: 'clamp(20px, 4vw, 40px)', margin: '0.2em 0' }}>
          {content.title}
        </h1>
        {content.subtitle && <p className={styles.body}>{content.subtitle}</p>}
      </div>
      {(content.presentedTo || content.date) && (
        <p className={styles.muted} style={{ fontSize: '0.65em' }}>
          {content.presentedTo && `Prepared for ${content.presentedTo}`}
          {content.presentedTo && content.date ? '   ·   ' : ''}
          {content.date}
        </p>
      )}
    </Canvas>
  );
}

// ---- 2. agenda --------------------------------------------------------------------------------

function AgendaSlide({ content }: { content: AgendaContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <ol className={styles.numberedList}>
        {content.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    </Canvas>
  );
}

// ---- 3. sectionDivider ------------------------------------------------------------------------

function SectionDividerSlide({ content }: { content: SectionDividerContent }) {
  return (
    <Canvas>
      <div className={styles.centered}>
        <p className={styles.dividerTitle}>{content.title}</p>
        {content.subtitle && <p className={styles.dividerSubtitle}>{content.subtitle}</p>}
      </div>
    </Canvas>
  );
}

// ---- 4. problemStatement / 5. solutionOverview (identical shape) ------------------------------

function BodyPointsSlide({ content }: { content: ProblemStatementContent | SolutionOverviewContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <p className={styles.body} style={{ marginBottom: '4%' }}>
        {content.body}
      </p>
      <Bullets items={content.points} />
    </Canvas>
  );
}

// ---- 6. threeColumn ------------------------------------------------------------------------------

function ThreeColumnSlide({ content }: { content: ThreeColumnContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.columns} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {content.columns.map((col, i) => (
          <div key={i}>
            <p className={styles.columnHeading}>{col.heading}</p>
            <p className={styles.body}>{col.body}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 7. twoColumnComparison ------------------------------------------------------------------

function TwoColumnComparisonSlide({ content }: { content: TwoColumnComparisonContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.columns} style={{ gridTemplateColumns: '1fr 1fr', position: 'relative' }}>
        <div>
          <p className={styles.columnHeading}>{content.leftHeading}</p>
          <Bullets items={content.leftItems} />
        </div>
        <div style={{ borderLeft: '1px solid var(--bf-paper-line)', paddingLeft: '4%' }}>
          <p className={styles.columnHeading} style={{ color: 'var(--bf-color-accent)' }}>
            {content.rightHeading}
          </p>
          <Bullets items={content.rightItems} />
        </div>
      </div>
    </Canvas>
  );
}

// ---- 8. processSteps ---------------------------------------------------------------------------

function ProcessStepsSlide({ content }: { content: ProcessStepsContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${content.steps.length}, 1fr)`, alignContent: 'start' }}>
        {content.steps.map((step) => (
          <div key={step.id}>
            <div className={styles.stepBadge}>{step.number}</div>
            <p className={styles.stepLabel}>{step.label}</p>
            <p className={styles.stepDescription}>{step.description}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 9. timeline --------------------------------------------------------------------------------

function TimelineSlide({ content }: { content: TimelineContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {content.milestones.map((m) => (
          <div key={m.id} className={styles.timelineRow}>
            <span className={styles.timelineDot} />
            <span className={styles.timelineLabel}>{m.label}</span>
            <span className={styles.timelineDate}>{m.date}</span>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 10. teamIntro ------------------------------------------------------------------------------

function TeamIntroSlide({ content }: { content: TeamIntroContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${content.members.length}, 1fr)`, alignContent: 'start' }}>
        {content.members.map((member) => (
          <div key={member.id}>
            <div
              className={styles.memberPhoto}
              style={member.photoDataUrl ? { backgroundImage: `url(${member.photoDataUrl})` } : undefined}
            />
            <p className={styles.memberName}>{member.name}</p>
            <p className={styles.memberRole}>{member.role}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 11. caseStudySummary -----------------------------------------------------------------------

function CaseStudySummarySlide({ content }: { content: CaseStudySummaryContent }) {
  const blocks: Array<[string, string]> = [
    ['Challenge', content.challenge],
    ['Approach', content.approach],
    ['Result', content.result],
  ];
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div>
        {blocks.map(([label, body]) => (
          <div key={label} className={styles.caseBlock}>
            <p className={styles.caseLabel}>{label}</p>
            <p className={styles.caseBody}>{body}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 12. testimonial ----------------------------------------------------------------------------

function TestimonialSlide({ content }: { content: TestimonialContent }) {
  return (
    <Canvas>
      <div className={styles.centered}>
        <p className={styles.quote}>&ldquo;{content.quote}&rdquo;</p>
        <p className={styles.attribution}>{content.attributionName}</p>
        <p className={styles.attributionRole}>{content.attributionRole}</p>
      </div>
    </Canvas>
  );
}

// ---- 13. bigStat --------------------------------------------------------------------------------

function BigStatSlide({ content }: { content: BigStatContent }) {
  return (
    <Canvas>
      <div className={styles.centered}>
        <p className={styles.bigStatNumber}>{content.statNumber}</p>
        <p className={styles.bigStatLabel}>{content.statLabel}</p>
        {content.supportingText && <p className={styles.muted} style={{ fontSize: '0.7em', marginTop: '0.3em' }}>{content.supportingText}</p>}
      </div>
    </Canvas>
  );
}

// ---- 14. statsGrid ------------------------------------------------------------------------------

function StatsGridSlide({ content }: { content: StatsGridContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.statsGrid} style={{ gridTemplateColumns: `repeat(${content.stats.length}, 1fr)` }}>
        {content.stats.map((stat) => (
          <div key={stat.id}>
            <p className={styles.statNumber}>{stat.number}</p>
            <p className={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 15. pricingInvestment ----------------------------------------------------------------------

function PricingInvestmentSlide({ content }: { content: PricingInvestmentContent }) {
  const total = computePricingTotal(content.lineItems);
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item</th>
            <th className={styles.amountCell}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {content.lineItems.map((item) => (
            <tr key={item.id}>
              <td>{item.label}</td>
              <td className={styles.amountCell}>${item.amount.toLocaleString('en-US')}</td>
            </tr>
          ))}
          <tr className={styles.tableTotalRow}>
            <td>Total</td>
            <td className={styles.amountCell}>${total.toLocaleString('en-US')}</td>
          </tr>
        </tbody>
      </table>
      {content.note && <p className={styles.muted} style={{ fontSize: '0.65em', marginTop: '3%', fontStyle: 'italic' }}>{content.note}</p>}
    </Canvas>
  );
}

// ---- 16. servicesOverview -----------------------------------------------------------------------

function ServicesOverviewSlide({ content }: { content: ServicesOverviewContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div>
        {content.services.map((service) => (
          <div key={service.id} className={styles.serviceRow}>
            <p className={styles.serviceName}>{service.name}</p>
            <p className={styles.body}>{service.description}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 17. fullBleedImage -------------------------------------------------------------------------

function FullBleedImageSlide({ content }: { content: FullBleedImageContent }) {
  return (
    <div className={styles.canvas}>
      {content.imageDataUrl && (
        <div className={styles.fullBleedImage} style={{ backgroundImage: `url(${content.imageDataUrl})` }} />
      )}
      {content.caption && <p className={styles.fullBleedCaption}>{content.caption}</p>}
      {LOGO}
    </div>
  );
}

// ---- 18. imageAndText ---------------------------------------------------------------------------

function ImageAndTextSlide({ content }: { content: ImageAndTextContent }) {
  return (
    <Canvas>
      <div style={{ display: 'flex', gap: '4%', flex: 1, minHeight: 0 }}>
        <div
          className={styles.imageBox}
          style={{ width: '45%', ...(content.imageDataUrl ? { backgroundImage: `url(${content.imageDataUrl})` } : {}) }}
        />
        <div style={{ flex: 1 }}>
          <p className={styles.title} style={{ fontSize: 'clamp(13px, 1.8vw, 22px)' }}>{content.title}</p>
          <p className={styles.body}>{content.body}</p>
        </div>
      </div>
    </Canvas>
  );
}

// ---- 19. bulletList -----------------------------------------------------------------------------

function BulletListSlide({ content }: { content: BulletListContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <Bullets items={content.bullets} />
    </Canvas>
  );
}

// ---- 20. chartImage -----------------------------------------------------------------------------

function ChartImageSlide({ content }: { content: ChartImageContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div
        className={styles.imageBox}
        style={{
          flex: 1,
          minHeight: 0,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          ...(content.chartImageDataUrl ? { backgroundImage: `url(${content.chartImageDataUrl})` } : {}),
        }}
      />
      {content.caption && (
        <p className={styles.muted} style={{ fontSize: '0.65em', textAlign: 'center', marginTop: '2%' }}>
          {content.caption}
        </p>
      )}
    </Canvas>
  );
}

// ---- 21. faq ------------------------------------------------------------------------------------

function FaqSlide({ content }: { content: FaqContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
        {content.qaPairs.map((qa) => (
          <div key={qa.id}>
            <p className={styles.faqQuestion}>{qa.question}</p>
            <p className={styles.faqAnswer}>{qa.answer}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 22. roadmap --------------------------------------------------------------------------------

function RoadmapSlide({ content }: { content: RoadmapContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${content.phases.length}, 1fr)`, alignContent: 'start' }}>
        {content.phases.map((phase) => (
          <div key={phase.id}>
            <div className={styles.roadmapBar} />
            <p className={styles.columnHeading}>{phase.label}</p>
            <p className={styles.body} style={{ fontSize: '0.75em' }}>{phase.description}</p>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

// ---- 23. contactNextSteps -----------------------------------------------------------------------

function ContactNextStepsSlide({ content }: { content: ContactNextStepsContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <div className={styles.contactBlock}>
        <p className={styles.contactName}>{content.contactName}</p>
        <p className={styles.muted}>{content.email}</p>
        {content.phone && <p className={styles.muted}>{content.phone}</p>}
        {content.website && <p className={styles.muted}>{content.website}</p>}
      </div>
      {content.nextStepNote && (
        <div className={styles.calloutBox} style={{ marginTop: 'auto' }}>
          {content.nextStepNote}
        </div>
      )}
    </Canvas>
  );
}

// ---- 24. thankYouClosing ------------------------------------------------------------------------

function ThankYouClosingSlide({ content }: { content: ThankYouClosingContent }) {
  return (
    <Canvas>
      <div className={styles.centered}>
        <p className={styles.dividerTitle}>{content.title}</p>
        {content.subtitle && <p className={styles.dividerSubtitle}>{content.subtitle}</p>}
      </div>
    </Canvas>
  );
}

// ---- 25. blankCustom ----------------------------------------------------------------------------

function BlankCustomSlide({ content }: { content: BlankCustomContent }) {
  return (
    <Canvas>
      <Title>{content.title}</Title>
      <p className={styles.body}>{content.freeText}</p>
    </Canvas>
  );
}

// ---- dispatcher -----------------------------------------------------------------------------

/** Themed, read-only, 16:9 preview of one slide — used by the editor canvas and the
 * slide-rail thumbnails alike. */
export default function SlideRenderer({ slide, theme }: { slide: Slide; theme: Theme }) {
  return <ThemedDocument theme={theme}>{renderSlideBody(slide)}</ThemedDocument>;
}

function renderSlideBody(slide: Slide): React.ReactNode {
  switch (slide.templateId) {
    case 'titleCover':
      return <TitleCoverSlide content={slide.content} />;
    case 'agenda':
      return <AgendaSlide content={slide.content} />;
    case 'sectionDivider':
      return <SectionDividerSlide content={slide.content} />;
    case 'problemStatement':
      return <BodyPointsSlide content={slide.content} />;
    case 'solutionOverview':
      return <BodyPointsSlide content={slide.content} />;
    case 'threeColumn':
      return <ThreeColumnSlide content={slide.content} />;
    case 'twoColumnComparison':
      return <TwoColumnComparisonSlide content={slide.content} />;
    case 'processSteps':
      return <ProcessStepsSlide content={slide.content} />;
    case 'timeline':
      return <TimelineSlide content={slide.content} />;
    case 'teamIntro':
      return <TeamIntroSlide content={slide.content} />;
    case 'caseStudySummary':
      return <CaseStudySummarySlide content={slide.content} />;
    case 'testimonial':
      return <TestimonialSlide content={slide.content} />;
    case 'bigStat':
      return <BigStatSlide content={slide.content} />;
    case 'statsGrid':
      return <StatsGridSlide content={slide.content} />;
    case 'pricingInvestment':
      return <PricingInvestmentSlide content={slide.content} />;
    case 'servicesOverview':
      return <ServicesOverviewSlide content={slide.content} />;
    case 'fullBleedImage':
      return <FullBleedImageSlide content={slide.content} />;
    case 'imageAndText':
      return <ImageAndTextSlide content={slide.content} />;
    case 'bulletList':
      return <BulletListSlide content={slide.content} />;
    case 'chartImage':
      return <ChartImageSlide content={slide.content} />;
    case 'faq':
      return <FaqSlide content={slide.content} />;
    case 'roadmap':
      return <RoadmapSlide content={slide.content} />;
    case 'contactNextSteps':
      return <ContactNextStepsSlide content={slide.content} />;
    case 'thankYouClosing':
      return <ThankYouClosingSlide content={slide.content} />;
    case 'blankCustom':
      return <BlankCustomSlide content={slide.content} />;
  }
}
