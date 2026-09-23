'use client';

import { useEffect } from 'react';

/**
 * Site-wide scroll reveal.
 *
 * Call `useRevealSections()` once in a page component and every <section> on
 * that page fades and rises into view as it is scrolled to.
 *
 * Design decisions worth keeping:
 *
 *  • Sections already ON SCREEN at load are never hidden. Animating them would
 *    mean the page arrives blank and then fills in, which reads as slow.
 *  • The inline styles are REMOVED once a section has finished animating. A
 *    lingering `transform` makes an element a containing block, which silently
 *    breaks `position: sticky` and `position: fixed` children inside it. This
 *    is the bug that usually follows "add some scroll animations".
 *  • `prefers-reduced-motion`, a missing IntersectionObserver, or a page that
 *    somehow never fires all leave the content plainly visible. Copy hidden
 *    behind an animation that does not run is copy nobody reads.
 */
const DISTANCE = 28;
const DURATION = 800;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function useRevealSections(selector = 'section') {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const clear = (el: HTMLElement) => {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transition = '';
      el.style.willChange = '';
    };

    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter(el => !el.dataset.revealed && !el.closest('[data-no-reveal]'))
      // Anything already in view at load stays exactly as it is.
      .filter(el => el.getBoundingClientRect().top > window.innerHeight * 0.9);

    if (targets.length === 0) return;

    targets.forEach(el => {
      el.dataset.revealed = 'pending';
      el.style.opacity = '0';
      el.style.transform = `translateY(${DISTANCE}px)`;
      el.style.willChange = 'opacity, transform';
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        obs.unobserve(el);
        el.dataset.revealed = 'done';
        el.style.transition = `opacity ${DURATION}ms ${EASE}, transform ${DURATION}ms ${EASE}`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        window.setTimeout(() => clear(el), DURATION + 80);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => obs.observe(el));

    return () => {
      obs.disconnect();
      // Leaving on unmount must never strand a section at opacity 0.
      targets.forEach(clear);
    };
  }, [selector]);
}

/** Wrapper form, for one element rather than a whole page. */
export default function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ animation: `ds-reveal ${DURATION}ms ${EASE} ${delay}ms both` }}>
      {children}
    </div>
  );
}
