/* ==========================================================================
   PRERNA — animations.js
   GSAP + ScrollTrigger choreography. Everything degrades to static content
   when GSAP is unavailable or the user prefers reduced motion.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function splitWords() {
    document.querySelectorAll('[data-split]').forEach((el) => {
      if (el.dataset.splitDone) return;
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((word, i) => {
        const w = document.createElement('span');
        w.className = 'split-w';
        const inner = document.createElement('span');
        inner.className = 'split-i';
        inner.textContent = word;
        w.appendChild(inner);
        el.appendChild(w);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      el.dataset.splitDone = 'true';
    });
  }

  function boot() {
    if (reduced || !window.gsap || !window.ScrollTrigger) {
      root.classList.remove('anim-ready');
      return;
    }

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    splitWords();

    /* ---------------- hero entrance ---------------- */
    gsap.set('[data-hero]', { y: 24 });

    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    heroTl
      .fromTo('.hero__img', { scale: 1.14 }, { scale: 1, duration: 1.9, ease: 'power2.out' }, 0)
      .fromTo(
        '.hero .line__inner',
        { yPercent: 112, y: 0 },
        { yPercent: 0, y: 0, duration: 1.2, stagger: 0.14 },
        0.15
      )
      .to('[data-hero]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.7);

    /* hero image drift on scroll */
    gsap.to('.hero__img', {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    /* ---------------- scroll reveals ---------------- */
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    /* ---------------- headline word reveals ---------------- */
    gsap.utils.toArray('[data-split]').forEach((el) => {
      const words = el.querySelectorAll('.split-i');
      if (!words.length) return;
      gsap.fromTo(
        words,
        { yPercent: 115, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.035,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });

    /* ---------------- image parallax ---------------- */
    gsap.utils.toArray('[data-parallax]').forEach((wrap) => {
      const img = wrap.querySelector('img');
      if (!img) return;
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });

    /* ---------------- refresh after assets ---------------- */
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
