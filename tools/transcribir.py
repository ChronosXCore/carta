#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de transcripción local y sincronización palabra por palabra para la carta.
Usa faster-whisper con marcas de tiempo precisas por palabra (word_timestamps=True).
Genera data/carta.json, data/carta.txt y actualiza js/carta-data.js.
"""

import os
import sys
import json
import argparse
import difflib
from pathlib import Path

def parse_args():
    parser = argparse.ArgumentParser(
        description="Transcribe el audio de la carta y genera JSON y JS con marcas de tiempo palabra por palabra."
    )
    parser.add_argument(
        "--audio",
        type=str,
        default="assets/audio/carta.mp3",
        help="Ruta al archivo de audio (por defecto: assets/audio/carta.mp3)"
    )
    parser.add_argument(
        "--modelo",
        type=str,
        default="small",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help="Modelo de faster-whisper a utilizar (por defecto: small)"
    )
    parser.add_argument(
        "--idioma",
        type=str,
        default="es",
        help="Código de idioma del audio (por defecto: es)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        choices=["auto", "cpu", "cuda"],
        help="Dispositivo de cómputo ('cpu', 'cuda' o 'auto')"
    )
    parser.add_argument(
        "--pausa-parrafo",
        type=float,
        default=0.8,
        help="Segundos de silencio entre palabras para dividir en un nuevo párrafo (por defecto: 0.8s)"
    )
    parser.add_argument(
        "--texto-corregido",
        type=str,
        default=None,
        help="Ruta a un archivo de texto con la transcripción corregida manualmente (ej. data/carta.txt)"
    )
    parser.add_argument(
        "--no-js",
        action="store_true",
        help="No actualizar automáticamente js/carta-data.js"
    )
    return parser.parse_args()


def detectar_device(device_arg):
    if device_arg != "auto":
        return device_arg, "float16" if device_arg == "cuda" else "int8"
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda", "float16"
    except Exception:
        pass
    return "cpu", "int8"


def alinear_palabras(palabras_whisper, texto_corregido):
    """
    Alinea las palabras del texto corregido por el usuario con las marcas
    de tiempo producidas por Whisper usando difflib.SequenceMatcher.
    """
    palabras_nuevas = [w.strip() for w in texto_corregido.split() if w.strip()]
    if not palabras_nuevas:
        return palabras_whisper

    textos_whisper = [w["texto"].strip().lower() for w in palabras_whisper]
    textos_nuevos = [w.strip().lower() for w in palabras_nuevas]

    matcher = difflib.SequenceMatcher(None, textos_whisper, textos_nuevos)
    matching_blocks = matcher.get_matching_blocks()

    resultado = []
    # Mapeo de índices
    # Para cada palabra nueva, intentamos asociar un tiempo de inicio y fin
    tiempo_anterior_fin = palabras_whisper[0]["inicio"] if palabras_whisper else 0.0
    duracion_total = palabras_whisper[-1]["fin"] if palabras_whisper else 10.0

    # Construir asignación base
    tiempos_asignados = [None] * len(palabras_nuevas)

    for block in matching_blocks:
        w_idx, n_idx, size = block.a, block.b, block.size
        for i in range(size):
            orig = palabras_whisper[w_idx + i]
            tiempos_asignados[n_idx + i] = (orig["inicio"], orig["fin"])

    # Interpolar palabras que no hayan tenido coincidencia exacta
    last_known_idx = -1
    for i in range(len(palabras_nuevas)):
        if tiempos_asignados[i] is not None:
            # Si hubo un hueco previo sin asignar, interpolar
            if last_known_idx < i - 1:
                t_start = tiempos_asignados[last_known_idx][1] if last_known_idx >= 0 else 0.0
                t_end = tiempos_asignados[i][0]
                n_gaps = i - 1 - last_known_idx
                step = (t_end - t_start) / (n_gaps + 1)
                for g in range(n_gaps):
                    idx_g = last_known_idx + 1 + g
                    g_start = round(t_start + g * step, 2)
                    g_end = round(t_start + (g + 1) * step, 2)
                    tiempos_asignados[idx_g] = (g_start, g_end)
            last_known_idx = i

    # Hueco al final si quedan palabras
    if last_known_idx < len(palabras_nuevas) - 1:
        t_start = tiempos_asignados[last_known_idx][1] if last_known_idx >= 0 else 0.0
        t_end = duracion_total
        n_gaps = len(palabras_nuevas) - 1 - last_known_idx
        step = max(0.2, (t_end - t_start) / (n_gaps + 1))
        for g in range(n_gaps):
            idx_g = last_known_idx + 1 + g
            g_start = round(t_start + g * step, 2)
            g_end = round(t_start + (g + 1) * step, 2)
            tiempos_asignados[idx_g] = (g_start, g_end)

    for i, palabra in enumerate(palabras_nuevas):
        t_ini, t_fin = tiempos_asignados[i] or (0.0, 0.5)
        resultado.append({
            "texto": palabra,
            "inicio": round(float(t_ini), 2),
            "fin": round(float(t_fin), 2)
        })

    return resultado


def agrupar_en_parrafos(palabras, pausa_minima=0.8):
    """
    Agrupa una lista de palabras con inicio y fin en párrafos
    detectando pausas superiores a pausa_minima segundos.
    """
    if not palabras:
        return []

    parrafos = []
    palabras_actuales = [palabras[0]]

    for i in range(1, len(palabras)):
        prev = palabras[i - 1]
        curr = palabras[i]
        silencio = curr["inicio"] - prev["fin"]

        if silencio >= pausa_minima:
            parrafos.append({
                "id": len(parrafos) + 1,
                "palabras": palabras_actuales
            })
            palabras_actuales = [curr]
        else:
            palabras_actuales.append(curr)

    if palabras_actuales:
        parrafos.append({
            "id": len(parrafos) + 1,
            "palabras": palabras_actuales
        })

    return parrafos


def main():
    args = parse_args()
    print("=" * 60)
    print(" 💌 Transcriptor y Sincronizador de la Carta")
    print("=" * 60)

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"❌ Error: El archivo de audio '{audio_path}' no existe.")
        print("   Por favor coloca tu archivo narrado en assets/audio/carta.mp3")
        sys.exit(1)

    device, compute_type = detectar_device(args.device)
    print(f"⚡ Dispositivo seleccionado: {device.upper()} (precisión: {compute_type})")
    print(f"🎧 Archivo de audio: {audio_path}")
    print(f"🤖 Modelo Whisper: {args.modelo} | Idioma: {args.idioma}")

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("\n❌ Error: La librería 'faster-whisper' no está instalada.")
        print("   Instálala ejecutando:")
        print("   pip install -r tools/requirements.txt")
        sys.exit(1)

    print("\n⏳ Cargando modelo... (esto puede tardar unos segundos en la primera ejecución)")
    model = WhisperModel(args.modelo, device=device, compute_type=compute_type)

    print("🎙️ Transcribiendo audio y extrayendo marcas de tiempo...")
    segments, info = model.transcribe(
        str(audio_path),
        language=args.idioma,
        word_timestamps=True,
        vad_filter=True
    )

    palabras_extraidas = []
    print(f"⏱️ Duración estimada del audio: {info.duration:.2f}s")

    for segment in segments:
        if segment.words:
            for w in segment.words:
                texto_limpio = w.word.strip()
                if texto_limpio:
                    palabras_extraidas.append({
                        "texto": texto_limpio,
                        "inicio": round(w.start, 2),
                        "fin": round(w.end, 2)
                    })

    if not palabras_extraidas:
        print("⚠️ No se detectaron palabras en el audio. Revisa que el volumen sea audible.")
        sys.exit(1)

    print(f"✅ Se reconocieron {len(palabras_extraidas)} palabras con marcas de tiempo.")

    # Si se especificó un archivo de texto corregido, alinear
    if args.texto_corregido:
        corregido_path = Path(args.texto_corregido)
        if corregido_path.exists():
            print(f"📝 Alineando con texto corregido desde: {corregido_path}")
            texto_manual = corregido_path.read_text(encoding="utf-8")
            palabras_extraidas = alinear_palabras(palabras_extraidas, texto_manual)
            print(f"✅ Texto corregido alineado con éxito ({len(palabras_extraidas)} palabras).")
        else:
            print(f"⚠️ Advertencia: No se encontró {corregido_path}. Usando transcripción automática.")

    # Agrupar en párrafos
    parrafos = agrupar_en_parrafos(palabras_extraidas, args.pausa_parrafo)
    duracion_total = palabras_extraidas[-1]["fin"] if palabras_extraidas else info.duration

    datos_finales = {
        "titulo": "Espero que me perdones… y que me entiendas",
        "duracion_total": round(duracion_total, 2),
        "parrafos": parrafos
    }

    # Guardar data/carta.json
    out_json = Path("data/carta.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(datos_finales, f, ensure_ascii=False, indent=2)
    print(f"💾 Guardado JSON en: {out_json}")

    # Guardar data/carta.txt para revisión editable
    out_txt = Path("data/carta.txt")
    lineas_txt = []
    for p in parrafos:
        lineas_txt.append(" ".join(w["texto"] for w in p["palabras"]))
    with open(out_txt, "w", encoding="utf-8") as f:
        f.write("\n\n".join(lineas_txt) + "\n")
    print(f"📄 Guardado texto editable en: {out_txt}")

    # Actualizar js/carta-data.js
    if not args.no_js:
        out_js = Path("js/carta-data.js")
        out_js.parent.mkdir(parents=True, exist_ok=True)
        js_content = (
            "/**\n"
            " * Datos generados automáticamente por tools/transcribir.py\n"
            " * Contiene las marcas de tiempo palabra por palabra para la sección de la carta.\n"
            " */\n"
            "window.CARTA_DATA = "
            + json.dumps(datos_finales, ensure_ascii=False, indent=2)
            + ";\n"
        )
        with open(out_js, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"🌐 Actualizado archivo JavaScript en: {out_js}")

    print("\n✨ ¡Proceso completado con éxito!")
    print("   Si necesitas corregir alguna palabra:")
    print("   1. Edita el archivo data/carta.txt con tus correcciones.")
    print("   2. Vuelve a ejecutar: python tools/transcribir.py --texto-corregido data/carta.txt")
    print("=" * 60)


if __name__ == "__main__":
    main()
