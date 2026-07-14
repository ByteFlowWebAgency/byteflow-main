// The thirteen built-in Document Builder templates. "Blank" (#1) is handled specially by
// the chooser (createBlankDocument); the twelve below are DocTemplate objects. Every one is
// built from the fixed page/block vocabulary in 02-BLOCKS-AND-PAGES.md — distinctiveness
// comes from which blocks are chosen and the theme, never new primitives. Placeholder copy
// is bracketed and obviously fake (no real client data).
//
// The two "Full Design" templates deliberately import shared logic rather than duplicate
// it: the pricingTable block renders through the proposal tool's calculateTotals, and the
// Site Audit template's section pages come from the audit tool's CATEGORY_ORDER/LABELS.

import { newId } from '@/lib/document-builder/defaults';
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/audit-tool/labels';
import type { Block, BuiltDocument, DocumentPage } from '@/lib/document-builder/types';
import type { Pricing } from '@/lib/proposal-tool/types';
import type { DocTemplate } from './templateTypes';

const id = () => newId();
const EPOCH = '2026-01-01T00:00:00.000Z';

// ---- terse block/page builders ----------------------------------------------------------
const heading = (level: 1 | 2 | 3, text: string): Block => ({ id: id(), type: 'heading', level, text });
const rich = (html: string): Block => ({ id: id(), type: 'richText', html });
const banner = (eyebrow: string, title: string, subtitle = ''): Block => ({
  id: id(),
  type: 'titleBanner',
  eyebrow,
  title,
  subtitle,
});
const callout = (html: string): Block => ({ id: id(), type: 'callout', html });
const kv = (items: [string, string][]): Block => ({
  id: id(),
  type: 'keyValueList',
  items: items.map(([label, value]) => ({ id: id(), label, value })),
});
const table = (header: string[], rows: string[][]): Block => ({ id: id(), type: 'table', header, rows });
const pricing = (p: Pricing, items: [string, number, boolean][] = []): Block => ({
  id: id(),
  type: 'pricingTable',
  pricing: p,
  lineItems: items.map(([description, amount, recurring]) => ({ id: id(), description, amount, recurring })),
});
const image = (caption = ''): Block => ({ id: id(), type: 'image', dataUrl: '', caption, alt: '', width: 'full' });
const divider = (): Block => ({ id: id(), type: 'divider' });
const spacer = (size: 'small' | 'medium' | 'large' = 'medium'): Block => ({ id: id(), type: 'spacer', size });

const cover = (title: string, subtitle: string, clientName = '[Client name]'): DocumentPage => ({
  id: id(),
  kind: 'cover',
  blocks: [],
  coverFields: { title, subtitle, clientName, date: '' },
});
const section = (eyebrow: string, title: string, subtitle = ''): DocumentPage => ({
  id: id(),
  kind: 'sectionTitle',
  blocks: [],
  sectionTitleFields: { eyebrow, title, subtitle },
});
const content = (...blocks: Block[]): DocumentPage => ({ id: id(), kind: 'content', blocks });
const closing = (...blocks: Block[]): DocumentPage => ({ id: id(), kind: 'closing', blocks });

const buildDoc = (name: string, themeId: string, pages: DocumentPage[]): BuiltDocument => ({
  id: id(),
  name,
  createdAt: EPOCH,
  updatedAt: EPOCH,
  themeId,
  pages,
});
const tpl = (
  tid: string,
  name: string,
  description: string,
  category: string,
  document: BuiltDocument,
): DocTemplate => ({ id: tid, name, description, category, isBuiltIn: true, document });

const SALES = 'Sales & Pitch';
const SCOPING = 'Scoping & Delivery';
const DIAG = 'Diagnostic & Reporting';
const EXTRAS = 'Client-Facing Extras';

const CONTACT = '<p>[Your name] · [email] · [phone] — <strong>ByteFlow Solutions</strong>, Akron, Ohio.</p>';

// ---- #10 Site Audit — Full Design: section page per audit category (imported labels) -----
function siteAuditPages(): DocumentPage[] {
  const pages: DocumentPage[] = [cover('[site.com] — Site Audit', 'SITE AUDIT REPORT', '[Client name]')];
  CATEGORY_ORDER.forEach((cat, i) => {
    pages.push(section('CATEGORY', CATEGORY_LABELS[cat]));
    const blocks: Block[] = [
      callout('<p><strong>[Finding headline]</strong> — [what you found and why it matters to the client].</p>'),
      table(
        ['Issue', 'Severity', 'Recommendation'],
        [
          ['[Issue observed]', '[Critical / High / Medium / Low / Working well]', '[What to change]'],
          ['[Issue observed]', '[Severity]', '[What to change]'],
        ],
      ),
    ];
    if (i === 0) blocks.push(image('[Screenshot of the issue]'));
    pages.push(content(...blocks));
  });
  pages.push(section('SUMMARY', 'Top Recommendations'));
  pages.push(
    content(
      table(
        ['Priority', 'Recommendation', 'Expected impact'],
        [
          ['1', '[Highest-impact fix]', '[Impact]'],
          ['2', '[Next fix]', '[Impact]'],
          ['3', '[Next fix]', '[Impact]'],
        ],
      ),
    ),
  );
  pages.push(closing(rich('<p>Ready to turn these findings into results? [Next step].</p>'), rich(CONTACT)));
  return pages;
}

export const BUILT_IN_TEMPLATES: readonly DocTemplate[] = [
  // ---- Sales & Pitch ----
  tpl(
    'tpl-one-pager',
    'One-Pager',
    'A single-page leave-behind: the pitch, the numbers, the hook.',
    SALES,
    buildDoc('One-Pager', 'classic', [
      content(
        heading(1, '[Project / offer headline]'),
        rich('<p>[One or two sentences on the opportunity and why it matters right now.]</p>'),
        kv([
          ['Project', '[What we will build]'],
          ['Timeline', '[e.g. 6–8 weeks]'],
          ['Investment', '[$0]'],
        ]),
        callout('<p><strong>The hook:</strong> [the single most compelling reason to say yes].</p>'),
        divider(),
        rich(CONTACT),
      ),
    ]),
  ),
  tpl(
    'tpl-proposal-full',
    'Proposal — Full Design',
    'The block-based, fully restructurable sibling to the fixed Proposal tool.',
    SALES,
    buildDoc('Proposal — Full Design', 'classic', [
      cover('[Project title]', 'PROJECT PROPOSAL', '[Client name]'),
      section('01', 'Overview'),
      content(
        rich('<p>[Frame the engagement: the client’s goal, the outcome, and how you will get there.]</p>'),
        banner('APPROACH', 'How we work', 'Discover → Build → Scale'),
        banner('PHASE 1', 'Discover'),
        rich('<p>[What happens in discovery and what the client gets out of it.]</p>'),
        banner('PHASE 2', 'Build'),
        rich('<p>[What happens during build.]</p>'),
        banner('PHASE 3', 'Scale'),
        rich('<p>[What happens as we scale and support.]</p>'),
      ),
      section('02', 'Investment'),
      content(
        pricing(
          { model: 'flat', totalAmount: 0, paymentSchedule: '[e.g. 50% to start, 50% on delivery]' },
          [['[Optional add-on]', 0, false]],
        ),
        rich('<p>[Anything the client should know about scope, assumptions, or what’s excluded.]</p>'),
      ),
      section('03', 'Terms'),
      closing(
        rich('<p>[Validity window, next steps, and how to accept.]</p>'),
        rich(CONTACT),
      ),
    ]),
  ),
  tpl(
    'tpl-exec-pitch',
    'Executive Pitch',
    'Dark, slide-deck rhythm inside a PDF — for when the format should feel premium.',
    SALES,
    buildDoc('Executive Pitch', 'dark', [
      cover('[Big idea, in a few words]', 'A PITCH FOR [CLIENT]', '[Client name]'),
      content(banner('01', 'The Problem'), callout('<p>[The pain, stated plainly. One or two sentences.]</p>')),
      content(banner('02', 'Our Approach'), callout('<p>[How ByteFlow solves it — the essence.]</p>')),
      content(banner('03', 'Why ByteFlow'), callout('<p>[The proof: track record, edge, fit.]</p>')),
      content(
        banner('04', 'Investment'),
        pricing({ model: 'retainer', monthlyAmount: 0, termMonths: 12, includedScope: '[What each month includes]' }),
      ),
      closing(banner('05', 'Next Step'), callout('<p>[The one action you want them to take.]</p>'), rich(CONTACT)),
    ]),
  ),
  tpl(
    'tpl-case-study',
    'Case Study',
    'Challenge → approach → outcome, with a results metric and a screenshot.',
    SALES,
    buildDoc('Case Study', 'classic', [
      cover('[Client] — Case Study', 'CASE STUDY', '[Client name]'),
      content(
        banner('THE CHALLENGE', '[What the client was up against]'),
        rich('<p>[The situation before ByteFlow got involved.]</p>'),
        banner('THE APPROACH', '[What we did]'),
        rich('<p>[The work, in a few sentences.]</p>'),
        kv([
          ['Stack', '[Tech used]'],
          ['Timeline', '[Duration]'],
          ['Team', '[Who worked on it]'],
        ]),
        image('[Result screenshot]'),
        callout('<p><strong>Outcome:</strong> [the headline metric — e.g. “+43% organic traffic in 90 days”].</p>'),
      ),
      closing(rich('<p>Want results like this? [Next step].</p>'), rich(CONTACT)),
    ]),
  ),

  // ---- Scoping & Delivery ----
  tpl(
    'tpl-scope-memo',
    'Scope Memo',
    'What’s in, what’s out — the exclusions that prevent disputes.',
    SCOPING,
    buildDoc('Scope Memo', 'classic', [
      cover('[Project] — Scope of Work', 'SCOPE MEMO', '[Client name]'),
      content(
        heading(1, 'Scope of Work'),
        rich('<p>[Summarize what this engagement covers.]</p>'),
        table(
          ['Deliverable', 'Included', 'Notes'],
          [
            ['[Deliverable]', 'Yes', '[Detail]'],
            ['[Deliverable]', 'Yes', '[Detail]'],
          ],
        ),
        callout('<p><strong>Out of scope:</strong> [list what is explicitly NOT included — this is the part that prevents disputes later].</p>'),
      ),
      closing(rich('<p>[Approval / sign-off line.]</p>'), rich(CONTACT)),
    ]),
  ),
  tpl(
    'tpl-project-overview',
    'Project Overview',
    'The mini-proposal for engagements too small for the full proposal tool.',
    SCOPING,
    buildDoc('Project Overview', 'classic', [
      cover('[Project name]', 'PROJECT OVERVIEW', '[Client name]'),
      content(
        heading(1, 'Overview'),
        rich('<p>[What we’re doing and why.]</p>'),
        kv([
          ['Goal', '[Outcome]'],
          ['Timeline', '[Duration]'],
          ['Point of contact', '[Name]'],
        ]),
        pricing({ model: 'flat', totalAmount: 0, paymentSchedule: '[Payment schedule]' }),
        spacer('medium'),
        callout('<p>[The one thing to keep front of mind.]</p>'),
      ),
      closing(rich('<p>[Next steps.]</p>'), rich(CONTACT)),
    ]),
  ),
  tpl(
    'tpl-migration-plan',
    'Migration Plan',
    'Phases, cutover windows, and the backup guarantee.',
    SCOPING,
    buildDoc('Migration Plan', 'classic', [
      cover('[System] Migration', 'MIGRATION PLAN', '[Client name]'),
      content(
        heading(1, 'Migration Overview'),
        rich('<p>[What is moving, from where to where, and the goal.]</p>'),
        table(
          ['Phase', 'Window', 'Rollback point'],
          [
            ['[Prep]', '[Date/time]', '[Snapshot / backup]'],
            ['[Cutover]', '[Date/time]', '[Snapshot / backup]'],
            ['[Verify]', '[Date/time]', '[Snapshot / backup]'],
          ],
        ),
        callout('<p><strong>Cutover window &amp; backup guarantee:</strong> [when the switch happens and how data is protected if we need to roll back].</p>'),
      ),
      closing(rich('<p>[Sign-off / go-live confirmation.]</p>'), rich(CONTACT)),
    ]),
  ),
  tpl(
    'tpl-meeting-brief',
    'Meeting Brief',
    'Discovery-meeting prep: what we know, what to ask, the outcome we want.',
    SCOPING,
    buildDoc('Meeting Brief', 'classic', [
      content(
        heading(1, '[Meeting name] — Brief'),
        kv([
          ['Org', '[Company]'],
          ['Attendees', '[Names]'],
          ['Date', '[Date]'],
          ['Goal', '[What success looks like]'],
        ]),
        rich('<p><strong>What we know:</strong> [context going in].</p>'),
        table(
          ['Questions to ask', 'Why it matters'],
          [
            ['[Question]', '[Reason]'],
            ['[Question]', '[Reason]'],
          ],
        ),
        callout('<p><strong>Desired outcome:</strong> [what we want to walk away with].</p>'),
      ),
    ]),
  ),

  // ---- Diagnostic & Reporting ----
  tpl(
    'tpl-site-audit-full',
    'Site Audit — Full Design',
    'The block-based sibling to the fixed Audit tool — a section page per category.',
    DIAG,
    buildDoc('Site Audit — Full Design', 'classic', siteAuditPages()),
  ),
  tpl(
    'tpl-monthly-report',
    'Monthly Client Report',
    'A reusable monthly report layout (placeholder data — no live source yet).',
    DIAG,
    buildDoc('Monthly Client Report', 'classic', [
      cover('[Client] — Monthly Report', '[Month Year]', '[Client name]'),
      content(
        kv([
          ['Period', '[Month Year]'],
          ['Client', '[Client name]'],
          ['Prepared by', '[Your name]'],
        ]),
        banner('THIS MONTH', 'Highlights'),
        table(
          ['Metric', 'Last month', 'This month', 'Change'],
          [
            ['[Metric]', '[0]', '[0]', '[+0%]'],
            ['[Metric]', '[0]', '[0]', '[+0%]'],
          ],
        ),
        callout('<p><strong>Wins:</strong> [what went well this month].</p>'),
        callout('<p><strong>Next month’s focus:</strong> [what we’ll prioritize].</p>'),
      ),
      closing(rich('<p>[Closing note.]</p>'), rich(CONTACT)),
    ]),
  ),

  // ---- Client-Facing Extras ----
  tpl(
    'tpl-onboarding',
    'Thank You / Onboarding Packet',
    'A warm welcome: what happens next, who to contact, how to reach us.',
    EXTRAS,
    buildDoc('Thank You / Onboarding Packet', 'classic', [
      cover('Welcome aboard', 'ONBOARDING', '[Client name]'),
      content(
        rich('<p>[A warm, human welcome — thank them and set the tone.]</p>'),
        kv([
          ['This week', '[What happens next]'],
          ['Week 2', '[Milestone]'],
          ['Week 3', '[Milestone]'],
        ]),
        table(
          ['Point of contact', 'Role', 'Email'],
          [
            ['[Name]', '[Role]', '[email]'],
            ['[Name]', '[Role]', '[email]'],
          ],
        ),
        callout('<p><strong>How to reach us:</strong> [the fastest way to get help].</p>'),
      ),
      closing(rich('<p>We’re glad you’re here. [Sign-off].</p>'), rich(CONTACT)),
    ]),
  ),
  tpl(
    'tpl-partnership-renewal',
    'Partnership Summary (Renewal)',
    'This past term, what was delivered, and the renewal terms.',
    EXTRAS,
    buildDoc('Partnership Summary', 'classic', [
      cover('[Client] — Partnership Summary', 'RENEWAL', '[Client name]'),
      content(
        banner('THIS PAST TERM', 'What we delivered'),
        table(
          ['Deliverable', 'Status'],
          [
            ['[Deliverable]', '[Delivered]'],
            ['[Deliverable]', '[Delivered]'],
          ],
        ),
        banner('RENEWAL TERMS', 'The next term'),
        pricing({ model: 'retainer', monthlyAmount: 0, termMonths: 12, includedScope: '[What the renewal includes each month]' }),
        callout('<p>[Why renewing is the obvious next step.]</p>'),
      ),
      closing(rich('<p>[How to renew / next steps.]</p>'), rich(CONTACT)),
    ]),
  ),
];

export function getBuiltInTemplate(id_: string): DocTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id_);
}
