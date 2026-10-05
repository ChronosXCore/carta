/**
 * Música de fondo — ZOE: Luna (Unplugged)
 *
 * Reglas de prioridad:
 *  1. La música comienza cuando el usuario hace clic en "Toca para abrir mi carta"
 *     (primer gesto de usuario = desbloqueo de autoplay en todos los navegadores).
 *  2. Se pausa automáticamente cuando:
 *     - La narración de la carta (#audio-carta) empieza a reproducirse.
 *     - Cualquier <video> de la galería empieza a reproducirse.
 *  3. Se reanuda automáticamente cuando:
 *     - La narración se pausa o termina Y ningún video está reproduciéndose.
 *     - El video se pausa o termina Y la narración no está reproduciéndose.
 *  4. El usuario puede silenciar/activar con el botón flotante #btn-bg-music.
 *  5. El volumen sube y baja con fade (300 ms) para que no se sienta abrupto.
 */

(function () {
  'use strict';

  const BG_SRC   = 'mp3/ZOE- Luna (Unplugged).mp3';
  const FADE_MS  = 300;
  const VOL_FULL = 0.35; // Volumen de fondo (no debe pisar la narración)

  /* ---- Crear elemento <audio> de fondo ---- */
  const bg = document.createElement('audio');
  bg.id    = 'bg-music';
  bg.src   = BG_SRC;
  bg.loop  = true;
  bg.volume = 0;
  bg.preload = 'auto';
  document.body.appendChild(bg);

  /* ---- Estado ---- */
  let bgUnlocked    = false; // El usuario ya hizo el primer gesto
  let userMuted     = false; // El usuario decidió silenciar manualmente
  let narrationPlaying = false;
  let videoPlaying     = false;
  let fadeTimer        = null;

  /* ---- Fade de volumen ---- */
  function fadeTo(targetVol, onDone) {
    if (fadeTimer) clearInterval(fadeTimer);
    const steps   = 15;
    const delay   = FADE_MS / steps;
    const start   = bg.volume;
    const delta   = (targetVol - start) / steps;
    let step      = 0;

    fadeTimer = setInterval(() => {
      step++;
      bg.volume = Math.min(1, Math.max(0, start + delta * step));
      if (step >= steps) {
        bg.volume = targetVol;
        clearInterval(fadeTimer);
        fadeTimer = null;
        if (onDone) onDone();
      }
    }, delay);
  }

  /* ---- Lógica central: ¿debe sonar la música ahora? ---- */
  function evalMusic() {
    if (!bgUnlocked || userMuted) return;

    const shouldPlay = !narrationPlaying && !videoPlaying;

    if (shouldPlay) {
      if (bg.paused) {
        bg.play().then(() => {
          fadeTo(VOL_FULL);
          updateBtnUI(true);
        }).catch(() => {/* bloqueado por el navegador — normal en iOS hasta gesto */});
      } else {
        fadeTo(VOL_FULL);
        updateBtnUI(true);
      }
    } else {
      // Ceder ante narración o video
      fadeTo(0, () => {
        if (!bg.paused) bg.pause();
        updateBtnUI(false);
      });
    }
  }

  /* ---- Escuchar la narración ---- */
  function hookNarration() {
    const narr = document.getElementById('audio-carta');
    if (!narr) return;

    narr.addEventListener('play', () => {
      narrationPlaying = true;
      evalMusic();
    });
    narr.addEventListener('pause', () => {
      narrationPlaying = false;
      evalMusic();
    });
    narr.addEventListener('ended', () => {
      narrationPlaying = false;
      evalMusic();
    });
  }

  /* ---- Escuchar TODOS los videos (actuales y futuros) ---- */
  function hookVideos() {
    // Delegar: capturar "play"/"pause"/"ended" en burbujeo desde document
    document.addEventListener('play', e => {
      if (e.target && e.target.tagName === 'VIDEO') {
        videoPlaying = true;
        evalMusic();
      }
    }, true);

    document.addEventListener('pause', e => {
      if (e.target && e.target.tagName === 'VIDEO') {
        // Pequeño delay: el lightbox puede vaciar el src antes de que suene
        setTimeout(() => {
          videoPlaying = isAnyVideoPlaying();
          evalMusic();
        }, 80);
      }
    }, true);

    document.addEventListener('ended', e => {
      if (e.target && e.target.tagName === 'VIDEO') {
        videoPlaying = isAnyVideoPlaying();
        evalMusic();
      }
    }, true);
  }

  function isAnyVideoPlaying() {
    const vids = document.querySelectorAll('video');
    for (const v of vids) {
      if (!v.paused && !v.ended) return true;
    }
    return false;
  }

  /* ---- Botón flotante de control de música de fondo ---- */
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id          = 'btn-bg-music';
    btn.type        = 'button';
    btn.title       = 'Música de fondo';
    btn.setAttribute('aria-label', 'Activar o silenciar música de fondo');
    btn.innerHTML   = `
      <svg id="bg-icon-on" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
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
    return btn;
  }

  function updateBtnUI(isPlaying) {
    const on  = document.getElementById('bg-icon-on');
    const off = document.getElementById('bg-icon-off');
    if (!on || !off) return;
    if (isPlaying && !userMuted) {
      on.style.display  = 'block';
      off.style.display = 'none';
    } else {
      on.style.display  = 'none';
      off.style.display = 'block';
    }
  }

  /* ---- Desbloqueo en el primer gesto del usuario ---- */
  function unlockAndStart() {
    if (bgUnlocked) return;
    bgUnlocked = true;

    bg.play().then(() => {
      fadeTo(VOL_FULL);
      updateBtnUI(true);
    }).catch(() => {
      // El navegador bloqueó incluso después del gesto (raro).
      // Dejar silenciado; el botón flotante sirve como alternativa.
    });
  }

  /* ---- Arranque ---- */
  document.addEventListener('DOMContentLoaded', () => {
    createToggleButton();
    hookNarration();
    hookVideos();

    // El botón "Toca para abrir mi carta" es el primer gesto confiable
    const btnAbrir = document.getElementById('btn-abrir-carta');
    if (btnAbrir) {
      btnAbrir.addEventListener('click', unlockAndStart, { once: true });
    }
  });

})();
