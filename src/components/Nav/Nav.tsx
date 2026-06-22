'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Nav.module.css';
import type { LogoData, NavLinkData } from '@/lib/contentful/props';

interface NavProps {
  logo: LogoData | null;
  navLinks: NavLinkData[];
  cta?: NavLinkData;
}

export default function Nav({ logo, navLinks, cta }: NavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav} aria-label="Primary">
        <Link href="/" className={styles.logo} onClick={() => setOpen(false)}>
          <Image
            src={logo?.url ?? '/BYTEFLOW_LOGO.png'}
            alt={logo?.alt ?? 'ByteFlow'}
            width={logo?.width ?? 280}
            height={logo?.height ?? 56}
            priority
            className={styles.logoImg}
          />
        </Link>

        <ul className={styles.links}>
          {navLinks.map((link) => (
            <li key={link.url}>
              <Link href={link.url} className={styles.link}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {cta && (
          <Link href={cta.url} className={styles.cta}>
            {cta.label}
          </Link>
        )}

        <button
          className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span />
          <span />
        </button>
      </nav>

      {open && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileLinks}>
            {navLinks.map((link) => (
              <li key={link.url}>
                <Link href={link.url} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {cta && (
            <Link href={cta.url} className={styles.mobileCta} onClick={() => setOpen(false)}>
              {cta.label}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
