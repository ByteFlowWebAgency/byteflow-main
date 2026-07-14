'use client';

// One field-editing form per SlideTemplateId (25 total) — plain labeled inputs driving the
// live canvas preview above. Same order as SlideRenderer.tsx / lib/slides/pptxGenerators.ts
// for easy cross-checking. Each form takes the slide's typed content and a setter that
// replaces it wholesale — the caller (DeckEditorApp) owns persistence/autosave.

import { newId } from '@/lib/slides/defaults';
import {
  BackgroundDesignField,
  ImageField,
  NumberField,
  ObjectListField,
  StringListField,
  TextAreaField,
  TextField,
} from './fields';
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
  TeamMember,
  TestimonialContent,
  ThankYouClosingContent,
  ThreeColumnContent,
  TimelineContent,
  TitleCoverContent,
  TwoColumnComparisonContent,
} from '@/lib/slides/types';

// ---- 1. titleCover ---------------------------------------------------------------------------

function TitleCoverEditor({ content, onChange }: { content: TitleCoverContent; onChange: (c: TitleCoverContent) => void }) {
  return (
    <>
      <TextField label="Eyebrow" value={content.eyebrow ?? ''} onChange={(v) => onChange({ ...content, eyebrow: v })} />
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextField label="Subtitle" value={content.subtitle ?? ''} onChange={(v) => onChange({ ...content, subtitle: v })} />
      <TextField label="Presented to" value={content.presentedTo ?? ''} onChange={(v) => onChange({ ...content, presentedTo: v })} />
      <TextField label="Date" value={content.date ?? ''} onChange={(v) => onChange({ ...content, date: v })} />
      <BackgroundDesignField value={content.backgroundDesignId} onChange={(backgroundDesignId) => onChange({ ...content, backgroundDesignId })} />
    </>
  );
}

// ---- 2. agenda --------------------------------------------------------------------------------

function AgendaEditor({ content, onChange }: { content: AgendaContent; onChange: (c: AgendaContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <StringListField label="Items" items={content.items} onChange={(items) => onChange({ ...content, items })} min={1} />
    </>
  );
}

// ---- 3. sectionDivider ------------------------------------------------------------------------

function SectionDividerEditor({ content, onChange }: { content: SectionDividerContent; onChange: (c: SectionDividerContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextField label="Subtitle" value={content.subtitle ?? ''} onChange={(v) => onChange({ ...content, subtitle: v })} />
      <BackgroundDesignField value={content.backgroundDesignId} onChange={(backgroundDesignId) => onChange({ ...content, backgroundDesignId })} />
    </>
  );
}

// ---- 4 & 5. problemStatement / solutionOverview (identical shape) -----------------------------

function BodyPointsEditor({
  content,
  onChange,
}: {
  content: ProblemStatementContent | SolutionOverviewContent;
  onChange: (c: ProblemStatementContent | SolutionOverviewContent) => void;
}) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextAreaField label="Body" value={content.body} onChange={(v) => onChange({ ...content, body: v })} />
      <StringListField label="Supporting points" items={content.points} onChange={(points) => onChange({ ...content, points })} />
    </>
  );
}

// ---- 6. threeColumn ------------------------------------------------------------------------------

function ThreeColumnEditor({ content, onChange }: { content: ThreeColumnContent; onChange: (c: ThreeColumnContent) => void }) {
  function updateCol(i: 0 | 1 | 2, patch: Partial<ThreeColumnContent['columns'][number]>) {
    const columns = [...content.columns] as ThreeColumnContent['columns'];
    columns[i] = { ...columns[i], ...patch };
    onChange({ ...content, columns });
  }
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      {([0, 1, 2] as const).map((i) => (
        <div key={i}>
          <TextField label={`Column ${i + 1} heading`} value={content.columns[i].heading} onChange={(v) => updateCol(i, { heading: v })} />
          <TextAreaField label={`Column ${i + 1} body`} value={content.columns[i].body} onChange={(v) => updateCol(i, { body: v })} rows={3} />
        </div>
      ))}
    </>
  );
}

// ---- 7. twoColumnComparison ------------------------------------------------------------------

function TwoColumnComparisonEditor({ content, onChange }: { content: TwoColumnComparisonContent; onChange: (c: TwoColumnComparisonContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextField label="Left heading" value={content.leftHeading} onChange={(v) => onChange({ ...content, leftHeading: v })} />
      <StringListField label="Left items" items={content.leftItems} onChange={(leftItems) => onChange({ ...content, leftItems })} />
      <TextField label="Right heading" value={content.rightHeading} onChange={(v) => onChange({ ...content, rightHeading: v })} />
      <StringListField label="Right items" items={content.rightItems} onChange={(rightItems) => onChange({ ...content, rightItems })} />
    </>
  );
}

// ---- 8. processSteps ---------------------------------------------------------------------------

function ProcessStepsEditor({ content, onChange }: { content: ProcessStepsContent; onChange: (c: ProcessStepsContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Steps (2–5)"
        items={content.steps}
        min={2}
        max={5}
        onChange={(steps) => onChange({ ...content, steps: steps.map((s, i) => ({ ...s, number: i + 1 })) })}
        makeNew={() => ({ id: newId(), number: content.steps.length + 1, label: '', description: '' })}
        renderItem={(step, update) => (
          <>
            <TextField label={`Step ${step.number} label`} value={step.label} onChange={(v) => update({ label: v })} />
            <TextAreaField label="Description" value={step.description} onChange={(v) => update({ description: v })} rows={2} />
          </>
        )}
      />
    </>
  );
}

// ---- 9. timeline --------------------------------------------------------------------------------

function TimelineEditor({ content, onChange }: { content: TimelineContent; onChange: (c: TimelineContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Milestones"
        items={content.milestones}
        onChange={(milestones) => onChange({ ...content, milestones })}
        makeNew={() => ({ id: newId(), label: '', date: '' })}
        renderItem={(m, update) => (
          <>
            <TextField label="Label" value={m.label} onChange={(v) => update({ label: v })} />
            <TextField label="Date" value={m.date} onChange={(v) => update({ date: v })} />
          </>
        )}
      />
    </>
  );
}

// ---- 10. teamIntro ------------------------------------------------------------------------------

function TeamIntroEditor({ content, onChange }: { content: TeamIntroContent; onChange: (c: TeamIntroContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField<TeamMember>
        label="Team members"
        items={content.members}
        onChange={(members) => onChange({ ...content, members })}
        makeNew={() => ({ id: newId(), name: '', role: '' })}
        renderItem={(member, update) => (
          <>
            <TextField label="Name" value={member.name} onChange={(v) => update({ name: v })} />
            <TextField label="Role" value={member.role} onChange={(v) => update({ role: v })} />
            <ImageField label="Photo" value={member.photoDataUrl ?? ''} onChange={(v) => update({ photoDataUrl: v || undefined })} />
          </>
        )}
      />
    </>
  );
}

// ---- 11. caseStudySummary -----------------------------------------------------------------------

function CaseStudySummaryEditor({ content, onChange }: { content: CaseStudySummaryContent; onChange: (c: CaseStudySummaryContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextAreaField label="Challenge" value={content.challenge} onChange={(v) => onChange({ ...content, challenge: v })} rows={2} />
      <TextAreaField label="Approach" value={content.approach} onChange={(v) => onChange({ ...content, approach: v })} rows={2} />
      <TextAreaField label="Result" value={content.result} onChange={(v) => onChange({ ...content, result: v })} rows={2} />
    </>
  );
}

// ---- 12. testimonial ----------------------------------------------------------------------------

function TestimonialEditor({ content, onChange }: { content: TestimonialContent; onChange: (c: TestimonialContent) => void }) {
  return (
    <>
      <TextAreaField label="Quote" value={content.quote} onChange={(v) => onChange({ ...content, quote: v })} />
      <TextField label="Attribution name" value={content.attributionName} onChange={(v) => onChange({ ...content, attributionName: v })} />
      <TextField label="Attribution role" value={content.attributionRole} onChange={(v) => onChange({ ...content, attributionRole: v })} />
    </>
  );
}

// ---- 13. bigStat --------------------------------------------------------------------------------

function BigStatEditor({ content, onChange }: { content: BigStatContent; onChange: (c: BigStatContent) => void }) {
  return (
    <>
      <TextField label="Stat number" value={content.statNumber} onChange={(v) => onChange({ ...content, statNumber: v })} />
      <TextField label="Stat label" value={content.statLabel} onChange={(v) => onChange({ ...content, statLabel: v })} />
      <TextField label="Supporting text" value={content.supportingText ?? ''} onChange={(v) => onChange({ ...content, supportingText: v })} />
    </>
  );
}

// ---- 14. statsGrid ------------------------------------------------------------------------------

function StatsGridEditor({ content, onChange }: { content: StatsGridContent; onChange: (c: StatsGridContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Stats (3–4)"
        items={content.stats}
        min={3}
        max={4}
        onChange={(stats) => onChange({ ...content, stats })}
        makeNew={() => ({ id: newId(), number: '', label: '' })}
        renderItem={(stat, update) => (
          <>
            <TextField label="Number" value={stat.number} onChange={(v) => update({ number: v })} />
            <TextField label="Label" value={stat.label} onChange={(v) => update({ label: v })} />
          </>
        )}
      />
    </>
  );
}

// ---- 15. pricingInvestment ----------------------------------------------------------------------

function PricingInvestmentEditor({ content, onChange }: { content: PricingInvestmentContent; onChange: (c: PricingInvestmentContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Line items"
        items={content.lineItems}
        onChange={(lineItems) => onChange({ ...content, lineItems })}
        makeNew={() => ({ id: newId(), label: '', amount: 0 })}
        renderItem={(item, update) => (
          <>
            <TextField label="Description" value={item.label} onChange={(v) => update({ label: v })} />
            <NumberField label="Amount (USD)" value={item.amount} onChange={(v) => update({ amount: v })} />
          </>
        )}
      />
      <TextField label="Note (e.g. payment terms)" value={content.note ?? ''} onChange={(v) => onChange({ ...content, note: v })} />
    </>
  );
}

// ---- 16. servicesOverview -----------------------------------------------------------------------

function ServicesOverviewEditor({ content, onChange }: { content: ServicesOverviewContent; onChange: (c: ServicesOverviewContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Services"
        items={content.services}
        onChange={(services) => onChange({ ...content, services })}
        makeNew={() => ({ id: newId(), name: '', description: '' })}
        renderItem={(service, update) => (
          <>
            <TextField label="Name" value={service.name} onChange={(v) => update({ name: v })} />
            <TextAreaField label="Description" value={service.description} onChange={(v) => update({ description: v })} rows={2} />
          </>
        )}
      />
    </>
  );
}

// ---- 17. fullBleedImage -------------------------------------------------------------------------

function FullBleedImageEditor({ content, onChange }: { content: FullBleedImageContent; onChange: (c: FullBleedImageContent) => void }) {
  return (
    <>
      <ImageField label="Image" value={content.imageDataUrl} onChange={(v) => onChange({ ...content, imageDataUrl: v })} />
      <TextField label="Caption" value={content.caption ?? ''} onChange={(v) => onChange({ ...content, caption: v })} />
    </>
  );
}

// ---- 18. imageAndText ---------------------------------------------------------------------------

function ImageAndTextEditor({ content, onChange }: { content: ImageAndTextContent; onChange: (c: ImageAndTextContent) => void }) {
  return (
    <>
      <ImageField label="Image" value={content.imageDataUrl} onChange={(v) => onChange({ ...content, imageDataUrl: v })} />
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextAreaField label="Body" value={content.body} onChange={(v) => onChange({ ...content, body: v })} />
    </>
  );
}

// ---- 19. bulletList -----------------------------------------------------------------------------

function BulletListEditor({ content, onChange }: { content: BulletListContent; onChange: (c: BulletListContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <StringListField label="Bullets" items={content.bullets} onChange={(bullets) => onChange({ ...content, bullets })} min={1} />
    </>
  );
}

// ---- 20. chartImage -----------------------------------------------------------------------------

function ChartImageEditor({ content, onChange }: { content: ChartImageContent; onChange: (c: ChartImageContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ImageField label="Chart image" value={content.chartImageDataUrl} onChange={(v) => onChange({ ...content, chartImageDataUrl: v })} />
      <TextField label="Caption" value={content.caption ?? ''} onChange={(v) => onChange({ ...content, caption: v })} />
    </>
  );
}

// ---- 21. faq ------------------------------------------------------------------------------------

function FaqEditor({ content, onChange }: { content: FaqContent; onChange: (c: FaqContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Questions & answers"
        items={content.qaPairs}
        onChange={(qaPairs) => onChange({ ...content, qaPairs })}
        makeNew={() => ({ id: newId(), question: '', answer: '' })}
        renderItem={(qa, update) => (
          <>
            <TextField label="Question" value={qa.question} onChange={(v) => update({ question: v })} />
            <TextAreaField label="Answer" value={qa.answer} onChange={(v) => update({ answer: v })} rows={2} />
          </>
        )}
      />
    </>
  );
}

// ---- 22. roadmap --------------------------------------------------------------------------------

function RoadmapEditor({ content, onChange }: { content: RoadmapContent; onChange: (c: RoadmapContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <ObjectListField
        label="Phases"
        items={content.phases}
        onChange={(phases) => onChange({ ...content, phases })}
        makeNew={() => ({ id: newId(), label: '', description: '' })}
        renderItem={(phase, update) => (
          <>
            <TextField label="Label" value={phase.label} onChange={(v) => update({ label: v })} />
            <TextAreaField label="Description" value={phase.description} onChange={(v) => update({ description: v })} rows={2} />
          </>
        )}
      />
    </>
  );
}

// ---- 23. contactNextSteps -----------------------------------------------------------------------

function ContactNextStepsEditor({ content, onChange }: { content: ContactNextStepsContent; onChange: (c: ContactNextStepsContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextField label="Contact name" value={content.contactName} onChange={(v) => onChange({ ...content, contactName: v })} />
      <TextField label="Email" value={content.email} onChange={(v) => onChange({ ...content, email: v })} />
      <TextField label="Phone" value={content.phone ?? ''} onChange={(v) => onChange({ ...content, phone: v })} />
      <TextField label="Website" value={content.website ?? ''} onChange={(v) => onChange({ ...content, website: v })} />
      <TextAreaField label="Next-step note" value={content.nextStepNote ?? ''} onChange={(v) => onChange({ ...content, nextStepNote: v })} rows={2} />
    </>
  );
}

// ---- 24. thankYouClosing ------------------------------------------------------------------------

function ThankYouClosingEditor({ content, onChange }: { content: ThankYouClosingContent; onChange: (c: ThankYouClosingContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextField label="Subtitle" value={content.subtitle ?? ''} onChange={(v) => onChange({ ...content, subtitle: v })} />
      <BackgroundDesignField value={content.backgroundDesignId} onChange={(backgroundDesignId) => onChange({ ...content, backgroundDesignId })} />
    </>
  );
}

// ---- 25. blankCustom ----------------------------------------------------------------------------

function BlankCustomEditor({ content, onChange }: { content: BlankCustomContent; onChange: (c: BlankCustomContent) => void }) {
  return (
    <>
      <TextField label="Title" value={content.title} onChange={(v) => onChange({ ...content, title: v })} />
      <TextAreaField label="Free-form content" value={content.freeText} onChange={(v) => onChange({ ...content, freeText: v })} rows={8} />
    </>
  );
}

// ---- dispatcher -----------------------------------------------------------------------------

/** The field-editing form for one slide — swapped entirely when the slide's templateId
 * changes (never mixed/partial across templates). */
export default function SlideFieldEditor({ slide, onChange }: { slide: Slide; onChange: (slide: Slide) => void }) {
  switch (slide.templateId) {
    case 'titleCover':
      return <TitleCoverEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'agenda':
      return <AgendaEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'sectionDivider':
      return <SectionDividerEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'problemStatement':
      return (
        <BodyPointsEditor
          content={slide.content}
          onChange={(content) => onChange({ ...slide, content } as Slide)}
        />
      );
    case 'solutionOverview':
      return (
        <BodyPointsEditor
          content={slide.content}
          onChange={(content) => onChange({ ...slide, content } as Slide)}
        />
      );
    case 'threeColumn':
      return <ThreeColumnEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'twoColumnComparison':
      return <TwoColumnComparisonEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'processSteps':
      return <ProcessStepsEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'timeline':
      return <TimelineEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'teamIntro':
      return <TeamIntroEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'caseStudySummary':
      return <CaseStudySummaryEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'testimonial':
      return <TestimonialEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'bigStat':
      return <BigStatEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'statsGrid':
      return <StatsGridEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'pricingInvestment':
      return <PricingInvestmentEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'servicesOverview':
      return <ServicesOverviewEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'fullBleedImage':
      return <FullBleedImageEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'imageAndText':
      return <ImageAndTextEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'bulletList':
      return <BulletListEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'chartImage':
      return <ChartImageEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'faq':
      return <FaqEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'roadmap':
      return <RoadmapEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'contactNextSteps':
      return <ContactNextStepsEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'thankYouClosing':
      return <ThankYouClosingEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
    case 'blankCustom':
      return <BlankCustomEditor content={slide.content} onChange={(content) => onChange({ ...slide, content })} />;
  }
}
