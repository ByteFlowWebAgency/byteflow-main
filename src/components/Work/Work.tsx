import Image from 'next/image';
import styles from './Work.module.css';

const projects = [
  {
    tag: 'Finance',
    title: 'Global Payments Platform',
    meta: '$100M+ processed in year one · 99.999% uptime',
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    large: true,
  },
  {
    tag: 'Healthcare',
    title: 'AI Diagnostic Engine',
    meta: '40% reduction in screening time',
    src: 'https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=800&auto=format&fit=crop',
    large: false,
  },
  {
    tag: 'Logistics',
    title: 'Real-Time Supply Chain',
    meta: '$2.4M saved annually',
    src: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?q=80&w=800&auto=format&fit=crop',
    large: false,
  },
];

export default function Work() {
  return (
    <section className={styles.work} id="work">
      <div className={styles.workHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Featured Work</p>
          <h2 className={styles.sectionH2}>Delivering Enterprise Value</h2>
        </div>
        <a href="#" className={styles.btnGhost}>View All Work →</a>
      </div>

      <div className={styles.workGrid}>
        {projects.map((p) => (
          <div key={p.title} className={`${styles.workCard} ${p.large ? styles.workCardLarge : ''}`}>
            <div className={styles.workImgWrap}>
              <Image
                src={p.src}
                alt={p.title}
                fill
                className={styles.workImg}
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
            <div className={styles.workOverlay}>
              <span className={styles.workTag}>{p.tag}</span>
              <h3 className={styles.workTitle}>{p.title}</h3>
              <p className={styles.workMeta}>{p.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
