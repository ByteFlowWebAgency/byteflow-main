import { getPage } from '@/lib/contentful/queries';
import Hero from '@/components/Hero/Hero';
import Services from '@/components/Services/Services';
import Why from '@/components/Why/Why';
import CtaBand from '@/components/CtaBand/CtaBand';
import { cardsOf, ctaFrom, headerOf, sectionsOf } from '@/lib/contentful/extract';
import type { CardData, StepData } from '@/lib/contentful/props';

export default async function Home() {
  const page = await getPage('/');
  const sections = sectionsOf(page);

  // sections[0] (hero) + sections[1] (sectionHeader + step cards) both render in Hero.
  const intro = headerOf(sections[0]);
  const showcase = headerOf(sections[1]);
  const servicesHeader = headerOf(sections[2]);
  const whyHeader = headerOf(sections[3]);
  const ctaHeader = headerOf(sections[4]);

  const steps: StepData[] = cardsOf(sections[1]).map((c) => ({
    num: c.eyebrow ?? '',
    title: c.title ?? '',
    desc: c.description ?? '',
  }));
  const services: CardData[] = cardsOf(sections[2]).map((c) => ({
    title: c.title ?? '',
    desc: c.description ?? '',
  }));
  const values: CardData[] = cardsOf(sections[3]).map((c) => ({
    title: c.title ?? '',
    desc: c.description ?? '',
  }));

  return (
    <>
      <Hero
        eyebrow={intro?.eyebrow ?? ''}
        heading={intro?.heading ?? ''}
        subText={intro?.subText ?? ''}
        primaryCta={ctaFrom(intro?.primaryCta)}
        secondaryCta={ctaFrom(intro?.secondaryCta)}
        showcaseEyebrow={showcase?.eyebrow ?? ''}
        showcaseTitle={showcase?.heading ?? ''}
        steps={steps}
      />
      <Services
        eyebrow={servicesHeader?.eyebrow ?? ''}
        heading={servicesHeader?.heading ?? ''}
        lede={servicesHeader?.subText ?? ''}
        services={services}
      />
      <Why
        eyebrow={whyHeader?.eyebrow ?? ''}
        heading={whyHeader?.heading ?? ''}
        values={values}
      />
      <CtaBand
        eyebrow={ctaHeader?.eyebrow ?? ''}
        heading={ctaHeader?.heading ?? ''}
        lede={ctaHeader?.subText ?? ''}
        primaryCta={ctaFrom(ctaHeader?.primaryCta)}
        secondaryCta={ctaFrom(ctaHeader?.secondaryCta)}
      />
    </>
  );
}
