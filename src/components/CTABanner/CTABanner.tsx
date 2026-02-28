import Link from 'next/link';
import styles from './CTABanner.module.css';

interface CTABannerProps {
    heading: string;
    subtext: string;
    buttonLabel: string;
    buttonHref: string;
}

export default function CTABanner({
    heading,
    subtext,
    buttonLabel,
    buttonHref,
}: CTABannerProps) {
    return (
        <section className={styles.banner} data-animate>
            <div className={styles.glow} />
            <div className={styles.container}>
                <h2 className={styles.heading}>{heading}</h2>
                <p className={styles.subtext}>{subtext}</p>
                <Link href={buttonHref} className={styles.button}>
                    {buttonLabel}
                </Link>
            </div>
        </section>
    );
}
