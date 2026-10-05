PROMPT (copiar desde aquí)

Actúa como un desarrollador front-end senior y diseñador creativo con mucho gusto artístico. Quiero que construyas una web estática de altísima calidad visual y emocional, que se sienta hecha a mano, con muchísimo esfuerzo y cariño. Es una carta de disculpa y de amor para mi expareja. La emoción que debe transmitir, en este orden, es: arrepentimiento sincero, disculpa humilde y, sobre todo, amor. Nada de que parezca una plantilla genérica: cada detalle debe sentirse pensado.

IDEA GENERAL

La web es una sola página con scroll vertical que funciona como una carta. Tiene una pantalla de entrada, una portada con el título, una galería de recuerdos repartida a lo largo de la página, la sección de la carta (con una narración en audio y subtítulos que se iluminan palabra por palabra) y un cierre. Todo el fondo tiene corazones pequeños cayendo en cascada.

TÍTULO

El título principal debe hacer referencia a esta frase: "Espero que me perdones y me entiendas". Puedes darle un toque más poético, por ejemplo "Espero que me perdones… y que me entiendas", con la parte de "perdones" y "entiendas" resaltada con un brillo neón. Debe aparecer con una animación suave de escritura o de aparición letra por letra, y con un efecto de resplandor que respire lentamente.

PALETA Y ATMÓSFERA

El color dominante es un morado fosforescente, que parezca iluminarse solo. Úsalo con text-shadow, box-shadow y filter drop-shadow en capas para lograr un efecto neón suave, y con variaciones de intensidad (una animación lenta de pulso, como si respirara). Alrededor, usa rosas (rosa neón, rosa empolvado, rosa palo) y tonos que transmitan arrepentimiento y disculpa: azul noche profundo, índigo apagado, lavanda pálida, gris azulado melancólico, y un toque cálido dorado tenue como luz de vela para los momentos de esperanza. El fondo base es oscuro (un degradado de índigo casi negro a morado profundo) para que los neones brillen. Define todo con variables CSS en :root. Cuida el contraste para que el texto sea siempre legible.

TIPOGRAFÍA

Usa Google Fonts: una serif elegante y romántica para títulos (por ejemplo Cormorant Garamond o Playfair Display), una cursiva manuscrita para frases emotivas (por ejemplo Dancing Script, Caveat o Homemade Apple) y una sans muy legible para texto secundario (por ejemplo Quicksand o Nunito). El texto de la carta debe usar una fuente cómoda de leer en móvil, con buen tamaño y mucho interlineado. Usa tamaños fluidos con clamp().

FONDO DE CORAZONES CAYENDO

Implementa un sistema de partículas en un canvas fijo detrás del contenido (position fixed, pointer-events none), con requestAnimationFrame. Los corazones son pequeños, caen suavemente en cascada con un ligero vaivén horizontal (movimiento senoidal), rotación leve y variación de velocidad. Requisitos de variedad: ningún corazón debe ser idéntico a otro. Varía el tamaño (de muy pequeños a medianos), la forma (al menos 4 o 5 siluetas de corazón distintas: clásico, redondeado, alargado, ligeramente asimétrico, corazón de contorno sin relleno, corazón con pequeño brillo), el color (morado neón, violeta, rosa neón, rosa empolvado, lavanda, ocasionalmente un dorado tenue), la opacidad, la velocidad, el nivel de desenfoque (algunos nítidos y cercanos, otros más borrosos y lejanos para dar profundidad) y el brillo (glow). Dibuja las formas con Path2D a partir de paths SVG o curvas bezier, no con emojis. Optimiza el rendimiento: reduce la cantidad de partículas en móvil (por ejemplo 25 a 35 en móvil y 60 a 80 en escritorio), limita el devicePixelRatio, pausa la animación cuando la pestaña no está visible y respeta prefers-reduced-motion (en ese caso, muestra pocos corazones muy lentos o estáticos).

CORAZONES DECORATIVOS EN LA PÁGINA

Además del fondo, coloca corazones decorativos como elementos de diseño: separadores entre secciones (una línea con un corazón brillante en el centro), corazones grandes de contorno neón detrás de títulos, corazones que laten suavemente, un corazón hecho de líneas finas o dibujado con animación stroke-dashoffset, y marcos de fotos con pequeños corazones en las esquinas. Todos deben tener pequeñas variaciones entre sí (tamaño, inclinación, color, intensidad de brillo), nunca copias exactas. Crea un pequeño conjunto de SVG inline reutilizables para esto.

FOTOS

Debe haber entre 10 y 15 fotos nuestras (de mi expareja y mías juntos) repartidas por toda la página como decoración y como recordatorios de lo que vivimos. No las pongas todas en una galería cuadriculada aburrida. Distribúyelas a lo largo del scroll con estilos distintos: polaroids ligeramente inclinadas con un pie de foto manuscrito, fotos en marcos ovalados o con forma de corazón (con clip-path), fotos con borde de brillo neón, fotos pequeñas flotando a los lados del texto, una tira tipo cinta de fotos que se desliza, y una o dos fotos grandes a ancho completo con un velo morado suave. Cada una con un pie de foto corto y emotivo (yo te daré los textos; por ahora deja placeholders como "Aquel día en [lugar]"). Anímalas con aparición progresiva al hacer scroll (IntersectionObserver), un leve parallax muy sutil y un pequeño movimiento al tocar o pasar el cursor. Usa loading="lazy", decoding="async", atributos width y height para evitar saltos de diseño, alt descriptivos y rutas relativas en assets/img/foto-01.webp hasta foto-15.webp. Incluye en el código un array de datos (objeto JS) con la lista de fotos, su pie de foto y su estilo, para que sea fácil cambiarlas. Mientras no existan las imágenes reales, deben mostrarse placeholders elegantes (degradado morado con un corazón) para que el diseño se pueda revisar. Dime también la resolución y el peso recomendados para optimizarlas (por ejemplo WebP, ancho máximo 1200 px, menos de 200 KB cada una).

ESTRUCTURA DE LA PÁGINA (SECCIONES)

Pantalla de entrada: fondo oscuro con un corazón neón latiendo y un botón "Toca para abrir mi carta". Este toque es obligatorio porque desbloquea el audio en móviles. Al tocar, hay una transición cinematográfica suave hacia la portada.
Portada: el título principal, un subtítulo corto y manuscrito (placeholder), un indicador animado de "desliza hacia abajo" con forma de corazón o flecha.
Primer bloque de recuerdos: un texto breve y emotivo de introducción (placeholder) con 3 o 4 fotos en estilos distintos.
Segundo bloque: una frase grande de disculpa destacada, con foto(s) y un fondo con un ligero cambio de tono (más azulado y melancólico) para transmitir arrepentimiento.
Sección de la carta: el corazón del proyecto (se describe abajo).
Bloque final de esperanza y amor: el tono de color se calienta hacia rosa y dorado tenue, con las últimas fotos, una frase final y un corazón grande que late.
Cierre: una despedida breve y una firma manuscrita (placeholder "Tu [nombre]").

SECCIÓN DE LA CARTA CON AUDIO Y SUBTÍTULOS (FUNCIONALIDAD CLAVE)

Cuando el usuario llegue a la sección de la carta, debe empezar a reproducirse automáticamente un mp3 con mi voz narrando la carta (assets/audio/carta.mp3). Mientras suena, el texto de la carta se va iluminando palabra por palabra, sincronizado con lo que se pronuncia, como subtítulos de karaoke. Las palabras ya dichas quedan en un color luminoso, la palabra actual tiene un brillo neón más intenso con una pequeña animación, y las que faltan se ven tenues. El texto hace auto-scroll suave para mantener la palabra actual visible en el centro del contenedor, sin pelear con el scroll manual del usuario (si el usuario hace scroll a mano, pausa el auto-scroll unos segundos).

Comportamiento: usa IntersectionObserver para iniciar el audio cuando la sección de la carta ocupe la mayor parte de la pantalla, y para pausarlo si el usuario sale de la sección. Como el toque de la pantalla de entrada ya desbloqueó el audio, la reproducción automática funcionará en móvil y escritorio. Añade siempre un reproductor propio y discreto con diseño a juego: botón play/pausa, barra de progreso táctil que permita saltar a otro punto, tiempo transcurrido, y un botón para reiniciar. Si el navegador bloquea el audio por cualquier motivo, muestra un botón grande y bonito de "Escuchar mi carta". Al terminar el audio, deja el texto completo iluminado y haz una transición suave al bloque final.

La sincronización se hace con requestAnimationFrame leyendo audio.currentTime y comparándolo con los tiempos de cada palabra (usa búsqueda binaria o un índice incremental para que sea eficiente). Debe funcionar bien si el usuario salta en la barra de progreso. Respeta prefers-reduced-motion (reduce las animaciones, pero mantiene el resaltado).

SISTEMA EN DOS PARTES: HERRAMIENTA LOCAL Y WEB FINAL

Importante: la conversión de mp3 a texto solo se hace en mi computadora, una vez, y NO debe formar parte de la web publicada.

Parte A, herramienta local (carpeta tools/, que no se publica): un script en Python (tools/transcribir.py) que use faster-whisper (modelo configurable, por ejemplo "small" o "medium", idioma español) con word_timestamps=True. Toma como entrada el mp3 (assets/audio/carta.mp3) y genera data/carta.json con esta estructura: una lista de párrafos, y dentro de cada uno una lista de palabras con texto, inicio y fin en segundos. Incluye un requirements.txt, instrucciones claras de ejecución en Windows (instalar dependencias, comando exacto, uso opcional de GPU) y una forma de corregir errores de transcripción: que el script también genere un archivo de texto editable (data/carta.txt) y un segundo modo (por ejemplo, --texto-corregido) que alinee mi texto corregido con los tiempos originales para que no se pierda la sincronización si Whisper se equivoca en alguna palabra. Agrupa las palabras en párrafos usando las pausas largas del audio. Haz que el script muestre el progreso y avise de los errores con mensajes claros.

Parte B, web final: solo carga assets/audio/carta.mp3 y data/carta.json ya generado (o, si prefieres, que el JSON se incruste en js/carta-data.js para evitar problemas de fetch). No debe haber ninguna dependencia de Python, de Whisper ni de herramientas de transcripción en la versión publicada. Entrega un archivo de datos de ejemplo con unas pocas líneas de carta ficticia y tiempos inventados, para que yo pueda probar el diseño y la sincronización antes de generar el JSON real.

REQUISITOS PARA GITHUB PAGES

La web debe ser 100% estática (HTML, CSS y JavaScript puros, sin frameworks ni paso de build obligatorio) y funcionar al subirla a un repositorio de GitHub Pages, incluso en una subruta tipo usuario.github.io/nombre-repo/. Por tanto: usa SOLO rutas relativas (nunca empezar con "/"), cuida las mayúsculas y minúsculas en los nombres de archivo (GitHub Pages distingue), incluye un archivo .nojekyll vacío en la raíz, un 404.html con diseño coherente que redirija suavemente a inicio, un favicon con forma de corazón en SVG, las metaetiquetas necesarias (viewport, theme-color morado, description, Open Graph con título y descripción para que se vea bonito al compartir el enlace) y un README.md con los pasos para publicar (crear repo, subir archivos, activar Pages desde Settings, rama main, carpeta raíz). Si usas fetch para cargar el JSON, asegúrate de que funciona en Pages, y además da una alternativa para probar en local (un comando simple como python -m http.server, porque fetch no funciona con file://). Mantén el peso total razonable, ya que los mp3 y las imágenes son lo más pesado: recomiéndame bitrate para el mp3 (por ejemplo 96 a 128 kbps mono) y el formato de imágenes.

ENFOQUE 100% MÓVIL (MOBILE-FIRST)

Diseña primero para móvil (pantallas desde 320 px) y luego escala a tablet y escritorio. Usa unidades dvh/svh para que la barra del navegador móvil no rompa las secciones de pantalla completa, áreas táctiles de al menos 44 px, nada de hover como única forma de interacción, safe-area-inset para móviles con notch, textos legibles sin zoom, sin scroll horizontal accidental, reproductor cómodo para el pulgar y un rendimiento fluido (usa transform y opacity para animar, will-change con moderación). Prueba mentalmente en 360x640, 390x844 y 768x1024 y 1440x900, y asegúrate de que el diseño se vea espectacular en todas.

ANIMACIONES Y DETALLES DE LUJO

Incluye transiciones cuidadas y con sentido: aparición de textos con fade y ligero desplazamiento, un cursor o toque que deje una pequeña estela de chispas de corazón (en móvil, al tocar), una barra de progreso de lectura fina y brillante arriba, un cambio gradual de la atmósfera de color según avanza el scroll (de azul melancólico y arrepentido hacia rosa y dorado cálido y esperanzador), partículas brillantes tipo luciérnagas muy sutiles y un pequeño efecto de latido sincronizado en los corazones grandes. Que no se vea recargado: la elegancia está en el equilibrio, así que prioriza la legibilidad del texto sobre todo.

ACCESIBILIDAD Y CALIDAD DE CÓDIGO

Usa HTML semántico (header, main, section, figure, figcaption), aria-labels en los controles del reproductor, foco visible, texto alternativo en las imágenes y soporte de prefers-reduced-motion. Organiza el código en archivos separados y bien comentados en español: index.html, css/styles.css, js/main.js (scroll, reveal, ajuste de atmósfera), js/hearts.js (sistema de partículas), js/letter.js (audio y subtítulos), js/fotos-data.js (datos de fotos), y la carpeta tools/ con el script local. Sin dependencias externas salvo las fuentes de Google. Código limpio, sin errores en consola.

TEXTOS DE EJEMPLO (los reemplazaré yo)

Título: "Espero que me perdones… y que me entiendas".
Subtítulo: "[frase corta y sincera]".
Frase de disculpa destacada: "[frase de disculpa]".
Frase final: "[frase de amor y esperanza]".
Firma: "[mi nombre]".
Pies de foto: "[recuerdo 1]" ... "[recuerdo 15]".

ENTREGA

Dame todos los archivos completos y listos para copiar y pegar, uno por uno, con su ruta indicada, sin resumir ni dejar partes como "aquí va el resto". Incluye la estructura de carpetas final, las instrucciones paso a paso para: 1) generar el JSON desde mi mp3 en local, 2) probar la web en mi computadora, 3) publicar en GitHub Pages. No me hagas preguntas antes de empezar: si algo no está definido, toma la mejor decisión de diseño y dime brevemente cuál fue. El resultado debe sentirse como un trabajo artesanal, emotivo y premium, de esos que a quien lo recibe se le llenan los ojos de lágrimas.

(fin del prompt)
