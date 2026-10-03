/* ==========================================================================
   PRERNA — donation.js
   Simulated donor journey (7 screens / 6 progress stages).
   NO real payment gateway, NO real OTP. Demo OTP: 123456
   ========================================================================== */

(function () {
  'use strict';

  const DEMO_OTP = '123456';

  /* Screen index (1-7) -> progress stage (1-6). Screens 4 & 5 share stage 04. */
  const SCREEN_TO_STAGE = [1, 2, 3, 4, 4, 5, 6];

  const state = {
    programme: 'education',
    frequency: 'once',
    amount: 1000,
    donor: { name: '', email: '', mobile: '', pan: '' },
    prefs: { email: true, sms: false, whatsapp: false },
    ref: '',
    date: '',
    screen: 1
  };

  /* ------------------------------------------------------------------ refs */
  let overlay, stepsWrap, stepEls, railSteps, mobileDots, railFill, summaryEl;
  let lastFocused = null;

  const money = (n) => '₹' + new Intl.NumberFormat('en-IN').format(n);
  const programmeLabel = () =>
    (typeof demoContent !== 'undefined' && demoContent.programmeNames[state.programme]) ||
    state.programme;
  const frequencyLabel = () => (state.frequency === 'monthly' ? 'Monthly' : 'One-time');
  const amountLabel = () => money(state.amount) + (state.frequency === 'monthly' ? ' / month' : '');

  /* ------------------------------------------------------------------ init */
  function init() {
    overlay = document.getElementById('donation');
    if (!overlay) return;

    stepsWrap = document.getElementById('steps');
    stepEls = Array.from(overlay.querySelectorAll('.step'));
    railSteps = Array.from(overlay.querySelectorAll('.rail__step'));
    mobileDots = Array.from(overlay.querySelectorAll('#mobileSteps i'));
    railFill = document.getElementById('railFill');
    summaryEl = document.getElementById('railSummary');

    stepEls.forEach((s) => s.removeAttribute('hidden'));
    stepEls.forEach((s) => s.querySelector('.step__title, h2')?.setAttribute('tabindex', '-1'));

    document.addEventListener('keydown', onKeydown);

    /* open triggers */
    document.querySelectorAll('[data-donate-open]').forEach((btn) => {
      btn.addEventListener('click', () => open(btn.dataset.programme));
    });
    document.querySelectorAll('[data-donate-close]').forEach((btn) => {
      btn.addEventListener('click', close);
    });

    wireStep1();
    wireStep2();
    wireOtp();
    wireActions();

    showScreen(1, { silent: true });
  }

  /* ------------------------------------------------------------------ open / close */
  function open(programme) {
    if (programme && typeof demoContent !== 'undefined' && demoContent.programmeNames[programme]) {
      const radio = overlay.querySelector(`input[name="dProgramme"][value="${programme}"]`);
      if (radio) radio.checked = true;
      state.programme = programme;
    }
    lastFocused = document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    syncSummary();
    setTimeout(() => {
      overlay
        .querySelector('.step.is-active .step__title, .step.is-active h2')
        ?.focus({ preventScroll: true });
    }, 120);
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus?.({ preventScroll: true });
  }

  const isOpen = () => overlay.classList.contains('is-open');

  function onKeydown(e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e) {
    const focusables = Array.from(
      overlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const step = el.closest('.step');
      if (step && !step.classList.contains('is-active')) return false;
      return el.offsetParent !== null;
    });
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------------ screen routing */
  function showScreen(n, opts = {}) {
    state.screen = n;

    stepEls.forEach((el) => {
      const active = Number(el.dataset.step) === n;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-hidden', String(!active));
    });

    const stage = SCREEN_TO_STAGE[n - 1];
    railSteps.forEach((li) => {
      const s = Number(li.dataset.stage);
      li.classList.toggle('is-current', s === stage);
      li.classList.toggle('is-done', s < stage);
    });
    mobileDots.forEach((dot, i) => {
      const s = i + 1;
      dot.classList.toggle('is-current', s === stage);
      dot.classList.toggle('is-done', s < stage);
    });
    if (railFill) railFill.style.height = ((stage - 1) / 5) * 100 + '%';

    if (!opts.silent) {
      stepsWrap.scrollTop = 0;
      const active = stepEls.find((el) => Number(el.dataset.step) === n);
      const title = active?.querySelector('.step__title, h2');
      if (title) title.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------ shared sync */
  function readState() {
    const prog = overlay.querySelector('input[name="dProgramme"]:checked');
    const freq = overlay.querySelector('input[name="dFrequency"]:checked');
    const amt = overlay.querySelector('input[name="dAmount"]:checked');
    if (prog) state.programme = prog.value;
    if (freq) state.frequency = freq.value;
    if (amt) {
      if (amt.value === 'custom') {
        const v = Number(document.getElementById('customInput').value);
        state.amount = Number.isFinite(v) && v > 0 ? v : 0;
      } else {
        state.amount = Number(amt.value);
      }
    }
  }

  function syncSummary() {
    readState();
    if (!summaryEl) return;
    summaryEl.hidden = false;
    document.getElementById('sumProgramme').textContent = programmeLabel();
    document.getElementById('sumFrequency').textContent = frequencyLabel();
    document.getElementById('sumAmount').textContent = amountLabel();
  }

  /* ------------------------------------------------------------------ step 1 */
  function wireStep1() {
    const customWrap = document.getElementById('customAmount');
    const customInput = document.getElementById('customInput');

    overlay.querySelectorAll('input[name="dProgramme"], input[name="dFrequency"], input[name="dAmount"]').forEach((input) => {
      input.addEventListener('change', () => {
        const custom = overlay.querySelector('input[name="dAmount"][value="custom"]');
        customWrap.hidden = !custom.checked;
        if (custom.checked) setTimeout(() => customInput.focus(), 60);
        syncSummary();
      });
    });
    customInput.addEventListener('input', () => {
      document.getElementById('customError').hidden = true;
      customInput.removeAttribute('aria-invalid');
      syncSummary();
    });
  }

  function validateStep1() {
    readState();
    const customRadio = overlay.querySelector('input[name="dAmount"][value="custom"]');
    if (customRadio.checked) {
      const v = Number(document.getElementById('customInput').value);
      if (!Number.isFinite(v) || v < 1 || v > 10000000) {
        const err = document.getElementById('customError');
        err.hidden = false;
        document.getElementById('customInput').setAttribute('aria-invalid', 'true');
        document.getElementById('customInput').focus();
        return false;
      }
      state.amount = v;
    }
    return true;
  }

  /* ------------------------------------------------------------------ step 2 */
  function wireStep2() {
    const mobile = document.getElementById('dMobile');
    mobile.addEventListener('input', () => {
      mobile.value = mobile.value.replace(/\D/g, '').slice(0, 10);
    });

    const pan = document.getElementById('dPan');
    pan.addEventListener('input', () => {
      pan.value = pan.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    });
  }

  function setError(id, show) {
    const input = document.getElementById(id);
    const err = overlay.querySelector(`[data-error-for="${id}"]`);
    if (err) err.hidden = !show;
    if (input) input.setAttribute('aria-invalid', String(show));
    return !show;
  }

  function validateStep2() {
    const name = document.getElementById('dName').value.trim();
    const email = document.getElementById('dEmail').value.trim();
    const mobile = document.getElementById('dMobile').value.trim();
    const pan = document.getElementById('dPan').value.trim();

    const okName = setError('dName', name.length < 2);
    const okEmail = setError('dEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
    const okMobile = setError('dMobile', !/^\d{10}$/.test(mobile));
    const okPan = setError('dPan', pan.length > 0 && pan.length !== 10);

    if (!(okName && okEmail && okMobile && okPan)) {
      overlay.querySelector('[aria-invalid="true"]')?.focus();
      return false;
    }

    state.donor = { name, email, mobile, pan };
    state.prefs = {
      email: document.getElementById('prefEmail').checked,
      sms: document.getElementById('prefSms').checked,
      whatsapp: document.getElementById('prefWhats').checked
    };
    return true;
  }

  /* ------------------------------------------------------------------ step 3 (OTP) */
  function wireOtp() {
    const boxes = Array.from(document.querySelectorAll('#otpInputs .otp__box'));
    const otpWrap = document.getElementById('otpInputs');
    const err = document.getElementById('otpError');

    const syncFilled = () =>
      boxes.forEach((b) => b.classList.toggle('is-filled', b.value.length > 0));

    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/\D/g, '').slice(0, 1);
        otpWrap.classList.remove('is-error');
        err.hidden = true;
        syncFilled();
        if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          boxes[i - 1].focus();
          boxes[i - 1].value = '';
          syncFilled();
        }
        if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
        if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        text.split('').forEach((ch, idx) => {
          if (boxes[idx]) boxes[idx].value = ch;
        });
        syncFilled();
        boxes[Math.min(text.length, boxes.length - 1)].focus();
      });
    });
  }

  function validateOtp() {
    const boxes = Array.from(document.querySelectorAll('#otpInputs .otp__box'));
    const code = boxes.map((b) => b.value).join('');
    const otpWrap = document.getElementById('otpInputs');
    const err = document.getElementById('otpError');

    if (code.length < 6) {
      otpWrap.classList.add('is-error');
      err.hidden = false;
      err.textContent = 'Enter all 6 digits. Demo OTP: 123456.';
      boxes.find((b) => !b.value)?.focus();
      return false;
    }
    if (code !== DEMO_OTP) {
      otpWrap.classList.add('is-error');
      err.hidden = false;
      err.textContent = `That code doesn't match the demo OTP. Try ${DEMO_OTP}.`;
      boxes[0].focus();
      boxes.forEach((b) => (b.value = ''));
      boxes.forEach((b) => b.classList.remove('is-filled'));
      return false;
    }

    otpWrap.classList.remove('is-error');
    err.hidden = true;
    return true;
  }

  /* ------------------------------------------------------------------ step 4-7 */
  function fillSubmitted() {
    document.getElementById('s4Programme').textContent = programmeLabel();
    document.getElementById('s4Amount').textContent = amountLabel();
    document.getElementById('s4Frequency').textContent = frequencyLabel();
    document.getElementById('s4Donor').textContent =
      state.donor.name + ' · ' + state.donor.mobile;
  }

  function fillPayment() {
    document.getElementById('s6Programme').textContent = programmeLabel();
    document.getElementById('s6Frequency').textContent = frequencyLabel();
    document.getElementById('s6Amount').textContent = amountLabel();
  }

  function makeRef() {
    const n = Math.floor(100000 + Math.random() * 900000);
    return 'PRN-DEMO-' + n;
  }

  function fillReceipt() {
    document.getElementById('rRef').textContent = state.ref;
    document.getElementById('rProgramme').textContent = programmeLabel();
    document.getElementById('rAmount').textContent = amountLabel();
    document.getElementById('rDate').textContent = state.date;
    document.getElementById('rDonor').textContent = state.donor.name || 'Demo Donor';
    document.getElementById('s5Ref').textContent = state.ref;
  }

  function busy(button, label, ms) {
    return new Promise((resolve) => {
      const original = button.innerHTML;
      button.disabled = true;
      button.style.opacity = '0.75';
      button.textContent = label;
      setTimeout(() => {
        button.disabled = false;
        button.style.opacity = '';
        button.innerHTML = original;
        resolve();
      }, ms);
    });
  }

  /* ------------------------------------------------------------------ actions */
  function wireActions() {
    overlay.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      switch (btn.dataset.action) {
        case 'to-details':
          if (validateStep1()) showScreen(2);
          break;

        case 'back-to-1':
          showScreen(1);
          break;

        case 'verify-mobile':
          if (validateStep2()) {
            document.getElementById('otpTarget').textContent = '+91 ' + state.donor.mobile;
            showScreen(3);
            setTimeout(() => document.querySelector('#otpInputs .otp__box')?.focus(), 150);
          }
          break;

        case 'back-to-2':
          showScreen(2);
          break;

        case 'verify-otp':
          if (validateOtp()) {
            fillSubmitted();
            showScreen(4);
          }
          break;

        case 'simulate-approval':
          await busy(btn, 'Approving…', 900);
          state.ref = makeRef();
          fillReceipt();
          showScreen(5);
          break;

        case 'to-payment':
          fillPayment();
          showScreen(6);
          break;

        case 'back-to-5':
          showScreen(5);
          break;

        case 'pay':
          await busy(btn, 'Processing…', 1100);
          state.date = new Date().toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          });
          fillReceipt();
          showScreen(7);
          break;

        case 'restart':
          resetJourney();
          break;

        case 'download-receipt':
          downloadReceipt();
          break;
      }
    });
  }

  /* ------------------------------------------------------------------ reset */
  function resetJourney() {
    state.donor = { name: '', email: '', mobile: '', pan: '' };
    state.prefs = { email: true, sms: false, whatsapp: false };
    state.ref = '';
    state.date = '';
    state.amount = 1000;

    overlay.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').forEach((i) => {
      i.value = '';
      i.removeAttribute('aria-invalid');
    });
    overlay.querySelectorAll('.field-error').forEach((e) => (e.hidden = true));
    document.getElementById('prefEmail').checked = true;
    document.getElementById('prefSms').checked = false;
    document.getElementById('prefWhats').checked = false;

    const defaultAmount = overlay.querySelector('input[name="dAmount"][value="1000"]');
    if (defaultAmount) defaultAmount.checked = true;
    document.getElementById('customAmount').hidden = true;
    document.querySelectorAll('#otpInputs .otp__box').forEach((b) => {
      b.value = '';
      b.classList.remove('is-filled');
    });
    document.getElementById('otpInputs').classList.remove('is-error');

    syncSummary();
    showScreen(1);
  }

  /* ------------------------------------------------------------------ receipt */
  function downloadReceipt() {
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>Prerna Demo Receipt — ${state.ref}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;background:#f4eee1;color:#111b16;margin:0;padding:48px 24px;display:flex;justify-content:center}
  .card{background:#fffdf9;border:1px solid rgba(17,27,22,.16);border-radius:18px;padding:36px;max-width:560px;width:100%}
  h1{font-size:26px;margin:0 0 4px}
  .demo{display:inline-block;background:#c96a3f;color:#fff;font:700 11px/1.4 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;padding:5px 10px;border-radius:999px}
  dl{margin:24px 0 0;display:grid;gap:12px}
  .row{display:flex;justify-content:space-between;gap:16px;border-bottom:1px dashed rgba(17,27,22,.18);padding-bottom:10px}
  dt{font:11px/1.4 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#3d4a43;order:1}
  dd{margin:0;font-weight:bold;order:2;text-align:right}
  .ref{font-family:ui-monospace,Menlo,monospace;color:#0e3b2c}
  .foot{margin-top:26px;font:12px/1.6 Arial,sans-serif;color:#3d4a43}
</style></head>
<body><div class="card">
  <span class="demo">Demo receipt</span>
  <h1>Prerna — Donation Receipt</h1>
  <p style="font:14px/1.6 Arial,sans-serif;color:#3d4a43;margin:6px 0 0">Prototype demo receipt. Not a tax document, not a live transaction.</p>
  <dl>
    <div class="row"><dt>Donation reference</dt><dd class="ref">${state.ref}</dd></div>
    <div class="row"><dt>Programme</dt><dd>${programmeLabel()}</dd></div>
    <div class="row"><dt>Amount</dt><dd>${amountLabel()}</dd></div>
    <div class="row"><dt>Date</dt><dd>${state.date}</dd></div>
    <div class="row"><dt>Donor</dt><dd>${state.donor.name || 'Demo Donor'}</dd></div>
    <div class="row"><dt>Status</dt><dd>Paid — demo</dd></div>
  </dl>
  <p class="foot">Generated by the Prerna website prototype. No payment was processed.</p>
</div></body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prerna-demo-receipt-${state.ref}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Demo receipt downloaded.';
      toast.classList.add('is-visible');
      clearTimeout(window.__prernaToast);
      window.__prernaToast = setTimeout(() => toast.classList.remove('is-visible'), 3200);
    }
  }

  /* ------------------------------------------------------------------ boot */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
