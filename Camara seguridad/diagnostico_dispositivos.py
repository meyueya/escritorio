#!/usr/bin/env python3
# =============================================================================
#  DIAGNÓSTICO DE DISPOSITIVOS — Sistema de Cámara de Seguridad
#
#  Usa este script para descubrir los índices correctos de tu cámara
#  y micrófono antes de configurar camara_seguridad.py
#
#  Uso:
#      python3 diagnostico_dispositivos.py
# =============================================================================

import subprocess
import shutil
import sys
import re


def ffmpeg_disponible() -> str | None:
    """Retorna la ruta a ffmpeg o None si no está instalado."""
    return shutil.which("ffmpeg")


def listar_dispositivos_avfoundation(ffmpeg_bin: str) -> None:
    """
    Ejecuta ffmpeg con la opción -list_devices para mostrar todos los
    dispositivos de video y audio disponibles en macOS (AVFoundation).
    """
    cmd = [
        ffmpeg_bin,
        "-f", "avfoundation",
        "-list_devices", "true",
        "-i", "",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    # FFmpeg escribe la lista de dispositivos en stderr
    salida = result.stderr

    print()
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║      DISPOSITIVOS AVFOUNDATION DISPONIBLES            ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()

    seccion_video = False
    seccion_audio = False

    dispositivos_video = []
    dispositivos_audio = []

    for linea in salida.split("\n"):
        # Detectar secciones
        if "AVFoundation video devices" in linea:
            seccion_video = True
            seccion_audio = False
            print("  📹 DISPOSITIVOS DE VIDEO:")
            continue
        elif "AVFoundation audio devices" in linea:
            seccion_video = False
            seccion_audio = True
            print()
            print("  🎙  DISPOSITIVOS DE AUDIO:")
            continue

        # Extraer dispositivos
        match = re.search(r"\[(\d+)\]\s+(.+)", linea)
        if match:
            indice = match.group(1)
            nombre = match.group(2).strip()
            if seccion_video:
                dispositivos_video.append((indice, nombre))
                print(f"     [{indice}] {nombre}")
            elif seccion_audio:
                dispositivos_audio.append((indice, nombre))
                print(f"     [{indice}] {nombre}")

    print()
    print("  ─────────────────────────────────────────────────────")
    print()

    # Dar recomendación automática
    if dispositivos_video:
        print("  ✓ Para usar la cámara integrada ('FaceTime HD Camera'),")
        print("    busca el índice correspondiente arriba y configura:")
        print("    INDICE_CAMARA = <número>  en camara_seguridad.py")
    else:
        print("  ✗ No se detectaron dispositivos de video.")
        print("    Comprueba los permisos de cámara en:")
        print("    Configuración del Sistema → Privacidad y Seguridad → Cámara")

    print()

    if dispositivos_audio:
        print("  ✓ Para usar el micrófono integrado ('MacBook ... Microphone'),")
        print("    busca el índice correspondiente arriba y configura:")
        print('    INDICE_AUDIO = "<número>"  en camara_seguridad.py')
    else:
        print("  ✗ No se detectaron dispositivos de audio.")
        print("    Comprueba los permisos de micrófono en:")
        print("    Configuración del Sistema → Privacidad y Seguridad → Micrófono")

    print()
    print("  ─────────────────────────────────────────────────────")
    print("  EJEMPLO de configuración para MacBook típico:")
    print()
    print("    INDICE_CAMARA = 0   # FaceTime HD Camera")
    print('    INDICE_AUDIO  = "0" # MacBook Microphone')
    print()


def probar_captura_breve(ffmpeg_bin: str, indice_video: int = 0, indice_audio: str = "0") -> None:
    """
    Realiza una grabación de prueba de 5 segundos para verificar que
    la cámara y el micrófono funcionan correctamente.
    """
    import tempfile, os

    archivo_prueba = "/tmp/prueba_camara_seguridad.mp4"

    print(f"  Realizando prueba de 5 segundos con video:{indice_video} audio:{indice_audio}...")
    print(f"  Archivo temporal: {archivo_prueba}")
    print()

    cmd = [
        ffmpeg_bin,
        "-f", "avfoundation",
        "-framerate", "30",
        "-pixel_format", "uyvy422",
        "-i", f"{indice_video}:{indice_audio}",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-t", "5",
        "-y",
        archivo_prueba,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0 and os.path.exists(archivo_prueba):
        tamano = os.path.getsize(archivo_prueba)
        print(f"  ✓ Prueba exitosa. Archivo generado: {tamano/1024:.1f} KB")
        print(f"     Puedes reproducirlo con: open {archivo_prueba}")
    else:
        print("  ✗ La prueba falló. Verifica los permisos e índices de dispositivos.")
        # Mostrar errores relevantes de FFmpeg
        for linea in result.stderr.split("\n"):
            if any(k in linea.lower() for k in ("error", "denied", "permission", "not authorized")):
                print(f"     FFmpeg: {linea.strip()}")

    print()


def main():
    print()
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║      DIAGNÓSTICO — Sistema de Cámara de Seguridad    ║")
    print("  ╚══════════════════════════════════════════════════════╝")

    ffmpeg_bin = ffmpeg_disponible()
    if not ffmpeg_bin:
        print()
        print("  ✗ FFmpeg no está instalado.")
        print("    Ejecuta primero: python3 instalar_dependencias.py")
        sys.exit(1)

    print(f"\n  ✓ FFmpeg encontrado en: {ffmpeg_bin}")

    # Listar todos los dispositivos
    listar_dispositivos_avfoundation(ffmpeg_bin)

    # Preguntar si hacer prueba de captura
    resp = input("  ¿Deseas realizar una grabación de prueba de 5 segundos? (s/n): ").strip().lower()
    if resp == "s":
        vid = input("  Índice de video (Enter para usar 0): ").strip() or "0"
        aud = input("  Índice de audio (Enter para usar 0): ").strip() or "0"
        print()
        probar_captura_breve(ffmpeg_bin, int(vid), aud)


if __name__ == "__main__":
    main()
