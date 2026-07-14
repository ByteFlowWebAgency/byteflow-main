// Placeholder content + factory functions for the Presentations tool. Per
// docs/slides/00-GUARDRAILS.md: no real client data, logos, or figures in any default —
// bracketed placeholders only, everywhere.

import type { Deck, Slide, SlideContent, SlideTemplateId } from './types';

export function newId(): string {
  return crypto.randomUUID();
}

/** Bracketed placeholder content for a fresh slide of the given template. */
function defaultContentFor(templateId: SlideTemplateId): SlideContent {
  switch (templateId) {
    case 'titleCover':
      return {
        templateId,
        content: {
          eyebrow: '[PROPOSAL FOLLOW-UP]',
          title: '[Project or Engagement Title]',
          subtitle: '[One-line framing of the opportunity]',
          presentedTo: '[Client Organization]',
          date: '[Month Year]',
        },
      };
    case 'agenda':
      return {
        templateId,
        content: {
          title: 'Agenda',
          items: ['[Topic one]', '[Topic two]', '[Topic three]'],
        },
      };
    case 'sectionDivider':
      return {
        templateId,
        content: { title: '[Section title]', subtitle: '[Optional subtitle]' },
      };
    case 'problemStatement':
      return {
        templateId,
        content: {
          title: 'The Opportunity',
          body: '[One short paragraph framing the problem — why the prospect should care now.]',
          points: ['[Supporting point one]', '[Supporting point two]'],
        },
      };
    case 'solutionOverview':
      return {
        templateId,
        content: {
          title: 'Our Approach',
          body: '[One short paragraph on how ByteFlow solves it.]',
          points: ['[Supporting point one]', '[Supporting point two]'],
        },
      };
    case 'threeColumn':
      return {
        templateId,
        content: {
          title: '[Three reasons / pillars / deliverables]',
          columns: [
            { heading: '[Column one]', body: '[Short body]' },
            { heading: '[Column two]', body: '[Short body]' },
            { heading: '[Column three]', body: '[Short body]' },
          ],
        },
      };
    case 'twoColumnComparison':
      return {
        templateId,
        content: {
          title: 'Without ByteFlow / With ByteFlow',
          leftHeading: '[Without ByteFlow]',
          leftItems: ['[Pain point one]', '[Pain point two]'],
          rightHeading: '[With ByteFlow]',
          rightItems: ['[Benefit one]', '[Benefit two]'],
        },
      };
    case 'processSteps':
      return {
        templateId,
        content: {
          title: 'How We Work',
          steps: [
            { id: newId(), number: 1, label: 'Discover', description: '[What happens in discovery]' },
            { id: newId(), number: 2, label: 'Build', description: '[What happens during build]' },
            { id: newId(), number: 3, label: 'Scale', description: '[What happens as we scale]' },
          ],
        },
      };
    case 'timeline':
      return {
        templateId,
        content: {
          title: 'Timeline',
          milestones: [
            { id: newId(), label: '[Milestone one]', date: '[Week 1]' },
            { id: newId(), label: '[Milestone two]', date: '[Week 4]' },
          ],
        },
      };
    case 'teamIntro':
      return {
        templateId,
        content: {
          title: 'The Team',
          members: [
            { id: newId(), name: '[Name]', role: '[Role]' },
            { id: newId(), name: '[Name]', role: '[Role]' },
          ],
        },
      };
    case 'caseStudySummary':
      return {
        templateId,
        content: {
          title: '[Client] — Case Study',
          challenge: '[What the client was up against]',
          approach: '[What we did]',
          result: '[The outcome, ideally with a metric]',
        },
      };
    case 'testimonial':
      return {
        templateId,
        content: {
          quote: '[A strong pull-quote from a happy client goes here.]',
          attributionName: '[Name]',
          attributionRole: '[Role, Organization]',
        },
      };
    case 'bigStat':
      return {
        templateId,
        content: {
          statNumber: '[0%]',
          statLabel: '[What this number measures]',
          supportingText: '[Optional one-line context]',
        },
      };
    case 'statsGrid':
      return {
        templateId,
        content: {
          title: 'By The Numbers',
          stats: [
            { id: newId(), number: '[0]', label: '[Metric one]' },
            { id: newId(), number: '[0]', label: '[Metric two]' },
            { id: newId(), number: '[0]', label: '[Metric three]' },
          ],
        },
      };
    case 'pricingInvestment':
      return {
        templateId,
        content: {
          title: 'Investment',
          lineItems: [
            { id: newId(), label: '[Line item one]', amount: 0 },
            { id: newId(), label: '[Line item two]', amount: 0 },
          ],
          note: '[e.g. 50% upfront, 50% on completion]',
        },
      };
    case 'servicesOverview':
      return {
        templateId,
        content: {
          title: 'Services',
          services: [
            { id: newId(), name: '[Service name]', description: '[Short description]' },
            { id: newId(), name: '[Service name]', description: '[Short description]' },
          ],
        },
      };
    case 'fullBleedImage':
      return { templateId, content: { imageDataUrl: '', caption: '[Optional caption]' } };
    case 'imageAndText':
      return {
        templateId,
        content: {
          imageDataUrl: '',
          title: '[Title]',
          body: '[Short body paragraph explaining the image.]',
        },
      };
    case 'bulletList':
      return {
        templateId,
        content: { title: '[Title]', bullets: ['[Bullet one]', '[Bullet two]', '[Bullet three]'] },
      };
    case 'chartImage':
      return {
        templateId,
        content: { title: '[Chart title]', chartImageDataUrl: '', caption: '[Optional caption]' },
      };
    case 'faq':
      return {
        templateId,
        content: {
          title: 'Frequently Asked Questions',
          qaPairs: [
            { id: newId(), question: '[Anticipated question]', answer: '[Answer]' },
            { id: newId(), question: '[Anticipated question]', answer: '[Answer]' },
          ],
        },
      };
    case 'roadmap':
      return {
        templateId,
        content: {
          title: "What's Next",
          phases: [
            { id: newId(), label: '[Phase one]', description: '[What happens]' },
            { id: newId(), label: '[Phase two]', description: '[What happens]' },
          ],
        },
      };
    case 'contactNextSteps':
      return {
        templateId,
        content: {
          title: 'Next Steps',
          contactName: '[Your Name]',
          email: '[you@byteflowsolutions.com]',
          phone: '[Phone]',
          website: '[byteflowsolutions.com]',
          nextStepNote: '[e.g. Let’s schedule a follow-up call]',
        },
      };
    case 'thankYouClosing':
      return { templateId, content: { title: 'Thank You', subtitle: '[Optional subtitle]' } };
    case 'blankCustom':
      return { templateId, content: { title: '[Title]', freeText: '[Free-form content]' } };
  }
}

/** A fresh slide of the given template, with bracketed placeholder content. */
export function createSlide(templateId: SlideTemplateId): Slide {
  return { id: newId(), ...defaultContentFor(templateId) };
}

/** A brand-new deck: one titleCover slide, classic theme, per docs/slides/02-SLIDE-DATA-MODEL.md. */
export function createDefaultDeck(): Deck {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: 'Untitled deck',
    createdAt: now,
    updatedAt: now,
    themeId: 'classic',
    slides: [createSlide('titleCover')],
  };
}
