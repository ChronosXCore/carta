/**
 * Música de fondo — ZOE: Luna (Unplugged)
 *
 * Reglas de prioridad:
 *  1. La música empieza tras el primer clic del usuario ("Toca para abrir mi carta").
 *  2. Se pausa con fade cuando suena la narración o algún video.
 *  3. Reanuda automáticamente con fade en cuanto ningún otro audio/video esté activo.
 *  4. El botón flotante ♪ permite silenciar/reactivar manualmente.
 *
 * Estrategia de detección:
 *  - Escucha eventos (play/pause/ended) para reaccionar rápido.
 *  - Además hace polling cada 800ms como red de seguridad para cubrir
 *    casos donde los eventos no llegan (ej: lightbox que vacía el src del video).
 */

(function () {
  'use strict';

  const BG_SRC   = 'mp3/ZOE- Luna (Unplugged).mp3';
  const FADE_MS  = 400;
  const VOL_FULL = 0.32;
  const POLL_MS  = 800;

  /* ---- Crear <audio> de fondo ---- */
  const bg    = document.createElement('audio');
  bg.id       = 'bg-music';
  bg.src      = BG_SRC;
  bg.loop     = true;
  bg.volume   = 0;
  bg.preload  = 'auto';
  document.body.appendChild(bg);

  /* ---- Estado ---- */
  let bgUnlocked = false;
  let userMuted  = false;
  let fadeTimer  = null;
  let pollTimer  = null;

  /* ============================================================
     UTILIDADES
  ============================================================ */

  /** ¿Está sonando realmente la narración? */
  function isNarrationPlaying() {
    const el = document.getElementById('audio-carta');
    return el ? (!el.paused && !el.ended) : false;
  }

  /** ¿Está sonando algún <video> en el documento? */
  function isVideoPlaying() {
    const vids = document.querySelectorAll('video');
    for (const v of vids) {
      if (v.src && !v.paused && !v.ended && v.readyState > 1) return true;
    }
    return false;
  }

  /** ¿Debe sonar la música de fondo en este momento? */
  function shouldMusicPlay() {
    return bgUnlocked && !userMuted && !isNarrationPlaying() && !isVideoPlaying();
  }

  /* ============================================================
     FADE DE VOLUMEN
  ============================================================ */

  function fadeTo(targetVol, onDone) {
    if (fadeTimer) clearInterval(fadeTimer);
    const STEPS = 16;
    const delay = FADE_MS / STEPS;
    const start = bg.volume;
    const delta = (targetVol - start) / STEPS;
    let step    = 0;

    fadeTimer = setInterval(() => {
      step++;
      bg.volume = Math.min(1, Math.max(0, start + delta * step));
      if (step >= STEPS) {
        bg.volume = targetVol;
        clearInterval(fadeTimer);
        fadeTimer = null;
        if (onDone) onDone();
      }
    }, delay);
  }

  /* ============================================================
     LÓGICA CENTRAL
  ============================================================ */

  function evalMusic() {
    if (shouldMusicPlay()) {
      // Reanudar música
      if (bg.paused) {
        bg.play()
          .then(() => { fadeTo(VOL_FULL); updateBtnUI(true); })
          .catch(() => { /* bloqueado por navegador */ });
      } else if (bg.volume < VOL_FULL) {
        fadeTo(VOL_FULL);
        updateBtnUI(true);
      }
    } else {
      // Ceder o silenciar
      if (!bg.paused) {
        fadeTo(0, () => { bg.pause(); updateBtnUI(false); });
      }
    }
  }

  /* ============================================================
     POLLING — red de seguridad cada POLL_MS
  ============================================================ */

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(evalMusic, POLL_MS);
  }

  /* ============================================================
     HOOKS DE EVENTOS — reacción rápida
  ============================================================ */

  function hookNarration() {
    const narr = document.getElementById('audio-carta');
    if (!narr) return;
    narr.addEventListener('play',  evalMusic);
    narr.addEventListener('pause', () => setTimeout(evalMusic, 120));
    narr.addEventListener('ended', () => setTimeout(evalMusic, 120));
  }

  function hookVideos() {
    // Captura en fase de captura (true) para pillar eventos en shadow/iframes
    document.addEventListener('play', e => {
      if (e.target && e.target.tagName === 'VIDEO') evalMusic();
    }, true);

    document.addEventListener('pause', e => {
      if (e.target && e.target.tagName === 'VIDEO') {
        // Delay: el lightbox puede estar limpiando el src en este instante
        setTimeout(evalMusic, 250);
      }
    }, true);

    document.addEventListener('ended', e => {
      if (e.target && e.target.tagName === 'VIDEO') {
        setTimeout(evalMusic, 250);
      }
    }, true);
  }

  /* ============================================================
     BOTÓN FLOTANTE ♪
  ============================================================ */

  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id    = 'btn-bg-music';
    btn.type  = 'button';
    btn.title = 'Música de fondo';
    btn.setAttribute('aria-label', 'Activar o silenciar música de fondo');
    btn.innerHTML = `
      <svg id="bg-icon-on"  viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
      <svg id="bg-icon-off" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display:none;">
        <path d="M4.27 3L3 4.27l6.01 6.01C9 10.43 9 10.71 9 11v5.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-4.73l4.02 4.02c-.68.49-1.35.97-2.02 1.44V22l5.38-5.38L19.73 21 21 19.73 4.27 3zM21 3l-6 4v.55L21 13.7V3z"/>
      </svg>`;

    btn.addEventListener('click', () => {
      userMuted = !userMuted;
      if (userMuted) {
        fadeTo(0, () => { if (!bg.paused) bg.pause(); });
        updateBtnUI(false);
      } else {
        evalMusic();
      }
    });

    document.body.appendChild(btn);
  }

  function updateBtnUI(playing) {
    const on  = document.getElementById('bg-icon-on');
    const off = document.getElementById('bg-icon-off');
    if (!on || !off) return;
    const show = playing && !userMuted;
    on.style.display  = show ? 'block' : 'none';
    off.style.display = show ? 'none'  : 'block';
  }

  /* ============================================================
     DESBLOQUEO — primer gesto del usuario
  ============================================================ */

  function unlockAndStart() {
    if (bgUnlocked) return;
    bgUnlocked = true;

    bg.play()
      .then(() => { fadeTo(VOL_FULL); updateBtnUI(true); })
      .catch(() => { /* bloqueado; el polling lo reintentará */ });

    startPolling();
  }

  /* ============================================================
     ARRANQUE
  ============================================================ */

  document.addEventListener('DOMContentLoaded', () => {
    createToggleButton();
    hookNarration();
    hookVideos();

    const btnAbrir = document.getElementById('btn-abrir-carta');
    if (btnAbrir) {
      btnAbrir.addEventListener('click', unlockAndStart, { once: true });
    }
  });

})();
