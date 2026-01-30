document.addEventListener('DOMContentLoaded', function () {
  // Nav toggle for small screens
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  navToggle && navToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
  mainNav && mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.length > 1 && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.12 });
    reveals.forEach(r => obs.observe(r));
  } else {
    reveals.forEach(r => r.classList.add('is-visible'));
  }

  // Project modal
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalClose = document.getElementById('modal-close');

  function openModal(card) {
    const title = card.dataset.title || '';
    const desc = card.dataset.desc || '';
    const img = card.dataset.img || '';
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalImg.src = img;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-card').forEach(card => {
    const thumb = card.querySelector('.project-thumb');
    if (card.dataset.img && thumb) thumb.style.backgroundImage = `url(${card.dataset.img})`;
    const btn = card.querySelector('.project-more');
    btn && btn.addEventListener('click', () => openModal(card));
  });

  modalClose && modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
});

// Contact form removed — no client-side handling needed
