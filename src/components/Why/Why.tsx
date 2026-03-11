import styles from './Why.module.css';

const cards = [
  {
    title: 'Precision Engineering',
    desc: 'Clean architectures and robust codebases that stand the test of time.',
  },
  {
    title: 'Speed to Market',
    desc: 'Agile methodologies that deliver working software to users faster.',
  },
  {
    title: 'Strategic Partnership',
    desc: 'We act as an extension of your engineering and leadership teams.',
  },
  {
    title: 'Enterprise Security',
    desc: 'Security-first development protecting your vital data assets.',
  },
];

export default function Why() {
  return (
    <section className={styles.why} id="about">
      <div className={styles.whyLeft}>
        <p className={styles.sectionEyebrow}>Why BYTEFLOW</p>
        <h2 className={styles.sectionH2}>Built for Scale. Designed for Results.</h2>
        <p className={styles.whyPara}>
          We don&apos;t just write code. We architect solutions to complex enterprise problems — acting as an extension of your own engineering and leadership team from day one.
        </p>
        <a href="#contact" className={styles.btnPrimary}>Partner With Us</a>
      </div>

      <div className={styles.whyRight}>
        {cards.map((card) => (
          <div key={card.title} className={styles.whyCard}>
            <h3 className={styles.whyCardTitle}>{card.title}</h3>
            <p className={styles.whyCardDesc}>{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
