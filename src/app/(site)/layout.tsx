import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { getHeader, getFooter } from '@/lib/contentful/queries';
import {
  toLogo,
  toNavLink,
  type FooterColumnData,
  type NavLinkData,
} from '@/lib/contentful/props';

// Loose shapes for the parts of the resolved getHeader()/getFooter() responses we read.
interface NavLinkFields {
  label?: string;
  url?: string;
  openInNewTab?: boolean;
}
interface AssetLike {
  fields?: {
    title?: string;
    file?: {
      url?: string;
      details?: { image?: { width?: number; height?: number } };
    };
  };
}
interface Linked<T> {
  fields?: T;
}
interface HeaderFields {
  logo?: AssetLike;
  navLinks?: Linked<NavLinkFields>[];
  ctaButton?: Linked<NavLinkFields>;
}
interface FooterColumnFields {
  title?: string;
  links?: Linked<NavLinkFields>[];
}
interface FooterFields {
  logo?: AssetLike;
  tagline?: string;
  columns?: Linked<FooterColumnFields>[];
  copyrightText?: string;
}

function navLinksFrom(links?: Linked<NavLinkFields>[]): NavLinkData[] {
  return (links ?? [])
    .map((l) => l.fields)
    .filter((f): f is NavLinkFields => Boolean(f))
    .map((f) => toNavLink(f));
}

// Marketing chrome for the public site. Fetches the Contentful-driven header/footer and
// wraps every (site) route; internal routes never reach this layout.
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [header, footer] = await Promise.all([getHeader(), getFooter()]);
  const headerFields = header?.fields as unknown as HeaderFields | undefined;
  const footerFields = footer?.fields as unknown as FooterFields | undefined;

  const navLinks = navLinksFrom(headerFields?.navLinks);
  const cta = headerFields?.ctaButton?.fields
    ? toNavLink(headerFields.ctaButton.fields)
    : undefined;

  const columns: FooterColumnData[] = (footerFields?.columns ?? [])
    .map((col) => col.fields)
    .filter((f): f is FooterColumnFields => Boolean(f))
    .map((f) => ({
      title: f.title ?? '',
      links: navLinksFrom(f.links),
    }));

  return (
    <>
      <Nav logo={toLogo(headerFields?.logo)} navLinks={navLinks} cta={cta} />
      {children}
      <Footer
        logo={toLogo(footerFields?.logo)}
        tagline={footerFields?.tagline ?? ''}
        columns={columns}
        copyrightText={footerFields?.copyrightText ?? ''}
      />
    </>
  );
}
