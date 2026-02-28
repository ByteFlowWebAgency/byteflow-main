import Image from 'next/image';
import Link from 'next/link';
import styles from './PortfolioCard.module.css';

interface PortfolioCardProps {
    category: string;
    title: string;
    outcome: string;
    imageSrc: string;
}

export default function PortfolioCard({
    category,
    title,
    outcome,
    imageSrc,
}: PortfolioCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={imageSrc}
                    alt={title}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            </div>
            <div className={styles.content}>
                <p className={styles.category}>{category}</p>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.outcome}>{outcome}</p>
                <Link href="/portfolio" className={styles.link}>
                    View Case Study ›
                </Link>
            </div>
        </div>
    );
}
