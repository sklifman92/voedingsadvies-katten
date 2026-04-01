/*!
 * VoerWij Parallax v2
 *
 * Twee modi:
 *
 * 1. data-parallax="<snelheid>"
 *    Achtergrondblobs: translateY op basis van scroll-positie.
 *    Snelheid: 0.1 (subtiel) – 0.5 (sterk).
 *
 * 2. data-parallax-3d
 *    Card reveal: rotateX + scale + translateY als element in beeld scrolt.
 *    Geïnspireerd op ContainerTextScroll (framer-motion stijl).
 *    Geen dependencies — puur rAF + CSS transforms.
 *
 * Beide modi:
 *  - requestAnimationFrame throttling (60fps)
 *  - GPU-versneld via transform
 *  - Respecteren prefers-reduced-motion
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ticking = false;
  var vh = window.innerHeight;

  // ── Helper: absolute document-top (niet beïnvloed door CSS transforms) ──
  function absTop(el) {
    var top = 0, node = el;
    while (node && node !== document.body) {
      top += node.offsetTop;
      node = node.offsetParent;
    }
    return top;
  }

  // ── Ease-out cubic ──────────────────────────────────────────────────────
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ── MOD 1: data-parallax blob items ────────────────────────────────────
  var blobItems = [];

  function initBlobs() {
    blobItems = [];
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      blobItems.push({
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0.2,
        baseCenter: absTop(el) + el.offsetHeight / 2
      });
    });
  }

  // ── MOD 2: data-parallax-3d card reveal ────────────────────────────────
  var cardItems = [];

  function initCards() {
    cardItems = [];
    document.querySelectorAll('[data-parallax-3d]').forEach(function (el) {
      // Voeg perspective toe aan het parent element
      var parent = el.parentElement;
      if (parent && !parent.dataset.perspectiveSet) {
        parent.style.perspective = '1200px';
        parent.dataset.perspectiveSet = '1';
      }
      el.style.willChange = 'transform';
      el.style.transformOrigin = '50% 50%';

      var elTop = absTop(el);
      cardItems.push({
        el: el,
        scrollStart: elTop - vh,          // element bottom raakt viewport bottom
        scrollEnd:   elTop - vh * 0.30    // element goed in beeld
      });
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function render() {
    var sy = window.pageYOffset || window.scrollY;
    var viewCenter = sy + vh / 2;

    // Blob translateY
    for (var i = 0; i < blobItems.length; i++) {
      var b = blobItems[i];
      var dist = viewCenter - b.baseCenter;
      var clamped = Math.max(-vh * 0.8, Math.min(vh * 0.8, dist));
      b.el.style.transform = 'translateY(' + (clamped * b.speed) + 'px)';
    }

    // 3D card reveal
    for (var j = 0; j < cardItems.length; j++) {
      var c = cardItems[j];
      var range = c.scrollEnd - c.scrollStart;
      if (range <= 0) continue;

      var raw = (sy - c.scrollStart) / range;
      var progress = easeOut(Math.max(0, Math.min(1, raw)));

      var rotateX  = -18 * (1 - progress);          // -18° → 0°
      var scale    = 0.88 + 0.12 * progress;         //  0.88 → 1.0
      var transY   = 60  * (1 - progress);           //  60px → 0px

      c.el.style.transform =
        'translateY(' + transY + 'px) ' +
        'rotateX('    + rotateX + 'deg) ' +
        'scale('      + scale + ')';
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(render);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    initBlobs();
    initCards();
    render();
  }, { passive: true });

  initBlobs();
  initCards();
  render();
}());
