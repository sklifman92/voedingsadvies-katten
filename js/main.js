// ===== HAAR. Kattentrimsalon - Main JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
  // Mobile navigation
  const burger = document.getElementById('burger');
  const navToggle = document.getElementById('nav-toggle') || burger;
  const nav = document.getElementById('lp-nav') || document.getElementById('nav');
  const usesLegacyNav = !!(nav && nav.id === 'nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      const isOpen = nav.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (usesLegacyNav && burger) {
        burger.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    });
  }

  // Mobile dropdown toggle
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('open');
        }
      });
    }
  });

  // Close nav when clicking a link (mobile)
  const navLinks = nav
    ? nav.querySelectorAll(usesLegacyNav ? '.nav-list a:not(.dropdown-toggle)' : 'a')
    : [];

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navToggle && nav) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (usesLegacyNav && burger) {
          burger.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
  });

  // Header scroll effect
  const header = document.getElementById('lp-header') || document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Scroll animations
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => observer.observe(el));
  }

  // Contact form (simple validation)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');

      if (!name || !email || !message) {
        alert('Vul alstublieft alle verplichte velden in.');
        return;
      }

      // In production, this would send to a server
      alert('Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.');
      contactForm.reset();
    });
  }
});
