import asyncio
import hashlib
import os
import re
import subprocess
import unicodedata
import uuid
import wave
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel, field_validator
from TTS.api import TTS

app = FastAPI()

CARPETA_MEMORIA = "memoria_de_frases"
os.makedirs(CARPETA_MEMORIA, exist_ok=True)

# ── Política de caché ─────────────────────────────────────────────────────────
CACHE_MAX_BYTES    = 500 * 1024 * 1024  # 500 MB: umbral que activa la limpieza
CACHE_TARGET_BYTES = 400 * 1024 * 1024  # 400 MB: objetivo tras la evicción

print("Cargando modelo XTTSv2...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
print("Modelo listo y en línea.")

# Compilado una sola vez al cargar el módulo, no en cada petición
_RE_TIENE_CONTENIDO = re.compile(r'\w', re.UNICODE)

class Payload(BaseModel):
    texto: str

    @field_validator('texto', mode='before')
    @classmethod
    def texto_debe_tener_contenido(cls, v: str) -> str:
        # Paso 1: eliminar espacios extremos
        v = v.strip()

        # Paso 2: rechazar cadenas vacías o solo espacios
        if not v:
            raise ValueError("El texto no puede estar vacío.")

        # Paso 3: rechazar payloads de solo puntuación/símbolos ('!!!', '---')
        # antes de que el Pop suene o XTTS sea invocado
        if not _RE_TIENE_CONTENIDO.search(v):
            raise ValueError(
                "El texto no contiene contenido legible (solo puntuación o símbolos)."
            )

        return v

# Abreviaciones comunes en español que terminan en punto pero NO cierran oración
_ABREVIACIONES = frozenset({
    'dr', 'dra', 'sr', 'sra', 'srta', 'prof', 'ing',
    'av', 'apdo', 'pág', 'vol', 'núm', 'art', 'fig',
})

# Separa en fin de oración real:
#   Caso A – punto precedido por LETRA (no dígito → no corta '3.14')
#             seguido de mayúscula o signo de apertura
#   Caso B – '!' o '?' siempre cierran oración
#   Caso C – uno o más saltos de línea
_RE_SEPARAR = re.compile(
    r'(?<=[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]\.)\ +(?=[A-ZÁÉÍÓÚÜÑ¿¡])'
    r'|(?<=[!?])\ +'
    r'|\n+',
    re.UNICODE
)

def dividir_en_oraciones(texto: str) -> list:
    """
    Divide el texto en oraciones con criterio lingüístico:
    - El punto en '3.14' NO corta (precedido por dígito).
    - El punto en 'precio. El' SÍ corta (precedido por letra, seguido de mayúscula).
    - Abreviaciones conocidas (Dr., Sr., etc.) se reagrupan con el fragmento siguiente.
    """
    candidatos = _RE_SEPARAR.split(texto)

    oraciones = []
    buffer = ""

    for fragmento in candidatos:
        fragmento = fragmento.strip()
        if not fragmento:
            continue

        if buffer:
            # Si el buffer termina en abreviación conocida, no es fin de oración
            ultima_palabra = buffer.rstrip('.').split()[-1].lower().rstrip('.')
            if ultima_palabra in _ABREVIACIONES:
                buffer = buffer + " " + fragmento
                continue

        if buffer:
            oraciones.append(buffer)
        buffer = fragmento

    if buffer:
        oraciones.append(buffer)

    return oraciones


def limpiar_texto(texto_bruto: str) -> str:
    """
    Prepara una oración individual para XTTS.
    Responsabilidad única: transformar puntuación residual en pausas naturales.
    Ya NO compite con dividir_en_oraciones: cada función tiene dominio exclusivo.
    """
    # 1. Normalización Unicode antes de cualquier regex
    texto = unicodedata.normalize('NFC', texto_bruto)

    # 2. Puntuación estructural → pausa (coma); el punto se incluye
    #    para manejar el residuo del último fragmento sin corte
    texto = re.sub(r'[.;:—\-–\(\)\[\]"\'«»]', ',', texto)

    # 3. Eliminar caracteres que XTTS no pronuncia correctamente
    texto = re.sub(r'[^\w\s,!?áéíóúÁÉÍÓÚñÑüÜ¿¡]', '', texto, flags=re.UNICODE)

    # 4. Colapsar repeticiones
    texto = re.sub(r',+', ',', texto)
    texto = re.sub(r'\s+', ' ', texto)

    # 5. Limpiar cola de puntuación sin sentido
    texto = re.sub(r'[,!?\s]+$', '', texto)

    return texto.strip()

_CHUNK_FRAMES = 8192  # ~64 KB por chunk a 22050 Hz / 16-bit

def unir_audios(archivos_entrada: list, archivo_salida_final: str) -> None:
    """
    Concatena WAVs en streaming: en RAM solo vive un chunk de ~64 KB
    en cualquier instante, independientemente del número de oraciones.
    Valida compatibilidad de parámetros para evitar audio corrupto silencioso.
    """
    if not archivos_entrada:
        return

    # Leer parámetros del primer archivo como referencia
    with wave.open(archivos_entrada[0], 'rb') as primer:
        params_ref = primer.getparams()

    with wave.open(archivo_salida_final, 'wb') as salida:
        salida.setparams(params_ref)

        for ruta in archivos_entrada:
            with wave.open(ruta, 'rb') as entrada:

                # Guardia: detectar WAV incompatible (caché corrupta o cambio de modelo)
                p = entrada.getparams()
                if (p.sampwidth != params_ref.sampwidth or
                        p.framerate != params_ref.framerate or
                        p.nchannels != params_ref.nchannels):
                    raise ValueError(
                        f"WAV incompatible '{ruta}': "
                        f"{p.framerate}Hz/{p.nchannels}ch vs "
                        f"referencia {params_ref.framerate}Hz/{params_ref.nchannels}ch"
                    )

                # Leer y escribir en chunks: nunca acumula todo en RAM
                while True:
                    chunk = entrada.readframes(_CHUNK_FRAMES)
                    if not chunk:
                        break
                    salida.writeframes(chunk)

def limpiar_cache_antigua() -> None:
    """
    Mantenimiento silencioso de la caché de frases sintetizadas.

    Política de dos umbrales:
      - CACHE_MAX_BYTES (500 MB): activa la limpieza solo si se supera este
        valor, evitando barrer el disco en cada petición.
      - CACHE_TARGET_BYTES (400 MB): objetivo de bajada, dejando 100 MB de
        margen para que peticiones inmediatamente posteriores no vuelvan a
        disparar la limpieza.

    Estrategia de evicción LRU (Least Recently Used):
      Se ordenan los archivos por fecha de último acceso (st_atime). Los
      que llevan más tiempo sin ser solicitados se eliminan primero,
      preservando automáticamente las frases de uso frecuente.
    """
    try:
        # Listar solo .wav de la carpeta de caché
        archivos = [
            os.path.join(CARPETA_MEMORIA, f)
            for f in os.listdir(CARPETA_MEMORIA)
            if f.endswith('.wav')
        ]

        if not archivos:
            return

        # Una sola pasada para obtener tamaño y metadatos de todos los archivos
        stats = {a: os.stat(a) for a in archivos}
        tamaño_total = sum(s.st_size for s in stats.values())

        if tamaño_total <= CACHE_MAX_BYTES:
            return  # Dentro del límite, nada que hacer

        print(
            f"[cache] Tamaño actual: {tamaño_total / 1024**2:.1f} MB "
            f"(límite: {CACHE_MAX_BYTES / 1024**2:.0f} MB) — iniciando evicción LRU..."
        )

        # Ordenar por último acceso: el más antiguo (st_atime menor) primero
        archivos.sort(key=lambda a: stats[a].st_atime)

        eliminados = 0
        for archivo in archivos:
            if tamaño_total <= CACHE_TARGET_BYTES:
                break
            tamaño_archivo = stats[archivo].st_size
            try:
                os.remove(archivo)
                tamaño_total -= tamaño_archivo
                eliminados += 1
            except FileNotFoundError:
                # Eliminado concurrentemente por otra operación; descontar igual
                tamaño_total -= tamaño_archivo

        print(
            f"[cache] Evicción completa: {eliminados} archivo(s) eliminado(s). "
            f"Tamaño estimado: {tamaño_total / 1024**2:.1f} MB"
        )

    except Exception as e:
        # Nunca propagar excepciones desde una BackgroundTask:
        # el error se registra pero no interrumpe al usuario
        print(f"[cache] Error inesperado durante la limpieza: {e}")


def reproducir_audio(ruta: str) -> None:
    """
    Reproduce el archivo temporal y lo elimina del disco al terminar.

    - subprocess.run con lista de args (sin shell=True): sin riesgo de
      inyección de comandos y maneja rutas con espacios correctamente.
    - El bloque finally garantiza que el temporal se borra SIEMPRE,
      incluso si afplay falla, evitando acumulación de archivos huérfanos.
    """
    try:
        subprocess.run(["afplay", ruta], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"[reproducir_audio] Error al reproducir '{ruta}': {e}")
    finally:
        try:
            os.remove(ruta)
        except FileNotFoundError:
            pass  # El archivo ya no existe; no es un error

@app.get("/")
def home() -> dict:
    return {"mensaje": "Servidor de Voz Local Online", "status_url": "/status"}

@app.get("/status")
def obtener_estado() -> dict:
    """
    Devuelve el estado del servidor y las métricas actuales de la caché.

    Diseño deliberadamente síncrono: os.listdir + os.path.getsize son
    llamadas al kernel de coste O(N) muy bajo (solo metadatos, sin leer
    contenido de audio), por lo que no justifican el overhead de to_thread.
    """
    try:
        archivos = [
            os.path.join(CARPETA_MEMORIA, f)
            for f in os.listdir(CARPETA_MEMORIA)
            if f.endswith('.wav')
        ]
        tamaño_bytes = sum(os.path.getsize(a) for a in archivos)
        return {
            "estado": "online",
            "cache_archivos": len(archivos),
            "cache_tamaño_mb": round(tamaño_bytes / 1024 ** 2, 2),
        }
    except Exception as e:
        # El servidor sigue online aunque la carpeta de caché tenga un problema
        return {
            "estado": "online",
            "cache_archivos": 0,
            "cache_tamaño_mb": 0.0,
            "advertencia": str(e),
        }


@app.post("/leer")
async def generar_y_reproducir(payload: Payload, tareas_fondo: BackgroundTasks):
    # 1. Separamos el texto en oraciones
    oraciones = dividir_en_oraciones(payload.texto)
    archivos_a_unir = []
    nueva_frase_generada = False  # bandera para disparar limpieza de caché

    # Pop de confirmación: Popen lanza el subproceso y retorna de inmediato
    # sin crear un shell intermedio ni bloquear el event loop de asyncio
    subprocess.Popen(["afplay", "/System/Library/Sounds/Pop.aiff"])

    # 2. Procesamos oración por oración
    for oracion in oraciones:
        texto_procesado = limpiar_texto(oracion)
        if not texto_procesado:
            continue

        codigo_frase = hashlib.md5(texto_procesado.lower().encode('utf-8')).hexdigest()
        ruta_archivo = os.path.join(CARPETA_MEMORIA, f"{codigo_frase}.wav")

        # Si la frase no está en caché, la fabricamos.
        # asyncio.to_thread() delega la llamada bloqueante de XTTS al
        # ThreadPoolExecutor interno de asyncio: el event loop queda libre
        # para aceptar y procesar otras peticiones mientras el modelo trabaja.
        if not os.path.exists(ruta_archivo):
            print(f"-> Fabricando nueva frase: {texto_procesado}")
            await asyncio.to_thread(
                tts.tts_to_file,
                text=texto_procesado,
                file_path=ruta_archivo,
                speaker_wav="mi_voz.wav",
                language="es"
            )
            nueva_frase_generada = True  # se escribió al menos un archivo nuevo
        else:
            print(f"-> Rescatando de memoria: {texto_procesado}")

        archivos_a_unir.append(ruta_archivo)

    if not archivos_a_unir:
        return {"status": "texto_vacio"}

    # 3. Nombre único por petición: elimina la condición de carrera sobre el
    # archivo compartido. Cada petición concurrente vive en su propio temporal;
    # es imposible que una petición sobreescriba el audio de otra.
    ruta_reproduccion = f"lectura_temporal_{uuid.uuid4().hex}.wav"
    unir_audios(archivos_a_unir, ruta_reproduccion)

    # reproducir_audio reproduce Y elimina el temporal en su bloque finally
    tareas_fondo.add_task(reproducir_audio, ruta_reproduccion)

    # Mantenimiento de caché: solo si se escribió al menos una frase nueva.
    # Si todo vino de caché el tamaño no cambió, no hay nada que revisar.
    if nueva_frase_generada:
        tareas_fondo.add_task(limpiar_cache_antigua)

    return {"status": "ejecutado"}
