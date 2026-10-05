/**
 * Controlador principal de la experiencia interactiva:
 * - Pantalla de entrada y desbloqueo de audio
 * - Renderizado dinámico y no monótono de fotografías y recuerdos
 * - Animación progresiva con IntersectionObserver
 * - Barra de lectura superior y transición de atmósfera lumínica
 * - Cinta de fotos táctil (filmstrip)
 */

(function () {
  'use strict';

  // Referencias a elementos
  const pantallaEntrada = document.getElementById('pantalla-entrada');
  const btnAbrirCarta = document.getElementById('btn-abrir-carta');
  const readingBar = document.getElementById('reading-progress');
  const mainContent = document.getElementById('contenido-principal');

  // 1. Pantalla de Entrada y Desbloqueo de Audio
  if (btnAbrirCarta && pantallaEntrada) {
    btnAbrirCarta.addEventListener('click', () => {
      // Desbloquear audio en navegadores móviles (iOS / Android)
      if (typeof window.desbloquearAudioCarta === 'function') {
        window.desbloquearAudioCarta();
      }

      // Animación cinematográfica de apertura
      pantallaEntrada.classList.add('fade-out');
      document.body.classList.remove('bloquear-scroll');

      setTimeout(() => {
        pantallaEntrada.style.display = 'none';
        iniciarAnimacionTitulo();
      }, 900);
    });
  }

  // 2. Animación suave del Título Principal
  function iniciarAnimacionTitulo() {
    const titleElement = document.getElementById('titulo-portada');
    if (!titleElement) return;
    titleElement.classList.add('titulo-visible');
  }



  // 4. Barra de Progreso de Lectura Superior y Transición de Atmósfera
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    if (readingBar) {
      readingBar.style.width = `${progress}%`;
    }

    // Cambio gradual de atmósfera de color
    // 0% - 25%: Inicio (Noche índigo & morado neón)
    // 25% - 55%: Disculpa (Azul profundo melancólico & gris azulado)
    // 55% - 75%: Carta (Morado luminoso neón & lavanda)
    // 75% - 100%: Esperanza y Amor (Rosa neón, lavanda y luz cálida dorada)
    if (progress < 25) {
      document.body.dataset.atmosfera = 'inicio';
    } else if (progress < 55) {
      document.body.dataset.atmosfera = 'disculpa';
    } else if (progress < 75) {
      document.body.dataset.atmosfera = 'carta';
    } else {
      document.body.dataset.atmosfera = 'esperanza';
    }
  }

  // 5. IntersectionObserver para Revelado Progresivo de Secciones y Fotos
  function setupScrollReveals() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.12
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // 6. Botón suave de "Deslizar para leer mi carta"
  const btnScrollDown = document.getElementById('btn-scroll-down');
  if (btnScrollDown) {
    btnScrollDown.addEventListener('click', () => {
      const target = document.getElementById('seccion-carta');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // 7. Toggle del sobre interactivo de recuerdos adicionales (fotos y videos)
  const btnToggleCofre = document.getElementById('btn-toggle-cofre');
  const cofrePanel = document.getElementById('cofre-recuerdos-panel');
  if (btnToggleCofre && cofrePanel) {
    btnToggleCofre.addEventListener('click', () => {
      const isHidden = cofrePanel.style.display === 'none';
      cofrePanel.style.display = isHidden ? 'block' : 'none';
      btnToggleCofre.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      btnToggleCofre.querySelector('span').textContent = isHidden 
        ? 'Cerrar sobre de recuerdos ♥' 
        : 'Abrir nuestro sobre de recuerdos (fotos y videos especiales) ♥';
      if (isHidden) {
        setTimeout(() => {
          cofrePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  }

  // 8. Visor de Recuerdos (Lightbox Modal) para fotos y videos con navegación
  function setupLightboxRecuerdos() {
    const modal = document.getElementById('modal-lightbox-recuerdos');
    if (!modal) return;

    const backdrop = document.getElementById('lightbox-backdrop');
    const btnClose = document.getElementById('lightbox-btn-close');
    const btnPrev = document.getElementById('lightbox-btn-prev');
    const btnNext = document.getElementById('lightbox-btn-next');
    const imgEl = document.getElementById('lightbox-img');
    const videoEl = document.getElementById('lightbox-video');
    const captionEl = document.getElementById('lightbox-caption');
    const counterEl = document.getElementById('lightbox-counter');
    const contentCard = modal.querySelector('.lightbox-content-card');

    // Construcción dinámica de la galería desde los elementos y pies de foto de index.html
    const galleryElements = document.querySelectorAll('.polaroid-gallery-item');
    const galleryItems = [];

    galleryElements.forEach((el, index) => {
      const isVideo = el.classList.contains('polaroid-video');
      const mediaEl = isVideo ? el.querySelector('video') : el.querySelector('img');
      const captionEl = el.querySelector('.scrapbook-caption');
      let captionText = captionEl ? captionEl.textContent.replace(/▶/g, '').trim() : '';

      let src = '';
      if (mediaEl) {
        src = mediaEl.getAttribute('src') || '';
        if (isVideo) src = src.split('#')[0]; // remover #t=0.5 si existe
      }

      galleryItems.push({
        type: isVideo ? 'video' : 'image',
        src: src,
        caption: captionText
      });
    });

    let currentIndex = 0;
    let isOpen = false;

    function renderCurrentItem() {
      const item = galleryItems[currentIndex];
      if (!item) return;

      if (captionEl) captionEl.textContent = item.caption;
      if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${galleryItems.length}`;

      // Detener y limpiar video si estaba activo
      if (videoEl) {
        try {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
        } catch (_) {}
        videoEl.style.display = 'none';
      }

      // Limpiar imagen previa
      if (imgEl) {
        imgEl.style.display = 'none';
        imgEl.src = '';
      }

      if (item.type === 'video') {
        // Pausar audio narrado de la carta para escuchar el audio del video con claridad
        if (window.CartaPlayer && typeof window.CartaPlayer.pause === 'function') {
          window.CartaPlayer.pause();
        }

        if (videoEl) {
          videoEl.style.display = 'block';
          videoEl.src = item.src;
          videoEl.load();
          videoEl.play().catch(() => {
            // Manejo de restricciones de autoplay si el navegador lo bloquea
          });
        }
      } else {
        if (imgEl) {
          imgEl.style.display = 'block';
          imgEl.src = item.src;
          imgEl.alt = item.caption;
        }
      }
    }

    function openLightbox(index) {
      currentIndex = (index >= 0 && index < galleryItems.length) ? index : 0;
      modal.style.display = 'flex';
      // Forzar reflujo para que la transición CSS de opacidad se aplique correctamente
      void modal.offsetWidth;
      modal.classList.add('is-open');
      isOpen = true;
      document.body.classList.add('bloquear-scroll');
      renderCurrentItem();

      if (btnClose) {
        btnClose.focus();
      }
    }

    function closeLightbox() {
      if (!isOpen) return;
      isOpen = false;
      modal.classList.remove('is-open');

      if (videoEl) {
        try {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
        } catch (_) {}
      }

      document.body.classList.remove('bloquear-scroll');

      setTimeout(() => {
        if (!isOpen) {
          modal.style.display = 'none';
        }
      }, 300);
    }

    function nextItem() {
      if (!isOpen) return;
      currentIndex = (currentIndex + 1) % galleryItems.length;
      renderCurrentItem();
    }

    function prevItem() {
      if (!isOpen) return;
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      renderCurrentItem();
    }

    // Delegación o asignación de click a cada recuerdo interactivo
    const items = document.querySelectorAll('.polaroid-gallery-item');
    items.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const rawIdx = el.getAttribute('data-index');
        const idx = parseInt(rawIdx, 10);
        openLightbox(isNaN(idx) ? 0 : idx);
      });
    });

    // Controles de navegación y cierre
    if (btnClose) btnClose.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    if (btnNext) btnNext.addEventListener('click', nextItem);
    if (btnPrev) btnPrev.addEventListener('click', prevItem);

    // Navegación con teclado (Flechas y Escape)
    window.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextItem();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevItem();
      }
    });

    // Soporte táctil Swipe (deslizar izquierda/derecha en móviles)
    let touchStartX = 0;
    let touchStartY = 0;
    if (contentCard) {
      contentCard.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      contentCard.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              nextItem();
            } else {
              prevItem();
            }
          }
        }
      }, { passive: true });
    }
  }

  // Inicializar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    setupScrollReveals();
    setupLightboxRecuerdos();
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  });

})();
