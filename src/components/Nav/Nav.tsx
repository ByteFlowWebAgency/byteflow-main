'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './Nav.module.css';

const links = [
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Contact', href: '/contact' },
];

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.navLogo}>
        <Image src="/BYTEFLOW_LOGO.png" alt="BYTEFLOW" width={100} height={20} priority />
      </Link>

      <ul className={styles.navLinks}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>

      <Link href="/contact" className={styles.navCta}>
        Get in Touch
      </Link>
    </nav>
  );
}
