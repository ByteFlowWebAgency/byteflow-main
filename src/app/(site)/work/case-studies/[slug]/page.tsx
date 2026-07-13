import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import styles from './page.module.css';
import { getCaseStudyBySlug, getAllCaseStudies } from '@/lib/contentful/queries';
import { assetUrl, type AssetLike } from '@/lib/contentful/props';

// Loose shape for the caseStudy entry fields we read (mirrors CardFields in extract.ts).
interface CaseStudyFields {
  companyName?: string;
  eyebrow?: string;
  tagline?: string;
  description?: string;
  thumbnail?: AssetLike;
  url?: string;
  slug?: string;
  body?: string;
}

function fieldsOf(entry: unknown): CaseStudyFields | undefined {
  return (entry as { fields?: unknown } | null)?.fields as CaseStudyFields | undefined;
}

/* ── Minimal Markdown renderer ───────────────────────────────────────────
 * The `body` field is Markdown. With no markdown dependency available, this
 * maps the exact subset the content uses — #/##/### headings, --- rules,
 * **bold** spans, and "- " bullet lists — to styled JSX. Anything else falls
 * through as a plain paragraph. */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on **bold** spans, keeping the delimited chunks.
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Prose({ body }: { body: string }) {
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let paragraph: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const key = `ul-${blocks.length}`;
    blocks.push(
      <ul key={key} className={styles.list}>
        {listItems.map((item, i) => (
          <li key={i} className={styles.listItem}>
            {renderInline(item, `${key}-${i}`)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const key = `p-${blocks.length}`;
    blocks.push(
      <p key={key} className={styles.paragraph}>
        {renderInline(paragraph.join(' '), key)}
      </p>,
    );
    paragraph = [];
  };

  for (const raw of body.split('\n')) {
    const line = raw.trim();

    if (line === '') {
      flushList();
      flushParagraph();
    } else if (line === '---') {
      flushList();
      flushParagraph();
      blocks.push(<hr key={`hr-${blocks.length}`} className={styles.rule} />);
    } else if (line.startsWith('### ')) {
      flushList();
      flushParagraph();
      const key = `h4-${blocks.length}`;
      blocks.push(<h4 key={key} className={styles.h4}>{renderInline(line.slice(4), key)}</h4>);
    } else if (line.startsWith('## ')) {
      flushList();
      flushParagraph();
      const key = `h3-${blocks.length}`;
      blocks.push(<h3 key={key} className={styles.h3}>{renderInline(line.slice(3), key)}</h3>);
    } else if (line.startsWith('# ')) {
      flushList();
      flushParagraph();
      const key = `h2-${blocks.length}`;
      blocks.push(<h2 key={key} className={styles.h2}>{renderInline(line.slice(2), key)}</h2>);
    } else if (line.startsWith('- ')) {
      flushParagraph();
      listItems.push(line.slice(2));
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushList();
  flushParagraph();

  return <div className={styles.prose}>{blocks}</div>;
}

/* ── Route ───────────────────────────────────────────────────────────── */

export async function generateStaticParams() {
  const caseStudies = await getAllCaseStudies();
  return (caseStudies ?? [])
    .map((entry) => (entry.fields as { slug?: string }).slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = fieldsOf(await getCaseStudyBySlug(slug));
  if (!cs) return { title: 'Case Study — ByteFlow' };
  return {
    title: `${cs.companyName ?? 'Case Study'} — ByteFlow`,
    description: cs.description ?? cs.tagline,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cs = fieldsOf(await getCaseStudyBySlug(slug));
  if (!cs) notFound();

  const img = assetUrl(cs.thumbnail);
  const imgAlt = cs.thumbnail?.fields?.title ?? cs.companyName ?? '';
  const liveUrl = cs.url;

  // Drive the frame's shape from the image's intrinsic dimensions so the whole
  // screenshot fits (no cropping) instead of being forced into a fixed ratio.
  const dim = cs.thumbnail?.fields?.file?.details?.image;
  const frameStyle =
    dim?.width && dim?.height ? { aspectRatio: `${dim.width} / ${dim.height}` } : undefined;

  return (
    <article>
      <section className={styles.hero}>
        <div className={styles.blobWrap} aria-hidden>
          <div className={`${styles.blob} ${styles.blobOne}`} />
          <div className={`${styles.blob} ${styles.blobTwo}`} />
        </div>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/work" className={styles.crumb}>Work</Link>
            <span className={styles.crumbSep} aria-hidden>/</span>
            <span className={styles.crumbCurrent}>{cs.companyName}</span>
          </nav>
          {cs.eyebrow && <p className={styles.eyebrow}>{cs.eyebrow}</p>}
          <h1 className={styles.h1}>{cs.companyName}</h1>
          {cs.tagline && <p className={styles.tagline}>{cs.tagline}</p>}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.liveLink}
            >
              Visit the live site
              <span className={styles.arrow} aria-hidden>↗</span>
            </a>
          )}
        </div>
      </section>

      {img && (
        <section className={styles.media}>
          <ScrollReveal>
            <div className={styles.mediaFrame} style={frameStyle}>
              {liveUrl ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mediaLink}
                  aria-label={`Visit ${cs.companyName}`}
                >
                  <Image
                    src={img}
                    alt={imgAlt}
                    fill
                    className={styles.mediaImg}
                    sizes="(max-width: 1120px) 100vw, 1120px"
                    priority
                  />
                  <div className={styles.mediaOverlay} aria-hidden />
                </a>
              ) : (
                <>
                  <Image
                    src={img}
                    alt={imgAlt}
                    fill
                    className={styles.mediaImg}
                    sizes="(max-width: 1120px) 100vw, 1120px"
                    priority
                  />
                  <div className={styles.mediaOverlay} aria-hidden />
                </>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      <section className={styles.content}>
        <div className={styles.contentInner}>
          {cs.description && <p className={styles.lede}>{cs.description}</p>}
          {cs.body && <Prose body={cs.body} />}
        </div>
      </section>

      {liveUrl && (
        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <div className={styles.ctaOverlay} aria-hidden />
            <div className={styles.ctaContent}>
              <p className={styles.ctaEyebrow}>Live in production</p>
              <h2 className={styles.ctaH2}>See {cs.companyName} in the wild</h2>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnPrimary}
              >
                Visit the live site
                <span className={styles.arrow} aria-hidden>→</span>
              </a>
              <Link href="/work" className={styles.backLink}>← Back to all work</Link>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
