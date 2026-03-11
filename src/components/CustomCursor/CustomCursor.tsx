'use client';

import { useEffect, useRef } from 'react';
import styles from './CustomCursor.module.css';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mx = 0, my = 0;
    let rx = 0, ry = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    };

    const lerp = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      rafId = requestAnimationFrame(lerp);
    };

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        cursor.style.width = '16px';
        cursor.style.height = '16px';
        ring.style.width = '52px';
        ring.style.height = '52px';
      }
    };

    const onLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        cursor.style.width = '10px';
        cursor.style.height = '10px';
        ring.style.width = '36px';
        ring.style.height = '36px';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    rafId = requestAnimationFrame(lerp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor} />
      <div ref={ringRef} className={styles.cursorRing} />
    </>
  );
}
