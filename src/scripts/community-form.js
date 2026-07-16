// Typeform-style one-question-at-a-time controller for the community membership form.
//
// Progressive enhancement: the page renders every question as a normal stacked form.
// When this script runs it adds `.cf-js` to the container, which flips the CSS into
// single-slide mode and wires navigation (click, Enter, letter keys, auto-advance).
// If JS never runs, the full form is still visible and usable.
//
// Submission reuses the site's reCAPTCHA Enterprise setup (window.__RECAPTCHA_SITE_KEY)
// and POSTs JSON to /api/community-application.

const ENDPOINT = '/api/community-application';
const ACTION = 'community_submit';
const AUTO_ADVANCE_MS = 280;

async function getRecaptchaToken(action) {
  const siteKey = window.__RECAPTCHA_SITE_KEY;
  const enterprise = window.grecaptcha && window.grecaptcha.enterprise;
  if (!siteKey || !enterprise) return null;
  await new Promise((resolve) => enterprise.ready(resolve));
  return enterprise.execute(siteKey, { action });
}

function initCommunityForm() {
  const container = document.querySelector('[data-community-form]');
  if (!container) return;
  const form = container.querySelector('#join-form');
  if (!form) return;

  const slides = Array.from(form.querySelectorAll('.q-slide'));
  if (!slides.length) return;

  const progressBar = container.querySelector('.cf-progress-bar');
  const stepLabel = container.querySelector('[data-step-label]');
  const backBtn = container.querySelector('.cf-back');
  const nextBtn = container.querySelector('.cf-next');
  const submitBtn = container.querySelector('.cf-submit');
  const errorEl = document.getElementById('join-error');
  const successEl = document.getElementById('join-success');
  const total = slides.length;
  const lastIndex = total - 1;

  let index = 0;
  let submitting = false; // re-entrancy guard so repeated Enter can't fire concurrent POSTs
  let lastKeyWasArrow = false; // suppress single-choice auto-advance during arrow-key nav
  let prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {}

  container.classList.add('cf-js');

  // --- helpers ---------------------------------------------------------------

  function clearSlideError(slide) {
    const el = slide.querySelector('[data-q-error]');
    if (el) {
      el.hidden = true;
      el.textContent = '';
    }
  }

  function showSlideError(slide, message) {
    const el = slide.querySelector('[data-q-error]');
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  }

  // Move focus to the first control of a slide (used on validation failure so the error —
  // announced via role="alert" — is paired with focus landing on the relevant input, not
  // the nav button the user just activated).
  function focusFirstControl(slide) {
    const el = slide.querySelector('input, textarea, select');
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }
  }

  function isOptional(slide) {
    return slide.dataset.optional === 'true';
  }

  function validateSlide(slide) {
    clearSlideError(slide);
    const kind = slide.dataset.kind;

    if (kind === 'fields') {
      const inputs = Array.from(slide.querySelectorAll('input, textarea'));
      for (const input of inputs) {
        if (!input.checkValidity()) {
          showSlideError(slide, input.validationMessage || 'Please complete this field.');
          input.focus();
          return false;
        }
      }
      return true;
    }

    if (kind === 'single') {
      const checked = slide.querySelector('input[type="radio"]:checked');
      if (!checked && !isOptional(slide)) {
        showSlideError(slide, 'Please pick one option.');
        focusFirstControl(slide);
        return false;
      }
      return true;
    }

    if (kind === 'multi') {
      const checked = slide.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length === 0 && !isOptional(slide)) {
        showSlideError(slide, 'Please select at least one option.');
        focusFirstControl(slide);
        return false;
      }
      return true;
    }

    if (kind === 'consent') {
      const box = slide.querySelector('input[type="checkbox"]');
      if (box && !box.checked) {
        showSlideError(slide, 'Please agree to the Code of Conduct to continue.');
        focusFirstControl(slide);
        return false;
      }
      return true;
    }

    return true;
  }

  function focusSlide(slide) {
    const target = slide.querySelector('input, textarea, select');
    if (!target) return;
    // Don't scroll the page while focusing; the slide is already in view.
    window.requestAnimationFrame(() => {
      try { target.focus({ preventScroll: true }); } catch { target.focus(); }
    });
  }

  function render() {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    const pct = Math.round(((index + 1) / total) * 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (stepLabel) stepLabel.textContent = `${index + 1} / ${total}`;

    if (backBtn) backBtn.disabled = index === 0;
    const onLast = index === lastIndex;
    if (nextBtn) nextBtn.hidden = onLast;
    if (submitBtn) submitBtn.hidden = !onLast;

    focusSlide(slides[index]);
  }

  function goTo(next) {
    index = Math.max(0, Math.min(lastIndex, next));
    render();
  }

  function goNext() {
    if (!validateSlide(slides[index])) return;
    if (index === lastIndex) {
      submit();
    } else {
      goTo(index + 1);
    }
  }

  function goBack() {
    if (index > 0) goTo(index - 1);
  }

  // --- submission ------------------------------------------------------------

  function buildPayload() {
    const fd = new FormData(form);
    const consentBox = form.querySelector('input[name="codeOfConduct"]');
    return {
      firstName: (fd.get('firstName') || '').toString(),
      lastName: (fd.get('lastName') || '').toString(),
      email: (fd.get('email') || '').toString(),
      linkedin: (fd.get('linkedin') || '').toString(),
      city: (fd.get('city') || '').toString(),
      country: (fd.get('country') || '').toString(),
      intro: (fd.get('intro') || '').toString(),
      role: (fd.get('role') || '').toString(),
      company: (fd.get('company') || '').toString(),
      experienceYears: (fd.get('experienceYears') || '').toString(),
      genaiExperience: (fd.get('genaiExperience') || '').toString(),
      motivations: fd.getAll('motivations').map((v) => v.toString()),
      participation: fd.getAll('participation').map((v) => v.toString()),
      newsletter: (fd.get('newsletter') || '').toString(),
      codeOfConduct: consentBox && consentBox.checked ? 'yes' : '',
    };
  }

  function setSubmitting(loading) {
    if (!submitBtn) return;
    if (loading) {
      if (!submitBtn.dataset.label) submitBtn.dataset.label = submitBtn.textContent.trim();
      submitBtn.disabled = true;
      submitBtn.textContent = submitBtn.dataset.loading || 'Submitting…';
    } else {
      submitBtn.disabled = false;
      if (submitBtn.dataset.label) submitBtn.textContent = submitBtn.dataset.label;
    }
  }

  async function submit() {
    if (submitting) return; // a POST is already in flight — ignore repeat Enter/clicks
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    // Re-validate everything before sending (guards against skipped slides).
    for (let i = 0; i < slides.length; i += 1) {
      if (!validateSlide(slides[i])) {
        goTo(i);
        return;
      }
    }

    submitting = true;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const token = await getRecaptchaToken(ACTION);
      if (token) payload.recaptchaToken = token;

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      // Success: swap the whole form card for the Slack welcome screen.
      const card = container.querySelector('.cf-card');
      if (card) card.hidden = true;
      // Hide the progress track too (inline style beats `.cf-js .cf-progress{display:block}`).
      const progress = container.querySelector('.cf-progress');
      if (progress) progress.style.display = 'none';
      if (successEl) {
        successEl.hidden = false;
        successEl.style.removeProperty('display');
        successEl.setAttribute('tabindex', '-1');
        successEl.focus();
        successEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Community application error:', error);
      if (errorEl) {
        errorEl.textContent =
          'Something went wrong. Please try again, or email hello@genaicommunity.eu directly.';
        errorEl.hidden = false;
        // role="alert" announces it; move focus so keyboard users land on the retry context.
        errorEl.setAttribute('tabindex', '-1');
        try { errorEl.focus({ preventScroll: true }); } catch { errorEl.focus(); }
      }
      submitting = false;
      setSubmitting(false);
    }
  }

  // --- events ----------------------------------------------------------------

  if (nextBtn) nextBtn.addEventListener('click', goNext);
  // The submit button is type="button" (see join.astro) so it never fires a native form
  // submit; the controller drives submission from its click (and the Enter handler below).
  if (submitBtn) submitBtn.addEventListener('click', goNext);
  if (backBtn) backBtn.addEventListener('click', goBack);

  // Track whether the last key was an arrow (capture phase runs before the native
  // radiogroup `change`), and reset on pointer use, so we can tell arrow-key navigation
  // apart from a deliberate click/letter selection for auto-advance.
  form.addEventListener('keydown', (event) => { lastKeyWasArrow = event.key.startsWith('Arrow'); }, true);
  form.addEventListener('pointerdown', () => { lastKeyWasArrow = false; });

  // The real submit button lives inside the form; intercept so we control the flow.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (index === lastIndex) {
      goNext();
    } else {
      goTo(index + 1);
    }
  });

  // Enter advances (and prevents implicit early submit from text inputs).
  form.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (event.repeat) { event.preventDefault(); return; } // ignore held-Enter key-repeat
    const target = event.target;
    if (target && target.tagName === 'TEXTAREA') return; // (none today, future-proof)
    event.preventDefault();
    goNext();
  });

  // Letter-key selection on choice slides (Typeform-style A/B/C…).
  form.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.length !== 1) return;
    const slide = slides[index];
    const kind = slide.dataset.kind;
    if (kind !== 'single' && kind !== 'multi') return;
    const letter = event.key.toLowerCase();
    if (letter < 'a' || letter > 'z') return;
    const optIndex = letter.charCodeAt(0) - 97;
    const inputs = slide.querySelectorAll('.q-opt input');
    const input = inputs[optIndex];
    if (!input) return;
    event.preventDefault();
    if (input.type === 'checkbox') {
      input.checked = !input.checked;
    } else {
      input.checked = true;
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Auto-advance on single-choice selection (skip the terminal/consent slide).
  slides.forEach((slide) => {
    if (slide.dataset.kind !== 'single') return;
    slide.addEventListener('change', (event) => {
      const input = event.target;
      if (!input || input.type !== 'radio' || !input.checked) return;
      if (!slide.classList.contains('is-active')) return;
      clearSlideError(slide);
      // Don't auto-advance when the selection came from arrow-key navigation — the user
      // is still reviewing options. Clicks, taps and letter keys still advance.
      if (lastKeyWasArrow) return;
      const advance = () => {
        if (slide.classList.contains('is-active')) goNext();
      };
      if (prefersReducedMotion) advance();
      else window.setTimeout(advance, AUTO_ADVANCE_MS);
    });
  });

  // Clear a slide's error as soon as the user interacts with it
  // (radios/checkboxes fire 'change', text inputs fire 'input').
  slides.forEach((slide) => {
    slide.addEventListener('input', () => clearSlideError(slide));
    slide.addEventListener('change', () => clearSlideError(slide));
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommunityForm);
} else {
  initCommunityForm();
}
