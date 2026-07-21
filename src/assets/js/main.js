/* ============================================================
   Grit Lab Africa — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Hamburger / mobile nav ───────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar')) {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }

  /* ── Active nav link ──────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Back-to-top button ───────────────────────────────── */
  const btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('show', window.scrollY > 400);
    });
    btt.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }

  /* ── Scroll-fade-up animations ────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    fadeEls.forEach(el => observer.observe(el));
  }

  /* ── Media page filter buttons ────────────────────────── */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.media-card').forEach(card => {
        card.style.display =
          (filter === 'all' || card.dataset.type === filter) ? '' : 'none';
      });
    });
  });

  /* ── Apply form submission ────────────────────────────── */
  const applyForm = document.getElementById('apply-form');
  if (applyForm) {
    applyForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = applyForm.querySelector('button[type="submit"]');
      btn.textContent = 'Submitting…';
      btn.disabled = true;
      setTimeout(() => {
        applyForm.innerHTML = `
          <div class="text-center" style="padding:2rem 0">
            <div style="font-size:3rem;margin-bottom:1rem">✅</div>
            <h3 style="color:var(--green);margin-bottom:.5rem">Application Submitted!</h3>
            <p style="color:var(--text-muted)">Thank you for applying to Grit Lab Africa.<br>
            We'll review your application and get back to you within 5–7 business days.</p>
          </div>`;
      }, 1200);
    });
  }

  /* ── Animate counter numbers ──────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString() + (el.dataset.suffix || '');
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length) {
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          countObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    countEls.forEach(el => countObs.observe(el));
  }

});
