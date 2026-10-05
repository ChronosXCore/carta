/**
 * Sincronización palabra por palabra — Carta para Yohandry
 * Motor de audio de alta precisión con tiempos fonéticos auténticos,
 * anticipación perceptiva calibrada, interpolación continua sub-frame a 60fps
 * y auto-scroll estable sin vibraciones.
 */

(function () {
  'use strict';

  const container     = document.getElementById('carta-contenido');
  const audioElement  = document.getElementById('audio-carta');
  const playerBox     = document.getElementById('carta-player');
  const playPauseBtn  = document.getElementById('btn-play-pause');
  const playIcon      = document.getElementById('icon-play');
  const pauseIcon     = document.getElementById('icon-pause');
  const restartBtn    = document.getElementById('btn-restart');
  const progressBar   = document.getElementById('audio-progress-bar');
  const progressFill  = document.getElementById('audio-progress-fill');
  const progressThumb = document.getElementById('audio-progress-thumb');
  const timeCurrent   = document.getElementById('audio-time-current');
  const timeTotal     = document.getElementById('audio-time-total');
  const fallbackBtn   = document.getElementById('btn-fallback-audio');
  const seccionCarta  = document.getElementById('seccion-carta');

  let wordsFlat = [];
  let isUserInteractingWithScroll = false;
  let userScrollTimeout = null;
  let isScrubbing = false;
  let hasAutoPlayedOnce = false;
  let manuallyPaused = false;
  let syncAnimationId = null;
  let currentActiveIndex = -1;
  let currentSpokenUntil = -1;
  let lastScrollTargetY = 0;
  let scrollThrottleTimeout = null;
  let lastKnownAudioTime = 0;
  let lastKnownPerfTime = 0;
  let isAudioPlaying = false;

  // ---- Prediccion temporal sub-frame ultra-suave ----
  function getPredictedAudioTime() {
    if (!audioElement) return 0;
    const rawTime = audioElement.currentTime;
    if (!isAudioPlaying || audioElement.paused || audioElement.ended) {
      lastKnownAudioTime = rawTime;
      lastKnownPerfTime  = performance.now();
      return rawTime;
    }
    const now = performance.now();
    const rawDelta = rawTime - lastKnownAudioTime;

    // Si el usuario saltó en la barra de progreso (seek) o hubo retroceso:
    if (Math.abs(rawDelta) > 0.35 || rawDelta < -0.05) {
      lastKnownAudioTime = rawTime;
      lastKnownPerfTime  = now;
      return rawTime;
    }

    // Re-anclaje al actualizarse el reloj del navegador (~cada 250ms)
    if (rawDelta > 0.02) {
      lastKnownAudioTime = rawTime;
      lastKnownPerfTime  = now;
      return rawTime;
    }

    // Extrapolación de alta resolución entre eventos (~60-120fps fluidos)
    const elapsed      = (now - lastKnownPerfTime) / 1000;
    const playbackRate = audioElement.playbackRate || 1;
    const predicted    = lastKnownAudioTime + elapsed * playbackRate;

    // Evitar que la predicción se adelante indebidamente
    if (predicted - rawTime > 0.30) {
      return rawTime;
    }
    return Math.max(0, Math.min(predicted, audioElement.duration || Infinity));
  }

  function formatTime(s) {
    if (isNaN(s) || s < 0) return '00:00';
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  }

  // ---- Preparación y calibración de marcas de tiempo auténticas ----
  // Respeta la fonética real de la voz detectada en cada párrafo
  function prepareTimestamps(data) {
    if (!data || !data.parrafos) return data;
    let lastTime = 0;
    data.parrafos.forEach(p => {
      p.palabras.forEach(w => {
        const start = parseFloat(w.inicio);
        const end   = parseFloat(w.fin);
        w.inicio = !isNaN(start) ? start : lastTime;
        w.fin    = !isNaN(end) && end > w.inicio ? end : w.inicio + 0.25;
        lastTime = w.fin;
      });
    });
    return data;
  }

  // ---- Inicialización ----
  function initCarta() {
    const load = (data) => {
      window.CARTA_DATA = data;
      renderLetter(prepareTimestamps(data));
      if (audioElement && audioElement.duration && !isNaN(audioElement.duration)) {
        if (timeTotal) timeTotal.textContent = formatTime(audioElement.duration);
      } else if (data.duracion_total && timeTotal) {
        timeTotal.textContent = formatTime(data.duracion_total);
      }
    };

    if (window.CARTA_DATA && window.CARTA_DATA.parrafos) {
      load(JSON.parse(JSON.stringify(window.CARTA_DATA)));
    } else {
      fetch('data/carta.json')
        .then(r => r.json())
        .then(load)
        .catch(() => renderFallbackText());
    }
  }

  function renderLetter(data) {
    wordsFlat = [];
    data.parrafos.forEach((parrafo, pIdx) => {
      let pEl = document.getElementById(`parrafo-${pIdx + 1}`);
      if (!pEl) {
        if (!container) return;
        pEl = document.createElement('p');
        pEl.className = 'carta-parrafo';
        pEl.id = `parrafo-${pIdx + 1}`;
        container.appendChild(pEl);
      }
      pEl.innerHTML = '';
      parrafo.palabras.forEach(palabra => {
        const span = document.createElement('span');
        span.className   = 'carta-palabra palabra-futura';
        span.textContent = palabra.texto + ' ';
        span.dataset.start = palabra.inicio;
        span.dataset.end   = palabra.fin;
        span.addEventListener('click', e => {
          e.stopPropagation();
          const t = parseFloat(palabra.inicio);
          if (!isNaN(t) && audioElement) {
            audioElement.currentTime = Math.max(0, t);
            lastKnownAudioTime = audioElement.currentTime;
            lastKnownPerfTime  = performance.now();
            manuallyPaused = false;
            playAudio();
          }
        });
        pEl.appendChild(span);
        wordsFlat.push({ el: span, start: parseFloat(palabra.inicio), end: parseFloat(palabra.fin), pEl });
      });
    });
    if (data.duracion_total && timeTotal) timeTotal.textContent = formatTime(data.duracion_total);
  }

  function renderFallbackText() {
    if (!container) return;
    container.innerHTML = '<p class="carta-parrafo"><span class="carta-palabra palabra-dicha">Cargando carta...</span></p>';
  }

  // ---- Sincronización Fluida y Estable ----
  // Anticipación calibrada: 230ms de adelanto perceptivo para que el destello luminoso
  // coincida con el ataque fonético de la voz y el ritmo natural de lectura visual.
  const OFFSET = 0.23;

  function getSync(t) {
    const playhead = t + OFFSET;
    if (!wordsFlat.length) return { activeIndex: -1, spokenUntil: -1 };
    if (playhead < wordsFlat[0].start) return { activeIndex: -1, spokenUntil: -1 };
    const last = wordsFlat.length - 1;
    if (playhead >= wordsFlat[last].end) return { activeIndex: -1, spokenUntil: last };

    // Búsqueda binaria instantánea O(log N)
    let lo = 0, hi = last, activeIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const w   = wordsFlat[mid];
      if (playhead >= w.start && playhead < w.end) {
        activeIdx = mid;
        break;
      } else if (playhead < w.start) {
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    if (activeIdx !== -1) {
      return { activeIndex: activeIdx, spokenUntil: activeIdx - 1 };
    }

    // Suavizado anti-parpadeo en pausas cortas entre palabras consecutivas:
    // Mantiene la palabra previa encendida durante micro-silencios (< 0.40s)
    // para que la lectura fluya como un destello continuo y no como un estroboscopio.
    if (hi >= 0 && hi < last) {
      const prevWord = wordsFlat[hi];
      const nextWord = wordsFlat[hi + 1];
      const gap = nextWord.start - prevWord.end;
      const timeSincePrevEnd = playhead - prevWord.end;

      if (timeSincePrevEnd < 0.24 && gap < 0.42) {
        return { activeIndex: hi, spokenUntil: hi - 1 };
      }
    }

    return { activeIndex: -1, spokenUntil: hi >= 0 ? hi : -1 };
  }

  function updateDOM(activeIndex, spokenUntil) {
    if (!wordsFlat.length) return;
    if (activeIndex === currentActiveIndex && spokenUntil === currentSpokenUntil) return;

    const jump = Math.abs(spokenUntil - currentSpokenUntil) > 2 ||
                 (currentActiveIndex !== -1 && activeIndex !== -1 && Math.abs(activeIndex - currentActiveIndex) > 2);

    if (jump) {
      // Re-sincronización completa tras un seek o salto manual
      wordsFlat.forEach((item, i) => {
        item.el.className = i === activeIndex ? 'carta-palabra palabra-activa'
                          : i <= spokenUntil  ? 'carta-palabra palabra-dicha'
                          : 'carta-palabra palabra-futura';
      });
    } else {
      // Actualización diferencial ultra-rápida (0 reflows innecesarios)
      if (currentActiveIndex >= 0 && currentActiveIndex < wordsFlat.length && currentActiveIndex !== activeIndex) {
        wordsFlat[currentActiveIndex].el.className = currentActiveIndex <= spokenUntil
          ? 'carta-palabra palabra-dicha' : 'carta-palabra palabra-futura';
      }
      for (let i = Math.max(0, currentSpokenUntil + 1); i <= spokenUntil; i++) {
        if (i !== activeIndex && i < wordsFlat.length) {
          wordsFlat[i].el.className = 'carta-palabra palabra-dicha';
        }
      }
      if (activeIndex >= 0 && activeIndex < wordsFlat.length) {
        wordsFlat[activeIndex].el.className = 'carta-palabra palabra-activa';
      }
    }

    currentActiveIndex = activeIndex;
    currentSpokenUntil = spokenUntil;

    if (!isUserInteractingWithScroll) {
      const target = activeIndex >= 0 ? wordsFlat[activeIndex].el
                   : spokenUntil >= 0 ? wordsFlat[spokenUntil].el : null;
      if (target) scrollToWord(target);
    }
  }

  function syncLoop() {
    if (!audioElement) return;
    const predicted = getPredictedAudioTime();
    const raw = audioElement.currentTime;
    const dur = audioElement.duration || (window.CARTA_DATA ? window.CARTA_DATA.duracion_total : 0);

    if (!isScrubbing && dur > 0) {
      const pct = Math.min(100, (raw / dur) * 100);
      if (progressFill)  progressFill.style.width  = `${pct}%`;
      if (progressThumb) progressThumb.style.left  = `${pct}%`;
      if (timeCurrent)   timeCurrent.textContent    = formatTime(raw);
      if (timeTotal && !isNaN(audioElement.duration)) timeTotal.textContent = formatTime(audioElement.duration);
    }

    if (wordsFlat.length > 0) {
      const { activeIndex, spokenUntil } = getSync(predicted);
      updateDOM(activeIndex, spokenUntil);
    }

    if (!audioElement.paused && !audioElement.ended)
      syncAnimationId = requestAnimationFrame(syncLoop);
  }

  // Auto-scroll sosegado y estable: mantiene el foco de lectura sin vibraciones ni saltos bruscos
  function scrollToWord(el) {
    if (!el || isUserInteractingWithScroll) return;
    const rect   = el.getBoundingClientRect();
    const winH   = window.innerHeight;
    const relPos = rect.top / winH;

    // Solo interviene cuando la palabra se aleja del centro cómodo de lectura (28% a 58% de altura)
    if (relPos < 0.28 || relPos > 0.58) {
      const targetY = window.pageYOffset + rect.top - winH * 0.42;
      if (Math.abs(targetY - lastScrollTargetY) > 28) {
        lastScrollTargetY = targetY;
        if (!scrollThrottleTimeout) {
          scrollThrottleTimeout = setTimeout(() => {
            window.scrollTo({ top: targetY, behavior: 'smooth' });
            scrollThrottleTimeout = null;
          }, 320); // Throttle calmado de 320ms para permitir transiciones orgánicas
        }
      }
    }
  }

  // ---- Visibilidad del reproductor: aparece al bajar a la carta ----
  function updatePlayerVisibility() {
    if (!playerBox) return;
    const isPlaying = isAudioPlaying || (audioElement && !audioElement.paused);
    if (!seccionCarta) {
      if (isPlaying) playerBox.classList.add('player-visible');
      return;
    }
    const rect = seccionCarta.getBoundingClientRect();
    const winH = window.innerHeight;
    const isEnteringCarta = rect.top <= winH * 0.75;
    if (isEnteringCarta || isPlaying) {
      playerBox.classList.add('player-visible');
    } else {
      playerBox.classList.remove('player-visible');
    }
  }

  window.addEventListener('scroll', updatePlayerVisibility, { passive: true });
  window.addEventListener('resize', updatePlayerVisibility, { passive: true });

  function onUserScroll() {
    isUserInteractingWithScroll = true;
    if (userScrollTimeout) clearTimeout(userScrollTimeout);
    userScrollTimeout = setTimeout(() => { isUserInteractingWithScroll = false; }, 2800);
  }
  window.addEventListener('wheel',     onUserScroll, { passive: true });
  window.addEventListener('touchmove', onUserScroll, { passive: true });

  // ---- Control de Audio Robusto ----
  function playAudio() {
    if (!audioElement) {
      console.error('[Audio Carta] Elemento #audio-carta no encontrado.');
      return;
    }

    isUserInteractingWithScroll = false;

    // Asegurar ruta correcta
    if (!audioElement.src || audioElement.src === window.location.href) {
      audioElement.src = 'assets/audio/carta.mp3';
    }

    const promise = audioElement.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          isAudioPlaying = true;
          manuallyPaused = false;
          lastKnownAudioTime = audioElement.currentTime;
          lastKnownPerfTime  = performance.now();
          if (playIcon)    playIcon.style.display    = 'none';
          if (pauseIcon)   pauseIcon.style.display   = 'block';
          if (fallbackBtn) fallbackBtn.classList.add('audio-playing');
          cancelAnimationFrame(syncAnimationId);
          syncAnimationId = requestAnimationFrame(syncLoop);
          updatePlayerVisibility();
        })
        .catch(err => {
          console.warn('[Audio Carta] Error al reproducir (posible bloqueo de autoplay):', err);
          isAudioPlaying = false;
          if (playIcon)    playIcon.style.display    = 'block';
          if (pauseIcon)   pauseIcon.style.display   = 'none';
          if (fallbackBtn) fallbackBtn.style.display = 'inline-flex';
        });
    }
  }

  function pauseAudio() {
    if (!audioElement) return;
    audioElement.pause();
    isAudioPlaying = false;
    if (playIcon)    playIcon.style.display    = 'block';
    if (pauseIcon)   pauseIcon.style.display   = 'none';
    if (fallbackBtn) fallbackBtn.classList.remove('audio-playing');
    cancelAnimationFrame(syncAnimationId);
    updatePlayerVisibility();
  }

  function togglePlay(e) {
    if (e) e.preventDefault();
    if (!audioElement) return;
    if (audioElement.paused) {
      manuallyPaused = false;
      playAudio();
    } else {
      manuallyPaused = true;
      pauseAudio();
    }
  }

  function restartAudio(e) {
    if (e) e.preventDefault();
    if (!audioElement) return;
    audioElement.currentTime = 0;
    currentActiveIndex = currentSpokenUntil = -1;
    lastScrollTargetY = lastKnownAudioTime = 0;
    lastKnownPerfTime = performance.now();
    wordsFlat.forEach(w => { w.el.className = 'carta-palabra palabra-futura'; });
    manuallyPaused = false;
    playAudio();
  }

  // ---- Barra de Progreso ----
  function setupProgressBar() {
    if (!progressBar) return;
    function seek(e) {
      const rect    = progressBar.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const pos     = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const dur     = audioElement.duration || (window.CARTA_DATA ? window.CARTA_DATA.duracion_total : 0);
      if (dur > 0) {
        audioElement.currentTime = pos * dur;
        lastKnownAudioTime = audioElement.currentTime;
        lastKnownPerfTime  = performance.now();
        if (progressFill)  progressFill.style.width  = `${pos * 100}%`;
        if (progressThumb) progressThumb.style.left  = `${pos * 100}%`;
        if (timeCurrent)   timeCurrent.textContent    = formatTime(audioElement.currentTime);
        const { activeIndex, spokenUntil } = getSync(audioElement.currentTime);
        updateDOM(activeIndex, spokenUntil);
      }
    }
    progressBar.addEventListener('pointerdown', e => { isScrubbing = true; progressBar.setPointerCapture(e.pointerId); seek(e); });
    progressBar.addEventListener('pointermove', e => { if (isScrubbing) seek(e); });
    progressBar.addEventListener('pointerup',   e => {
      if (isScrubbing) { seek(e); isScrubbing = false; try { progressBar.releasePointerCapture(e.pointerId); } catch(_){} }
    });
  }

  // ---- Eventos de Audio ----
  if (audioElement) {
    audioElement.addEventListener('ended', () => {
      isAudioPlaying = false;
      if (playIcon)    playIcon.style.display  = 'block';
      if (pauseIcon)   pauseIcon.style.display = 'none';
      if (fallbackBtn) fallbackBtn.classList.remove('audio-playing');
      currentActiveIndex = -1;
      currentSpokenUntil = wordsFlat.length - 1;
      wordsFlat.forEach(w => { w.el.className = 'carta-palabra palabra-dicha'; });
      window.dispatchEvent(new CustomEvent('carta-finalizada'));
    });
    audioElement.addEventListener('loadedmetadata', () => {
      if (timeTotal && audioElement.duration && !isNaN(audioElement.duration)) {
        timeTotal.textContent = formatTime(audioElement.duration);
      }
    });
    audioElement.addEventListener('canplay', () => {
      if (timeTotal && audioElement.duration && !isNaN(audioElement.duration)) {
        timeTotal.textContent = formatTime(audioElement.duration);
      }
    });
    audioElement.addEventListener('play', () => {
      isAudioPlaying = true;
      if (playIcon)    playIcon.style.display  = 'none';
      if (pauseIcon)   pauseIcon.style.display = 'block';
      if (fallbackBtn) fallbackBtn.classList.add('audio-playing');
      updatePlayerVisibility();
    });
    audioElement.addEventListener('pause', () => {
      isAudioPlaying = false;
      if (playIcon)    playIcon.style.display  = 'block';
      if (pauseIcon)   pauseIcon.style.display = 'none';
      if (fallbackBtn) fallbackBtn.classList.remove('audio-playing');
      updatePlayerVisibility();
    });
    audioElement.addEventListener('seeked',  () => {
      lastKnownAudioTime = audioElement.currentTime;
      lastKnownPerfTime = performance.now();
    });
  }

  // ---- IntersectionObserver (Gestión de visibilidad de interfaz sin reproducción automática forzada) ----
  function setupIO() {
    if (!seccionCarta || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updatePlayerVisibility();
        }
      });
    }, { threshold: [0.08] }).observe(seccionCarta);
  }

  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
  if (restartBtn)   restartBtn.addEventListener('click', restartAudio);
  if (fallbackBtn)  fallbackBtn.addEventListener('click', () => {
    if (audioElement && !audioElement.paused) {
      pauseAudio();
    } else {
      manuallyPaused = false;
      playAudio();
    }
  });

  initCarta();
  setupProgressBar();
  setupIO();
  updatePlayerVisibility();

  // Función de desbloqueo sin reset agresivo
  window.desbloquearAudioCarta = function () {
    if (!audioElement) return;
    if (audioElement.readyState === 0) {
      audioElement.load();
    }
  };

  window.CartaPlayer = { play: playAudio, pause: pauseAudio, toggle: togglePlay, restart: restartAudio };
})();