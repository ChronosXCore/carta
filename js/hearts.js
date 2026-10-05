/**
 * Sistema de partículas de corazones en cascada y estela de toques interactivos.
 * Diseñado con Canvas 2D, Path2D procedurales, movimiento senoidal y optimización móvil.
 */

(function () {
  'use strict';

  // Verificación de reducción de movimiento por accesibilidad
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.getElementById('hearts-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationId = null;
  let isRunning = false;

  // Colección de partículas de fondo y chispas interactivas
  const particles = [];
  const sparks = [];

  // Paleta de colores cromática y emotiva
  const COLOR_PALETTE = [
    { fill: '#c026d3', glow: 'rgba(192, 38, 211, 0.6)' }, // Morado neón vibrante
    { fill: '#d946ef', glow: 'rgba(217, 70, 239, 0.6)' }, // Fucsia neón
    { fill: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' }, // Violeta puro
    { fill: '#ff2a85', glow: 'rgba(255, 42, 133, 0.6)' }, // Rosa neón intenso
    { fill: '#e0a8b9', glow: 'rgba(224, 168, 185, 0.4)' }, // Rosa empolvado
    { fill: '#e9d5ff', glow: 'rgba(233, 213, 255, 0.5)' }, // Lavanda pálida
    { fill: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' }  // Dorado luz de vela tenue
  ];

  /**
   * Generación de siluetas de corazón diferenciadas mediante Path2D
   * (Clásico, redondeado, alargado, asimétrico, contorno y destello)
   */
  function createHeartPath(type) {
    const p = new Path2D();

    if (type === 'rounded') {
      // Corazón tierno y redondeado
      p.moveTo(0, 0);
      p.bezierCurveTo(-12, -14, -22, 2, 0, 18);
      p.bezierCurveTo(22, 2, 12, -14, 0, 0);
    } else if (type === 'elongated') {
      // Corazón alargado, estilizado y poético
      p.moveTo(0, -4);
      p.bezierCurveTo(-10, -22, -18, -4, 0, 24);
      p.bezierCurveTo(18, -4, 10, -22, 0, -4);
    } else if (type === 'asymmetric') {
      // Ligeramente asimétrico con tacto artesanal
      p.moveTo(0, 0);
      p.bezierCurveTo(-16, -18, -24, 4, 0, 20);
      p.bezierCurveTo(20, 0, 10, -14, 0, 0);
    } else {
      // Clásico romántico con proporciones áureas
      p.moveTo(0, 0);
      p.bezierCurveTo(-14, -16, -20, 0, 0, 18);
      p.bezierCurveTo(20, 0, 14, -16, 0, 0);
    }
    return p;
  }

  const HEART_TYPES = ['classic', 'rounded', 'elongated', 'asymmetric'];
  const HEART_PATHS = {};
  HEART_TYPES.forEach(t => {
    HEART_PATHS[t] = createHeartPath(t);
  });

  /**
   * Representación individual de un corazón flotante en cascada
   */
  class FallingHeart {
    constructor(initialSpawn = false) {
      this.reset(initialSpawn);
    }

    reset(initialSpawn = false) {
      this.x = Math.random() * width;
      this.y = initialSpawn ? Math.random() * height : -30 - Math.random() * 60;

      // Profundidad z (0.3 = lejano y sutil, 1.0 = primer plano brillante)
      this.z = 0.35 + Math.random() * 0.65;

      // Escala base condicionada por profundidad
      this.size = (8 + Math.random() * 16) * this.z * (width < 600 ? 0.85 : 1);

      // Movimiento vertical suave y senoidal horizontal
      const baseSpeed = prefersReducedMotion ? 0.2 : 0.65;
      this.speedY = (baseSpeed + Math.random() * 1.1) * (0.6 + this.z * 0.6);
      this.swaySpeed = 0.008 + Math.random() * 0.018;
      this.swayAmplitude = 25 + Math.random() * 45;
      this.swayOffset = Math.random() * Math.PI * 2;

      // Rotación
      this.rotation = (Math.random() - 0.5) * 0.5;
      this.rotationSpeed = prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.015;

      // Selección cromática y tipo
      const colorPick = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      this.fill = colorPick.fill;
      this.glow = colorPick.glow;
      this.isOutline = Math.random() < 0.2; // 20% siluetas de contorno
      this.hasGlint = Math.random() < 0.25; // 25% con destello de brillo
      this.shapeType = HEART_TYPES[Math.floor(Math.random() * HEART_TYPES.length)];

      // Opacidad con atenuación por lejanía
      this.baseOpacity = (0.25 + Math.random() * 0.65) * (0.5 + this.z * 0.5);
      this.opacity = this.baseOpacity;
    }

    update(time) {
      if (prefersReducedMotion) {
        this.y += this.speedY * 0.3;
      } else {
        this.y += this.speedY;
        this.x += Math.sin(time * this.swaySpeed + this.swayOffset) * 0.65;
        this.rotation += this.rotationSpeed;
      }

      // Reiniciar cuando supera la parte inferior
      if (this.y > height + 40) {
        this.reset(false);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      const scale = this.size / 20;
      ctx.scale(scale, scale);
      ctx.globalAlpha = this.opacity;

      const path = HEART_PATHS[this.shapeType];

      // Efecto resplandor neón selectivo para partículas cercanas
      if (this.z > 0.7 && !prefersReducedMotion) {
        ctx.shadowColor = this.glow;
        ctx.shadowBlur = 10 * this.z;
      }

      if (this.isOutline) {
        ctx.strokeStyle = this.fill;
        ctx.lineWidth = 2.2 / scale;
        ctx.stroke(path);
      } else {
        ctx.fillStyle = this.fill;
        ctx.fill(path);

        // Pequeño brillo estético en la parte superior izquierda
        if (this.hasGlint) {
          ctx.beginPath();
          ctx.arc(-5, -6, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  /**
   * Pequeñas chispas que brotan con el cursor o toque en pantalla
   */
  class SparkHeart {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const velocity = 1 + Math.random() * 2.5;
      this.vx = Math.cos(angle) * velocity;
      this.vy = Math.sin(angle) * velocity - 1.5; // Impulso ascendente
      this.size = 5 + Math.random() * 8;
      this.life = 1.0;
      this.decay = 0.02 + Math.random() * 0.025;
      const color = COLOR_PALETTE[Math.floor(Math.random() * (COLOR_PALETTE.length - 1))];
      this.color = color.fill;
      this.glow = color.glow;
      this.rotation = Math.random() * Math.PI;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.04; // Leve gravedad
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const scale = (this.size / 20) * this.life;
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.glow;
      ctx.shadowBlur = 8;
      ctx.fill(HEART_PATHS['classic']);
      ctx.restore();
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Ajuste de densidad según dispositivo (30 en móvil, 70 en escritorio)
    const targetCount = width < 768 ? (prefersReducedMotion ? 12 : 32) : (prefersReducedMotion ? 20 : 68);

    while (particles.length < targetCount) {
      particles.push(new FallingHeart(true));
    }
    while (particles.length > targetCount) {
      particles.pop();
    }
  }

  let lastTime = 0;
  function animate(timestamp) {
    if (!isRunning) return;
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    // Actualizar y renderizar corazones de fondo
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(timestamp);
      particles[i].draw(ctx);
    }

    // Actualizar y renderizar estela táctil de chispas
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.update();
      if (s.life <= 0) {
        sparks.splice(i, 1);
      } else {
        s.draw(ctx);
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  function start() {
    if (!isRunning) {
      isRunning = true;
      animationId = requestAnimationFrame(animate);
    }
  }

  function stop() {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Interacción táctil / cursor para estela de corazones
  function addSpark(x, y) {
    if (prefersReducedMotion) return;
    if (sparks.length > 40) sparks.shift();
    sparks.push(new SparkHeart(x, y));
  }

  let lastPointerMove = 0;
  function onPointerMove(e) {
    const now = performance.now();
    if (now - lastPointerMove < 35) return; // Limitar frecuencia a ~30fps
    lastPointerMove = now;
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
    if (x !== null && y !== null) {
      addSpark(x, y);
    }
  }

  // Event Listeners
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  // Pausar cuando la pestaña esté inactiva para ahorrar batería y recursos
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  // Inicialización
  resize();
  start();

  // Exponer al ámbito global para control si es necesario
  window.HeartsEngine = { start, stop, resize, addSpark };

  /* =========================================================================
     SISTEMA DE PARTÍCULAS SUTILES DENTRO DEL PERGAMINO DE LA CARTA
     - Corazones enteros románticos y corazones rotos (35% rotos, 65% enteros)
     - Ubicados estrictamente por debajo de la letra (baja opacidad 0.08 - 0.20)
     - Movimiento ascendente sutil y pausado
     - Culling inteligente para renderizar solo lo visible en el scroll
     ========================================================================= */
  (function initCartaHearts() {
    const cartaCanvas = document.getElementById('carta-hearts-canvas');
    const seccionCarta = document.getElementById('seccion-carta');
    if (!cartaCanvas || !seccionCarta) return;

    const ctx = cartaCanvas.getContext('2d');
    let cWidth = 0;
    let cHeight = 0;
    let cartaAnimId = null;
    let isCartaRunning = false;

    // Paleta delicada y tenue para no molestar la lectura
    const CARTA_PALETTE = [
      '#ff2a85', // Rosa neón
      '#d946ef', // Fucsia
      '#a855f7', // Violeta
      '#fb7185', // Rosa coral / herida
      '#f43f5e', // Rubí sincero
      '#e0a8b9', // Rosa empolvado
      '#c026d3', // Morado suave
      '#fbbf24'  // Luz dorada tenue
    ];

    class PergaminoParticle {
      constructor(initialSpawn = false) {
        this.reset(initialSpawn);
      }

      reset(initialSpawn = false) {
        this.x = Math.random() * (cWidth || 600);
        this.y = initialSpawn ? Math.random() * (cHeight || 1200) : (cHeight || 1200) + 20 + Math.random() * 40;

        // 35% de probabilidad de ser corazón roto
        this.isBroken = Math.random() < 0.35;

        // Tamaño sutil (entre 10px y 19px)
        this.size = 10 + Math.random() * 9;

        // Velocidad ascendente muy suave y lenta para no distraer la lectura
        this.speedY = 0.22 + Math.random() * 0.42;
        this.swaySpeed = 0.0012 + Math.random() * 0.002;
        this.swayAmp = 12 + Math.random() * 24;
        this.swayOffset = Math.random() * Math.PI * 2;

        // Rotación leve
        this.rotation = (Math.random() - 0.5) * 0.4;
        this.rotationSpeed = (Math.random() - 0.5) * 0.004;

        // Baja opacidad estética (0.08 a 0.20)
        this.baseAlpha = 0.08 + Math.random() * 0.12;
        this.color = CARTA_PALETTE[Math.floor(Math.random() * CARTA_PALETTE.length)];
        this.pulseSpeed = 0.0015 + Math.random() * 0.002;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(time) {
        this.y -= this.speedY;
        this.x += Math.sin(time * this.swaySpeed + this.swayOffset) * 0.45;
        this.rotation += this.rotationSpeed;

        if (this.y < -30) {
          this.reset(false);
        }
      }

      draw(ctx, time) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Opacidad tenue con leve respiración
        const alpha = Math.max(0.05, Math.min(0.24, this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.035));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        const s = this.size / 20;
        ctx.scale(s, s);

        if (!this.isBroken) {
          // Corazón entero
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.bezierCurveTo(-7, -15, -18, -4, -18, 5);
          ctx.bezierCurveTo(-18, 12, -7, 18, 0, 22);
          ctx.bezierCurveTo(7, 18, 18, 12, 18, 5);
          ctx.bezierCurveTo(18, -4, 7, -15, 0, -6);
          ctx.closePath();
          ctx.fill();
        } else {
          // Corazón roto con grieta dentada en el centro
          // Mitad izquierda con fisura
          ctx.beginPath();
          ctx.moveTo(-1, -6);
          ctx.bezierCurveTo(-7, -15, -18, -4, -18, 5);
          ctx.bezierCurveTo(-18, 12, -7, 18, -2, 22);
          ctx.lineTo(-2, 17);
          ctx.lineTo(-6, 11);
          ctx.lineTo(-1, 6);
          ctx.lineTo(-7, 0);
          ctx.lineTo(-1, -6);
          ctx.closePath();
          ctx.fill();

          // Mitad derecha con fisura complementaria (ligeramente separada)
          ctx.beginPath();
          ctx.moveTo(2, -6);
          ctx.bezierCurveTo(8, -15, 19, -4, 19, 5);
          ctx.bezierCurveTo(19, 12, 8, 18, 2, 22);
          ctx.lineTo(2, 17);
          ctx.lineTo(-2, 11);
          ctx.lineTo(3, 6);
          ctx.lineTo(-3, 0);
          ctx.lineTo(2, -6);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const cartaParticles = [];
    const count = window.innerWidth < 680 ? 22 : 38;

    function resizeCartaCanvas() {
      if (!cartaCanvas || !seccionCarta) return;
      const rect = seccionCarta.getBoundingClientRect();
      cWidth = seccionCarta.clientWidth || rect.width || 800;
      cHeight = seccionCarta.clientHeight || rect.height || 1800;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      cartaCanvas.width = Math.floor(cWidth * dpr);
      cartaCanvas.height = Math.floor(cHeight * dpr);
      cartaCanvas.style.width = `${cWidth}px`;
      cartaCanvas.style.height = `${cHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function initParticles() {
      cartaParticles.length = 0;
      for (let i = 0; i < count; i++) {
        cartaParticles.push(new PergaminoParticle(true));
      }
    }

    function animateCarta(time) {
      if (!isCartaRunning) return;

      const rect = seccionCarta.getBoundingClientRect();
      const winH = window.innerHeight;

      // Optimización inteligente: solo procesar si la carta está dentro o cerca del viewport
      const isInView = rect.bottom > -100 && rect.top < winH + 100;

      if (isInView) {
        ctx.clearRect(0, 0, cWidth, cHeight);

        // Rango vertical actualmente visible en la ventana para optimizar el dibujo
        const visibleTop = Math.max(0, -rect.top - 120);
        const visibleBottom = Math.min(cHeight, -rect.top + winH + 120);

        for (let i = 0; i < cartaParticles.length; i++) {
          const p = cartaParticles[i];
          p.update(time);
          if (p.y >= visibleTop && p.y <= visibleBottom) {
            p.draw(ctx, time);
          }
        }
      }

      cartaAnimId = requestAnimationFrame(animateCarta);
    }

    function startCarta() {
      if (!isCartaRunning) {
        isCartaRunning = true;
        cartaAnimId = requestAnimationFrame(animateCarta);
      }
    }

    function stopCarta() {
      isCartaRunning = false;
      if (cartaAnimId) {
        cancelAnimationFrame(cartaAnimId);
        cartaAnimId = null;
      }
    }

    window.addEventListener('resize', () => {
      resizeCartaCanvas();
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCarta();
      else startCarta();
    });

    // Inicializar cuando el DOM y fuentes estén listos
    setTimeout(() => {
      resizeCartaCanvas();
      initParticles();
      startCarta();
    }, 150);

    // Re-ajustar dimensiones tras carga de imágenes
    window.addEventListener('load', () => {
      setTimeout(() => {
        resizeCartaCanvas();
      }, 500);
    });
  })();
})();
