'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className={styles.nav}>
            <div className={styles.container}>
                <Link href="/" className={styles.logoLink}>
                    <Image src="/BYTEFLOW_LOGO.png" alt="BYTEFLOW" width={160} height={32} />
                </Link>

                {/* Desktop Links */}
                <div className={styles.desktopNav}>
                    <Link href="/" className={styles.navLink}>Home</Link>
                    <Link href="/about" className={styles.navLink}>About</Link>
                    <Link href="/services" className={styles.navLink}>Services</Link>
                    <Link href="/portfolio" className={styles.navLink}>Portfolio</Link>
                    <Link href="/contact" className={styles.navLink}>Contact</Link>
                    <Link href="/contact" className={styles.ctaButton}>Get in Touch</Link>
                </div>

                {/* Mobile Toggle */}
                <button className={styles.mobileToggle} onClick={toggleMenu} aria-label="Toggle menu">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                    </svg>
                </button>

                {/* Mobile Overlay */}
                <div className={`${styles.mobileOverlay} ${isOpen ? styles.isOpen : ''}`}>
                    <div className={styles.mobileOverlayContent}>
                        <button className={styles.closeButton} onClick={toggleMenu} aria-label="Close menu">
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                        <div className={styles.mobileLinks}>
                            <Link href="/" className={styles.mobileNavLink} onClick={toggleMenu}>Home</Link>
                            <Link href="/about" className={styles.mobileNavLink} onClick={toggleMenu}>About</Link>
                            <Link href="/services" className={styles.mobileNavLink} onClick={toggleMenu}>Services</Link>
                            <Link href="/portfolio" className={styles.mobileNavLink} onClick={toggleMenu}>Portfolio</Link>
                            <Link href="/contact" className={styles.mobileNavLink} onClick={toggleMenu}>Contact</Link>
                            <Link href="/contact" className={styles.mobileCta} onClick={toggleMenu}>Get in Touch</Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
