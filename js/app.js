/* ==========================================================================
   PRERNA — app.js
   Demo content config, navigation, counters, contact form, utilities.
   NOTE: all numbers/copy marked "demo" live in `demoContent` below.
   ========================================================================== */

const demoContent = {
  /* ---- DEMO impact figures (replace with verified Prerna data) ---- */
  impact: [
    { value: 10, suffix: 'K+', label: 'Lives touched' },
    { value: 25, suffix: '+', label: 'Initiatives' },
    { value: 3, suffix: '', label: 'Programme areas' }
  ],

  programmeNames: {
    education: 'Education',
    healthcare: 'Healthcare',
    sports: 'Sports'
  },

  imageFallbackLabel: 'Image placeholder — replace in index.html'
};

/* ---------------------------------------------------------------- helpers */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- toast */
let toastTimer = null;
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

/* ---------------------------------------------------------------- nav */
function initNav() {
  const nav = $('#nav');
  const burger = $('#navBurger');
  const menu = $('#mobileMenu');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('is-solid', window.scrollY > 48);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  const setMenu = (open) => {
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };

  burger?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('.menu a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
  });

  /* active section highlighting */
  const links = $$('.nav__links a');
  const sections = links
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) =>
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }
}

/* ---------------------------------------------------------------- impact counters */
function buildImpact() {
  const grid = $('.impact__grid');
  if (!grid || !demoContent.impact.length) return;

  grid.innerHTML = demoContent.impact
    .map(
      (item) => `
      <div class="impact__item" data-reveal>
        <span class="impact__num" data-count-to="${item.value}" data-count-suffix="${item.suffix}">0</span>
        <span class="impact__label">${item.label}</span>
      </div>`
    )
    .join('');
}

function animateCount(el) {
  const target = Number(el.dataset.countTo || 0);
  const suffix = el.dataset.countSuffix || '';
  const duration = 1700;
  const start = performance.now();

  if (prefersReducedMotion) {
    el.textContent = target + suffix;
    return;
  }

  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const nums = $$('[data-count-to]');
  if (!nums.length) return;

  if (!('IntersectionObserver' in window)) {
    nums.forEach((n) => (n.textContent = n.dataset.countTo + (n.dataset.countSuffix || '')));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  nums.forEach((n) => io.observe(n));
}

/* ---------------------------------------------------------------- contact form */
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = $('#cName');
    const email = $('#cEmail');
    const msg = $('#cMsg');
    let valid = true;

    const setInvalid = (input, bad) => {
      input.setAttribute('aria-invalid', String(bad));
      if (bad) valid = false;
    };

    setInvalid(name, name.value.trim().length < 2);
    setInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()));
    setInvalid(msg, msg.value.trim().length < 5);

    if (!valid) {
      showToast('Please complete the highlighted fields.');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    $('#contactSuccess').hidden = false;
    form.reset();
    showToast('Thank you. Your message has been received.');
    $('#contactSuccess').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
}

/* ---------------------------------------------------------------- generic actions */
function initDelegatedActions() {
  document.addEventListener('click', (e) => {
    const toastBtn = e.target.closest('[data-toast]');
    if (toastBtn) {
      showToast(toastBtn.dataset.toast);
      return;
    }

    const scrollBtn = e.target.closest('[data-scroll-to]');
    if (scrollBtn) {
      const target = document.querySelector(scrollBtn.dataset.scrollTo);
      target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });
}

/* ---------------------------------------------------------------- image fallbacks */
function initImageFallbacks() {
  $$('img').forEach((img) => {
    const markFailed = () => {
      const parent = img.parentElement;
      if (!parent) return;
      parent.classList.add('img-failed');
      parent.dataset.fallback =
        img.alt && img.alt.trim() ? img.alt.trim() : demoContent.imageFallbackLabel;
    };

    if (img.complete && img.naturalWidth === 0) markFailed();
    img.addEventListener('error', markFailed);
  });
}

/* ---------------------------------------------------------------- boot */
function startApp() {
  buildImpact();
  initNav();
  initCounters();
  initContactForm();
  initDelegatedActions();
  initImageFallbacks();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
