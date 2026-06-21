#!/usr/bin/env python3
# =============================================================================
#  INSTALADOR DE DEPENDENCIAS — Sistema de Cámara de Seguridad
#  Ejecuta este script UNA SOLA VEZ antes de usar camara_seguridad.py
#
#  Uso:
#      python3 instalar_dependencias.py
# =============================================================================

import subprocess
import sys
import shutil


VERDE = "\033[92m"
ROJO = "\033[91m"
AMARILLO = "\033[93m"
RESET = "\033[0m"

OK = f"{VERDE}✓{RESET}"
FAIL = f"{ROJO}✗{RESET}"
AVISO = f"{AMARILLO}⚠{RESET}"


def cmd(args: list, descripcion: str, check: bool = True) -> bool:
    """Ejecuta un comando y reporta el resultado."""
    print(f"\n  ➤ {descripcion}...")
    try:
        result = subprocess.run(args, check=check)
        if result.returncode == 0:
            print(f"  {OK} {descripcion} completado.")
            return True
        else:
            print(f"  {FAIL} {descripcion} falló (código {result.returncode}).")
            return False
    except FileNotFoundError as exc:
        print(f"  {FAIL} Comando no encontrado: {exc}")
        return False
    except subprocess.CalledProcessError as exc:
        print(f"  {FAIL} Error: {exc}")
        return False


def verificar_brew() -> bool:
    return shutil.which("brew") is not None


def instalar_homebrew() -> bool:
    print(f"\n  {AVISO} Instalando Homebrew (gestor de paquetes para macOS)...")
    print("     Esto puede tardar varios minutos. Sigue las instrucciones en pantalla.")
    install_cmd = (
        '/bin/bash -c "$(curl -fsSL '
        'https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    )
    result = subprocess.run(install_cmd, shell=True)
    return result.returncode == 0


def paquete_instalado(nombre: str) -> bool:
    """Verifica si un paquete pip está importable."""
    result = subprocess.run(
        [sys.executable, "-c", f"import {nombre}"],
        capture_output=True,
    )
    return result.returncode == 0


def main():
    print()
    print("  ╔══════════════════════════════════════════════════════╗")
    print("  ║    INSTALADOR — Sistema de Cámara de Seguridad       ║")
    print("  ╚══════════════════════════════════════════════════════╝")
    print()
    print("  Dependencias que se instalarán:")
    print("    • FFmpeg         — muxeado A/V (vía Homebrew)")
    print("    • PortAudio      — backend de audio (vía Homebrew)")
    print("    • opencv-python-headless — captura de video con cv2")
    print("    • sounddevice    — captura de audio del micrófono")
    print("    • numpy          — procesamiento de arrays de audio")
    print()

    errores = []

    # ── 1. Homebrew ────────────────────────────────────────────────────────
    if verificar_brew():
        print(f"  {OK} Homebrew ya está instalado.")
    else:
        resp = input("  Homebrew no encontrado. ¿Instalarlo ahora? (s/n): ").strip().lower()
        if resp == "s":
            if not instalar_homebrew():
                errores.append("Homebrew")
                print(f"  {FAIL} No se pudo instalar Homebrew.")
                print("     Instálalo manualmente: https://brew.sh")
        else:
            print(f"  {AVISO} Homebrew es necesario para FFmpeg y PortAudio.")
            errores.append("Homebrew (omitido por el usuario)")

    brew_ok = verificar_brew()

    # ── 2. FFmpeg (vía Homebrew) ───────────────────────────────────────────
    if brew_ok:
        if shutil.which("ffmpeg"):
            v = subprocess.run(
                ["ffmpeg", "-version"], capture_output=True, text=True
            )
            version = v.stdout.split("\n")[0] if v.stdout else "?"
            print(f"  {OK} FFmpeg ya está instalado. {version[:60]}")
        else:
            if not cmd(["brew", "install", "ffmpeg"], "Instalando FFmpeg"):
                errores.append("FFmpeg")
    else:
        print(f"  {AVISO} Omitiendo FFmpeg (Homebrew no disponible).")

    # ── 3. PortAudio (requerido por sounddevice) ───────────────────────────
    if brew_ok:
        # Verificar si portaudio está instalado
        check_pa = subprocess.run(
            ["brew", "list", "--formula", "portaudio"],
            capture_output=True
        )
        if check_pa.returncode == 0:
            print(f"  {OK} PortAudio ya está instalado.")
        else:
            if not cmd(["brew", "install", "portaudio"], "Instalando PortAudio"):
                errores.append("PortAudio")
    else:
        print(f"  {AVISO} Omitiendo PortAudio (Homebrew no disponible).")

    # ── 4. Actualizar pip ──────────────────────────────────────────────────
    cmd(
        [sys.executable, "-m", "pip", "install", "--upgrade", "pip"],
        "Actualizando pip",
        check=False,
    )

    # ── 5. opencv-python-headless ──────────────────────────────────────────
    # Usamos 'headless' porque no necesitamos la GUI de OpenCV (sin imshow)
    if paquete_instalado("cv2"):
        import importlib
        cv2 = importlib.import_module("cv2")
        print(f"  {OK} OpenCV ya está instalado (versión {cv2.__version__}).")
    else:
        if not cmd(
            [sys.executable, "-m", "pip", "install", "opencv-python-headless"],
            "Instalando opencv-python-headless",
            check=False,
        ):
            errores.append("opencv-python-headless")

    # ── 6. sounddevice ────────────────────────────────────────────────────
    if paquete_instalado("sounddevice"):
        print(f"  {OK} sounddevice ya está instalado.")
    else:
        if not cmd(
            [sys.executable, "-m", "pip", "install", "sounddevice"],
            "Instalando sounddevice",
            check=False,
        ):
            errores.append("sounddevice")

    # ── 7. numpy ──────────────────────────────────────────────────────────
    if paquete_instalado("numpy"):
        print(f"  {OK} numpy ya está instalado.")
    else:
        if not cmd(
            [sys.executable, "-m", "pip", "install", "numpy"],
            "Instalando numpy",
            check=False,
        ):
            errores.append("numpy")

    # ── Resumen ────────────────────────────────────────────────────────────
    print()
    print("  ─────────────────────────────────────────────────────────")

    if not errores:
        print(f"  {OK} Todas las dependencias instaladas correctamente.")
        print()
        print("  SIGUIENTE PASO — Concede permisos a Terminal.app:")
        print()
        print("    Configuración del Sistema → Privacidad y Seguridad:")
        print("      • Cámara       → activa 'Terminal' ✓")
        print("      • Micrófono    → activa 'Terminal' ✓")
        print("      • Acceso total al disco → activa 'Terminal' ✓ (recomendado)")
        print()
        print("    Luego ejecuta el diagnóstico:")
        print("      python3 diagnostico_dispositivos.py")
        print()
        print("    Y finalmente inicia la grabación:")
        print("      python3 camara_seguridad.py")
    else:
        print(f"  {FAIL} Componentes con errores: {', '.join(errores)}")
        print("     Revisa los mensajes anteriores e intenta instalar manualmente.")
        print()
        print("  Comandos manuales de instalación:")
        print("     brew install ffmpeg portaudio")
        print("     pip3 install opencv-python-headless sounddevice numpy")

    print()


if __name__ == "__main__":
    main()
