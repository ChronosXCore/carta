# 💌 Carta de Amor y Disculpa | Web Interactiva Emocional

Una experiencia web estática, íntima y artesanal diseñada con HTML5, CSS3 y JavaScript puro. Cuenta con un sistema de partículas de corazones procedimentales en Canvas, galerías asimétricas con diferentes estilos (polaroids inclinadas, marcos de neón, camafeos ovalados, cinta filmstrip táctil) y una **sección de carta narrada con sincronización palabra por palabra (efecto karaoke)** sincronizada con audio.

---

## 📂 Estructura del Proyecto

```text
Carta/
├── .nojekyll                 # Evita el procesamiento de Jekyll en GitHub Pages
├── 404.html                  # Página de error coherente con redirección automática
├── favicon.svg               # Favicon con silueta de corazón neón
├── index.html                # Página principal de la carta
├── README.md                 # Guía completa de uso y publicación
│
├── assets/
│   ├── audio/
│   │   └── carta.mp3         # Tu audio narrado real (02:03 min) sincronizado palabra por palabra
│   └── img/
│       ├── foto-01.jpg       # Fotos de tus recuerdos juntos (foto-01 a foto-17)
│       └── ...
│
├── css/
│   └── styles.css            # Sistema de diseño, paleta neón, tipografías y animaciones
│
├── data/
│   ├── carta.json            # Estructura JSON con marcas de tiempo por palabra
│   └── carta.txt             # Texto en texto plano para corrección manual
│
├── js/
│   ├── carta-data.js         # Datos de la carta listos para funcionar sin servidor
│   ├── fotos-data.js         # Lista de fotografías, estilos y pies de foto emotivos
│   ├── hearts.js             # Motor Canvas de lluvia de corazones y estela táctil
│   ├── letter.js             # Sincronización palabra por palabra y reproductor
│   └── main.js               # Control de scroll, transiciones lumínicas y revelado
│
└── tools/
    ├── requirements.txt      # Dependencias para transcripción local
    └── transcribir.py        # Script local con faster-whisper para generar los tiempos
```

---

## 🚀 1. Cómo Probar la Web en tu Computadora

### Opción A: Directo con doble clic (¡Sin instalar nada!)
Gracias a que los datos están precargados en `js/carta-data.js`, puedes hacer **doble clic en `index.html`** y se abrirá directamente en Google Chrome, Microsoft Edge, Safari o Firefox con todas las funciones activas.

### Opción B: Con un servidor local ligero
Si prefieres probar mediante HTTP:
```bash
# Con Python (si lo tienes instalado):
python -m http.server 8080

# Luego abre en tu navegador:
http://localhost:8080
```

---

## 🎙️ 2. Cómo Grabar y Sincronizar tu Propia Voz Narrada

El proyecto incluye una herramienta en Python (`tools/transcribir.py`) que escucha tu audio y detecta el segundo exacto en el que pronuncias cada palabra usando IA local (`faster-whisper`), **sin enviar tu voz a internet**.

### Paso 1: Coloca tu archivo de audio
Graba tu carta con el teléfono o micrófono y guarda el archivo en:
```text
assets/audio/carta.mp3
```

> **💡 Recomendación de audio:**
> - **Formato:** MP3 o AAC
> - **Canal:** Mono (suficiente para voz y reduce a la mitad el peso)
> - **Bitrate:** 96 kbps a 128 kbps (calidad cristalina y peso inferior a 3 MB)

### Paso 2: Instala las dependencias (solo la primera vez)
Abre la terminal en la carpeta del proyecto y ejecuta:
```bash
pip install -r tools/requirements.txt
```

### Paso 3: Ejecuta la transcripción automática
```bash
python tools/transcribir.py
```
*Si tienes tarjeta gráfica NVIDIA, puedes acelerar el proceso añadiendo `--device cuda`.*

Esto generará automáticamente:
1. `data/carta.json` con los tiempos precisos de cada palabra.
2. `data/carta.txt` con el texto transcrito.
3. `js/carta-data.js` actualizado para la web.

### Paso 4 (Opcional): Corregir palabras o puntuación
Si Whisper entendió mal alguna palabra o quieres ajustar un signo:
1. Abre `data/carta.txt` en el Bloc de Notas y corrige el texto con tus palabras exactas.
2. Vuelve a ejecutar alineando el texto corregido con los tiempos originales:
```bash
python tools/transcribir.py --texto-corregido data/carta.txt
```
¡Listo! La web quedará perfectamente sincronizada con tu voz y tus palabras exactas.

---

## 📸 3. Personalización de Fotos y Textos

- **Fotografías:** Las 17 fotos ya están en `assets/img/foto-01.jpg` a `foto-17.jpg`. Puedes cambiarlas o reemplazarlas cuando quieras manteniendo esos nombres, o editando `js/fotos-data.js`.
  - **Formato recomendado:** WebP o JPEG optimizado.
  - **Resolución sugerida:** Ancho máximo de 1000px a 1400px.
  - **Peso recomendado:** Menos de 200 KB por imagen para carga instantánea en teléfonos móviles con datos.
- **Pies de foto:** Abre `js/fotos-data.js` y personaliza los textos que aparecen debajo de cada imagen.
- **Títulos y dedicatorias:** Abre `index.html` para cambiar los nombres, la dedicatoria en la pantalla de bienvenida y la firma final al pie de la página.

---

## 🌐 4. Cómo Publicar en GitHub Pages (Gratis y Permanente)

Puedes publicar la web en internet para enviársela por enlace a tu expareja siguiendo estos pasos:

1. **Crea una cuenta o inicia sesión en [GitHub.com](https://github.com).**
2. **Crea un nuevo repositorio:**
   - Haz clic en el botón verde **"New"**.
   - Nombre del repositorio: por ejemplo `para-ti` o `carta`.
   - Selecciona **Public** (Público).
   - Deja las demás casillas desmarcadas y haz clic en **"Create repository"**.
3. **Sube los archivos del proyecto:**
   - En la pantalla de tu nuevo repositorio, haz clic en **"uploading an existing file"**.
   - Arrastra todos los archivos de esta carpeta:
     `index.html`, `404.html`, `.nojekyll`, `favicon.svg`, las carpetas `css`, `js`, `assets`, `data`. *(No es necesario subir la carpeta `tools`)*.
   - Haz clic abajo en el botón verde **"Commit changes"**.
4. **Activa GitHub Pages:**
   - Entra en la pestaña **Settings** (Configuración) en la parte superior de tu repositorio.
   - En el menú izquierdo, haz clic en **Pages**.
   - En **Build and deployment > Source**, asegúrate de que esté seleccionado **Deploy from a branch**.
   - En **Branch**, selecciona `main` (o `master`) y la carpeta `/(root)`.
   - Haz clic en **Save** (Guardar).
5. **¡Listo!** En unos 60 segundos, GitHub te proporcionará tu enlace en la parte superior:
   ```text
   https://tu-usuario.github.io/nombre-del-repo/
   ```
   Ese es el enlace que puedes enviarle por WhatsApp o mensaje.

---

## ✨ Detalles y Características Técnicas

- **Mobile First:** Diseñado y probado para teléfonos inteligentes (soporte de `dvh`, áreas táctiles ≥ 44px, safe area insets).
- **Desbloqueo de Audio:** La pantalla de entrada cuenta con el evento táctil que habilita el audio en navegadores estrictos de iOS (Safari) y Android (Chrome).
- **Auto-scroll inteligente:** Mantiene la palabra activa visible sin interrumpir si la persona desea desplazarse manualmente para mirar las fotos.
- **Rendimiento optimizado:** Pausa de bucles `requestAnimationFrame` cuando la pestaña se minimiza para no agotar la batería del móvil.
- **Accesibilidad:** Soporta `prefers-reduced-motion` reduciendo las animaciones para mayor comodidad visual.
