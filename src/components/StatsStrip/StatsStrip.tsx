import styles from './StatsStrip.module.css';

export default function StatsStrip() {
    return (
        <section className={styles.strip} data-animate>
            <div className={styles.container}>
                <div className={styles.stat}>
                    <div className={styles.number}>150+</div>
                    <div className={styles.descriptor}>Projects Delivered</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.number}>98%</div>
                    <div className={styles.descriptor}>Client Retention Rate</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.number}>7 Core</div>
                    <div className={styles.descriptor}>Technology Capabilities</div>
                </div>
                <div className={styles.stat}>
                    <div className={styles.number}>Enterprise</div>
                    <div className={styles.descriptor}>Grade Delivery</div>
                </div>
            </div>
        </section>
    );
}
