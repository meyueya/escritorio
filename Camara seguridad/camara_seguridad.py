#!/usr/bin/env python3
# =============================================================================
#  SISTEMA DE CÁMARA DE SEGURIDAD PERSONAL — macOS
#  Versión: 3.0.0
#  Autor: Generado por Antigravity AI
#
#  DESCRIPCIÓN:
#    Graba video (cv2) y audio (sounddevice) de forma continua y silenciosa
#    en bloques de 30 minutos, organizados en subcarpetas por año/mes/día
#    dentro de ~/Camara seguridad.
#
#    Arquitectura:
#      • OpenCV (cv2) → captura frames de la cámara FaceTime
#      • sounddevice  → captura audio del micrófono
#      • FFmpeg       → muxea video+audio en un MP4 con H.264+AAC sincronizados
#
# =============================================================================
#
#  ──────────────────────────────────────────────────────────────────────────
#  PERMISOS REQUERIDOS EN macOS (leer ANTES de ejecutar)
#  ──────────────────────────────────────────────────────────────────────────
#
#  macOS controla el acceso a cámara, micrófono y disco mediante el sistema
#  TCC (Transparencia, Consentimiento y Control). Sigue TODOS estos pasos:
#
#  ── 1. CÁMARA ────────────────────────────────────────────────────────────
#     a) Abre "Configuración del Sistema" → "Privacidad y Seguridad"
#     b) Haz clic en "Cámara"
#     c) Activa el interruptor junto a "Terminal" (o iTerm2 si lo usas)
#     d) Si Terminal NO aparece en la lista:
#        - Ejecuta el script una vez → macOS mostrará un diálogo → "Permitir"
#     e) Si el diálogo NO aparece (permiso bloqueado anteriormente):
#        - Ejecuta en Terminal: tccutil reset Camera
#        - Vuelve a ejecutar el script
#
#  ── 2. MICRÓFONO ─────────────────────────────────────────────────────────
#     a) "Configuración del Sistema" → "Privacidad y Seguridad"
#     b) Haz clic en "Micrófono"
#     c) Activa el interruptor junto a "Terminal"
#     d) Si el diálogo NO aparece: tccutil reset Microphone
#
#  ── 3. ACCESO COMPLETO AL DISCO (recomendado) ───────────────────────────
#     a) "Configuración del Sistema" → "Privacidad y Seguridad"
#     b) Haz clic en "Acceso total al disco"
#     c) Activa el interruptor junto a "Terminal"
#     d) Cierra y vuelve a abrir Terminal para que el cambio surta efecto
#
#  ── 4. VERIFICACIÓN ──────────────────────────────────────────────────────
#     Ejecuta el script de diagnóstico para confirmar que todo funciona:
#         python3 diagnostico_dispositivos.py
#
#  ── 5. NOTA SOBRE OTROS TERMINALES ──────────────────────────────────────
#     Si usas iTerm2, VS Code, PyCharm u otro IDE, concede los permisos
#     a ESE terminal específico en lugar de Terminal.app.
#
# =============================================================================
#
#  INSTALACIÓN DE DEPENDENCIAS
#  ──────────────────────────────────────────────────────────────────────────
#     python3 instalar_dependencias.py
#
#  O manualmente:
#     brew install ffmpeg portaudio
#     pip3 install opencv-python-headless sounddevice numpy
#
#  USO
#  ──────────────────────────────────────────────────────────────────────────
#     python3 camara_seguridad.py
#
#  Para detener: presiona Ctrl+C — el segmento actual se cierra limpiamente.
#
# =============================================================================

import os
import sys
import signal
import subprocess
import threading
import time
import logging
import shutil
import queue
from datetime import datetime
from pathlib import Path

# cv2 se importa con verificación para dar un mensaje de error claro
try:
    import cv2
except ImportError:
    print("\n  ✗ OpenCV no está instalado.")
    print("    Ejecuta: python3 instalar_dependencias.py")
    sys.exit(1)

# sounddevice para captura de audio sincronizado con el micrófono
try:
    import sounddevice as sd
    import numpy as np
except ImportError:
    print("\n  ✗ sounddevice o numpy no están instalados.")
    print("    Ejecuta: python3 instalar_dependencias.py")
    sys.exit(1)


# =============================================================================
#  CONFIGURACIÓN GLOBAL — ajusta estos valores según tus preferencias
# =============================================================================

# Carpeta raíz donde se guardarán todas las grabaciones
CARPETA_RAIZ: Path = Path.home() / "Camara seguridad"

# Duración de cada segmento de video en segundos (30 minutos = 1800)
DURACION_SEGMENTO: int = 30 * 60  # 1800 segundos (30 minutos)

# Índice del dispositivo de video (0 = cámara integrada FaceTime)
# Usa diagnostico_dispositivos.py para encontrar el índice correcto
INDICE_CAMARA: int = 0

# Fotogramas por segundo del video de salida
FPS: int = 30

# Resolución de captura (ancho, alto). None = resolución nativa de la cámara
# Ejemplo para 720p: RESOLUCION = (1280, 720)
RESOLUCION: tuple | None = None

# Calidad del video H.264 (CRF: 0=máxima calidad/máximo tamaño,
# 51=mínima calidad/mínimo tamaño; 23 = buen balance calidad/tamaño)
CALIDAD_VIDEO_CRF: int = 23

# Configuración de audio
SAMPLE_RATE_AUDIO: int = 44100   # Hz (44.1 kHz = calidad CD)
CANALES_AUDIO: int = 1           # 1=Mono (micrófono integrado), 2=Estéreo
TASA_BITS_AUDIO: int = 128       # kb/s para codec AAC

# Tamaño del buffer de audio en fotogramas
BUFFER_AUDIO_FRAMES: int = 1024

# =============================================================================
#  FIN DE CONFIGURACIÓN
# =============================================================================


# ── Variables de control globales ──────────────────────────────────────────
_detener_evento = threading.Event()   # Señaliza parada a todos los hilos
_proceso_ffmpeg: subprocess.Popen | None = None  # Proceso FFmpeg activo


# =============================================================================
#  LOGGING
# =============================================================================

def configurar_logging(carpeta: Path) -> None:
    """
    Configura el sistema de logging para escribir simultáneamente en:
      - Un archivo de log permanente (~/ Camara seguridad/camara_seguridad.log)
      - La consola de la Terminal (para monitoreo en tiempo real)
    """
    carpeta.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.FileHandler(
                carpeta / "camara_seguridad.log",
                encoding="utf-8",
                mode="a",   # Append: no sobreescribe el historial anterior
            ),
            logging.StreamHandler(sys.stdout),
        ],
    )


# =============================================================================
#  VERIFICACIONES DE ENTORNO
# =============================================================================

def verificar_ffmpeg() -> str:
    """
    Verifica que FFmpeg esté instalado y devuelve su ruta.
    FFmpeg es esencial para muxear los streams de video y audio en MP4.
    """
    ruta = shutil.which("ffmpeg")
    if ruta is None:
        raise EnvironmentError(
            "\n  ✗ FFmpeg no está instalado o no está en el PATH.\n"
            "\n  Instálalo con:\n"
            "      brew install ffmpeg\n"
            "\n  Si no tienes Homebrew:\n"
            "      /bin/bash -c \"$(curl -fsSL "
            "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"\n"
        )
    version = subprocess.check_output(
        [ruta, "-version"], stderr=subprocess.STDOUT, text=True
    ).split("\n")[0]
    logging.info("FFmpeg: %s", version)
    return ruta


def verificar_camara(indice: int) -> tuple[int, int]:
    """
    Abre brevemente la cámara con cv2 para verificar que está disponible
    y obtener su resolución nativa. No muestra ninguna ventana.

    Retorna: (ancho, alto) — resolución real de la cámara.
    """
    cap = cv2.VideoCapture(indice)
    if not cap.isOpened():
        raise RuntimeError(
            f"\n  ✗ No se puede abrir la cámara con índice {indice}.\n"
            "\n  Posibles causas:\n"
            "    • Terminal no tiene permiso de 'Cámara' en Privacidad y Seguridad\n"
            "    • El índice de cámara es incorrecto (usa diagnostico_dispositivos.py)\n"
            "    • Otro programa está usando la cámara\n"
            "\n  Para resetear los permisos:\n"
            "      tccutil reset Camera\n"
        )

    # Leer resolución nativa
    ancho = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    alto = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    logging.info(
        "Cámara %d detectada correctamente. Resolución nativa: %dx%d",
        indice, ancho, alto,
    )
    return ancho, alto


def verificar_microfono() -> None:
    """
    Verifica que sounddevice pueda acceder al micrófono por defecto.
    No graba nada — solo comprueba que el dispositivo responde.
    """
    try:
        dispositivo = sd.query_devices(kind="input")
        logging.info(
            "Micrófono detectado: '%s' (%d ch, %d Hz)",
            dispositivo["name"],
            dispositivo["max_input_channels"],
            int(dispositivo["default_samplerate"]),
        )
    except Exception as exc:
        raise RuntimeError(
            f"\n  ✗ No se puede acceder al micrófono: {exc}\n"
            "\n  Posibles causas:\n"
            "    • Terminal no tiene permiso de 'Micrófono' en Privacidad y Seguridad\n"
            "    • No hay micrófono disponible\n"
            "\n  Para resetear los permisos:\n"
            "      tccutil reset Microphone\n"
        ) from exc


# =============================================================================
#  GESTIÓN DE RUTAS Y CARPETAS
# =============================================================================

def generar_ruta_segmento(carpeta_raiz: Path, numero: int) -> Path:
    """
    Genera la ruta completa del archivo MP4 para un segmento dado,
    creando automáticamente las subcarpetas año/mes/día.

    Ejemplo de ruta generada:
      ~/Camara seguridad/2025/06/04/grabacion_20250604_143000_0001.mp4
    """
    ahora = datetime.now()
    # Subcarpeta con estructura año/mes/día (con ceros a la izquierda)
    subcarpeta = (
        carpeta_raiz
        / ahora.strftime("%Y")   # 2025
        / ahora.strftime("%m")   # 06
        / ahora.strftime("%d")   # 04
    )
    subcarpeta.mkdir(parents=True, exist_ok=True)

    # Nombre: grabacion_AAAAMMDD_HHMMSS_NNNN.mp4
    nombre = f"grabacion_{ahora.strftime('%Y%m%d_%H%M%S')}_{numero:04d}.mp4"
    return subcarpeta / nombre


# =============================================================================
#  CAPTURA DE VIDEO CON cv2 → PIPE A FFMPEG
# =============================================================================

def hilo_captura_video(
    cap: cv2.VideoCapture,
    proceso_ffmpeg: subprocess.Popen,
    fps: int,
    resolucion: tuple | None,
    detener: threading.Event,
) -> None:
    """
    Hilo de captura de video: lee frames de cv2.VideoCapture y los escribe
    en el stdin de FFmpeg (pipe de video crudo en formato BGR24).

    Este hilo se ejecuta silenciosamente — sin cv2.imshow ni ninguna ventana.
    El control de FPS se hace con un temporizador para mantener la cadencia.
    """
    intervalo = 1.0 / fps          # Tiempo entre frames en segundos
    siguiente_captura = time.perf_counter()

    try:
        while not detener.is_set():
            ahora = time.perf_counter()
            if ahora < siguiente_captura:
                # Esperar el tiempo restante para mantener el FPS objetivo
                time.sleep(siguiente_captura - ahora)

            siguiente_captura += intervalo

            ret, frame = cap.read()
            if not ret:
                logging.warning("No se pudo leer frame de la cámara, reintentando...")
                time.sleep(0.05)
                continue

            # Redimensionar si se especificó una resolución de salida diferente
            if resolucion is not None:
                frame = cv2.resize(frame, resolucion, interpolation=cv2.INTER_LINEAR)

            # Escribir frame raw (BGR24) en el stdin de FFmpeg
            try:
                proceso_ffmpeg.stdin.write(frame.tobytes())
            except (BrokenPipeError, OSError):
                # FFmpeg cerró el pipe (fin de segmento o parada)
                break

    except Exception as exc:
        if not detener.is_set():
            logging.error("Error en hilo de video: %s", exc)
    finally:
        # Cerrar el stdin de FFmpeg para señalizar fin del stream de video
        try:
            proceso_ffmpeg.stdin.close()
        except Exception:
            pass


# =============================================================================
#  CAPTURA DE AUDIO CON sounddevice → PIPE A FFMPEG
# =============================================================================

def hilo_captura_audio(
    proceso_ffmpeg: subprocess.Popen,
    sample_rate: int,
    canales: int,
    detener: threading.Event,
) -> None:
    """
    Hilo de captura de audio: lee muestras del micrófono con sounddevice
    y las escribe en el stdin de FFmpeg (pipe de audio raw PCM s16le).

    sounddevice usa PortAudio internamente y tiene mejor compatibilidad
    con macOS moderno que pyaudio.
    """
    # Cola para pasar bloques de audio desde el callback al hilo principal
    cola_audio: queue.Queue = queue.Queue(maxsize=100)

    def callback_audio(indata, frames, time_info, status):
        """
        Callback de sounddevice: se llama en tiempo real con cada bloque de audio.
        Convertimos a int16 (PCM signed 16-bit little-endian) para FFmpeg.
        """
        if status:
            logging.debug("Estado audio: %s", status)
        # indata tiene dtype float32 por defecto; convertir a int16
        pcm = (indata * 32767).astype(np.int16)
        try:
            cola_audio.put_nowait(pcm.tobytes())
        except queue.Full:
            pass  # Descartar si la cola está llena (evita bloqueos)

    try:
        with sd.InputStream(
            samplerate=sample_rate,
            channels=canales,
            dtype="float32",
            blocksize=BUFFER_AUDIO_FRAMES,
            callback=callback_audio,
        ):
            while not detener.is_set():
                try:
                    bloque = cola_audio.get(timeout=0.5)
                    proceso_ffmpeg.stdin_audio.write(bloque)  # type: ignore[attr-defined]
                except queue.Empty:
                    continue
                except (BrokenPipeError, OSError):
                    break

    except Exception as exc:
        logging.error("Error en hilo de audio: %s", exc)


# =============================================================================
#  GRABACIÓN DE SEGMENTO (cv2 + sounddevice → FFmpeg → MP4)
# =============================================================================

def grabar_segmento(
    ffmpeg_bin: str,
    ruta_salida: Path,
    duracion: int,
    indice_camara: int,
    fps: int,
    resolucion_salida: tuple | None,
    resolucion_nativa: tuple,
    sample_rate: int,
    canales: int,
    crf: int,
    tasa_bits_audio: int,
    detener: threading.Event,
) -> bool:
    """
    Graba un segmento de video+audio de 'duracion' segundos.

    Flujo de datos:
      cv2.VideoCapture → frames BGR raw → stdin pipe de FFmpeg (video)
      sounddevice      → PCM s16le     → named pipe FIFO (audio)
      FFmpeg           → muxea ambos streams → archivo .mp4 H.264+AAC

    No abre ninguna ventana ni genera alertas visuales.
    Retorna True si el segmento se guardó correctamente.
    """
    global _proceso_ffmpeg

    # Dimensiones reales del video de salida
    ancho_sal = resolucion_salida[0] if resolucion_salida else resolucion_nativa[0]
    alto_sal = resolucion_salida[1] if resolucion_salida else resolucion_nativa[1]

    # ── Crear FIFO para el audio ────────────────────────────────────────────
    # Usamos un named pipe (FIFO) para pasar el audio crudo a FFmpeg,
    # mientras el video se pasa por el stdin estándar.
    ruta_fifo = ruta_salida.parent / f".audio_fifo_{ruta_salida.stem}"
    try:
        os.mkfifo(str(ruta_fifo))
    except OSError:
        # Si ya existe (raro), eliminarlo y recrearlo
        ruta_fifo.unlink(missing_ok=True)
        os.mkfifo(str(ruta_fifo))

    # ── Construir comando FFmpeg ────────────────────────────────────────────
    # Entrada 1: Video raw BGR24 desde stdin (pipe de cv2)
    # Entrada 2: Audio PCM s16le desde FIFO (pipe de sounddevice)
    cmd_ffmpeg = [
        ffmpeg_bin,
        "-loglevel", "error",      # Silenciar FFmpeg (solo mostrar errores)

        # ── Entrada de VIDEO (raw BGR desde cv2 vía stdin) ──────────────
        "-f", "rawvideo",
        "-pixel_format", "bgr24",  # Formato nativo de cv2
        "-video_size", f"{ancho_sal}x{alto_sal}",
        "-framerate", str(fps),
        "-i", "pipe:0",            # stdin = fd 0

        # ── Entrada de AUDIO (PCM s16le desde FIFO) ─────────────────────
        "-f", "s16le",             # Signed 16-bit little-endian PCM
        "-ar", str(sample_rate),
        "-ac", str(canales),
        "-i", str(ruta_fifo),      # FIFO de audio

        # ── Codec de VIDEO: H.264 ────────────────────────────────────────
        "-c:v", "libx264",
        "-preset", "ultrafast",    # Rápido, bajo uso de CPU
        "-crf", str(crf),          # Calidad constante (23 = buena)
        "-pix_fmt", "yuv420p",     # Compatible con todos los reproductores

        # ── Codec de AUDIO: AAC ──────────────────────────────────────────
        "-c:a", "aac",
        "-b:a", f"{tasa_bits_audio}k",

        # ── Opciones de contenedor ───────────────────────────────────────
        "-t", str(duracion),           # Duración del segmento
        "-movflags", "+faststart",     # MP4 optimizado para reproducción
        "-avoid_negative_ts", "make_zero",
        "-map", "0:v:0",               # Stream 0 → video
        "-map", "1:a:0",               # Stream 1 → audio

        # ── Salida ───────────────────────────────────────────────────────
        "-y", str(ruta_salida),
    ]

    logging.info("Iniciando segmento: %s", ruta_salida.name)

    # ── Abrir cámara con cv2 ───────────────────────────────────────────────
    cap = cv2.VideoCapture(indice_camara)
    if not cap.isOpened():
        logging.error("No se pudo abrir la cámara %d", indice_camara)
        ruta_fifo.unlink(missing_ok=True)
        return False

    # Configurar resolución de captura si se especificó
    if resolucion_salida:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, resolucion_salida[0])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resolucion_salida[1])

    cap.set(cv2.CAP_PROP_FPS, fps)

    # ── Lanzar FFmpeg ──────────────────────────────────────────────────────
    try:
        _proceso_ffmpeg = subprocess.Popen(
            cmd_ffmpeg,
            stdin=subprocess.PIPE,    # Recibirá video raw de cv2
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=False,               # Modo binario para datos raw
        )
    except Exception as exc:
        logging.error("No se pudo lanzar FFmpeg: %s", exc)
        cap.release()
        ruta_fifo.unlink(missing_ok=True)
        return False

    # ── Hilo de audio: sounddevice → FIFO ─────────────────────────────────
    detener_segmento = threading.Event()

    def hilo_audio_fifo():
        """
        Escribe audio PCM al FIFO de forma sincronizada con FFmpeg.
        sounddevice captura audio del micrófono en tiempo real.
        """
        try:
            with open(str(ruta_fifo), "wb") as fifo:
                with sd.InputStream(
                    samplerate=sample_rate,
                    channels=canales,
                    dtype="int16",         # PCM s16le directamente
                    blocksize=BUFFER_AUDIO_FRAMES,
                ) as stream:
                    while not detener_segmento.is_set() and not detener.is_set():
                        bloque, _ = stream.read(BUFFER_AUDIO_FRAMES)
                        try:
                            fifo.write(bloque.tobytes())
                        except (BrokenPipeError, OSError):
                            break
        except Exception as exc:
            if not detener_segmento.is_set():
                logging.error("Error en hilo de audio: %s", exc)

    thread_audio = threading.Thread(target=hilo_audio_fifo, daemon=True, name="AudioCapture")
    thread_audio.start()

    # ── Hilo de video: cv2 → stdin de FFmpeg ──────────────────────────────
    hilo_video = threading.Thread(
        target=hilo_captura_video,
        args=(_proceso_ffmpeg, fps, resolucion_salida, detener_segmento),
        daemon=True,
        name="VideoCapture",
    )

    # Pasar el objeto cap a la función del hilo a través de un closure
    def hilo_video_con_cap():
        hilo_captura_video(
            cap, _proceso_ffmpeg, fps, resolucion_salida, detener_segmento
        )

    hilo_video_wrapper = threading.Thread(
        target=hilo_video_con_cap,
        daemon=True,
        name="VideoCapture",
    )
    hilo_video_wrapper.start()

    # ── Esperar a que FFmpeg termine el segmento o se detenga ────────────────
    tiempo_fin = time.perf_counter() + duracion
    try:
        while time.perf_counter() < tiempo_fin and not detener.is_set():
            if _proceso_ffmpeg.poll() is not None:
                logging.warning("FFmpeg terminó inesperadamente antes de tiempo.")
                break
            time.sleep(0.5)
    finally:
        # Señalizar parada a los hilos de captura de este segmento
        detener_segmento.set()

    # Cerrar el stdin de FFmpeg para que finalice el procesamiento del archivo
    try:
        _proceso_ffmpeg.stdin.close()
    except Exception:
        pass

    # Esperar a que FFmpeg termine de empaquetar el MP4
    try:
        codigo_retorno = _proceso_ffmpeg.wait(timeout=15)
    except subprocess.TimeoutExpired:
        logging.warning("FFmpeg no terminó a tiempo, forzando cierre...")
        _proceso_ffmpeg.kill()
        codigo_retorno = _proceso_ffmpeg.wait()

    # Leer la salida de error (stderr) si quedó algo registrado
    stderr_output = b""
    try:
        stderr_output = _proceso_ffmpeg.stderr.read()
    except Exception:
        pass

    _proceso_ffmpeg = None

    # Registrar errores de FFmpeg si los hay
    if stderr_output:
        for linea in stderr_output.decode("utf-8", errors="replace").split("\n"):
            linea = linea.strip()
            if linea and any(
                kw in linea.lower()
                for kw in ("error", "denied", "permission", "not authorized", "invalid")
            ):
                logging.error("FFmpeg: %s", linea)

    # Liberar cámara
    cap.release()

    # Limpiar FIFO
    ruta_fifo.unlink(missing_ok=True)

    # Esperar a que el hilo de audio termine
    thread_audio.join(timeout=3.0)
    hilo_video_wrapper.join(timeout=3.0)

    # Verificar resultado
    exito = codigo_retorno in (0, -15, -2, 255)  # 0=OK, -15=SIGTERM, -2=SIGINT, 255=señal
    if exito and ruta_salida.exists():
        tamano_mb = ruta_salida.stat().st_size / (1024 * 1024)
        logging.info("Segmento guardado: %s (%.1f MB)", ruta_salida.name, tamano_mb)
    elif not ruta_salida.exists():
        logging.error("El archivo no fue creado: %s", ruta_salida.name)
        exito = False
    else:
        logging.error("FFmpeg terminó con código %d para %s", codigo_retorno, ruta_salida.name)
        exito = False

    return exito


# =============================================================================
#  MANEJADOR DE SEÑALES (CTRL+C)
# =============================================================================

def manejador_senal(signum, frame) -> None:
    """
    Manejador para SIGINT (Ctrl+C) y SIGTERM (kill).
    Señaliza al bucle principal que debe terminar limpiamente.
    El segmento actual se finaliza antes de salir — no se pierde la grabación.
    """
    logging.info("")
    logging.info("══════════════════════════════════════════")
    logging.info("Señal de parada recibida (Ctrl+C / SIGTERM)")
    logging.info("Finalizando el segmento actual... por favor espera.")
    logging.info("══════════════════════════════════════════")

    _detener_evento.set()


# =============================================================================
#  BUCLE PRINCIPAL
# =============================================================================

def loop_principal(
    ffmpeg_bin: str,
    resolucion_nativa: tuple,
) -> None:
    """
    Bucle de grabación continua. Graba segmentos de DURACION_SEGMENTO segundos
    indefinidamente hasta que se recibe Ctrl+C o SIGTERM.

    Si un segmento falla, espera 3 segundos y reintenta automáticamente.
    """
    segmentos_exitosos = 0
    segmentos_fallidos = 0
    numero_segmento = 0
    inicio_sesion = datetime.now()

    logging.info("Sesión iniciada: %s", inicio_sesion.strftime("%Y-%m-%d %H:%M:%S"))
    logging.info("Bloques de %d minutos → %s", DURACION_SEGMENTO // 60, CARPETA_RAIZ)

    while not _detener_evento.is_set():
        numero_segmento += 1
        ruta = generar_ruta_segmento(CARPETA_RAIZ, numero_segmento)

        exito = grabar_segmento(
            ffmpeg_bin=ffmpeg_bin,
            ruta_salida=ruta,
            duracion=DURACION_SEGMENTO,
            indice_camara=INDICE_CAMARA,
            fps=FPS,
            resolucion_salida=RESOLUCION,
            resolucion_nativa=resolucion_nativa,
            sample_rate=SAMPLE_RATE_AUDIO,
            canales=CANALES_AUDIO,
            crf=CALIDAD_VIDEO_CRF,
            tasa_bits_audio=TASA_BITS_AUDIO,
            detener=_detener_evento,
        )

        if exito:
            segmentos_exitosos += 1
        else:
            segmentos_fallidos += 1
            if not _detener_evento.is_set():
                logging.warning("Error en segmento. Reintentando en 3 segundos...")
                time.sleep(3)

    # ── Resumen de la sesión ────────────────────────────────────────────────
    duracion = datetime.now() - inicio_sesion
    horas = int(duracion.total_seconds() // 3600)
    minutos = int((duracion.total_seconds() % 3600) // 60)
    segundos = int(duracion.total_seconds() % 60)

    logging.info("")
    logging.info("══════════════════════════════════════════")
    logging.info("Sesión finalizada")
    logging.info("  Duración:           %dh %dm %ds", horas, minutos, segundos)
    logging.info("  Segmentos grabados: %d", segmentos_exitosos)
    logging.info("  Segmentos fallidos: %d", segmentos_fallidos)
    logging.info("  Archivos en:        %s", CARPETA_RAIZ)
    logging.info("══════════════════════════════════════════")


# =============================================================================
#  BANNER DE INICIO
# =============================================================================

def imprimir_banner() -> None:
    """Muestra la configuración activa al iniciar el sistema."""
    res = f"{RESOLUCION[0]}x{RESOLUCION[1]}" if RESOLUCION else "Nativa"
    print()
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║      SISTEMA DE CÁMARA DE SEGURIDAD PERSONAL         ║")
    print("  ║                  macOS — Modo Silencioso             ║")
    print("  ╠══════════════════════════════════════════════════════╣")
    print(f"  ║  Grabaciones:    {str(CARPETA_RAIZ):<36} ║")
    print(f"  ║  Segmentos:      {DURACION_SEGMENTO // 60} minutos{'':<43}║")
    print(f"  ║  Resolución:     {res:<36} ║")
    print(f"  ║  FPS:            {FPS:<36} ║")
    print(f"  ║  Calidad CRF:    {CALIDAD_VIDEO_CRF:<36} ║")
    print(f"  ║  Audio:          {SAMPLE_RATE_AUDIO} Hz — {CANALES_AUDIO}ch — {TASA_BITS_AUDIO} kb/s{'':<19} ║")
    print(f"  ║  cv2 versión:    {cv2.__version__:<36} ║")
    print("  ╠══════════════════════════════════════════════════════╣")
    print("  ║  Modo: SILENCIOSO (sin ventanas, sin alertas)        ║")
    print("  ║  Para detener: Ctrl+C                                ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()


# =============================================================================
#  PUNTO DE ENTRADA PRINCIPAL
# =============================================================================

def main() -> int:
    """
    Punto de entrada principal.
    Retorna 0 si todo fue correcto, 1 si hubo un error crítico.
    """
    # 1. Configurar logging
    configurar_logging(CARPETA_RAIZ)

    # 2. Mostrar banner
    imprimir_banner()

    # 3. Registrar manejadores de señales para parada limpia con Ctrl+C
    signal.signal(signal.SIGINT, manejador_senal)
    signal.signal(signal.SIGTERM, manejador_senal)

    # 4. Verificar dependencias
    try:
        ffmpeg_bin = verificar_ffmpeg()
    except EnvironmentError as err:
        logging.critical("%s", err)
        return 1

    # 5. Verificar acceso a disco
    try:
        CARPETA_RAIZ.mkdir(parents=True, exist_ok=True)
        archivo_prueba = CARPETA_RAIZ / ".test_escritura"
        archivo_prueba.touch()
        archivo_prueba.unlink()
        logging.info("Carpeta de grabaciones OK: %s", CARPETA_RAIZ)
    except PermissionError:
        logging.critical(
            "Sin permiso de escritura en %s\n"
            "Habilita 'Acceso total al disco' para Terminal:\n"
            "  Configuración del Sistema → Privacidad y Seguridad → Acceso total al disco",
            CARPETA_RAIZ,
        )
        return 1

    # 6. Verificar cámara con cv2
    try:
        logging.info("Verificando cámara con OpenCV (cv2)...")
        resolucion_nativa = verificar_camara(INDICE_CAMARA)
    except RuntimeError as err:
        logging.critical("%s", err)
        return 1

    # 7. Verificar micrófono con sounddevice
    try:
        logging.info("Verificando micrófono con sounddevice...")
        verificar_microfono()
    except RuntimeError as err:
        logging.critical("%s", err)
        return 1

    # 8. Iniciar grabación continua
    logging.info("Sistema listo. Iniciando grabación continua...")
    logging.info("Presiona Ctrl+C para detener.")

    loop_principal(ffmpeg_bin, resolucion_nativa)

    return 0


if __name__ == "__main__":
    sys.exit(main())
