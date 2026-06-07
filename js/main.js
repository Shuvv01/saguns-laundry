// ============================================================
// Sagun's Laundry — main.js  (XSS-safe, CSRF-aware)
// ============================================================

const SAGUNS_WHATSAPP_NUMBER = '9779851332353';

function buildWhatsAppUrl(message) {
  return `https://wa.me/${SAGUNS_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function goToWhatsApp(message) {
  window.location.href = buildWhatsAppUrl(message);
}

window.buildWhatsAppUrl = buildWhatsAppUrl;
window.goToWhatsApp = goToWhatsApp;

// ── XSS-safe DOM helpers ──────────────────────────────────
// Never use innerHTML with user data — always use these
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str ?? '')));
  return d.innerHTML;
}
function setTextSafe(el, text) {
  if (el) el.textContent = String(text ?? '');
}
// Safe innerHTML for TRUSTED template strings only (no user data)
function safeHTML(el, html) {
  if (el) el.innerHTML = html;
}

// ── CSRF Token ────────────────────────────────────────────
// PHP pages embed the token in a <meta> tag
function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

// ── API Helpers ───────────────────────────────────────────
async function apiCall(url, data = {}) {
  const body = new URLSearchParams();
  body.append('csrf_token', getCSRFToken());
  Object.entries(data).forEach(([k, v]) => body.append(k, v));
  try {
    const res  = await fetch(url, { method: 'POST', body, credentials: 'same-origin' });
    const json = await res.json();
    return json;
  } catch (e) {
    return { error: 'Network error. Please try again.' };
  }
}

async function apiGet(url, params = {}) {
  const qs  = new URLSearchParams(params).toString();
  const full = qs ? `${url}?${qs}` : url;
  try {
    const res = await fetch(full, { credentials: 'same-origin' });
    return res.json();
  } catch (e) {
    return { error: 'Network error.' };
  }
}

// ── Toast Notifications ───────────────────────────────────
const ToastManager = {
  container: null,
  init() {
    this.container = document.querySelector('.toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 4500) {
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${escHtml(type)}`;
    // Use textContent for icon and message — no innerHTML with user data
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icons[type] || icons.info;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;   // textContent — XSS safe
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => toast.remove(), 310);
    }, duration);
  }
};

// ── Button Loading ────────────────────────────────────────
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-loading');
  } else {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    if (btn.dataset.origHtml != null) btn.innerHTML = btn.dataset.origHtml;
  }
}

// ── Navbar Scroll ─────────────────────────────────────────
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  if (nav.dataset.alwaysScrolled === 'true') {
    nav.classList.add('scrolled');
    return;
  }
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initSectionLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      const navHeight = document.querySelector('.navbar')?.offsetHeight ?? 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      history.pushState(null, '', hash);
    });
  });
}

// ── Mobile Menu ───────────────────────────────────────────
function initMobileMenu() {
  const ham  = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (!ham || !menu) return;
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  ham.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!menu.classList.contains('open')); });
  document.addEventListener('click', (e) => {
    if (!ham.contains(e.target) && !menu.contains(e.target)) setOpen(false);
  });
  // Close on mobile link click
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
}

// ── Service Cards Accordion ───────────────────────────────
function initServiceCards() {
  const closeCards = () => {
    document.querySelectorAll('.service-card').forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-expanded', 'false');
    });
  };
  document.querySelectorAll('.service-card').forEach(card => {
    const toggle = () => {
      const isActive = card.classList.contains('active');
      closeCards();
      if (!isActive) {
        card.classList.add('active');
        card.setAttribute('aria-expanded', 'true');
      }
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

// ── Scroll Animations ─────────────────────────────────────
function initScrollAnimations() {
  if (!window.IntersectionObserver) {
    document.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
}

// ── Modal ─────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('open'); document.body.style.overflow = ''; }
  if (e.target.classList.contains('modal-close'))   { e.target.closest('.modal-overlay')?.classList.remove('open'); document.body.style.overflow = ''; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.open').forEach(m => { m.classList.remove('open'); document.body.style.overflow = ''; }); }
});

// ── Formatters ────────────────────────────────────────────
function formatNPR(amount) {
  const n = parseFloat(amount) || 0;
  return 'NPR\u00a0' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

// ── Status Config ─────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: 'Pending',     icon: '📋' },
  confirmed:  { label: 'Confirmed',   icon: '✅' },
  picked_up:  { label: 'Picked Up',   icon: '🚗' },
  in_process: { label: 'In Process',  icon: '🧺' },
  ready:      { label: 'Ready',       icon: '✨' },
  delivered:  { label: 'Delivered',   icon: '🎉' },
  cancelled:  { label: 'Cancelled',   icon: '❌' },
};

// ── Contact Form ──────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const name = form.querySelector('[name="name"]')?.value?.trim() ?? '';
    const phone = form.querySelector('[name="phone"]')?.value?.trim() ?? '';
    const message = form.querySelector('[name="message"]')?.value?.trim() ?? '';
    if (!name || message.length < 5) {
      ToastManager.show('Please add your name and message.', 'error');
      return;
    }
    setLoading(btn, true);
    const text = [
      'Hello Sagun\'s Laundry, I want to contact you.',
      `Name: ${name}`,
      phone ? `Phone/WhatsApp: ${phone}` : '',
      `Message: ${message}`
    ].filter(Boolean).join('\n');
    setTimeout(() => goToWhatsApp(text), 250);
  });
}

// ── Alert helper ──────────────────────────────────────────
function showAlert(containerId, message, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  const div = document.createElement('div');
  div.className = `alert alert-${escHtml(type)}`;
  div.textContent = message;   // textContent — XSS safe
  el.innerHTML = '';
  el.appendChild(div);
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ToastManager.init();
  initNavbar();
  initSectionLinks();
  initMobileMenu();
  initServiceCards();
  initScrollAnimations();
  initContactForm();
});

// Inject exit animation keyframe once
const _ks = document.createElement('style');
_ks.textContent = '@keyframes slideOutRight{to{opacity:0;transform:translateX(32px)}}';
document.head.appendChild(_ks);
