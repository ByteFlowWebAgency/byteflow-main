'use client';

import { useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import Hero from '@/components/Hero/Hero';
import StatsStrip from '@/components/StatsStrip/StatsStrip';
import ServiceGrid from '@/components/ServiceGrid/ServiceGrid';
import WhyByteflow from '@/components/WhyByteflow/WhyByteflow';
import CTABanner from '@/components/CTABanner/CTABanner';
import PortfolioGrid from '@/components/PortfolioGrid/PortfolioGrid';

export default function Home() {
  useScrollAnimation();

  return (
    <>
      <Hero />
      <StatsStrip />
      <ServiceGrid />
      <WhyByteflow />
      <CTABanner
        heading="Ready to Build Your Engineering Capabilities?"
        subtext="Let's discuss how BYTEFLOW can accelerate your digital transformation and build technology that scales with your business."
        buttonLabel="Schedule a Consultation"
        buttonHref="/contact"
      />
      <PortfolioGrid limit={3} showHeader={true} />
      <CTABanner
        heading="Partner with Proven Engineering Leaders."
        subtext="We don't just write code. We architect solutions to complex enterprise problems."
        buttonLabel="Explore Our Services"
        buttonHref="/services"
      />
    </>
  );
}
