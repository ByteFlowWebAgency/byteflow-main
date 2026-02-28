'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import CTABanner from '@/components/CTABanner/CTABanner';
import TeamCard from '@/components/TeamCard/TeamCard';
import styles from './page.module.css';

export default function AboutPage() {
    useScrollAnimation();

    const leadership = [
        {
            name: "Marcus Sterling",
            title: "Chief Executive Officer",
            bio: "Former Director of Engineering at a Fortune 500 tech firm. 15+ years of experience scaling global enterprise systems.",
            imageSrc: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2000&auto=format&fit=crop"
        },
        {
            name: "Elena Rostova",
            title: "Chief Technology Officer",
            bio: "Expert in distributed systems and AI infrastructure. Holds multiple patents in predictive analytics architecture.",
            imageSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2000&auto=format&fit=crop"
        },
        {
            name: "David Chen",
            title: "Head of Cloud Architecture",
            bio: "AWS Machine Learning Hero and certified solutions architect. Specializes in real-time streaming architectures.",
            imageSrc: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=2000&auto=format&fit=crop"
        }
    ];

    return (
        <>
            <section className={styles.hero}>
                <div className={styles.glowBg}></div>
                <div className={styles.container}>
                    <SectionLabel label="OUR STORY" />
                    <h1 className={styles.title} data-animate>
                        Architects of the Digital Enterprise.
                    </h1>
                    <p className={styles.subtitle} data-animate>
                        Founded on the principle that exceptional engineering shouldn&apos;t be constrained by legacy systems or bureaucratic friction.
                    </p>
                </div>
            </section>

            <section className={styles.storySection} data-animate>
                <div className={styles.container}>
                    <div className={styles.grid2Col}>
                        <div>
                            <h2 className={styles.sectionTitle}>The BYTEFLOW Approach</h2>
                            <div className={styles.divider}></div>
                        </div>
                        <div>
                            <p className={styles.bodyText}>
                                We observed a critical gap in the technology consulting landscape: firms either offered high-level strategic advice with no implementation capability, or provided low-cost development resources that lacked enterprise architectural vision.
                            </p>
                            <p className={styles.bodyText}>
                                BYTEFLOW bridges that gap. We are a deep-tech engineering firm that embeds with our clients to solve their hardest technical challenges. Our teams don&apos;t just take orders; we challenge assumptions, design robust architectures, and deliver production code that scales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.valuesSection} data-animate>
                <div className={styles.container}>
                    <SectionLabel label="OUR VALUES" />
                    <h2 className={styles.sectionTitleCenter}>What Drives Us</h2>
                    <div className={styles.grid3Col}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>🛠️</div>
                            <h3>Engineering Excellence</h3>
                            <p>We believe in clean code, solid architectures, and rigorous testing. Quality is never negotiated.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>💡</div>
                            <h3>Pragmatic Innovation</h3>
                            <p>We use cutting-edge technology when it provides competitive advantage, not just for the sake of novelty.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}>🤝</div>
                            <h3>Radical Transparency</h3>
                            <p>We communicate openly about risks, progress, and challenges. No surprises, just solutions.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.teamSection} id="team" data-animate>
                <div className={styles.container}>
                    <SectionLabel label="LEADERSHIP" />
                    <h2 className={styles.sectionTitle}>Meet the Team</h2>
                    <div className={styles.teamGrid}>
                        {leadership.map((member, i) => (
                            <TeamCard key={i} {...member} />
                        ))}
                    </div>
                </div>
            </section>

            <CTABanner
                heading="Looking for a Strategic Technology Partner?"
                subtext="See how our engineering teams can help you overcome technical debt and scale your operations."
                buttonLabel="Get in Touch"
                buttonHref="/contact"
            />
        </>
    );
}
