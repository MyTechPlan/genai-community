// Reusable client-side form submission: native validation + reCAPTCHA Enterprise + JSON POST.
// Any <form data-recaptcha data-endpoint="/api/x" data-action="x_submit"> is wired automatically.
// On success, the form is hidden and #<form-id>-success is shown (if present).

function setLoading(form, loading) {
  const btn = form.querySelector('[type="submit"]');
  if (!btn) return;
  if (loading) {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
    btn.disabled = true;
    btn.textContent = btn.dataset.loading || 'Sending…';
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}

async function getRecaptchaToken(action) {
  const siteKey = window.__RECAPTCHA_SITE_KEY;
  const enterprise = window.grecaptcha && window.grecaptcha.enterprise;
  if (!siteKey || !enterprise) return null;
  await new Promise((resolve) => enterprise.ready(resolve));
  return enterprise.execute(siteKey, { action });
}

export function wireForm(form) {
  const endpoint = form.dataset.endpoint;
  const action = form.dataset.action || 'submit';
  const successEl = form.id ? document.getElementById(`${form.id}-success`) : null;
  // Error element may live inside the form OR as a sibling (#<form-id>-error).
  const errorEl =
    form.querySelector('[data-form-error]') ||
    (form.id ? document.getElementById(`${form.id}-error`) : null);

  if (!endpoint) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    if (!form.reportValidity()) return;

    setLoading(form, true);

    try {
      const token = await getRecaptchaToken(action);
      const payload = Object.fromEntries(new FormData(form).entries());
      if (token) payload.recaptchaToken = token;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      if (successEl) {
        form.hidden = true;
        successEl.hidden = false;
      } else {
        form.reset();
        setLoading(form, false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (errorEl) {
        errorEl.textContent = 'Something went wrong. Please try again, or email hello@genaicommunity.eu directly.';
        errorEl.hidden = false;
      }
      setLoading(form, false);
    }
  });
}

export function wireAllForms() {
  document.querySelectorAll('form[data-recaptcha]').forEach(wireForm);
}
