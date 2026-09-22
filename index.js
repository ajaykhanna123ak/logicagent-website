(() => {
    'use strict';

    /* ------------------------------------------------------------------
     * Consult form delivery.
     *
     * GitHub Pages serves static files only, so the send is handled by a
     * form backend. FormSubmit posts the submission straight to
     * CONTACT_EMAIL — no account needed, but the address must be confirmed
     * once: the first submission triggers an activation email to
     * contactus@logicagent.co, and delivery starts after that link is
     * clicked. Enquiry details pass through formsubmit.co.
     *
     * To move to a different provider, change FORM_ENDPOINT only, e.g.
     *   Formspree   'https://formspree.io/f/<your-form-id>'
     *   Web3Forms   'https://api.web3forms.com/submit'  (add your access_key)
     * ------------------------------------------------------------------ */
    const CONTACT_EMAIL = 'contactus@logicagent.co';
    const FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + CONTACT_EMAIL;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('js-enabled');

    /* ---------- Reveal on scroll ---------- */
    const revealTargets = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealTargets.forEach(el => el.classList.add('is-visible'));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (!entry.isIntersecting) return;
                // Small stagger for siblings entering together.
                entry.target.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        revealTargets.forEach(el => observer.observe(el));
    }

    /* ---------- Header state + scroll progress ---------- */
    const header = document.getElementById('site-header');
    const progress = document.querySelector('.scroll-progress span');
    let ticking = false;

    function onScroll() {
        const y = window.scrollY || document.documentElement.scrollTop;
        header.classList.toggle('is-scrolled', y > 12);

        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = max > 0 ? `${(y / max) * 100}%` : '0%';
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(onScroll);
    }, { passive: true });
    onScroll();

    /* ---------- Mobile navigation ---------- */
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('site-nav');

    function closeNav() {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
    }

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        });

        nav.addEventListener('click', (e) => {
            if (e.target.closest('a')) closeNav();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                closeNav();
                toggle.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 760) closeNav();
        });
    }

    /* ---------- Theme toggle ---------- */
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        const label = t => t === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
        const current = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        themeBtn.setAttribute('aria-label', label(current()));

        themeBtn.addEventListener('click', () => {
            const next = current() === 'light' ? 'dark' : 'light';
            if (next === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            themeBtn.setAttribute('aria-label', label(next));
            try { localStorage.setItem('la-theme', next); } catch (e) { /* private mode */ }
        });
    }

    /* ---------- Use-case flow tabs ---------- */
    const tablist = document.querySelector('.flow-rail');
    if (tablist) {
        const tabs = [...tablist.querySelectorAll('[role="tab"]')];

        function select(tab, focus = true) {
            tabs.forEach(t => {
                const on = t === tab;
                t.classList.toggle('is-active', on);
                t.setAttribute('aria-selected', String(on));
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
            });
            if (focus) tab.focus();
        }

        tablist.addEventListener('click', (e) => {
            const tab = e.target.closest('[role="tab"]');
            if (tab) select(tab, false);
        });

        // Arrow-key navigation, per the WAI-ARIA tabs pattern.
        tablist.addEventListener('keydown', (e) => {
            const i = tabs.indexOf(document.activeElement);
            if (i === -1) return;
            const last = tabs.length - 1;
            let next = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = last;
            if (next === null) return;
            e.preventDefault();
            select(tabs[next]);
        });
    }

    /* ---------- Consult modal ---------- */
    const modal = document.getElementById('consult-modal');
    const form = document.getElementById('consult-form');

    if (modal && form && typeof modal.showModal === 'function') {
        const body = document.getElementById('consult-body');
        const success = document.getElementById('consult-success');
        const successNote = document.getElementById('consult-success-note');
        const statusEl = document.getElementById('consult-status');
        const submitBtn = document.getElementById('consult-submit');
        let lastFocused = null;

        const fields = [
            { input: document.getElementById('cf-name'), error: document.getElementById('err-name') },
            { input: document.getElementById('cf-email'), error: document.getElementById('err-email') },
            { input: document.getElementById('cf-message'), error: document.getElementById('err-message') }
        ];

        function clearErrors() {
            fields.forEach(({ input, error }) => {
                input.removeAttribute('aria-invalid');
                error.hidden = true;
            });
            statusEl.textContent = '';
            statusEl.classList.remove('is-error');
        }

        function validate() {
            let firstBad = null;
            fields.forEach(({ input, error }) => {
                const bad = input.type === 'email'
                    ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())
                    : input.value.trim().length < 2;
                if (bad) {
                    input.setAttribute('aria-invalid', 'true');
                } else {
                    input.removeAttribute('aria-invalid');
                }
                error.hidden = !bad;
                if (bad && !firstBad) firstBad = input;
            });
            if (firstBad) firstBad.focus();
            return !firstBad;
        }

        function openModal(trigger) {
            lastFocused = trigger || document.activeElement;
            clearErrors();
            body.hidden = false;
            success.hidden = true;
            modal.showModal();
            document.body.classList.add('modal-open');
            // Focus the first field rather than the close button.
            requestAnimationFrame(() => fields[0].input.focus());
        }

        function closeModal() {
            modal.close();
        }

        modal.addEventListener('close', () => {
            document.body.classList.remove('modal-open');
            if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
        });

        // Clicking the backdrop (outside the panel) closes the dialog.
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.getElementById('consult-close').addEventListener('click', closeModal);
        modal.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));

        document.querySelectorAll('[data-consult]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(trigger);
            });
        });

        function payloadFrom(data) {
            return {
                name: (data.get('name') || '').trim(),
                email: (data.get('email') || '').trim(),
                company: (data.get('company') || '').trim(),
                topic: data.get('topic') || '',
                message: (data.get('message') || '').trim()
            };
        }

        function showSuccess(note) {
            if (note) successNote.textContent = note;
            body.hidden = true;
            success.hidden = false;
            form.reset();
            success.querySelector('h2').setAttribute('tabindex', '-1');
            success.querySelector('h2').focus();
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            // Honeypot filled in → silently accept and drop.
            if (form.elements['_honey'].value) {
                showSuccess();
                return;
            }
            if (!validate()) return;

            const p = payloadFrom(new FormData(form));

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';
            try {
                const res = await fetch(FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        name: p.name,
                        email: p.email,
                        company: p.company || '—',
                        topic: p.topic,
                        message: p.message,
                        _subject: `Consult enquiry — ${p.name}${p.company ? ' (' + p.company + ')' : ''}`,
                        _template: 'table',
                        _captcha: 'false'
                    })
                });
                if (!res.ok) throw new Error('Request failed: ' + res.status);
                // FormSubmit answers 200 even for rejected posts; check the body.
                const data = await res.json().catch(() => ({}));
                if (data.success === false || data.success === 'false') {
                    throw new Error(data.message || 'Submission rejected');
                }
                showSuccess();
            } catch (err) {
                statusEl.textContent = 'That didn\'t send. Please email ' + CONTACT_EMAIL + ' directly — or try again in a moment.';
                statusEl.classList.add('is-error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send enquiry';
            }
        });

        // Clear a field's error as soon as it's being corrected.
        fields.forEach(({ input, error }) => {
            input.addEventListener('input', () => {
                if (input.hasAttribute('aria-invalid')) {
                    input.removeAttribute('aria-invalid');
                    error.hidden = true;
                }
            });
        });
    }

    /* ---------- Anchor scrolling that respects motion preference ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        // Consult CTAs open the modal instead of scrolling.
        if (link.hasAttribute('data-consult')) return;
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href');
            if (id === '#') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
                return;
            }
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            // Keep keyboard focus in sync with the visual jump.
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    });
})();
