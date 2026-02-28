import Link from 'next/link';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import ServiceCard from '@/components/ServiceCard/ServiceCard';
import styles from './ServiceGrid.module.css';

export default function ServiceGrid() {
    const services = [
        {
            title: "Enterprise Software Solutions",
            description: "Scalable systems that unify operations and eliminate friction across your organization.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            )
        },
        {
            title: "Custom Software Development",
            description: "Bespoke platforms built to your exact specifications — from MVP to full-scale production.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
            )
        },
        {
            title: "AI Integration",
            description: "Intelligent systems embedded into your workflows — from predictive models to LLM-powered automation.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            )
        },
        {
            title: "Cloud Solutions",
            description: "Resilient, cost-optimized infrastructure on AWS, Azure, and GCP built for your scale.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
            )
        },
        {
            title: "SEO & Digital Growth",
            description: "Data-driven visibility strategies that convert organic traffic into measurable business outcomes.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
            )
        },
        {
            title: "Software Consulting & Host Mgt.",
            description: "Strategic advisory and always-on infrastructure management — so you never have to worry.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
            )
        }
    ];

    return (
        <section className={styles.section} data-animate>
            <div className={styles.container}>
                <SectionLabel label="WHAT WE DO" />
                <h2 className={styles.title}>End-to-End Technology Capabilities</h2>
                <p className={styles.subtext}>
                    We build robust, scalable solutions tailored to complex business challenges.
                </p>

                <div className={styles.grid}>
                    {services.map((service, i) => (
                        <ServiceCard
                            key={i}
                            icon={service.icon}
                            title={service.title}
                            description={service.description}
                        />
                    ))}
                </div>

                <div className={styles.actionContainer}>
                    <Link href="/services" className={styles.actionLink}>
                        See All Capabilities <span className={styles.arrow}>›</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
