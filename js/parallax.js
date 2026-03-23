/*!
 * VoerWij Parallax — lichtgewicht parallax engine
 *
 * Gebruik: voeg data-parallax="<snelheid>" toe aan elk element.
 * Snelheid: positief getal (0.2 = subtiel, 0.5 = sterk).
 *
 * Berekent offset via absolute document-positie (niet viewport-afhankelijk),
 * zodat het effect correct werkt in elke sectie op de pagina.
 *
 * Respecteert prefers-reduced-motion automatisch.
 * Gebruikt requestAnimationFrame + translateY voor GPU-versnelling.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ticking = false;
  var vh = window.innerHeight;

  // Absolute document-top van een element (niet beïnvloed door CSS transforms)
  function absTop(el) {
    var top = 0;
    var node = el;
    while (node && node !== document.body) {
      top += node.offsetTop;
      node = node.offsetParent;
    }
    return top;
  }

  // Sla bij initialisatie de basis-positie op per element
  var items = [];
  function initItems() {
    items = [];
    var els = document.querySelectorAll('[data-parallax]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      items.push({
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0.2,
        baseCenter: absTop(el) + el.offsetHeight / 2
      });
    }
  }

  function applyParallax() {
    var sy = window.pageYOffset || window.scrollY;
    var viewportCenter = sy + vh / 2;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // Hoe ver zit het element-midden van het viewport-midden?
      var dist = viewportCenter - item.baseCenter;
      var offset = dist * item.speed;
      item.el.style.transform = 'translateY(' + offset + 'px)';
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    initItems(); // herbereken basis-posities na resize
    applyParallax();
  }, { passive: true });

  // Start
  initItems();
  applyParallax();
}());
