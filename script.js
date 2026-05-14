/**
 * Meridian Hardware – script.js
 * Handles: nav scroll, mobile menu, scroll-reveal, count-up, bar animations
 */
 
/* ─── Utility ──────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
 
/* ─── DOM refs ─────────────────────────────────────────────────── */
const header     = $('#site-header');
const hamburger  = $('#hamburger');
const navLinks   = $('#nav-links');
 
/* ════════════════════════════════════════════════════════════
   1. STICKY NAV – add .scrolled class on scroll
   ════════════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
 
// Initialise on load in case the page is refreshed partway down
if (window.scrollY > 40) header.classList.add('scrolled');
 
/* ════════════════════════════════════════════════════════════
   2. MOBILE MENU TOGGLE
   ════════════════════════════════════════════════════════════ */
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('active');
  navLinks.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});
 
// Close menu when any nav link is tapped
$$('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});
 
// Close menu on outside click
document.addEventListener('click', (e) => {
  if (!header.contains(e.target) && navLinks.classList.contains('open')) {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  }
});
 
/* ════════════════════════════════════════════════════════════
   3. SCROLL REVEAL
   Uses IntersectionObserver; falls back gracefully if unsupported.
   ════════════════════════════════════════════════════════════ */
const revealEls = $$('.reveal');
 
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
 
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  // Fallback: show everything immediately
  revealEls.forEach(el => el.classList.add('visible'));
}
 
/* ════════════════════════════════════════════════════════════
   4. COUNT-UP ANIMATION  (stats bar)
   Animates from 0 to the target value when the stat bar enters view.
   ════════════════════════════════════════════════════════════ */
const countEls = $$('[data-count]');
 
if (countEls.length && 'IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  countEls.forEach(el => countObserver.observe(el));
}
 
function animateCount(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 1400; // ms
  const fps      = 60;
  const steps    = Math.round((duration / 1000) * fps);
  let   step     = 0;
 
  const timer = setInterval(() => {
    step++;
    // Ease-out curve: fast start, slow finish
    const progress = 1 - Math.pow(1 - step / steps, 3);
    el.textContent = Math.round(progress * target);
 
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    }
  }, 1000 / fps);
}
 
/* ════════════════════════════════════════════════════════════
   5. RATING BAR ANIMATION
   Triggers the bars to grow when the reviews section enters view.
   ════════════════════════════════════════════════════════════ */
const barFills = $$('.bar-fill');
 
if (barFills.length && 'IntersectionObserver' in window) {
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          barFills.forEach(bar => {
            // Pull the inline-style width and apply it via CSS var for animation
            const targetW = bar.style.width;
            bar.style.setProperty('--w', targetW);
            bar.style.width = '0';
            // Trigger reflow then animate
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                bar.style.transition = 'width 0.9s ease';
                bar.style.width = targetW;
              });
            });
          });
          barObserver.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
 
  const ratingSummary = $('.rating-summary');
  if (ratingSummary) barObserver.observe(ratingSummary);
}
 
/* ════════════════════════════════════════════════════════════
   6. SMOOTH ACTIVE NAV HIGHLIGHTING
   Highlights the nav link corresponding to the visible section.
   ════════════════════════════════════════════════════════════ */
const sections = $$('section[id]');
const navItems = $$('.nav-links a[href^="#"]');
 
if (sections.length && navItems.length && 'IntersectionObserver' in window) {
  const sectionMap = {};
  sections.forEach(s => { sectionMap[s.id] = s; });
 
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navItems.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
 
  sections.forEach(s => sectionObserver.observe(s));
}
 
// Add active style dynamically
const styleTag = document.createElement('style');
styleTag.textContent = `.nav-links a.active { color: #fff !important; }
.nav-links a.active::after { transform: scaleX(1) !important; transform-origin: left !important; }`;
document.head.appendChild(styleTag);
 
/* ════════════════════════════════════════════════════════════
   7. SERVICE CARD – staggered reveal delay
   Adds sequential delay to service and feature cards so they
   animate in one by one.
   ════════════════════════════════════════════════════════════ */
function staggerCards(selector) {
  $$(selector).forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
  });
}
 
staggerCards('.service-card');
staggerCards('.feature-card');
staggerCards('.review-card');
 
/* ════════════════════════════════════════════════════════════
   8. CURRENT OPEN/CLOSED STATUS
   Dynamically checks if the store is open based on local time.
   ════════════════════════════════════════════════════════════ */
(function checkStoreStatus() {
  const now  = new Date();
  const day  = now.getDay();  // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const min  = now.getMinutes();
  const time = hour + min / 60;
 
  // Mon–Sat: 8 AM – 5 PM
  const isOpen = day >= 1 && day <= 6 && time >= 8 && time < 17;
 
  const badgeDots = $$('.badge-dot');
  const heroBadge = $('.hero-badge');
  const openBadge = $('.open-badge');
 
  if (!isOpen) {
    badgeDots.forEach(dot => {
      dot.style.background = '#ef4444';
      dot.style.animation  = 'none';
    });
    if (heroBadge) heroBadge.textContent = '⛔ Currently Closed';
    if (openBadge) openBadge.innerHTML = '<span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;"></span> Closed Now';
  }
})();
 
/* ════════════════════════════════════════════════════════════
   9. BACK-TO-TOP  (auto-inject button)
   ════════════════════════════════════════════════════════════ */
const backBtn = document.createElement('button');
backBtn.id = 'back-to-top';
backBtn.setAttribute('aria-label', 'Back to top');
backBtn.innerHTML = '↑';
backBtn.style.cssText = `
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  width: 44px;
  height: 44px;
  background: #f59e0b;
  color: #18191c;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(245,158,11,.4);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity .3s ease, transform .3s ease;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
`;
document.body.appendChild(backBtn);
 
window.addEventListener('scroll', () => {
  const show = window.scrollY > 400;
  backBtn.style.opacity   = show ? '1' : '0';
  backBtn.style.transform = show ? 'translateY(0)' : 'translateY(12px)';
  backBtn.style.pointerEvents = show ? 'auto' : 'none';
}, { passive: true });
 
backBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
 
/* ─── Init log ──────────────────────────────────────────────────── */
console.log('%cMeridian Hardware Website Loaded', 'color:#f59e0b;font-weight:bold;font-size:14px;');
 
