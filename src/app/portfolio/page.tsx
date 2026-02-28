'use client';

import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import PortfolioGrid from '@/components/PortfolioGrid/PortfolioGrid';
import CTABanner from '@/components/CTABanner/CTABanner';
import styles from './page.module.css';

export default function PortfolioPage() {
    useScrollAnimation();
    const [activeFilter, setActiveFilter] = useState('All Work');

    const filters = ['All Work', 'Enterprise Software', 'AI Integration', 'Cloud Solutions', 'Digital Growth'];

    return (
        <>
            <section className={styles.hero}>
                <div className={styles.container}>
                    <SectionLabel label="CASE STUDIES" />
                    <h1 className={styles.title} data-animate>
                        Proven Engineering.<br />Measurable Impact.
                    </h1>
                    <p className={styles.subtitle} data-animate>
                        Select case studies demonstrating our ability to solve complex technical challenges at enterprise scale.
                    </p>
                </div>
            </section>

            <section className={styles.filterSection}>
                <div className={styles.container}>
                    <div className={styles.filterBar}>
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                className={`${styles.filterBtn} ${activeFilter === filter ? styles.active : ''}`}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <PortfolioGrid showHeader={false} />

            <section className={styles.resultsStrip} data-animate>
                <div className={styles.container}>
                    <div className={styles.resultsGrid}>
                        <div className={styles.resultItem}>
                            <h3>$140M+</h3>
                            <p>Client Revenue Generated via Our Platforms</p>
                        </div>
                        <div className={styles.resultItem}>
                            <h3>99.999%</h3>
                            <p>SLA Consistently Maintained</p>
                        </div>
                        <div className={styles.resultItem}>
                            <h3>40%</h3>
                            <p>Average Reduction in Operational Costs</p>
                        </div>
                    </div>
                </div>
            </section>

            <CTABanner
                heading="Let's Build Your Success Story."
                subtext="Bring us your hardest technical challenges. We'll bring the engineering talent to solve them."
                buttonLabel="Start the Conversation"
                buttonHref="/contact"
            />
        </>
    );
}
