# 📹 Sistema de Cámara de Seguridad Personal — macOS

Sistema de grabación continua, silenciosa y segmentada para Mac. Captura video y audio sincronizados en bloques de 30 minutos, organizados por fecha, sin ninguna ventana de previsualización.

---

## Archivos del proyecto

| Archivo | Descripción |
|---|---|
| `camara_seguridad.py` | 🎬 **Script principal** — ejecuta esto para grabar |
| `instalar_dependencias.py` | 🔧 Instala FFmpeg y OpenCV automáticamente |
| `diagnostico_dispositivos.py` | 🔍 Descubre los índices de tu cámara y micrófono |
| `README.md` | 📖 Esta guía |

---

## Instalación rápida (3 pasos)

### Paso 1 — Instalar dependencias

```bash
cd ~/Desktop/Camara\ seguridad
python3 instalar_dependencias.py
```

### Paso 2 — Conceder permisos a Terminal.app

> ⚠️ **CRÍTICO**: macOS bloqueará el acceso a la cámara y micrófono hasta que lo permitas explícitamente.

1. Abre **Configuración del Sistema** → **Privacidad y Seguridad**
2. Haz clic en **Cámara** → activa el interruptor de **Terminal**
3. Haz clic en **Micrófono** → activa el interruptor de **Terminal**
4. *(Opcional)* Haz clic en **Acceso total al disco** → activa **Terminal**

Si Terminal no aparece en la lista, ejecuta el script una vez — macOS mostrará el diálogo de permiso automáticamente.

**Si el permiso fue denegado antes y el diálogo no aparece**, resetea los permisos:
```bash
tccutil reset Camera
tccutil reset Microphone
```

### Paso 3 — Verificar dispositivos (opcional pero recomendado)

```bash
python3 diagnostico_dispositivos.py
```

Este script lista todos los dispositivos de video y audio disponibles y permite hacer una grabación de prueba de 5 segundos.

---

## Uso

### Iniciar la grabación

```bash
python3 camara_seguridad.py
```

La grabación comienza inmediatamente en modo **100% silencioso** (sin ventanas, sin alertas). Los archivos se guardan en:

```
~/Camara seguridad/
└── 2025/
    └── 06/
        └── 04/
            ├── grabacion_20250604_140000_0001.mp4
            ├── grabacion_20250604_143000_0002.mp4
            └── ...
```

### Detener la grabación

Presiona **Ctrl+C** en la Terminal. El segmento actual se finaliza correctamente antes de salir.

---

## Configuración

Edita las variables al inicio de `camara_seguridad.py`:

```python
# Carpeta donde se guardan las grabaciones
CARPETA_RAIZ = Path.home() / "Camara seguridad"

# Duración de cada segmento en segundos (30 min = 1800)
DURACION_SEGMENTO = 30 * 60

# Resolución (None = nativa de la cámara, o ej: (1280, 720))
RESOLUCION = None

# Fotogramas por segundo
FPS = 30

# Índice de la cámara (0 = cámara integrada)
INDICE_CAMARA = 0

# Índice del micrófono ("0" = micrófono integrado)
INDICE_AUDIO = "0"

# Calidad de video CRF (0=máxima calidad, 51=mínima; recomendado: 23)
CALIDAD_VIDEO_CRF = 23

# Tasa de bits del audio en kb/s
TASA_BITS_AUDIO = 128
```

---

## Estructura técnica

```
┌─────────────────────────────────────────────┐
│          camara_seguridad.py                │
│                                             │
│  ┌──────────┐     ┌──────────────────────┐ │
│  │  OpenCV  │     │       FFmpeg         │ │
│  │  (check) │     │  AVFoundation input  │ │
│  └──────────┘     │  ├── Cámara FaceTime │ │
│                   │  └── Micrófono Mac   │ │
│                   │                      │ │
│                   │  H.264 + AAC → MP4   │ │
│                   └──────────────────────┘ │
│                            │               │
│                   ┌────────▼────────┐      │
│                   │  Segmento .mp4  │      │
│                   │  (30 minutos)   │      │
│                   └─────────────────┘      │
└─────────────────────────────────────────────┘
```

### ¿Por qué FFmpeg y no solo OpenCV?

OpenCV es una librería de **visión por computadora**, no un sistema multimedia. No puede capturar y mezclar audio y video de forma sincronizada de manera confiable. FFmpeg con AVFoundation es el estándar de la industria en macOS y garantiza:

- ✅ Sincronización perfecta audio/video
- ✅ Códec H.264 nativo del sistema
- ✅ Sin deriva temporal en grabaciones largas
- ✅ Bajo uso de CPU

---

## Log de eventos

Todos los eventos se registran en:
```
~/Camara seguridad/camara_seguridad.log
```

Para monitorearlo en tiempo real:
```bash
tail -f ~/Desktop/Camara\ seguridad/camara_seguridad.log
```

---

## Solución de problemas

### La cámara no se detecta
```bash
# Resetear permisos de cámara
tccutil reset Camera
# Volver a ejecutar el script (aceptar el diálogo de permiso)
python3 camara_seguridad.py
```

### El micrófono no graba audio
```bash
# Resetear permisos de micrófono
tccutil reset Microphone
# Verificar dispositivos disponibles
python3 diagnostico_dispositivos.py
```

### FFmpeg no encontrado
```bash
brew install ffmpeg
```

### Error "Not authorized" en el log
Sigue el **Paso 2** de la instalación para conceder permisos en Configuración del Sistema.

### Cambiar la cámara o micrófono usado
```bash
# Listar todos los dispositivos disponibles
python3 diagnostico_dispositivos.py
# Luego edita INDICE_CAMARA e INDICE_AUDIO en camara_seguridad.py
```

---

## Estimación de espacio en disco

| Resolución | FPS | Bitrate aprox. | Por hora |
|---|---|---|---|
| 720p | 30 | ~2 Mbps | ~900 MB |
| 1080p | 30 | ~4 Mbps | ~1.8 GB |
| Nativa (720p) | 30 | ~2 Mbps | ~900 MB |

Con CRF=23, los valores reales dependen del movimiento en escena. Escenas estáticas generan archivos mucho más pequeños.

---

*Generado por Antigravity AI*
