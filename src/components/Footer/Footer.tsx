import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

function getCurrentYear() {
  return new Date().getFullYear();
}

const columns = [
  {
    header: 'Services',
    links: [
      { label: 'Enterprise Software', href: '/services' },
      { label: 'Custom Development', href: '/services' },
      { label: 'AI Integration', href: '/services' },
      { label: 'Cloud Solutions', href: '/services' },
      { label: 'SEO & Digital Growth', href: '/services' },
      { label: 'Consulting', href: '/services' },
    ],
  },
  {
    header: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Work', href: '/work' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <Image
                src="/BYTEFLOW_LOGO.png"
                alt="ByteFlow"
                width={320}
                height={64}
                className={styles.logoImg}
              />
            </Link>
            <p className={styles.tagline}>
              Software engineering for teams that take shipping seriously.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.header} className={styles.col}>
              <h4 className={styles.colHeader}>{col.header}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <span className={styles.copyLeft}>
            © {getCurrentYear()} ByteFlow Solutions, LLC. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
