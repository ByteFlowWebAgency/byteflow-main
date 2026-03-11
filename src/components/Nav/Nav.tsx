'use client';

import { useState } from 'react';
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={`${styles.nav} ${open ? styles.navMenuOpen : ''}`}>
        <Link href="/" className={styles.navLogo} onClick={() => setOpen(false)}>
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

        <button
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {open && (
        <div className={styles.mobileMenu}>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/contact" className={styles.mobileCta} onClick={() => setOpen(false)}>
            Get in Touch
          </Link>
        </div>
      )}
    </>
  );
}
