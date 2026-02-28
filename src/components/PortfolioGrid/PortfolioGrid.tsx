import PortfolioCard from '@/components/PortfolioCard/PortfolioCard';
import SectionLabel from '@/components/SectionLabel/SectionLabel';
import styles from './PortfolioGrid.module.css';

interface PortfolioGridProps {
    limit?: number;
    showHeader?: boolean;
}

export default function PortfolioGrid({ limit, showHeader = true }: PortfolioGridProps) {
    const projects = [
        {
            category: "Finance",
            title: "Global Payments Platform",
            outcome: "Processed $100M+ in year one with 99.999% uptime.",
            imageSrc: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
        },
        {
            category: "Healthcare",
            title: "AI Diagnostic Engine",
            outcome: "Reduced screening time by 40% using custom computer vision models.",
            imageSrc: "https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=2070&auto=format&fit=crop"
        },
        {
            category: "Logistics",
            title: "Real-Time Supply Chain App",
            outcome: "Saved enterprise client $2.4M annually in routing inefficiencies.",
            imageSrc: "https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?q=80&w=2070&auto=format&fit=crop"
        },
        {
            category: "Retail",
            title: "Omnichannel Commerce Framework",
            outcome: "Unified 5 disparate inventory systems into a single source of truth.",
            imageSrc: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop"
        },
        {
            category: "Cybersecurity",
            title: "Zero-Trust Identity Provider",
            outcome: "Deployed biometric MFA across 10,000+ employee devices.",
            imageSrc: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=2070&auto=format&fit=crop"
        },
        {
            category: "Media",
            title: "High-Volume Content Delivery",
            outcome: "Scaled to handle 50M concurrent users during live events.",
            imageSrc: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop"
        }
    ];

    const displayProjects = limit ? projects.slice(0, limit) : projects;

    return (
        <section className={styles.section} data-animate>
            <div className={styles.container}>
                {showHeader && (
                    <div className={styles.header}>
                        <SectionLabel label="FEATURED WORK" />
                        <h2 className={styles.title}>Delivering Enterprise Value</h2>
                    </div>
                )}

                <div className={styles.grid}>
                    {displayProjects.map((project, i) => (
                        <PortfolioCard
                            key={i}
                            category={project.category}
                            title={project.title}
                            outcome={project.outcome}
                            imageSrc={project.imageSrc}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
