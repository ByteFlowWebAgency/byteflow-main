import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

function getCurrentYear() {
  return new Date().getFullYear();
}

export default function Footer() {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logoLink}>
            <Image src="/BYTEFLOW_LOGO.png" alt="BYTEFLOW" width={140} height={32} />
          </Link>
          <p className={styles.footerDesc}>
            BYTEFLOW partners with organizations to design, build, and deploy enterprise-grade technology — with precision and speed.
          </p>
        </div>

        <div className={styles.linkCol}>
          <h4 className={styles.colHeader}>Services</h4>
          <ul>
            <li><Link href="/services" className={styles.link}>Enterprise Software</Link></li>
            <li><Link href="/services" className={styles.link}>AI Integration</Link></li>
            <li><Link href="/services" className={styles.link}>Cloud Solutions</Link></li>
            <li><Link href="/services" className={styles.link}>Consulting</Link></li>
          </ul>
        </div>

        <div className={styles.linkCol}>
          <h4 className={styles.colHeader}>Connect</h4>
          <ul>
            <li><Link href="/contact" className={styles.link}>Contact Us</Link></li>
            <li>
              <a href="mailto:support@byteflowsolutions.com" className={styles.link}>
                support@byteflowsolutions.com
              </a>
            </li>
          </ul>
        </div>
      </footer>

      <div className={styles.footerBottom}>
        <span className={styles.footerBottomText}>© {getCurrentYear()} BYTEFLOW. All rights reserved.</span>
        <div className={styles.footerBottomLine} />
      </div>
    </>
  );
}
