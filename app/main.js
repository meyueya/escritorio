// ====== NEBULA BACKGROUND WITH THREE.JS ======
function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function safeMultiline(value) {
    return escapeHtml(value).replace(/\n/g, '<br>');
}

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05051a, 0.0008);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
camera.position.z = 1200;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05051a, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimización
container.appendChild(renderer.domElement);

// Particles for Nebula
const geometry = new THREE.BufferGeometry();
const particlesCount = 2500;
const posArray = new Float32Array(particlesCount * 3);
const colorsArray = new Float32Array(particlesCount * 3);
const scalesArray = new Float32Array(particlesCount); // Variedad de tamaños

// Colors: Indigo, Turquoise
const colorBase = [55 / 255, 19 / 255, 236 / 255]; // Indigo Deep
const colorAcc1 = [17 / 255, 180 / 255, 212 / 255]; // Light Turquoise
const colorAcc2 = [224 / 255, 224 / 255, 224 / 255]; // Silver

for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3;
    // Distribución esférica difusa
    posArray[i3] = (Math.random() - 0.5) * 4000; // x
    posArray[i3 + 1] = (Math.random() - 0.5) * 4000; // y
    posArray[i3 + 2] = (Math.random() - 0.5) * 3000; // z

    // Mix colors de forma elegante
    const randomColor = Math.random();
    let r, g, b;

    if (randomColor < 0.6) {
        // Mayormente Indigo a Turquesa oscuro
        r = colorBase[0] * Math.random() + 0.1;
        g = colorBase[1] * Math.random() + 0.2;
        b = colorBase[2] * Math.random() + 0.3;
    } else if (randomColor < 0.9) {
        // Acentos Turquesa brillante
        r = colorAcc1[0];
        g = colorAcc1[1];
        b = colorAcc1[2];
    } else {
        // Pequeñas chispas plateadas
        r = colorAcc2[0];
        g = colorAcc2[1];
        b = colorAcc2[2];
    }

    colorsArray[i3] = r;
    colorsArray[i3 + 1] = g;
    colorsArray[i3 + 2] = b;

    scalesArray[i] = Math.random() * 2;
}

geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(scalesArray, 1));

// Custom Shader Material for glowing dots with dynamic sizing
const material = new THREE.PointsMaterial({
    size: 5,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true
});

const particlesMesh = new THREE.Points(geometry, material);
scene.add(particlesMesh);

// Ambient Light to glow things up subtly
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Animation Loop
let mouseX = 0;
let mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    // Rotación más sutil y suave basada en el ratón
    mouseX = (event.clientX - windowHalfX) * 1.5;
    mouseY = (event.clientY - windowHalfY) * 1.5;
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Rotación lenta natural de la nebulosa
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.z = Math.sin(elapsedTime * 0.05) * 0.1;

    // Fluididad del ratón (Easing smoothing)
    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Respiración del material
    material.opacity = 0.6 + Math.sin(elapsedTime * 0.5) * 0.2;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ====== UI INTERACTION LOGIC & AUTHENTICATION ======
const assistant = document.getElementById('ai-assistant');
const uiLayer = document.getElementById('ui-layer');
const statusText = document.getElementById('status-text');
const inputContainer = document.getElementById('input-container');
const ideaInput = document.getElementById('idea-input');

// ====== DIRECTIVA 2: AUTONOMÍA DE VUELO (Vuelo Errante Orgánico) ======
const ButterflyFlight = (() => {
    let time = 0;
    let baseX = window.innerWidth * 0.75;
    let baseY = window.innerHeight * 0.5;
    let animId = null;
    let paused = false;
    let evadeTimer = null;
    let lastEvadeAt = 0;

    // Parámetros de movimiento errante (multi-seno simulando Perlin)
    const params = {
        ampX1: 0.30, ampX2: 0.12, ampX3: 0.06,
        freqX1: 0.15, freqX2: 0.37, freqX3: 0.73,
        ampY1: 0.25, ampY2: 0.10, ampY3: 0.05,
        freqY1: 0.19, freqY2: 0.43, freqY3: 0.67,
        speed: 0.012
    };

    function wander(_timestamp) {
        if (paused || !assistant) { animId = requestAnimationFrame(wander); return; }
        time += params.speed;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 120;

        // Multi-seno para movimiento no-lineal orgánico
        const noiseX = Math.sin(time * params.freqX1) * params.ampX1
            + Math.sin(time * params.freqX2 + 1.7) * params.ampX2
            + Math.sin(time * params.freqX3 + 3.1) * params.ampX3;
        const noiseY = Math.sin(time * params.freqY1 + 0.5) * params.ampY1
            + Math.sin(time * params.freqY2 + 2.3) * params.ampY2
            + Math.cos(time * params.freqY3 + 4.7) * params.ampY3;

        // Convertir noise [-0.5..0.5 aprox] a coordenadas de pantalla
        const targetX = (vw * 0.5) + noiseX * (vw - margin * 2);
        const targetY = (vh * 0.5) + noiseY * (vh - margin * 2);

        // Suavizado (lerp) para movimiento fluido
        baseX += (targetX - baseX) * 0.02;
        baseY += (targetY - baseY) * 0.02;

        // Aplicar posición — restamos la mitad del tamaño de la mariposa para centrar
        assistant.style.left = Math.max(10, Math.min(vw - 230, baseX - 110)) + 'px';
        assistant.style.top = Math.max(10, Math.min(vh - 230, baseY - 110)) + 'px';

        // Rotación sutil basada en dirección horizontal
        const tilt = Math.sin(time * 0.31) * 8;
        assistant.style.transform = `rotate(${tilt}deg)`;

        animId = requestAnimationFrame(wander);
    }

    return {
        start() { if (!animId) { animId = requestAnimationFrame(wander); } },
        pause() { paused = true; },
        resume() { paused = false; },
        evadeFrom(nodeRect) {
            if (!assistant || assistant.classList.contains('listening') || Date.now() - lastEvadeAt < 900) return;
            const butterflyRect = assistant.getBoundingClientRect();
            const padding = 18;
            const overlaps = !(butterflyRect.right < nodeRect.left - padding ||
                butterflyRect.left > nodeRect.right + padding ||
                butterflyRect.bottom < nodeRect.top - padding ||
                butterflyRect.top > nodeRect.bottom + padding);
            if (!overlaps) return;

            lastEvadeAt = Date.now();
            paused = true;
            clearTimeout(evadeTimer);
            const nodeCenterX = nodeRect.left + nodeRect.width / 2;
            const targetLeft = nodeCenterX < window.innerWidth / 2
                ? Math.min(window.innerWidth - 230, nodeRect.right + 38)
                : Math.max(10, nodeRect.left - 258);
            const targetTop = Math.max(10, Math.min(window.innerHeight - 230, nodeRect.top - 70));
            baseX = targetLeft + 110;
            baseY = targetTop + 110;
            assistant.classList.add('butterfly-yielding');
            assistant.style.transition = 'left .42s cubic-bezier(.22,1,.36,1), top .42s cubic-bezier(.22,1,.36,1), opacity .2s ease';
            assistant.style.left = `${targetLeft}px`;
            assistant.style.top = `${targetTop}px`;
            evadeTimer = setTimeout(() => {
                assistant.classList.remove('butterfly-yielding');
                assistant.style.transition = '';
                paused = false;
            }, 650);
        },
        stop() { if (animId) { cancelAnimationFrame(animId); animId = null; } }
    };
})();

// Iniciar vuelo autónomo cuando la app sea visible
const startFlightObserver = new MutationObserver(() => {
    const appView = document.getElementById('app-view');
    if (appView && !appView.classList.contains('hidden')) {
        ButterflyFlight.start();
    }
});
startFlightObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
// Iniciar inmediatamente si ya está visible
if (document.getElementById('app-view') && !document.getElementById('app-view').classList.contains('hidden')) {
    ButterflyFlight.start();
}

// ====== MOTOR DE VOZ INMERSIVO (macOS System Voice / ElevenLabs + Spatial Audio + Light Pulsation) ======
const LuminaVoice = (() => {
    let speechBubble = null;
    let bubbleTimeout = null;
    let currentAudioSource = null;
    let audioContext = null;
    let analyserNode = null;
    let pannerNode = null;
    let gainNode = null;
    let pulsationRAF = null;
    let isSpeakingState = false;
    const audioCache = new Map();
    const CACHE_MAX = 30;
    const DEBOUNCE_MS = 2500;
    let lastSpokenHash = '';
    let lastSpokenTime = 0;

    function cleanTextForSpeech(text) {
        if (!text) return '';
        return text
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_~#>]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function hashText(text) {
        const key = text.substring(0, 100).trim().toLowerCase();
        let h = 0;
        for (let i = 0; i < key.length; i++) { h = ((h << 5) - h) + key.charCodeAt(i); h |= 0; }
        return h.toString(36);
    }

    function getAudioContext() {
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
        return audioContext;
    }

    // Desbloqueo proactivo del AudioContext en el primer toque/click del usuario
    const unlockAudioContext = () => {
        getAudioContext();
        window.removeEventListener('click', unlockAudioContext);
        window.removeEventListener('keydown', unlockAudioContext);
        window.removeEventListener('touchstart', unlockAudioContext);
    };
    window.addEventListener('click', unlockAudioContext, { once: true });
    window.addEventListener('keydown', unlockAudioContext, { once: true });
    window.addEventListener('touchstart', unlockAudioContext, { once: true });

    // === Spatial Audio Setup ===
    function setupSpatialChain(ctx) {
        // Analyser → Panner → Gain → Destination
        analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        pannerNode = ctx.createPanner();
        pannerNode.panningModel = 'HRTF';
        pannerNode.distanceModel = 'inverse';
        pannerNode.refDistance = 1;
        pannerNode.maxDistance = 100;
        pannerNode.rolloffFactor = 1;
        pannerNode.coneInnerAngle = 360;
        pannerNode.coneOuterAngle = 0;
        pannerNode.coneOuterGain = 0;
        // Listener at center
        if (ctx.listener.positionX) {
            ctx.listener.positionX.value = 0;
            ctx.listener.positionY.value = 0;
            ctx.listener.positionZ.value = 0;
        }

        gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;

        analyserNode.connect(pannerNode);
        pannerNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        return analyserNode; // connect source to this
    }

    // === Map butterfly CSS position → 3D audio coordinates ===
    function updatePannerPosition() {
        if (!pannerNode || !assistant) return;
        const rect = assistant.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // Map screen position to audio space (-5 to +5)
        const x = ((rect.left + rect.width / 2) / vw - 0.5) * 10;
        const y = -((rect.top + rect.height / 2) / vh - 0.5) * 10;
        const z = -2; // slightly in front

        if (pannerNode.positionX) {
            pannerNode.positionX.value = x;
            pannerNode.positionY.value = y;
            pannerNode.positionZ.value = z;
        } else {
            pannerNode.setPosition(x, y, z);
        }
    }

    // === Volume-Driven Light Pulsation ===
    function startPulsation() {
        if (!analyserNode || !assistant) return;
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

        function pulse() {
            if (!analyserNode || !currentAudioSource) {
                resetPulsation();
                return;
            }
            analyserNode.getByteFrequencyData(dataArray);

            // Calculate RMS energy (0.0 → 1.0)
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
            const rms = Math.sqrt(sum / dataArray.length) / 255;
            const energy = Math.min(1, rms * 2.5); // amplify

            // Map energy to visual properties
            const scale = 1.0 + energy * 0.2;        // 1.0 → 1.2
            const glowSpread = 10 + energy * 40;      // 10px → 50px
            const glowOpacity = 0.3 + energy * 0.7;   // 0.3 → 1.0
            const hue = 45 + energy * 10;              // Golden shift

            assistant.style.transform = `scale(${scale})`;
            assistant.style.filter = `drop-shadow(0 0 ${glowSpread}px hsla(${hue}, 100%, 65%, ${glowOpacity}))`;

            // Update panner position while speaking
            updatePannerPosition();

            pulsationRAF = requestAnimationFrame(pulse);
        }
        pulse();
    }

    function resetPulsation() {
        if (pulsationRAF) { cancelAnimationFrame(pulsationRAF); pulsationRAF = null; }
        if (assistant) {
            assistant.style.transform = '';
            assistant.style.filter = '';
        }
    }

    // === Speech Bubble ===
    function showBubble(text) {
        removeBubble();
        speechBubble = document.createElement('div');
        speechBubble.className = 'butterfly-speech';
        speechBubble.textContent = text.length > 180 ? text.substring(0, 177) + '...' : text;
        document.body.appendChild(speechBubble);
        updateBubblePosition();
    }

    function updateBubblePosition() {
        if (!speechBubble || !assistant) return;
        const rect = assistant.getBoundingClientRect();
        speechBubble.style.left = Math.max(10, rect.left - 40) + 'px';
        speechBubble.style.top = Math.max(10, rect.top - speechBubble.offsetHeight - 15) + 'px';
        if (assistant.classList.contains('speaking')) {
            requestAnimationFrame(updateBubblePosition);
        }
    }

    function removeBubble() {
        if (speechBubble) { speechBubble.remove(); speechBubble = null; }
        if (bubbleTimeout) { clearTimeout(bubbleTimeout); bubbleTimeout = null; }
    }

    function startSpeakingState(text) {
        isSpeakingState = true;
        if (assistant) assistant.classList.add('speaking');
        showBubble(text);
        if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.pause();
    }

    function endSpeakingState() {
        isSpeakingState = false;
        if (assistant) assistant.classList.remove('speaking');
        if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.resume();
        resetPulsation();
        bubbleTimeout = setTimeout(removeBubble, 2000);
    }

    // === Web Speech Fallback (si el backend o la red no están disponibles) ===
    function speakFallback(text) {
        const synth = window.speechSynthesis;
        if (!synth) { endSpeakingState(); return; }
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.lang = 'es-ES';
        const voices = synth.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es') || v.lang.startsWith('es_')) || voices[0];
        if (esVoice) utterance.voice = esVoice;
        utterance.onend = endSpeakingState;
        utterance.onerror = endSpeakingState;
        startSpeakingState(text);
        synth.speak(utterance);
    }

    // === Play buffer with spatial audio chain ===
    async function playBuffer(buffer, text) {
        try {
            const ctx = getAudioContext();
            const audioBuffer = await ctx.decodeAudioData(buffer);

            if (currentAudioSource) {
                try { currentAudioSource.stop(); } catch { /* ignore */ }
            }

            const chainInput = setupSpatialChain(ctx);
            updatePannerPosition(); // Set initial position

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(chainInput); // source → analyser → panner → gain → dest
            currentAudioSource = source;

            source.onended = () => {
                currentAudioSource = null;
                endSpeakingState();
            };

            startSpeakingState(text);
            source.start(0);
            startPulsation(); // Begin volume-driven light effects
        } catch (err) {
            console.warn('[LuminaVoice] Error decodificando audio, usando fallback:', err);
            speakFallback(text);
        }
    }

    return {
        async speak(rawText) {
            if (!rawText || typeof rawText !== 'string') return;
            const text = cleanTextForSpeech(rawText);
            if (!text || text.length === 0) return;

            const hash = hashText(text);
            const now = Date.now();
            if (hash === lastSpokenHash && (now - lastSpokenTime) < DEBOUNCE_MS) {
                console.log('[LuminaVoice] Debounced: texto idéntico dentro de 2.5s');
                return;
            }
            lastSpokenHash = hash;
            lastSpokenTime = now;

            // Stop ongoing audio
            if (currentAudioSource) {
                try { currentAudioSource.stop(); } catch { /* ignore */ }
                currentAudioSource = null;
            }
            if (window.speechSynthesis) window.speechSynthesis.cancel();

            // Check cache
            if (audioCache.has(hash)) {
                console.log('[LuminaVoice] Cache hit — reproduciendo audio guardado');
                const cachedBuffer = audioCache.get(hash);
                await playBuffer(cachedBuffer.slice(0), text);
                return;
            }

            startSpeakingState(text);

            try {
                const token = localStorage.getItem('lumina_token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ text: text.substring(0, 3000) })
                });

                if (response.status === 503) {
                    console.log('[LuminaVoice] Servicio TTS no disponible — usando fallback de navegador');
                    speakFallback(text);
                    return;
                }

                if (!response.ok) throw new Error(`TTS error: ${response.status}`);

                const arrayBuffer = await response.arrayBuffer();

                if (audioCache.size >= CACHE_MAX) {
                    const firstKey = audioCache.keys().next().value;
                    audioCache.delete(firstKey);
                }
                audioCache.set(hash, arrayBuffer.slice(0));

                await playBuffer(arrayBuffer, text);

            } catch (error) {
                console.warn('[LuminaVoice] Error en TTS backend, usando fallback:', error);
                speakFallback(text);
            }
        },

        isSpeaking() {
            return isSpeakingState || currentAudioSource !== null || (window.speechSynthesis && window.speechSynthesis.speaking);
        },

        stop() {
            isSpeakingState = false;
            if (currentAudioSource) { try { currentAudioSource.stop(); } catch { /* ignore */ } currentAudioSource = null; }
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            if (assistant) assistant.classList.remove('speaking');
            if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.resume();
            resetPulsation();
            removeBubble();
        }
    };
})();

// ====== MÓDULO VOICECLONER — Clonación de Voz Premium ======
const _VoiceCloner = (() => {
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingTimer = null;
    let recordingSeconds = 0;
    let audioBlob = null;
    let isRecording = false;

    // Elementos DOM
    const getEl = (id) => document.getElementById(id);

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // Inicializar el modal al cargar
    function init() {
        const btnVoiceClone = getEl('btn-voice-clone');
        const optRecord = getEl('vc-option-record');
        const optUpload = getEl('vc-option-upload');
        const recBtn = getEl('vc-rec-btn');
        const fileInput = getEl('vc-file-input');
        const previewBtn = getEl('vc-preview-btn');
        const submitBtn = getEl('vc-submit-btn');
        const deleteBtn = getEl('vc-delete-voice');
        const upgradeBtn = getEl('vc-upgrade-btn');

        if (!btnVoiceClone) return;

        btnVoiceClone.addEventListener('click', () => openModal());
        
        document.getElementById('close-voice-clone-modal')?.addEventListener('click', (e) => {
            console.log('Cerrando voice clone modal');
            e.stopPropagation();
            document.getElementById('voice-clone-modal').classList.add('hidden');
        });

        const vcModal = document.getElementById('voice-clone-modal');
        vcModal?.addEventListener('click', (e) => {
            if (e.target === vcModal) {
                vcModal.classList.add('hidden');
            }
        });
        optRecord?.addEventListener('click', () => showRecordPanel());
        optUpload?.addEventListener('click', () => showUploadPanel());
        recBtn?.addEventListener('click', () => toggleRecording());
        fileInput?.addEventListener('change', (e) => handleFileSelect(e));
        previewBtn?.addEventListener('click', () => previewAudio());
        submitBtn?.addEventListener('click', () => submitVoice());
        deleteBtn?.addEventListener('click', () => deleteVoice());
        upgradeBtn?.addEventListener('click', () => activatePremium());

        // Drag & drop en upload area
        const uploadArea = getEl('vc-upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    processFile(e.dataTransfer.files[0]);
                }
            });
        }

        console.log('[VoiceCloner] Módulo inicializado');
    }

    async function openModal() {
        const modal = getEl('voice-clone-modal');
        if (!modal) return;

        // Reset paneles
        resetPanels();
        modal.classList.remove('hidden');

        // Consultar estado premium y voz
        try {
            const resp = await fetch('/api/voice/status', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await resp.json();

            if (!data.isPremium) {
                // No es premium: mostrar upgrade
                getEl('vc-options').classList.add('hidden');
                getEl('vc-upgrade').classList.remove('hidden');
                return;
            }

            // Es premium
            getEl('vc-upgrade').classList.add('hidden');

            if (data.hasClonedVoice) {
                getEl('vc-current-status').classList.remove('hidden');
                getEl('vc-status-text').textContent = `Voz clonada activa (${new Date(data.voiceClonedAt).toLocaleDateString('es')})`;
            } else {
                getEl('vc-current-status').classList.add('hidden');
            }
        } catch (err) {
            console.error('[VoiceCloner] Error consultando estado:', err);
        }
    }

    function closeModal() {
        getEl('voice-clone-modal')?.classList.add('hidden');
        if (isRecording) stopRecording();
        resetPanels();
    }

    function resetPanels() {
        getEl('vc-record-panel')?.classList.add('hidden');
        getEl('vc-upload-panel')?.classList.add('hidden');
        getEl('vc-actions')?.classList.add('hidden');
        getEl('vc-processing')?.classList.add('hidden');
        getEl('vc-options')?.classList.remove('hidden');
        audioBlob = null;
        audioChunks = [];
        recordingSeconds = 0;
        const timer = getEl('vc-timer');
        if (timer) timer.textContent = '00:00';
        const fill = getEl('vc-quality-fill');
        if (fill) fill.style.width = '0%';
        const fileName = getEl('vc-file-name');
        if (fileName) fileName.textContent = '';
    }

    function showRecordPanel() {
        getEl('vc-options')?.classList.add('hidden');
        getEl('vc-record-panel')?.classList.remove('hidden');
    }

    function showUploadPanel() {
        getEl('vc-options')?.classList.add('hidden');
        getEl('vc-upload-panel')?.classList.remove('hidden');
    }

    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                console.log(`[VoiceCloner] Grabación completada: ${(audioBlob.size / 1024).toFixed(1)} KB`);

                if (recordingSeconds >= 30) {
                    getEl('vc-actions')?.classList.remove('hidden');
                    getEl('vc-rec-hint').textContent = '✅ Grabación lista. Puedes escuchar un preview o enviar.';
                } else {
                    getEl('vc-rec-hint').textContent = `⚠️ La grabación fue de ${recordingSeconds}s. Se recomiendan mínimo 30s.`;
                    getEl('vc-actions')?.classList.remove('hidden');
                }
            };

            mediaRecorder.start(250);
            isRecording = true;
            getEl('vc-rec-icon').textContent = '⏹️';
            getEl('vc-rec-btn')?.classList.add('recording');
            getEl('vc-rec-hint').textContent = 'Grabando... Habla con voz clara y natural.';
            recordingSeconds = 0;

            recordingTimer = setInterval(() => {
                recordingSeconds++;
                getEl('vc-timer').textContent = formatTime(recordingSeconds);
                // Barra de calidad (100% = 60 seg)
                const pct = Math.min((recordingSeconds / 60) * 100, 100);
                const fill = getEl('vc-quality-fill');
                if (fill) {
                    fill.style.width = pct + '%';
                    fill.style.background = recordingSeconds < 30
                        ? 'linear-gradient(90deg, #ff6b6b, #ffa726)'
                        : 'linear-gradient(90deg, #11b4d4, #4ade80)';
                }
            }, 1000);

        } catch (err) {
            console.error('[VoiceCloner] Error accediendo micrófono:', err);
            getEl('vc-rec-hint').textContent = '❌ No se pudo acceder al micrófono. Verifica permisos.';
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        clearInterval(recordingTimer);
        getEl('vc-rec-icon').textContent = '⏺️';
        getEl('vc-rec-btn')?.classList.remove('recording');
    }

    function handleFileSelect(event) {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    }

    function processFile(file) {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/x-m4a'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm)$/i)) {
            getEl('vc-file-name').textContent = '❌ Formato no soportado. Usa .mp3, .wav o .m4a';
            return;
        }

        audioBlob = file;
        getEl('vc-file-name').textContent = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
        getEl('vc-actions')?.classList.remove('hidden');
    }

    function previewAudio() {
        if (!audioBlob) return;
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
    }

    async function submitVoice() {
        if (!audioBlob) return;

        getEl('vc-actions')?.classList.add('hidden');
        getEl('vc-record-panel')?.classList.add('hidden');
        getEl('vc-upload-panel')?.classList.add('hidden');
        getEl('vc-processing')?.classList.remove('hidden');
        getEl('vc-processing-text').textContent = '🔄 Enviando audio a ElevenLabs...';

        try {
            const formData = new FormData();
            const ext = audioBlob.type?.includes('webm') ? 'webm' : audioBlob.name?.split('.').pop() || 'mp3';
            formData.append('audio', audioBlob, `voice_sample.${ext}`);

            const resp = await fetch('/api/voice/clone', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });

            const data = await resp.json();

            if (resp.ok && data.success) {
                getEl('vc-processing-text').textContent = '✅ Voz clonada correctamente. Lumina ahora hablará con tu voz.';
                getEl('vc-processing').querySelector('.vc-spinner')?.classList.add('hidden');
                setTimeout(() => {
                    closeModal();
                    statusText.innerText = '🎤 Tu voz ha sido clonada. Lumina hablará contigo.';
                }, 3000);
            } else {
                getEl('vc-processing-text').textContent = `❌ ${data.error || 'Error desconocido'}`;
                getEl('vc-processing').querySelector('.vc-spinner')?.classList.add('hidden');
            }
        } catch (err) {
            console.error('[VoiceCloner] Error:', err);
            getEl('vc-processing-text').textContent = '❌ Error de conexión. Inténtalo de nuevo.';
            getEl('vc-processing').querySelector('.vc-spinner')?.classList.add('hidden');
        }
    }

    async function deleteVoice() {
        if (!confirm('¿Seguro que quieres eliminar tu voz clonada? Lumina volverá a usar la voz por defecto.')) return;

        try {
            const resp = await fetch('/api/voice/clone', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await resp.json();

            if (resp.ok) {
                getEl('vc-current-status')?.classList.add('hidden');
                statusText.innerText = '🔊 Voz clonada eliminada. Usando voz por defecto.';
            } else {
                alert(data.error || 'Error eliminando voz');
            }
        } catch (err) {
            console.error('[VoiceCloner] Error eliminando:', err);
        }
    }

    async function activatePremium() {
        statusText.innerText = 'La voz premium estará disponible después de la beta privada.';
        closeModal();
    }

    // Verificar estado premium al login y mostrar/ocultar botón
    async function checkPremiumStatus() {
        getEl('btn-voice-clone')?.classList.add('hidden');
    }

    return {
        init,
        openModal,
        closeModal,
        checkPremiumStatus
    };
})();

// ====== MÓDULO INTEGRATIONSMANAGER — Google Calendar, Slack, Email ======
const _IntegrationsManager = (() => {
    const getEl = (id) => document.getElementById(id);

    function init() {
        const btnOpen = getEl('btn-integrations');

        if (!btnOpen) return;

        btnOpen.addEventListener('click', () => openModal());
        
        document.getElementById('close-integrations-modal')?.addEventListener('click', (e) => {
            console.log('Cerrando integrations modal');
            e.stopPropagation();
            document.getElementById('integrations-modal').classList.add('hidden');
        });

        const intModal = document.getElementById('integrations-modal');
        intModal?.addEventListener('click', (e) => {
            if (e.target === intModal) {
                intModal.classList.add('hidden');
            }
        });

        // Google Calendar
        getEl('btn-connect-calendar')?.addEventListener('click', () => connectCalendar());
        getEl('btn-sync-calendar')?.addEventListener('click', () => syncCalendar());
        getEl('btn-view-events')?.addEventListener('click', () => viewEvents());
        getEl('btn-disconnect-calendar')?.addEventListener('click', () => disconnectService('calendar'));

        // Slack
        getEl('btn-connect-slack')?.addEventListener('click', () => connectSlack());
        getEl('btn-test-slack')?.addEventListener('click', () => testSlack());
        getEl('btn-disconnect-slack')?.addEventListener('click', () => disconnectService('slack'));

        // Email
        getEl('btn-save-email')?.addEventListener('click', () => saveEmail());
        getEl('btn-send-summary')?.addEventListener('click', () => sendSummary());

        console.log('[IntegrationsManager] Módulo inicializado');
    }

    function feedback(msg) {
        const el = getEl('int-feedback');
        if (el) { el.textContent = msg; setTimeout(() => el.textContent = '', 5000); }
    }

    async function openModal() {
        getEl('integrations-modal')?.classList.remove('hidden');
        await refreshStatus();
    }

    function closeModal() {
        getEl('integrations-modal')?.classList.add('hidden');
    }

    async function refreshStatus() {
        try {
            const resp = await fetch('/api/integrations/status', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await resp.json();

            // Google Calendar
            const gcalStatus = getEl('int-gcal-status');
            if (data.googleCalendar.connected) {
                gcalStatus.textContent = '✅ Conectado';
                gcalStatus.style.color = '#4ade80';
                getEl('btn-connect-calendar')?.classList.add('hidden');
                getEl('btn-sync-calendar')?.classList.remove('hidden');
                getEl('btn-view-events')?.classList.remove('hidden');
                getEl('btn-disconnect-calendar')?.classList.remove('hidden');
                getEl('int-gcal-card')?.classList.add('connected');
            } else {
                gcalStatus.textContent = 'No conectado';
                gcalStatus.style.color = '#888';
                getEl('btn-connect-calendar')?.classList.remove('hidden');
                getEl('btn-sync-calendar')?.classList.add('hidden');
                getEl('btn-view-events')?.classList.add('hidden');
                getEl('btn-disconnect-calendar')?.classList.add('hidden');
                getEl('int-gcal-card')?.classList.remove('connected');
            }

            // Slack
            const slackStatus = getEl('int-slack-status');
            if (data.slack.connected) {
                slackStatus.textContent = `✅ ${data.slack.teamName || 'Conectado'}`;
                slackStatus.style.color = '#4ade80';
                getEl('btn-connect-slack')?.classList.add('hidden');
                getEl('btn-test-slack')?.classList.remove('hidden');
                getEl('btn-disconnect-slack')?.classList.remove('hidden');
                getEl('int-slack-card')?.classList.add('connected');
            } else {
                slackStatus.textContent = 'No conectado';
                slackStatus.style.color = '#888';
                getEl('btn-connect-slack')?.classList.remove('hidden');
                getEl('btn-test-slack')?.classList.add('hidden');
                getEl('btn-disconnect-slack')?.classList.add('hidden');
                getEl('int-slack-card')?.classList.remove('connected');
            }

            // Email
            const emailStatus = getEl('int-email-status');
            if (data.email.configured) {
                emailStatus.textContent = `✅ ${data.email.address}`;
                emailStatus.style.color = '#4ade80';
                getEl('int-email-input').value = data.email.address;
                getEl('int-email-daily').checked = data.email.dailySummary;
                getEl('int-email-reminders').checked = data.email.reminders;
                getEl('btn-send-summary')?.classList.remove('hidden');
                getEl('int-email-card')?.classList.add('connected');
            }
        } catch (err) {
            console.error('[IntegrationsManager] Error cargando estado:', err);
        }
    }

    // --- Google Calendar ---
    async function connectCalendar() {
        try {
            feedback('Conectando con Google Calendar...');
            const resp = await fetch('/api/integrations/calendar/connect', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await resp.json();

            if (data.authUrl) {
                window.open(data.authUrl, '_blank', 'width=600,height=700');
                feedback('Completa la autorización en la ventana nueva.');
                // Poll para detectar cuando se conecte
                const poll = setInterval(async () => {
                    const status = await fetch('/api/integrations/status', { headers: { 'Authorization': `Bearer ${authToken}` } });
                    const st = await status.json();
                    if (st.googleCalendar.connected) {
                        clearInterval(poll);
                        feedback('✅ ¡Google Calendar conectado!');
                        await refreshStatus();
                    }
                }, 3000);
                setTimeout(() => clearInterval(poll), 120000); // Timeout a 2 min
            } else {
                feedback(`❌ ${data.error || 'Error iniciando OAuth'}`);
            }
        } catch {
            feedback('❌ Error de conexión');
        }
    }

    async function syncCalendar() {
        try {
            feedback('🔄 Sincronizando...');
            const resp = await fetch('/api/integrations/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
            });
            const data = await resp.json();
            feedback(data.message || `✅ ${data.synced} evento(s) sincronizado(s)`);
        } catch {
            feedback('❌ Error sincronizando');
        }
    }

    async function viewEvents() {
        try {
            feedback('Cargando eventos...');
            const resp = await fetch('/api/integrations/calendar/events', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await resp.json();

            if (data.events && data.events.length > 0) {
                const list = data.events.map(e => {
                    const date = new Date(e.start).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    return `${e.isLumina ? '🦋' : '📌'} ${date} — ${e.summary}`;
                }).join('\n');
                alert(`📅 Próximos Eventos (7 días):\n\n${list}`);
                feedback(`📋 ${data.count} evento(s) encontrado(s)`);
            } else {
                feedback('📭 No hay eventos en los próximos 7 días');
            }
        } catch {
            feedback('❌ Error cargando eventos');
        }
    }

    // --- Slack ---
    async function connectSlack() {
        try {
            feedback('Conectando con Slack...');
            const resp = await fetch('/api/integrations/slack/connect', { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await resp.json();

            if (data.authUrl) {
                window.open(data.authUrl, '_blank', 'width=600,height=700');
                feedback('Completa la autorización en Slack.');
                const poll = setInterval(async () => {
                    const status = await fetch('/api/integrations/status', { headers: { 'Authorization': `Bearer ${authToken}` } });
                    const st = await status.json();
                    if (st.slack.connected) {
                        clearInterval(poll);
                        feedback('✅ ¡Slack conectado!');
                        await refreshStatus();
                    }
                }, 3000);
                setTimeout(() => clearInterval(poll), 120000);
            } else {
                feedback(`❌ ${data.error || 'Error con Slack'}`);
            }
        } catch {
            feedback('❌ Error de conexión');
        }
    }

    async function testSlack() {
        try {
            feedback('Enviando mensaje de prueba...');
            const resp = await fetch('/api/integrations/slack/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ message: '🧪 ¡Mensaje de prueba desde Lumina! La integración funciona correctamente.' })
            });
            const data = await resp.json();
            feedback(data.success ? '✅ Mensaje enviado a Slack' : `❌ ${data.error}`);
        } catch {
            feedback('❌ Error enviando a Slack');
        }
    }

    // --- Email ---
    async function saveEmail() {
        const address = getEl('int-email-input')?.value?.trim();
        if (!address || !address.includes('@')) {
            feedback('❌ Ingresa un email válido');
            return;
        }

        try {
            const resp = await fetch('/api/integrations/email/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({
                    address,
                    dailySummary: getEl('int-email-daily')?.checked,
                    reminders: getEl('int-email-reminders')?.checked,
                    weeklyReport: getEl('int-email-weekly')?.checked
                })
            });
            const data = await resp.json();
            feedback(data.success ? `✅ ${data.message}` : `❌ ${data.error}`);
            if (data.success) await refreshStatus();
        } catch {
            feedback('❌ Error guardando email');
        }
    }

    async function sendSummary() {
        try {
            feedback('📊 Generando resumen...');
            const resp = await fetch('/api/notifications/send-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
            });
            const data = await resp.json();
            feedback(data.success ? `✅ ${data.message}` : `❌ ${data.error}`);
        } catch {
            feedback('❌ Error enviando resumen');
        }
    }

    // --- Desconectar ---
    async function disconnectService(service) {
        const names = { calendar: 'Google Calendar', slack: 'Slack' };
        if (!confirm(`¿Desconectar ${names[service]}?`)) return;

        try {
            const endpoint = service === 'calendar'
                ? '/api/integrations/calendar/disconnect'
                : '/api/integrations/slack/disconnect';

            await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            feedback(`🔌 ${names[service]} desconectado`);
            await refreshStatus();
        } catch {
            feedback('❌ Error desconectando');
        }
    }

    return { init, openModal, closeModal, refreshStatus };
})();

// Pre-cargar voces del fallback Web Speech API
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// Inicializar variable global para almacenar la última respuesta IA
window.lastAIResponse = '';

// ====== SISTEMA DE MEMORIA DE CONTEXTO ======
window.lumiContext = {
    historial: [],                 // Historial de la conversación (opcional para mantener últimos 10 intercambios)
    ultimoNodoRevisadoId: null,    // ID del último nodo al que Lumi prestó atención
    ultimaPropuestaMejora: null    // Última sugerencia de mejora para Smart Edit
};

// Función para registrar en el historial de contexto (máx 10 items)
function agregarAlContexto(intercambio) {
    window.lumiContext.historial.push(intercambio);
    if (window.lumiContext.historial.length > 10) {
        window.lumiContext.historial.shift();
    }
}
// ============================================

// Click-to-speak logic merged into unified handler below (line ~830)
if (assistant) {
    assistant.style.cursor = 'pointer';
}

// Auth DOM
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');
const navUsername = document.getElementById('nav-username');
const btnLogout = document.getElementById('btn-logout');
const btnOrganize = document.getElementById('btn-organize');
const btnSynthesize = document.getElementById('btn-synthesize');
const neuralCanvas = document.getElementById('neural-canvas');

let isLoginMode = true;
// La sesión web vive en una cookie HttpOnly. No guardar credenciales en
// localStorage: así el JavaScript de la página no puede leer el token.
let authToken = null;
let currentUsername = null;

// Auth Helper
const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return headers;
};

let floatNodes = [];

// ====== LÓGICA DE AUTENTICACIÓN ======
function setAuthSubmitLabel(label) {
    if (!authSubmitBtn) return;
    const text = document.createElement('span');
    text.textContent = label;
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    authSubmitBtn.replaceChildren(text, arrow);
}

function setAuthMode(isLogin) {
    isLoginMode = isLogin;
    authError.innerText = '';

    if (isLogin) {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        setAuthSubmitLabel('Entrar a Lumina');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        setAuthSubmitLabel('Crear mi espacio');
    }
}

if (tabLogin && tabRegister && authForm) {
    tabLogin.addEventListener('click', () => setAuthMode(true));
    tabRegister.addEventListener('click', () => setAuthMode(false));

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = authUsername.value.trim();
        const password = authPassword.value;

        if (!username || !password) {
            authError.innerText = "Credenciales requeridas.";
            return;
        }

        authSubmitBtn.disabled = true;
        authSubmitBtn.innerText = "Procesando...";
        authError.innerText = "";

        try {
            const endpoint = isLoginMode ? '/api/login' : '/api/registro';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error de autenticación');
            }

            if (!isLoginMode) {
                // Registro exitoso, pasar a login automáticamente
                authPassword.value = '';
                setAuthMode(true);
                authError.innerText = "Espacio creado. Ya puedes entrar.";
                authError.style.color = "#4ade80"; // Turquesa/verde
            } else {
                // Login exitoso
                currentUsername = data.username;

                showApp();

                // Guardar el saludo para que el usuario pueda escucharlo si lo solicita.
                if (data.bienvenida && data.bienvenida.trim().length > 0) {
                    window.lastAIResponse = data.bienvenida;
                }
            }
        } catch (err) {
            authError.innerText = err.message;
            authError.style.color = "#ff6b6b"; // Rojo
        } finally {
            authSubmitBtn.disabled = false;
            setAuthSubmitLabel(isLoginMode ? 'Entrar a Lumina' : 'Crear mi espacio');
        }
    });
}

function showApp() {
    loginView.style.display = 'none';
    appView.classList.remove('hidden');
    if (navUsername) navUsername.innerText = currentUsername || 'Lumina';

    // Limpiar nodos anteriores del DOM antes de cargar los nuevos
    floatNodes.forEach(n => { if (n.parentNode) n.parentNode.removeChild(n); });
    floatNodes = [];
    if (neuralCanvas) neuralCanvas.querySelectorAll('line').forEach(l => l.remove());
    document.querySelectorAll('.planet-marker, .planet-orbit-ring, .backup-ghost').forEach(el => el.remove());
    window.lumiContext = { historial: [], ultimoNodoRevisadoId: null, ultimaPropuestaMejora: null };
    window.lastAIResponse = '';

    conectarTiempoReal(); // pizarra viva: abrir canal SSE en TODO inicio de sesión (login/demo/restauración)
    conectarMicLumi();    // voz local: botón de dictado junto al chat de Lumi
    conectarBotonNota();  // botón visible para crear notas sin doble clic
    loadConstellation();

    // El micrófono solo se activa tras una acción explícita del usuario.
    // Iniciar recordatorios
    if (typeof LuminaReminders !== 'undefined') {
        LuminaReminders.start();
    }
    // Iniciar panel de estadísticas
    if (typeof StatsPanel !== 'undefined') {
        StatsPanel.init();
    }

    // Onboarding cinemático (solo la primera vez)
    maybeStartOnboarding();

    // En la beta, "Hoy" es el punto de entrada. El mapa estratégico queda
    // disponible detrás como vista creativa secundaria.
    setTimeout(() => {
        if (localStorage.getItem(ONBOARDING_KEY) === '1') openTodayView();
    }, 900);
}

function handleSessionExpired() {
    if (LuminaEar) LuminaEar.stop();
    if (typeof LuminaReminders !== 'undefined') LuminaReminders.stop();
    authToken = null;
    currentUsername = null;
    if (realtimeSource) { realtimeSource.close(); realtimeSource = null; }

    // Limpiar estado de nodos del DOM
    floatNodes.forEach(n => { if (n.parentNode) n.parentNode.removeChild(n); });
    floatNodes = [];
    chatHistorial = typeof chatHistorial !== 'undefined' ? [] : [];
    window.lumiContext = { historial: [], ultimoNodoRevisadoId: null, ultimaPropuestaMejora: null };
    window.lastAIResponse = '';
    window.currentPlanet = null;

    // Limpiar SVG (líneas neuronales y sinergias)
    if (neuralCanvas) {
        neuralCanvas.querySelectorAll('line').forEach(l => l.remove());
    }

    // Limpiar planetas y planet view
    document.querySelectorAll('.planet-marker, .planet-orbit-ring').forEach(el => el.remove());
    const pv = document.getElementById('planet-view');
    if (pv) pv.classList.add('hidden');

    appView.classList.add('hidden');
    loginView.style.display = 'flex';
    if (authForm) authForm.reset();
    if (authError) {
        authError.innerText = "Sesión finalizada.";
        authError.style.color = "#ff6b6b";
    }
}

if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        try { await fetch('/api/logout', { method: 'POST' }); } catch { /* cierre local igualmente */ }
        handleSessionExpired();
    });
}

// Check inicial
async function initAuth() {
    try {
        const response = await fetch('/api/session');
        if (!response.ok) throw new Error('Sin sesión');
        const session = await response.json();
        currentUsername = session.username;
        showApp();
    } catch {
        loginView.style.display = 'flex';
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// ====== LUMINA EAR — SISTEMA DE ESCUCHA SIEMPRE ACTIVO ======
const LuminaEar = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('[LuminaEar] SpeechRecognition no soportado en este navegador');
        return null;
    }

    // === ESTADO ===
    let state = 'idle';       // idle | passive | active | processing
    let recognition = null;
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let silenceTimer = null;
    let autoRestart = true;
    let finalTranscript = '';

    // Wake phrases: pares de palabras clave para matching flexible
    const WAKE_TRIGGERS = [
        ['oye', 'lumi'], ['oye', 'lumina'], ['oye', 'luminosa'],
        ['hey', 'lumi'], ['hey', 'lumina'],
        ['hola', 'lumi'], ['hola', 'lumina'],
        ['ey', 'lumi'], ['ey', 'lumina'],
        ['ole', 'lumi'], ['olle', 'lumi']
    ];
    const SILENCE_TIMEOUT_MS = 4000;
    const VOICE_FREQ_MIN = 2;
    const VOICE_FREQ_MAX = 12;
    const VOICE_THRESHOLD = 35;

    // === HELPERS ===
    function clearButterflyStates() {
        if (assistant) {
            assistant.classList.remove('passive-listening', 'wake-activated', 'listening', 'processing', 'speaking');
        }
    }

    function setVisualState(newState) {
        clearButterflyStates();
        if (assistant && newState) {
            assistant.classList.add(newState);
        }
    }

    // Fuzzy word match — tolera errores comunes de transcripción
    function wordSimilar(a, b) {
        a = a.toLowerCase(); b = b.toLowerCase();
        if (a === b) return true;
        if (a.length < 2 || b.length < 2) return false;
        // Empieza igual y longitud similar → match (ej: "lumi" vs "lumia", "lumin")
        const prefix = Math.min(a.length, b.length, 3);
        if (a.substring(0, prefix) === b.substring(0, prefix) && Math.abs(a.length - b.length) <= 2) return true;
        // "lumi" está contenido en "lumina", "luminosa", etc.
        if (b.includes(a) || a.includes(b)) return true;
        return false;
    }

    function containsWakeWord(text) {
        const lower = text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[.,!?¿¡]/g, '');
        const words = lower.split(/\s+/).filter(w => w.length > 0);

        // Buscar cualquier par trigger en secuencia dentro del texto
        for (const [triggerA, triggerB] of WAKE_TRIGGERS) {
            for (let i = 0; i < words.length - 1; i++) {
                if (wordSimilar(words[i], triggerA)) {
                    // Verificar las siguientes 1-2 palabras
                    for (let j = i + 1; j <= Math.min(i + 2, words.length - 1); j++) {
                        if (wordSimilar(words[j], triggerB)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function stripWakeWord(text) {
        // Eliminar variantes de "oye lumi/lumina" del texto
        let cleaned = text;
        const patterns = [
            /\b(oye|hey|hola|ey|ole)\s+(lumi\w*)\b/gi,
        ];
        patterns.forEach(p => { cleaned = cleaned.replace(p, ''); });
        return cleaned.trim().replace(/^[,.\s]+/, '').trim();
    }

    // === NOISE FILTER: Analizar frecuencias de voz ===
    async function setupAudioAnalyser() {
        try {
            if (audioContext) return;
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            const source = audioContext.createMediaStreamSource(micStream);
            source.connect(analyser);
            console.log('[LuminaEar] Analizador de audio inicializado');
        } catch (err) {
            console.warn('[LuminaEar] No se pudo inicializar analizador de audio:', err.message);
        }
    }

    function isVoiceDetected() {
        if (!analyser) return true;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let voiceEnergy = 0;
        for (let i = VOICE_FREQ_MIN; i <= VOICE_FREQ_MAX && i < data.length; i++) {
            voiceEnergy += data[i];
        }
        voiceEnergy /= (VOICE_FREQ_MAX - VOICE_FREQ_MIN + 1);
        return voiceEnergy > VOICE_THRESHOLD;
    }

    // === RECONOCIMIENTO DE VOZ ===
    // Rolling buffer para detectar wake word entre sesiones rápidas
    let recentSegments = []; // [{text, time}]
    const BUFFER_WINDOW_MS = 6000; // Ventana de 6 segundos

    function pruneBuffer() {
        const now = Date.now();
        recentSegments = recentSegments.filter(s => (now - s.time) < BUFFER_WINDOW_MS);
    }

    function getBufferText() {
        pruneBuffer();
        return recentSegments.map(s => s.text).join(' ');
    }

    function createRecognition() {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'es-ES';
        rec.maxAlternatives = 3;

        rec.onstart = () => {
            console.log(`[LuminaEar] Recognition started — state: ${state}`);
            if (state === 'idle') {
                state = 'passive';
                setVisualState('passive-listening');
                statusText.innerText = 'Lumina escuchando... di "Oye Lumi" para activar 🦋';
            }
        };

        rec.onresult = (event) => {
            // === EVITAR AUTO-INTERRUPCIÓN: Si Lumi está hablando, ignorar audio captado del propio altavoz ===
            if (typeof LuminaVoice !== 'undefined' && LuminaVoice.isSpeaking()) {
                return;
            }

            // === MODO PASIVO: buscar wake word con rolling buffer ===
            if (state === 'passive') {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    for (let alt = 0; alt < event.results[i].length; alt++) {
                        const segment = event.results[i][alt].transcript.trim();
                        if (!segment) continue;

                        // Añadir al buffer con timestamp
                        if (alt === 0) { // Solo la alternativa principal al buffer
                            recentSegments.push({ text: segment, time: Date.now() });
                        }

                        // Verificar wake word en el segmento individual
                        if (containsWakeWord(segment)) {
                            console.log(`[LuminaEar] 🦋 Wake word directo: "${segment}"`);
                            activateFromWake(segment);
                            return;
                        }
                    }
                }

                // Verificar wake word en el buffer combinado (cross-session)
                const bufferText = getBufferText();
                if (bufferText.length > 3 && containsWakeWord(bufferText)) {
                    console.log(`[LuminaEar] 🦋 Wake word en buffer: "${bufferText}"`);
                    activateFromWake(bufferText);
                    return;
                }
                return;
            }

            // === MODO ACTIVO: acumular texto y gestionar silencio ===
            if (state === 'active') {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (isVoiceDetected()) {
                    ideaInput.value = finalTranscript + interimTranscript;
                    ideaInput.scrollLeft = ideaInput.scrollWidth;
                    resetSilenceTimer();
                }
            }
        };

        rec.onend = () => {
            console.log(`[LuminaEar] Recognition ended — state: ${state}`);
            if (autoRestart && state !== 'processing') {
                // NO limpiar buffer — permitir wake word cross-session
                setTimeout(() => {
                    try {
                        if (autoRestart) rec.start();
                    } catch {
                        console.warn('[LuminaEar] Reintento restart...');
                        setTimeout(() => {
                            try { if (autoRestart) rec.start(); } catch { /* ignore */ }
                        }, 800);
                    }
                }, 100); // Mínimo gap entre sesiones
            }
        };

        rec.onerror = (event) => {
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            console.error('[LuminaEar] Error:', event.error);
            if (event.error === 'not-allowed') {
                statusText.innerText = 'Permisos de micrófono denegados — clic en la mariposa para dictado manual.';
                autoRestart = false;
            }
        };

        return rec;
    }

    // === ACTIVAR DESDE WAKE WORD ===
    function activateFromWake(sourceText) {
        state = 'active';
        recentSegments = []; // Limpiar buffer

        const cleanedText = stripWakeWord(sourceText);
        finalTranscript = cleanedText;

        setVisualState('wake-activated');
        inputContainer.classList.remove('hidden');
        ideaInput.value = cleanedText;
        ideaInput.placeholder = 'Escuchando... (envío automático en 4s de silencio)';
        statusText.innerText = '🦋 ¡LUMINA ACTIVADA! Escuchando tu instrucción...';
        statusText.classList.add('listening-text');
        material.size = 7;

        flyButterflyToCenter();
        resetSilenceTimer();
    }

    // === TIMER DE SILENCIO (4s auto-submit) ===
    function resetSilenceTimer() {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
            if (state === 'active' && ideaInput.value.trim().length > 0) {
                console.log('[LuminaEar] ⏱️ 4s silence — auto-submitting');
                autoSubmit();
            } else if (state === 'active') {
                // No hay texto, volver a pasivo
                returnToPassive();
            }
        }, SILENCE_TIMEOUT_MS);
    }

    async function autoSubmit() {
        state = 'processing';
        if (silenceTimer) clearTimeout(silenceTimer);

        // Visual: Processing nova
        setVisualState('processing');
        statusText.innerText = '🧠 Procesando instrucción automáticamente...';
        material.size = 8;

        // Detener recognition temporalmente
        try { recognition.stop(); } catch { /* ignore */ }

        // Ejecutar el mismo flujo que Enter
        await stopRecordingAndSend();

        // Después de procesar, volver a pasivo
        setTimeout(() => {
            returnToPassive();
        }, 2000);
    }

    function returnToPassive() {
        state = 'passive';
        finalTranscript = '';
        setVisualState('passive-listening');
        inputContainer.classList.add('hidden');
        statusText.innerText = 'Lumina escuchando... di "Oye Lumi" para activar 🦋';
        statusText.classList.remove('listening-text');
        material.size = 5;

        // Regresar mariposa a su patrón de vuelo
        assistant.style.transition = 'left 2s ease, top 2s ease, transform 1s ease';
        assistant.style.transform = 'scale(1)';
        setTimeout(() => {
            assistant.style.transition = '';
            if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.resume();
        }, 2200);

        // Reiniciar recognition si no está corriendo
        if (autoRestart) {
            setTimeout(() => {
                try { recognition.start(); } catch { /* ignore */ }
            }, 500);
        }
    }

    function flyButterflyToCenter() {
        if (!assistant) return;
        if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.pause();

        const centerX = (window.innerWidth / 2) - 110;
        const centerY = (window.innerHeight / 2) - 110;

        assistant.style.transition = 'left 1s cubic-bezier(0.25, 1, 0.5, 1), top 1s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s ease';
        assistant.style.left = centerX + 'px';
        assistant.style.top = centerY + 'px';
        assistant.style.transform = 'scale(1.2)';
    }

    // === API PÚBLICA ===
    return {
        async start() {
            if (!SpeechRecognition) return;
            autoRestart = true;
            recognition = createRecognition();

            // Setup audio analyser para filtro de ruido
            await setupAudioAnalyser();

            // Iniciar reconocimiento
            try {
                recognition.start();
                console.log('[LuminaEar] 🎙️ Modo siempre activo iniciado');
            } catch (e) {
                console.warn('[LuminaEar] Error iniciando:', e.message);
            }
        },

        stop() {
            autoRestart = false;
            state = 'idle';
            if (silenceTimer) clearTimeout(silenceTimer);
            if (recognition) { try { recognition.stop(); } catch { /* ignore */ } }
            clearButterflyStates();
        },

        // Para activación manual (clic en mariposa)
        manualActivate() {
            if (state === 'passive' || state === 'idle') {
                state = 'active';
                finalTranscript = '';
                setVisualState('wake-activated');
                inputContainer.classList.remove('hidden');
                ideaInput.value = '';
                ideaInput.focus();
                ideaInput.placeholder = 'Escuchando... (envío automático en 4s de silencio)';
                statusText.innerText = '🦋 LUMINA ACTIVADA — Escuchando tu instrucción...';
                statusText.classList.add('listening-text');
                material.size = 7;
                flyButterflyToCenter();
                resetSilenceTimer();
            }
        },

        // Para cancelar modo activo
        deactivate() {
            if (silenceTimer) clearTimeout(silenceTimer);
            returnToPassive();
        },

        getState() { return state; },
        isActive() { return state === 'active'; }
    };
})();

// Legacy compatibility — variables reusadas en stopRecordingAndSend

// === TECLA ESC: Cancelar instrucción activa ===
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Si Lumina está escuchando activamente, cancelar
        if (LuminaEar && LuminaEar.isActive()) {
            e.preventDefault();
            ideaInput.value = '';
            inputContainer.classList.add('hidden');
            LuminaEar.deactivate();
            statusText.innerText = 'Instrucción cancelada. Lumina en reposo.';
            statusText.classList.remove('listening-text');
            material.size = 5;
            console.log('[ESC] Instrucción cancelada por el usuario');
            return;
        }
        // Si hay voz reproduciéndose, detenerla
        if (typeof LuminaVoice !== 'undefined' && LuminaVoice.isSpeaking()) {
            LuminaVoice.stop();
            statusText.innerText = 'Voz detenida. Lumina en reposo.';
            return;
        }
        // Si el input está visible pero sin wake word (escritura manual), cerrarlo
        if (!inputContainer.classList.contains('hidden')) {
            ideaInput.value = '';
            inputContainer.classList.add('hidden');
            statusText.innerText = 'Lumina en reposo';
            statusText.classList.remove('listening-text');
            material.size = 5;
        }
    }
});
function startRecording() {
    // Ahora LuminaEar gestiona la escucha — mantener por compatibilidad
    if (LuminaEar) {
        LuminaEar.manualActivate();
    }
}


async function stopRecordingAndSend() {
    const text = ideaInput.value.trim();
    if (!text) {
        inputContainer.classList.add('hidden');
        assistant.classList.remove('listening');
        material.size = 5;
        statusText.innerText = "Lumina en reposo";
        statusText.classList.remove('listening-text');
        return;
    }

    // Ocultar input
    inputContainer.classList.add('hidden');
    statusText.innerText = "🧠 Analizando intención...";
    statusText.classList.add('listening-text');
    material.size = 7;

    try {
        // === PASO 1: CLASIFICAR INTENCIÓN ===
        const classResp = await fetch('/api/clasificar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ texto: text })
        });

        if (classResp.status === 401) { handleSessionExpired(); return; }
        const classification = await classResp.json();
        const intent = classification.intent;

        console.log(`[Consciousness] Intención: ${intent}`, classification);

        // === PASO 2: RUTEAR SEGÚN INTENCIÓN ===
        if (intent === 'PREGUNTA') {
            await handlePregunta(text);
        } else if (intent === 'COMANDO') {
            await handleComando(text, classification.accion, classification);
        } else {
            await handleIdea(text);
        }

    } catch (error) {
        console.error('Error en clasificación:', error);
        // Fallback: tratar como idea
        await handleIdea(text);
    }

    ideaInput.value = '';
    material.size = 5;
}

// === HANDLER: PREGUNTA / CHARLA ===
async function handlePregunta(text) {
    statusText.innerText = '💬 Lumi razonando...';

    try {
        const resp = await fetch('/api/lumi-responde', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ texto: text, planetaActivo: window.currentPlanet || null, historial: window.lumiContext.historial })
        });

        if (!resp.ok) throw new Error('Error en respuesta');
        const data = await resp.json();

        window.lastAIResponse = data.respuesta;
        agregarAlContexto({ user: text, lumi: data.respuesta });
        statusText.innerText = `🦋 Lumi: "${data.respuesta.substring(0, 80)}..."`;

        // Hablar la respuesta con ElevenLabs
        ejecutarRespuestaMariposa(data.respuesta, 0, 0);

    } catch (error) {
        console.error('[Pregunta] Error:', error);
        statusText.innerText = 'Error al consultar a Lumi.';
    }
}

// === HANDLER: COMANDO ===
async function handleComando(text, accion, classData = {}) {
    // Determinar acción si no viene del clasificador directo
    if (!accion) {
        const lower = text.toLowerCase();
        if (lower.includes('borra') || lower.includes('elimina') || lower.includes('limpia')) accion = 'BACKUP_ALL';
        else if (lower.includes('abre') && lower.includes('backup')) accion = 'SHOW_BACKUP';
        else if (lower.includes('restaura') || lower.includes('recupera')) accion = 'RESTORE_BACKUP';
        else if (lower.includes('muestrame') || lower.includes('resumen') || lower.includes('que hiciste')
            || lower.includes('cuantos') || lower.includes('que tengo')) accion = 'RESUMEN';
        else if (lower.includes('analiza') && (lower.includes('nodo') || lower.includes('idea') || lower.includes('tarea'))) accion = 'ANALYZE_NODE';
        else if (lower.includes('actualiza') && (lower.includes('mencionado') || lower.includes('sugerido') || lower.includes('propuesta'))) accion = 'SMART_EDIT_NODE';
        else {
            // Detectar verbos de creación que se clasificaron incorrectamente como COMANDO
            const creationVerbs = ['anota', 'crea', 'agenda', 'registra', 'programa', 'apunta', 'guarda', 'planea', 'planifica', 'organiza', 'genera', 'prepara'];
            const hasCreationIntent = creationVerbs.some(v => lower.includes(v));
            if (hasCreationIntent) {
                console.log('[Comando] Detectado verbo de creación → redirigiendo a handleIdea');
                await handleIdea(text);
                return;
            }
            // Comando no reconocido → Lumi responde conversacionalmente (NO crear nodo)
            console.log('[Comando] Acción desconocida, delegando a Lumi...');
            await handlePregunta(text);
            return;
        }
    }

    if (accion === 'RESUMEN') {
        statusText.innerText = 'Analizando el mapa estratégico…';

        try {
            const resp = await fetch('/api/resumen', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await resp.json();

            statusText.innerText = `${data.count} iniciativas encontradas`;

            // Highlight nodos existentes con un pulso
            const allNodes = document.querySelectorAll('.idea-node');
            allNodes.forEach((node, i) => {
                setTimeout(() => {
                    node.style.transition = 'box-shadow 0.5s ease, transform 0.3s ease';
                    node.style.boxShadow = '0 0 30px rgba(17, 180, 212, 0.8)';
                    node.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        node.style.boxShadow = '';
                        node.style.transform = '';
                    }, 1500);
                }, i * 150);
            });

            // Lumi habla el resumen
            ejecutarRespuestaMariposa(data.resumen, 0, 0);

        } catch (error) {
            console.error('[Resumen] Error:', error);
            statusText.innerText = 'Error al generar resumen.';
        }
        return;
    }
    if (accion === 'BACK') {
        if (window.currentPlanet) {
            closePlanetView();
            ejecutarRespuestaMariposa('Volviendo al sistema solar.', 0, 0);
        } else {
            ejecutarRespuestaMariposa('Ya estás en el sistema solar.', 0, 0);
        }
        return;
    }

    if (accion === 'NAVIGATE_PLANET') {
        // Prioridad 1: usar el campo ya resuelto por el clasificador backend
        let planet = classData.planet || null;

        // Prioridad 2: fallback — parsear el texto si el clasificador no lo resolvió
        if (!planet) {
            const lowerNav = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const planetMap = [
                { cats: ['ideas', 'idea'], key: 'idea' },
                { cats: ['reuniones', 'reunion', 'meetings', 'juntas', 'junta', 'meeting'], key: 'reunion' },
                { cats: ['tareas', 'tarea', 'pendientes', 'pendiente'], key: 'tarea' },
                { cats: ['proyectos', 'proyecto'], key: 'proyecto' }
            ];
            for (const entry of planetMap) {
                if (entry.cats.some(c => lowerNav.includes(c))) { planet = entry.key; break; }
            }
        }
        if (!planet) planet = 'idea'; // Default

        statusText.innerText = `Abriendo el área ${PLANET_CONFIG[planet]?.label || planet}…`;
        openPlanetView(planet);
        return;
    }

    if (accion === 'SHOW_NODE') {
        statusText.innerText = '🔍 Buscando nodo...';

        // Si estamos dentro de un planeta, operar sobre las tarjetas visibles
        if (window.currentPlanet) {
            const cards = Array.from(document.querySelectorAll('.planet-node-card'));
            if (cards.length === 0) {
                ejecutarRespuestaMariposa('Esta área todavía está vacía.', 0, 0);
                return;
            }
            // Usar el índice del clasificador o fallback texto
            let pIdx = classData.nodeIndex ?? 0;
            const pLower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const pOrdinals = { 'primera': 0, 'primer': 0, 'primero': 0, 'segunda': 1, 'segundo': 1, 'tercera': 2, 'cuarta': 3, 'quinta': 4, 'ultima': -1, 'ultimo': -1 };
            for (const [w, v] of Object.entries(pOrdinals)) { if (pLower.includes(w)) { pIdx = v; break; } }
            if (pIdx === -1) pIdx = cards.length - 1;
            pIdx = Math.max(0, Math.min(pIdx, cards.length - 1));
            const targetCard = cards[pIdx];
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.style.boxShadow = `0 0 40px rgba(255, 215, 0, 0.9)`;
            targetCard.style.transform = 'scale(1.05)';
            setTimeout(() => { targetCard.style.boxShadow = ''; targetCard.style.transform = ''; }, 3000);
            const cardText = targetCard.querySelector('.card-text')?.innerText || '';
            ejecutarRespuestaMariposa(`Esta es la ${['primera', 'segunda', 'tercera', 'cuarta', 'quinta'][pIdx] || 'siguiente'}: ${cardText}`, 0, 0);
            return;
        }

        const allNodes = Array.from(document.querySelectorAll('.idea-node:not(.backup-ghost)'));
        if (allNodes.length === 0) {
            const msg = 'Todavía no hay iniciativas en tu mapa.';
            statusText.innerText = msg;
            ejecutarRespuestaMariposa(msg, 0, 0);
            return;
        }

        // Usar nodeIndex del clasificador (ya resuelto por backend), con fallback texto
        let idx = classData.nodeIndex ?? 0;
        const ordinals = { 'primera': 0, 'primer': 0, 'primero': 0, 'segunda': 1, 'segundo': 1, 'tercera': 2, 'tercero': 2, 'cuarta': 3, 'cuarto': 3, 'quinta': 4, 'quinto': 4, 'ultima': -1, 'ultimo': -1 };
        const lowerShow = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const [word, val] of Object.entries(ordinals)) {
            if (lowerShow.includes(word)) { idx = val; break; }
        }
        // Número directo: "tarea 3"
        const numMatch = lowerShow.match(/(?:tarea|nodo|mision)\s+(\d+)/);
        if (numMatch) idx = parseInt(numMatch[1]) - 1;

        // Resolver -1 como último
        if (idx === -1) idx = allNodes.length - 1;
        idx = Math.max(0, Math.min(idx, allNodes.length - 1));

        const targetNode = allNodes[idx];
        const nodeText = targetNode.dataset.original || targetNode.innerText;

        // === ANIMACIÓN: Scroll + Spotlight ===
        // 1. Mover mariposa hacia el nodo
        const nodeRect = targetNode.getBoundingClientRect();
        const butterflyX = nodeRect.left - 60;
        const butterflyY = nodeRect.top - 30;

        if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.pause();
        assistant.style.transition = 'left 1.2s cubic-bezier(0.25, 1, 0.5, 1), top 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
        assistant.style.left = butterflyX + 'px';
        assistant.style.top = butterflyY + 'px';

        // 2. Iluminar el nodo
        targetNode.style.transition = 'all 0.5s ease';
        targetNode.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.9), 0 0 80px rgba(255, 215, 0, 0.4)';
        targetNode.style.transform = 'scale(1.15)';
        targetNode.style.zIndex = '999';
        targetNode.style.border = '2px solid #ffd700';

        // MEMORIA: Guardar referencia al nodo revisado
        window.lumiContext.ultimoNodoRevisadoId = targetNode.dataset.id;
        // Limpiar cualquier propuesta antigua de un nodo previo
        window.lumiContext.ultimaPropuestaMejora = null;
        agregarAlContexto({ user: text, lumiShow: nodeText });

        // 3. Abrir el modal del nodo después de la animación de vuelo
        setTimeout(() => {
            targetNode.click();
        }, 1400);

        // 4. Lumi lee el contenido del nodo
        const ordinalNames = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta'];
        const ordName = ordinalNames[idx] || `número ${idx + 1}`;
        const msg = `Aquí tienes la ${ordName} tarea: ${nodeText}`;
        statusText.innerText = `📋 Tarea ${idx + 1}: ${nodeText.substring(0, 60)}...`;
        setTimeout(() => {
            ejecutarRespuestaMariposa(msg, 0, 0);
        }, 2000);

        // 5. Limpiar spotlight después
        setTimeout(() => {
            targetNode.style.boxShadow = '';
            targetNode.style.transform = '';
            targetNode.style.zIndex = '';
            targetNode.style.border = '';
        }, 6000);

        return;
    }

    if (accion === 'ANALYZE_NODE') {
        const lowerShow = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let targetId = window.lumiContext.ultimoNodoRevisadoId; // Por defecto usa el último en memoria
        let targetNodeEl = null;

        // Comprobar si el usuario se refiere a un nodo específico (ej. "analiza el segundo nodo")
        const ordinals = { 'primer ': 0, 'primero': 0, 'segundo': 1, 'tercer ': 2, 'tercero': 2, 'cuarto': 3, 'quinto': 4, 'ultimo': -1 };
        const allNodes = Array.from(document.querySelectorAll('.idea-node:not(.backup-ghost)'));
        let explicitIdx = null;

        for (const [word, val] of Object.entries(ordinals)) {
            if (lowerShow.includes(word)) { explicitIdx = val; break; }
        }
        const numMatch = lowerShow.match(/(?:tarea|nodo|mision)\s+(\d+)/);
        if (numMatch) explicitIdx = parseInt(numMatch[1]) - 1;

        if (explicitIdx !== null && allNodes.length > 0) {
            let i = explicitIdx === -1 ? allNodes.length - 1 : explicitIdx;
            i = Math.max(0, Math.min(i, allNodes.length - 1));
            targetNodeEl = allNodes[i];
            targetId = targetNodeEl.dataset.id;
        }

        if (!targetId) {
            const msg = 'No sé a qué nodo te refieres. ¿Me puedes decir cuál?';
            statusText.innerText = msg;
            ejecutarRespuestaMariposa(msg, 0, 0);
            return;
        }

        statusText.innerText = '🔍 Analizando nodo...';
        try {
            const resp = await fetch(`/api/nodo/${targetId}/analizar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await resp.json();

            // Guardar en contexto la propuesta de mejora
            window.lumiContext.ultimoNodoRevisadoId = targetId;
            window.lumiContext.ultimaPropuestaMejora = data.propuestaMejora;
            agregarAlContexto({ action: 'analyze', result: data.analisis });

            statusText.innerText = `💡 Crítica lista. Di "actualízalo según lo sugerido" para aplicar cambios.`;
            ejecutarRespuestaMariposa(data.analisis, 0, 0);

        } catch (error) {
            console.error('[Analyze] Error:', error);
            statusText.innerText = 'Error al analizar el nodo.';
        }
        return;
    }

    if (accion === 'SMART_EDIT_NODE') {
        const targetId = window.lumiContext.ultimoNodoRevisadoId;
        const propuesta = window.lumiContext.ultimaPropuestaMejora;

        if (!targetId || !propuesta) {
            const msg = 'No tengo registrado un nodo reciente o una propuesta de mejora para aplicar. Pídeme que analice uno primero.';
            statusText.innerText = msg;
            ejecutarRespuestaMariposa(msg, 0, 0);
            return;
        }

        statusText.innerText = '✨ Aplicando edición inteligente...';
        try {
            const resp = await fetch(`/api/nodo/${targetId}/smart-edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ propuesta })
            });

            if (!resp.ok) throw new Error('Fallo la edición');

            await resp.json();

            // Limpiar propuesta después de aplicar
            window.lumiContext.ultimaPropuestaMejora = null;
            agregarAlContexto({ action: 'smart-edit', success: true });

            // Refrescar UI (recargar constelación)
            loadConstellation();

            const msg = 'Entendido, he rediseñado el nodo con las mejoras que sugerí.';
            statusText.innerText = `✅ Nodo rediseñado.`;
            ejecutarRespuestaMariposa(msg, 0, 0);

        } catch (error) {
            console.error('[Smart Edit] Error:', error);
            statusText.innerText = 'Hubo un error al rediseñar el nodo.';
        }
        return;
    }

    if (accion === 'BACKUP_ALL') {
        statusText.innerText = 'Archivando iniciativas…';

        try {
            const resp = await fetch('/api/backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await resp.json();

            // Animar nodos desapareciendo
            const allNodes = document.querySelectorAll('.idea-node');
            allNodes.forEach((node, i) => {
                setTimeout(() => {
                    node.style.transition = 'transform 0.8s ease-in, opacity 0.8s ease-in';
                    node.style.transform = 'scale(0) rotate(360deg)';
                    node.style.opacity = '0';
                    setTimeout(() => node.remove(), 900);
                }, i * 100);
            });

            // Limpiar líneas SVG
            if (neuralCanvas) {
                neuralCanvas.querySelectorAll('line').forEach(l => l.remove());
            }

            const msg = `${data.count} iniciativas archivadas. Puedes recuperarlas desde el Archivo.`;
            statusText.innerText = msg;
            ejecutarRespuestaMariposa(msg, 0, 0);

        } catch (error) {
            console.error('[Backup] Error:', error);
            statusText.innerText = 'Error al crear backup.';
        }

    } else if (accion === 'SHOW_BACKUP') {
        statusText.innerText = 'Abriendo el Archivo…';

        try {
            const resp = await fetch('/api/backup', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await resp.json();

            if (data.count === 0) {
                const msg = 'El Archivo está vacío. No hay iniciativas archivadas.';
                statusText.innerText = msg;
                ejecutarRespuestaMariposa(msg, 0, 0);
                return;
            }

            // Mostrar nodos del backup como fantasmas (semi-transparentes)
            data.nodos.forEach((nodo, i) => {
                setTimeout(() => {
                    const node = createNewIdeaNode(nodo);
                    if (node) {
                        node.style.opacity = '0.5';
                        node.style.borderColor = '#8844aa';
                        node.style.boxShadow = '0 0 20px rgba(136, 68, 170, 0.4)';
                        node.classList.add('backup-ghost');
                        node.title = `🕳️ Archivado: ${nodo.backupDate || 'fecha desconocida'}`;
                    }
                }, i * 200);
            });

            const msg = `${data.count} iniciativas archivadas disponibles para recuperar.`;
            statusText.innerText = msg;
            ejecutarRespuestaMariposa(msg, 0, 0);

        } catch (error) {
            console.error('[Backup] Error mostrando:', error);
            statusText.innerText = 'Error al abrir backup.';
        }

    } else if (accion === 'RESTORE_BACKUP') {
        statusText.innerText = 'Recuperando iniciativas del Archivo…';

        try {
            const resp = await fetch('/api/restaurar-backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await resp.json();

            if (data.count === 0) {
                const msg = 'No hay iniciativas para recuperar.';
                statusText.innerText = msg;
                ejecutarRespuestaMariposa(msg, 0, 0);
                return;
            }

            // Eliminar nodos fantasma y recargar constelación
            document.querySelectorAll('.backup-ghost').forEach(n => n.remove());
            loadConstellation();

            const msg = `${data.count} iniciativas recuperadas del Archivo.`;
            statusText.innerText = msg;
            ejecutarRespuestaMariposa(msg, 0, 0);

        } catch (error) {
            console.error('[Backup] Error restaurando:', error);
            statusText.innerText = 'Error al restaurar backup.';
        }
    }
}

// === HANDLER: IDEA (Orquestador Estratégico) ===
async function handleIdea(text) {
    statusText.innerText = "🧠 Orquestador activado — desglosando misiones...";

    try {
        const response = await fetch('/api/orquestar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ texto: text })
        });

        if (response.status === 401) { handleSessionExpired(); return; }
        if (!response.ok) throw new Error('Error en orquestador');

        const data = await response.json();

        statusText.innerText = `${data.misiones.length} próximos pasos creados — actualizando el mapa…`;

        const roleColors = {
            ceo: '#ffd700', cfo: '#00e676', coo: '#29b6f6',
            cmo: '#ff7043', director: '#ab47bc'
        };

        data.misiones.forEach((mision, i) => {
            setTimeout(() => {
                const node = createNewIdeaNode(mision);
                if (node && mision.assignedRole) {
                    const color = roleColors[mision.assignedRole] || '#11b4d4';
                    node.style.borderColor = color;
                    node.style.boxShadow = `0 0 20px ${color}44, 0 10px 40px -10px rgba(0,0,0,0.5)`;
                }
            }, i * 400);
        });

        if (data.conexiones && data.conexiones.length > 0) {
            setTimeout(() => {
                renderOrchestrationLinks(data.conexiones);
            }, data.misiones.length * 400 + 500);
        }

        window.lastAIResponse = data.resumenVoz;

        setTimeout(() => {
            ejecutarRespuestaMariposa(data.resumenVoz, data.misiones.length, data.conexiones?.length || 0);
        }, data.misiones.length * 400 + 800);

    } catch (error) {
        console.error('Error en orquestador frontend:', error);
        statusText.innerText = 'Error contactando al orquestador.';
    }
}

// === RENDERIZAR LINKS DE ORQUESTACIÓN (Sinergias + Conflictos) ===
function renderOrchestrationLinks(conexiones) {
    if (!neuralCanvas || !conexiones || conexiones.length === 0) return;

    // Asegurar gradiente dorado
    if (!document.getElementById('synergy-gradient')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'synergy-gradient');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#ffd700');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#ff8c00');
        gradient.appendChild(stop1); gradient.appendChild(stop2);
        defs.appendChild(gradient);
        neuralCanvas.appendChild(defs);
    }

    conexiones.forEach(conn => {
        const nodeA = document.querySelector(`.idea-node[data-id="${conn.id_origen}"]`);
        const nodeB = document.querySelector(`.idea-node[data-id="${conn.id_destino}"]`);
        if (!nodeA || !nodeB) return;

        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', rectA.left + rectA.width / 2);
        line.setAttribute('y1', rectA.top + rectA.height / 2);
        line.setAttribute('x2', rectB.left + rectB.width / 2);
        line.setAttribute('y2', rectB.top + rectB.height / 2);
        line.setAttribute('stroke-width', '3');
        line.classList.add('synergy-line');

        if (conn.tipo === 'conflict') {
            line.setAttribute('stroke', '#ff2244');
            line.setAttribute('stroke-dasharray', '8 5');
            line.setAttribute('opacity', '0.85');
            line.style.filter = 'drop-shadow(0 0 10px #ff003366)';
        } else {
            line.setAttribute('stroke', 'url(#synergy-gradient)');
            line.setAttribute('opacity', '0.9');
            line.style.filter = 'drop-shadow(0 0 10px #ffd70066)';
        }

        // Tooltip
        if (conn.razon) {
            line.style.cursor = 'help';
            line.style.pointerEvents = 'stroke';
            const icon = conn.tipo === 'conflict' ? '⚠️ Conflicto' : '✨ Sinergia';
            line.addEventListener('mouseenter', () => {
                statusText.innerText = `${icon}: ${conn.razon}`;
            });
            line.addEventListener('mouseleave', () => {
                statusText.innerText = 'Lumina en reposo';
            });
        }

        neuralCanvas.appendChild(line);
    });
}

// ====== SISTEMA PLANETARIO ======
const PLANET_CONFIG = {
    idea: { icon: '\u{1F4A1}', label: 'Ideas', color: '#a78bfa' },
    reunion: { icon: '\u{1F4C5}', label: 'Reuniones', color: '#f59e0b' },
    tarea: { icon: '\u2705', label: 'Tareas', color: '#10b981' },
    proyecto: { icon: '\u{1F680}', label: 'Proyectos', color: '#3b82f6' }
};

let planetOrbitFrame = null;
window.currentPlanet = null;

function renderPlanets() {
    document.querySelectorAll('.planet-marker').forEach(p => p.remove());
    document.querySelectorAll('.planet-orbit-ring').forEach(r => r.remove());
    if (planetOrbitFrame) cancelAnimationFrame(planetOrbitFrame);

    if (uiLayer) uiLayer.classList.add('main-nodes-hidden');

    const counts = { idea: 0, reunion: 0, tarea: 0, proyecto: 0 };
    document.querySelectorAll('.idea-node:not(.backup-ghost)').forEach(n => {
        const cat = n.dataset.category || 'idea';
        if (counts[cat] !== undefined) counts[cat]++;
        else counts.idea++;
    });

    const orbitPadding = window.innerWidth <= 650 ? 150 : 110;
    const maxRadius = Math.max(72, Math.min(190, (window.innerWidth - orbitPadding) / 2));
    const radii = {
        idea: maxRadius * 0.42,
        reunion: maxRadius * 0.63,
        tarea: maxRadius * 0.84,
        proyecto: maxRadius
    };
    const orbitSizes = Object.fromEntries(
        Object.entries(radii).map(([category, radius]) => [category, radius * 2])
    );
    for (const [cat, size] of Object.entries(orbitSizes)) {
        const ring = document.createElement('div');
        ring.className = 'planet-orbit-ring';
        ring.style.width = size + 'px';
        ring.style.height = (size * 0.6) + 'px';
        ring.style.borderColor = PLANET_CONFIG[cat].color + '15';
        if (uiLayer) uiLayer.appendChild(ring);
    }

    const planets = {};
    const speeds = { idea: 0.0003, reunion: 0.0002, tarea: 0.00015, proyecto: 0.0001 };
    const offsets = { idea: 0, reunion: Math.PI / 2, tarea: Math.PI, proyecto: (3 * Math.PI) / 2 };

    for (const [cat, config] of Object.entries(PLANET_CONFIG)) {
        const planet = document.createElement('div');
        planet.className = 'planet-marker';
        planet.dataset.category = cat;
        planet.innerHTML = `
            <div class="planet-core" style="background: radial-gradient(circle at 35% 35%, ${config.color}, ${config.color}88); color: ${config.color}">
                <span class="planet-icon">${config.icon}</span>
            </div>
            <div class="planet-label" style="color: ${config.color}">${config.label}</div>
            ${counts[cat] > 0 ? `<div class="planet-count" style="background: ${config.color}">${counts[cat]}</div>` : ''}
        `;
        planet.addEventListener('click', () => openPlanetView(cat));
        if (uiLayer) uiLayer.appendChild(planet);
        planets[cat] = planet;
    }

    const startTime = Date.now();

    function animateOrbits() {
        const workspaceOffset = window.innerWidth > 900 ? 110 : 0;
        const centerX = (window.innerWidth / 2) + workspaceOffset;
        const centerY = window.innerHeight / 2;
        const elapsed = Date.now() - startTime;
        for (const [cat, planet] of Object.entries(planets)) {
            const angle = offsets[cat] + elapsed * speeds[cat];
            const r = radii[cat];
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r * 0.6;
            planet.style.left = x + 'px';
            planet.style.top = y + 'px';
        }
        planetOrbitFrame = requestAnimationFrame(animateOrbits);
    }
    animateOrbits();
}

async function openPlanetView(category) {
    const config = PLANET_CONFIG[category];
    if (!config) return;
    window.currentPlanet = category;

    const planetView = document.getElementById('planet-view');
    const container = document.getElementById('planet-nodes-container');
    const nameEl = document.getElementById('planet-view-name');
    const iconEl = document.getElementById('planet-view-icon');
    const countEl = document.getElementById('planet-view-count');

    planetView.style.background = `radial-gradient(ellipse at 50% 30%, ${config.color}18 0%, rgb(5,5,20) 70%)`;
    nameEl.textContent = config.label;
    nameEl.style.color = config.color;
    iconEl.textContent = config.icon;
    container.innerHTML = '<div class="planet-empty">Cargando iniciativas…</div>';
    planetView.classList.remove('hidden');

    try {
        const resp = await fetch('/api/ideas', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!resp.ok) throw new Error('Error');
        const allNodes = await resp.json();

        const iconMap = { idea: '\u{1F4A1}', reunion: '\u{1F4C5}', tarea: '\u2705', proyecto: '\u{1F680}' };
        const catNodes = allNodes.filter(n => !n.hidden).filter(n => {
            const nodeCategory = n.category || 'idea'; // Default: nodos sin categoría → idea
            if (nodeCategory === category) return true;
            return (n.resumen || '').includes(iconMap[category]);
        });

        countEl.textContent = `${catNodes.length} iniciativa${catNodes.length !== 1 ? 's' : ''}`;
        container.innerHTML = '';

        if (catNodes.length === 0) {
            container.innerHTML = `<div class="planet-empty">${config.icon} Esta área está vacía.<br>Captura una iniciativa para empezar.</div>`;
        } else {
            catNodes.forEach((nodo, i) => {
                const card = document.createElement('div');
                card.className = 'planet-node-card';
                card.style.animationDelay = `${i * 0.1}s`;
                card.style.borderColor = `${config.color}30`;

                const roleLabel = (nodo.assignedRole || 'general').toUpperCase();
                const header = document.createElement('div');
                header.className = 'card-header-row';
                const roleEl = document.createElement('div');
                roleEl.className = 'card-role';
                roleEl.style.color = config.color;
                roleEl.textContent = roleLabel;
                const openHint = document.createElement('span');
                openHint.className = 'card-open-hint';
                openHint.textContent = 'Abrir →';
                header.append(roleEl, openHint);

                const cardText = document.createElement('div');
                cardText.className = 'card-text';
                cardText.textContent = nodo.textoOriginal || nodo.resumen || 'Sin contenido';

                const meta = document.createElement('div');
                meta.className = 'card-meta';
                const status = nodo.estado || nodo.status;
                if (status) {
                    const statusChip = document.createElement('span');
                    statusChip.className = 'card-status';
                    statusChip.textContent = `● ${status}`;
                    meta.appendChild(statusChip);
                }
                const dueValue = nodo.fechaObjetivo || nodo.dueDate;
                if (dueValue) {
                    const dateEl = document.createElement('span');
                    dateEl.className = 'card-date';
                    const dateValue = new Date(String(dueValue).includes('T') ? dueValue : `${dueValue}T23:59:59`);
                    dateEl.textContent = `📅 ${new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(dateValue)}`;
                    meta.appendChild(dateEl);
                }
                if (nodo.fecha) {
                    const created = document.createElement('span');
                    created.textContent = `Creado ${new Date(nodo.fecha).toLocaleDateString('es')}`;
                    meta.appendChild(created);
                }
                const cardActions = document.createElement('span');
                cardActions.className = 'today-card-actions';
                const startBtn = document.createElement('button');
                startBtn.className = 'quick-action';
                startBtn.textContent = '▶ Iniciar';
                const doneBtn = document.createElement('button');
                doneBtn.className = 'quick-action complete';
                doneBtn.textContent = '✓ Hecho';
                [startBtn, doneBtn].forEach(btn => btn.addEventListener('click', e => e.stopPropagation()));
                startBtn.addEventListener('click', () => updateNodeOperational(nodo, { estado: 'en_progreso' }, card));
                doneBtn.addEventListener('click', () => updateNodeOperational(nodo, { estado: 'completado' }, card));
                cardActions.append(startBtn, doneBtn);
                meta.appendChild(cardActions);
                card.append(header, cardText, meta);

                card.addEventListener('click', () => {
                    const mainNode = document.querySelector(`.idea-node[data-id="${nodo.id}"]`);
                    if (mainNode) { closePlanetView(); setTimeout(() => mainNode.click(), 400); }
                });
                card.addEventListener('mouseenter', () => { card.style.boxShadow = `0 4px 30px ${config.color}40`; });
                card.addEventListener('pointerenter', () => ButterflyFlight.evadeFrom(card.getBoundingClientRect()));
                card.addEventListener('mouseleave', () => { card.style.boxShadow = ''; });
                container.appendChild(card);
            });
        }

        const msg = catNodes.length > 0
            ? `Área ${config.label}. Tienes ${catNodes.length} iniciativas aquí.`
            : `El área ${config.label} está vacía.`;
        ejecutarRespuestaMariposa(msg, 0, 0);
    } catch (error) {
        console.error('[PlanetView] Error:', error);
        container.innerHTML = '<div class="planet-empty">Error al cargar las iniciativas.</div>';
    }
}

function closePlanetView() {
    window.currentPlanet = null;
    const pv = document.getElementById('planet-view');
    pv.style.opacity = '0';
    pv.style.transform = 'scale(0.95)';
    setTimeout(() => {
        pv.classList.add('hidden');
        pv.style.opacity = '';
        pv.style.transform = '';
        renderPlanets(); // Re-render planetary orbits
    }, 300);
}

document.getElementById('planet-back-btn')?.addEventListener('click', closePlanetView);



// ====== SISTEMA DE RECORDATORIOS ======
const LuminaReminders = (() => {
    let checkInterval = null;
    const notifiedIds = new Set(); // No repetir notificaciones

    function checkReminders() {
        const allNodes = document.querySelectorAll('.idea-node[data-id]');
        const today = new Date().toISOString().split('T')[0];

        allNodes.forEach(node => {
            const id = node.dataset.id;
            if (notifiedIds.has(id)) return;

            // Buscar dueDate en data.json (guardado como data-attribute o extraído del texto)
            const dueDate = node.dataset.duedate;
            if (!dueDate) return;

            if (dueDate <= today) {
                notifiedIds.add(id);
                const nodeText = node.dataset.original || node.innerText;
                showReminderToast(nodeText, dueDate, node);
            }
        });
    }

    function showReminderToast(text, dueDate, node) {
        const isOverdue = dueDate < new Date().toISOString().split('T')[0];
        const toast = document.createElement('div');
        toast.className = 'reminder-toast';
        const icon = document.createElement('div');
        icon.className = 'reminder-icon';
        icon.textContent = isOverdue ? '🔴' : '🔔';

        const content = document.createElement('div');
        content.className = 'reminder-content';
        const title = document.createElement('div');
        title.className = 'reminder-title';
        title.textContent = isOverdue ? 'TAREA VENCIDA' : 'RECORDATORIO';
        const reminderText = document.createElement('div');
        reminderText.className = 'reminder-text';
        reminderText.textContent = String(text || '').substring(0, 80);
        const date = document.createElement('div');
        date.className = 'reminder-date';
        date.textContent = `📅 ${dueDate}`;
        content.append(title, reminderText, date);

        const close = document.createElement('button');
        close.className = 'reminder-close';
        close.type = 'button';
        close.setAttribute('aria-label', 'Cerrar recordatorio');
        close.textContent = '✕';
        close.addEventListener('click', (event) => {
            event.stopPropagation();
            toast.remove();
        });
        toast.append(icon, content, close);

        // Click para navegar al nodo
        toast.addEventListener('click', (e) => {
            if (e.target.classList.contains('reminder-close')) return;
            node.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.9)';
            node.style.transform = 'scale(1.15)';
            setTimeout(() => {
                node.style.boxShadow = '';
                node.style.transform = '';
            }, 3000);
            node.click();
            toast.remove();
        });

        document.body.appendChild(toast);

        // Auto-remove after 10s
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 10000);

        // La voz queda disponible bajo petición; los recordatorios no hablan solos.
    }

    return {
        start() {
            if (checkInterval) clearInterval(checkInterval);
            // Chequear cada 60 segundos
            checkInterval = setInterval(checkReminders, 60000);
            // Chequeo inicial a los 5s
            setTimeout(checkReminders, 5000);
            console.log('[Reminders] Sistema de recordatorios activo');
        },
        stop() {
            if (checkInterval) clearInterval(checkInterval);
        },
        check() { checkReminders(); }
    };
})();

// Handle Idea Input (Text Fallback hacia Backend)
ideaInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && ideaInput.value.trim() !== '') {
        e.preventDefault();
        await stopRecordingAndSend();
    }
});

assistant.addEventListener('click', () => {
    // Si LuminaVoice está hablando, detener la voz.
    if (typeof LuminaVoice !== 'undefined' && LuminaVoice.isSpeaking()) {
        LuminaVoice.stop();
        return;
    }

    // Mostrar u ocultar la captura. El dictado tiene su propio botón y solo
    // solicita acceso al micrófono cuando el usuario lo pulsa.
    if (inputContainer.classList.contains('hidden')) {
        inputContainer.classList.remove('hidden');
        ideaInput.value = '';
        ideaInput.focus();
        statusText.innerText = 'Escribe una idea o un próximo paso';
    } else {
        inputContainer.classList.add('hidden');
        assistant.classList.remove('listening');
        material.size = 5;
        statusText.innerText = 'Lumina en reposo';
        statusText.classList.remove('listening-text');
    }
});

// Doble-clic en la mariposa → leer última respuesta IA con LuminaVoice
assistant.addEventListener('dblclick', () => {
    if (typeof LuminaVoice !== 'undefined') {
        if (window.lastAIResponse && window.lastAIResponse.trim().length > 0) {
            LuminaVoice.speak(window.lastAIResponse);
        } else {
            LuminaVoice.speak('Hola, soy Lumina. Pregúntame algo o genera una expansión y hazme doble clic para leértela.');
        }
    }
});

// === SECUENCIA DE LA MARIPOSA (Action Loop) ===
async function ejecutarRespuestaMariposa(resumenVoz, numMisiones, numConexiones) {
    if (!assistant) return;

    // 1. Pausar vuelo errante
    if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.pause();

    // 2. Animar mariposa al centro de la pantalla
    const centerX = (window.innerWidth / 2) - 110;
    const centerY = (window.innerHeight / 2) - 110;

    assistant.style.transition = 'left 1.5s cubic-bezier(0.25, 1, 0.5, 1), top 1.5s cubic-bezier(0.25, 1, 0.5, 1), transform 1.5s ease';
    assistant.style.left = centerX + 'px';
    assistant.style.top = centerY + 'px';
    assistant.style.transform = 'scale(1.3)';

    // 3. Activar brillo pulsante dorado
    assistant.classList.add('speaking');
    material.size = 8;
    if (numMisiones > 0) {
        statusText.innerText = `🧠 Lumina informa: ${numMisiones} misiones, ${numConexiones} conexiones`;
    }
    statusText.classList.add('listening-text');

    // 4. Esperar 1.5s para que la animación se complete
    await new Promise(r => setTimeout(r, 1600));

    // 5. Hablar el resumen con LuminaVoice
    if (typeof LuminaVoice !== 'undefined' && resumenVoz) {
        LuminaVoice.speak(resumenVoz);

        // Esperar a que termine de hablar
        const waitForSpeechEnd = () => new Promise(resolve => {
            let hasStarted = false;
            let checkCount = 0;
            const check = setInterval(() => {
                checkCount++;
                const speaking = LuminaVoice.isSpeaking();
                if (speaking) hasStarted = true;
                if ((hasStarted && !speaking) || (checkCount > 15 && !hasStarted)) {
                    clearInterval(check);
                    resolve();
                }
            }, 300);
            setTimeout(() => { clearInterval(check); resolve(); }, 35000);
        });

        await waitForSpeechEnd();
    }

    // 6. Regresar mariposa a su esquina con animación suave
    assistant.classList.remove('speaking');
    assistant.style.transition = 'left 2s cubic-bezier(0.25, 1, 0.5, 1), top 2s cubic-bezier(0.25, 1, 0.5, 1), transform 2s ease';
    assistant.style.transform = 'scale(1) rotate(0deg)';
    material.size = 5;
    statusText.innerText = 'Lumina en reposo';
    statusText.classList.remove('listening-text');

    // 7. Reanudar vuelo errante después de que la transición termine
    setTimeout(() => {
        assistant.style.transition = '';
        if (typeof ButterflyFlight !== 'undefined') ButterflyFlight.resume();
    }, 2200);
}

function createNewIdeaNode(ideaData) {
    const node = document.createElement('div');
    node.className = 'idea-node';
    if (ideaData.tipo === 'agujero_negro') node.classList.add('black-hole');
    node.dataset.id = ideaData.id || "temp"; // Guardar el ID de la base de datos
    node.dataset.original = ideaData.textoOriginal || ideaData.resumen || "Idea";
    node.dataset.color = ideaData.color || 'default'; // Asignar color guardado
    node.dataset.tipo = ideaData.tipo || 'idea';

    const textToDisplay = ideaData.resumen || ideaData.textoOriginal || String(ideaData);
    const mainText = document.createElement('span');
    mainText.className = 'node-main';
    mainText.textContent = textToDisplay;
    node.appendChild(mainText);

    if (ideaData.tipo !== 'agujero_negro') {
        const lowerText = String(ideaData.textoOriginal || '').toLowerCase();
        let category = ideaData.category || ideaData.tipo || 'idea';
        if (!ideaData.category && (!ideaData.tipo || ideaData.tipo === 'idea')) {
            if (lowerText.includes('reunión') || lowerText.includes('reunion')) category = 'reunión';
            else if (lowerText.includes('proyecto')) category = 'proyecto';
            else if (lowerText.includes('tarea')) category = 'tarea';
        }
        const meta = document.createElement('span');
        meta.className = 'node-meta';
        const typeChip = document.createElement('span');
        typeChip.className = 'node-chip';
        const typeIcons = { idea: '💡', tarea: '✓', reunión: '◷', reunion: '◷', proyecto: '◆' };
        typeChip.textContent = `${typeIcons[category] || '•'} ${category}`;
        meta.appendChild(typeChip);

        const dueValue = ideaData.fechaObjetivo || ideaData.dueDate;
        if (dueValue) {
            const dueChip = document.createElement('span');
            dueChip.className = 'node-chip';
            const dueDate = new Date(String(dueValue).includes('T') ? dueValue : `${dueValue}T23:59:59`);
            const days = Math.ceil((dueDate - new Date()) / 86400000);
            if (days < 0) dueChip.classList.add('overdue');
            else if (days <= 3) dueChip.classList.add('due-soon');
            dueChip.textContent = `📅 ${new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(dueDate)}`;
            meta.appendChild(dueChip);
        }
        const role = ideaData.assignedRole || ideaData.area;
        if (role) {
            const roleChip = document.createElement('span');
            roleChip.className = 'node-chip';
            roleChip.textContent = `◎ ${String(role).toUpperCase()}`;
            meta.appendChild(roleChip);
        }
        node.appendChild(meta);

        const quickActions = document.createElement('span');
        quickActions.className = 'node-quick-actions';
        const progressBtn = document.createElement('button');
        progressBtn.type = 'button';
        progressBtn.textContent = '▶ En progreso';
        progressBtn.addEventListener('mousedown', e => e.stopPropagation());
        progressBtn.addEventListener('click', e => {
            e.stopPropagation();
            updateNodeOperational(ideaData, { estado: 'en_progreso' }, node);
        });
        const completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.textContent = '✓ Completar';
        completeBtn.addEventListener('mousedown', e => e.stopPropagation());
        completeBtn.addEventListener('click', e => {
            e.stopPropagation();
            updateNodeOperational(ideaData, { estado: 'completado' }, node);
        });
        quickActions.append(progressBtn, completeBtn);
        node.appendChild(quickActions);
        applyNodeOperationalVisual(node, ideaData);
    }

    // Guardar fecha objetivo para Timeline
    if (ideaData.fechaObjetivo) node.dataset.date = ideaData.fechaObjetivo;
    if (ideaData.dueDate) node.dataset.duedate = ideaData.dueDate;
    if (ideaData.category) node.dataset.category = ideaData.category;

    // Usar la posición que viene de base de datos o asignar una nueva
    const topPos = ideaData.y !== undefined ? ideaData.y : Math.floor(Math.random() * 60) + 15;
    const leftPos = ideaData.x !== undefined ? ideaData.x : Math.floor(Math.random() * 50) + 10;

    node.style.top = topPos + '%';
    node.style.left = leftPos + '%';

    // Ligera animación flotante desfasada
    const delay = Math.random() * 2;
    node.style.animationDelay = `-${delay}s`;

    uiLayer.appendChild(node);
    floatNodes.push(node);

    // Añadir lógica de drag and drop
    let isDragging = false;
    let justDragged = false;
    let startPosX, startPosY, currentX, currentY;
    let movementTimer = null; // Para distinguir entre click y drag

    node.addEventListener('mousedown', startDrag);
    node.addEventListener('touchstart', startDrag, { passive: false });
    node.addEventListener('pointerenter', () => ButterflyFlight.evadeFrom(node.getBoundingClientRect()));

    function startDrag(e) {
        // Prevenir click simple por defecto si se empieza a arrastrar
        isDragging = false;

        // Obtener posición inicial según tipo de evento (mouse o touch)
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        startPosX = clientX;
        startPosY = clientY;

        // Posición actual del elemento en el DOM
        const rect = node.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;

        // Estilos durante el arrastre
        node.style.transition = 'none'; // Quitar transición para que siga el cursor fluído
        node.style.zIndex = '1000'; // Traer al frente
        node.style.cursor = 'grabbing';

        movementTimer = setTimeout(() => {
            isDragging = true;
        }, 150); // Si el mouse se mantiene abajo 150ms, consideramos que es drag, no click

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    function drag(e) {
        if (!isDragging) {
            // Si el movimiento es muy rápido, forzamos que sea drag
            isDragging = true;
            clearTimeout(movementTimer);
        }

        e.preventDefault(); // Prevenir scrolling en móviles

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        const changeX = clientX - startPosX;
        const changeY = clientY - startPosY;

        // Nueva posición en pantalla (px)
        const newX = currentX + changeX;
        const newY = currentY + changeY;

        // Convertir px a porcentajes relativos a la ventana
        const percentX = (newX / window.innerWidth) * 100;
        const percentY = (newY / window.innerHeight) * 100;

        // Limitar coordenadas para que no se salgan de la pantalla (muy lejos)
        const finalX = Math.max(2, Math.min(percentX, 90)); // Entre 2% y 90%
        const finalY = Math.max(5, Math.min(percentY, 85)); // Entre 5% y 85%

        node.style.left = `${finalX}%`;
        node.style.top = `${finalY}%`;

        // Actualizar conexiones dinámicamente mientras arrastra
        drawNeuralConnections();
    }

    async function stopDrag(e) {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);

        clearTimeout(movementTimer);

        // Restaurar estilos base
        node.style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
        node.style.zIndex = '';
        node.style.cursor = 'grab';

        if (isDragging) {
            e.stopPropagation();
            isDragging = false;
            justDragged = true;
            setTimeout(() => { justDragged = false; }, 300);

            // PHASE 3: Verificar colisión con Agujero Negro
            if (typeof checkBlackHoleCollision === 'function' && checkBlackHoleCollision(node)) {
                return; // Fue absorbido, no hacer nada más
            }

            // Refrescar líneas una última vez al soltar
            drawNeuralConnections();

            // Opcional: Guardar nueva posición en BD para que persista
            // asumiendo que el ID temporal es "temp" hasta que se refresca
            const nodeId = node.dataset.id;
            if (nodeId && nodeId !== "temp" && authToken) {
                try {
                    // Calculamos los nuevos porcentajes actuales (ya seteados durante drag)
                    const currentLeft = parseFloat(node.style.left);
                    const currentTop = parseFloat(node.style.top);

                    await fetch(`/api/ideas/${nodeId}/posicion`, {
                        method: 'PATCH',
                        headers: getHeaders(),
                        body: JSON.stringify({ x: currentLeft, y: currentTop })
                    });
                } catch (err) {
                    console.error("No se pudo guardar la posición:", err);
                }
            }
        }
    }

    // Permitir clic para interactuar
    node.addEventListener('click', (_e) => {
        if (!isDragging && !justDragged) {
            document.querySelectorAll('.idea-node.node-selected').forEach(n => n.classList.remove('node-selected'));
            node.classList.add('node-selected');
            // Si es agujero negro, abrir su modal especial
            if (ideaData.tipo === 'agujero_negro') {
                if (typeof openBlackholeModal === 'function') openBlackholeModal(ideaData);
            } else {
                openNodeModal(node, ideaData);
            }
        }
    });

    // Trigger animation in
    requestAnimationFrame(() => {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0) scale(1)';
        node.style.cursor = 'grab'; // Cambiar cursor inicial

        // Refrescar conexiones 
        setTimeout(drawNeuralConnections, 100);
    });

    return node;
}

// Cargar recuerdos desde Backend (Requiere Token)
async function loadConstellation() {
    try {
        const response = await fetch('/api/ideas', {
            headers: getHeaders()
        });

        if (response.status === 401) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) throw new Error("Fallo al cargar memoria.");
        const ideas = await response.json();

        // Limpiar render previo para que la re-sincronización sea idempotente
        // (si no, los cambios en vivo duplicarían burbujas en el mapa).
        floatNodes.forEach(n => { if (n.parentNode) n.parentNode.removeChild(n); });
        floatNodes = [];
        if (neuralCanvas) neuralCanvas.querySelectorAll('line').forEach(l => l.remove());

        statusText.innerText = `Mapa de ${currentUsername} restaurado.`;
        conectarTiempoReal(); // pizarra viva: recibir cambios de otros dispositivos

        // Renderizar secuencialmente (filtrar ocultos por agujeros negros)
        const visibleIdeas = ideas.filter(i => !i.hidden);
        visibleIdeas.forEach((idea, index) => {
            setTimeout(() => createNewIdeaNode(idea), index * 300);
        });

        setTimeout(() => {
            statusText.innerText = "Lumina en reposo";
            renderPlanets(); // Renderizar planetas después de cargar nodos
        }, 3000);
    } catch (error) {
        console.error("Error cargando DB:", error);
    }
}

// NO cargar de inmediato, esperar a ver si tiene sesión
// setTimeout(loadConstellation, 500);

// ====== TIEMPO REAL (SSE) — pizarra viva multi-dispositivo ======
let realtimeSource = null;

function conectarTiempoReal() {
    if (realtimeSource || !currentUsername) return;
    try {
        realtimeSource = new EventSource('/api/stream'); // auth por cookie HttpOnly (same-origin)
        realtimeSource.onopen = () => console.log('[TiempoReal] Canal SSE abierto');
        realtimeSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.tipo === 'conectado') {
                    showLuminaToast('🛰️ Sincronización en vivo activa');
                } else if (data.tipo === 'datos-actualizados') {
                    if (data.usuario && data.usuario !== currentUsername) {
                        showLuminaToast(`🔄 ${data.usuario} actualizó el mapa — sincronizando…`);
                    }
                    loadConstellation();
                    if (todayModal && !todayModal.classList.contains('hidden')) loadToday();
                }
                // 'presencia': ignorado en v1 (podría mostrarse como indicador)
            } catch { /* heartbeats ": ping" no son JSON */ }
        };
        realtimeSource.onerror = () => {
            console.warn('[TiempoReal] Canal SSE interrumpido; reintentando automáticamente…');
        };
    } catch (err) {
        console.warn('[TiempoReal] SSE no disponible:', err.message);
    }
}

// ====== PIZARRA: notas adhesivas con doble clic en el lienzo ======
function crearNotaEn(x, y) {
    if (!currentUsername) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sticky-input';
    input.placeholder = 'Escribe tu nota y pulsa Enter…';
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    document.body.appendChild(input);
    input.focus();

    const guardar = async () => {
        const texto = input.value.trim();
        input.remove();
        if (!texto) return;
        try {
            const resp = await fetch('/api/nodo-manual', {
                method: 'POST',
                headers: { ...getHeaders() },
                body: JSON.stringify({ x, y, texto })
            });
            if (resp.status === 401) return handleSessionExpired();
            if (!resp.ok) throw new Error('No se pudo crear la nota');
            const data = await resp.json();
            createNewIdeaNode(data.nodo); // aparece al instante; el SSE sincroniza al resto
            showLuminaToast('🗒️ Nota creada en la pizarra');
        } catch (err) {
            console.error('[Pizarra]', err);
            showLuminaToast('No se pudo crear la nota');
        }
    };
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') guardar();
        if (e.key === 'Escape') input.remove();
    });
    input.addEventListener('blur', guardar);
}

if (appView) {
    appView.addEventListener('dblclick', (e) => {
        // Solo sobre el fondo: ignorar dobles clics en nodos, modales o controles
        if (e.target.closest('.idea-node, .lumina-toast, .modal, input, button')) return;
        crearNotaEn(e.clientX, e.clientY);
    });
}

// Botón visible "🗒️ Nota": alternativa al doble clic para crear notas.
function conectarBotonNota() {
    const contenedor = btnToday?.parentNode;
    if (!contenedor || document.getElementById('btn-note')) return;
    const btnNote = document.createElement('button');
    btnNote.id = 'btn-note';
    btnNote.type = 'button';
    btnNote.className = btnToday?.className || 'nav-btn';
    btnNote.textContent = '🗒️ Nota';
    btnNote.title = 'Crear una nota adhesiva en el centro de la pizarra';
    btnNote.addEventListener('click', () => {
        crearNotaEn(window.innerWidth / 2, window.innerHeight / 2);
    });
    contenedor.insertBefore(btnNote, btnToday);
}

// ====== VOZ LOCAL: dictar a Lumi con el micrófono del Mac ======
function conectarMicLumi() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btnMic = document.createElement('button');
    btnMic.type = 'button';
    btnMic.className = 'quick-action';
    btnMic.textContent = '🎤';
    btnMic.title = SpeechRecognition
        ? 'Dicta a Lumi con tu voz (en Safari usa el dictado local del Mac)'
        : 'Tu navegador no soporta dictado por voz';
    if (chatInput?.parentNode && !document.getElementById('btn-mic-lumi')) {
        btnMic.id = 'btn-mic-lumi';
        chatInput.parentNode.insertBefore(btnMic, btnSendChat);
    }
    if (!SpeechRecognition) return;

    let rec = null;
    btnMic.addEventListener('click', () => {
        if (rec) { try { rec.stop(); } catch { /* ignore */ } rec = null; btnMic.textContent = '🎤'; return; }
        rec = new SpeechRecognition();
        rec.lang = 'es-ES';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e) => {
            const texto = e.results[0][0].transcript;
            chatInput.value = texto;
            sendChatMessage();
        };
        rec.onend = () => { rec = null; btnMic.textContent = '🎤'; };
        rec.onerror = () => { rec = null; btnMic.textContent = '🎤'; };
        btnMic.textContent = '🔴';
        try { rec.start(); } catch { btnMic.textContent = '🎤'; }
    });
}

// ====== LÓGICA DEL MODAL INTERACTIVO ======
const nodeModal = document.getElementById('node-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalOriginalText = document.getElementById('modal-original-text');
const modalExpansionArea = document.getElementById('modal-expansion-area');
const modalExpansionText = document.getElementById('modal-expansion-text');
const btnExpand = document.getElementById('btn-expand');
const btnDelete = document.getElementById('btn-delete');

// Nuevas variables Fase 2
const modalDate = document.getElementById('modal-date');
const modalObservations = document.getElementById('modal-observations');
const modalStatus = document.getElementById('modal-status');
const modalPriority = document.getElementById('modal-priority');
const modalProgress = document.getElementById('modal-progress');
const modalProgressValue = document.getElementById('modal-progress-value');
const satellitesList = document.getElementById('satellites-list');
const newSatelliteInput = document.getElementById('new-satellite-input');
const btnAddSatellite = document.getElementById('btn-add-satellite');
const btnAiSatellites = document.getElementById('btn-ai-satellites');

let selectedNodeId = null;
let selectedNodeElement = null;
let selectedIdeaData = null; // Guardar referencia de datos para edición

function openNodeModal(nodeElement, ideaData) {
    selectedNodeId = ideaData.id;
    selectedNodeElement = nodeElement;
    selectedIdeaData = ideaData;

    // Llenar Modal (Texto editable)
    modalOriginalText.innerText = ideaData.textoOriginal || ideaData.resumen || "";

    // Llenar nuevos campos
    modalDate.value = ideaData.fechaObjetivo || "";
    modalObservations.value = ideaData.observaciones || "";
    modalStatus.value = ideaData.estado || 'pendiente';
    modalPriority.value = ideaData.prioridad || 'media';
    modalProgress.value = ideaData.progreso || 0;
    modalProgressValue.textContent = `${modalProgress.value}%`;

    // Llenar Satélites
    satellitesList.innerHTML = "";
    if (ideaData.subIdeas && Array.isArray(ideaData.subIdeas)) {
        ideaData.subIdeas.forEach(sub => renderSatellite(sub));
    }

    // Comprobar si ya tiene expansión y precargarla
    if (ideaData.expansion) {
        const formattedExp = safeMultiline(ideaData.expansion);
        modalExpansionText.innerHTML = formattedExp;
        modalExpansionArea.classList.remove('hidden');
        btnExpand.innerText = "✅ Expandido";
        btnExpand.disabled = true; // Evitar regenerar sobre la misma (o false si quieres regenerar)
    } else {
        modalExpansionArea.classList.add('hidden');
        modalExpansionText.innerHTML = '';
        btnExpand.disabled = false;
        btnExpand.innerText = "✨ Expandir Estrategia";
    }

    const btnSaveEdit = document.getElementById('btn-save-edit');
    if (btnSaveEdit) btnSaveEdit.classList.add('hidden');

    // Configurar swatches (Color piker)
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const nodeColor = ideaData.color || 'default';
    colorSwatches.forEach(swatch => {
        swatch.classList.remove('active');
        if (swatch.dataset.color === nodeColor) {
            swatch.classList.add('active');
        }
    });

    nodeModal.classList.remove('hidden');
    // Auto-dim butterfly during modal
    if (assistant) { assistant.style.opacity = '0.3'; assistant.style.pointerEvents = 'none'; }
}

closeModalBtn.addEventListener('click', () => {
    nodeModal.classList.add('hidden');
    // Restore butterfly
    if (assistant) { assistant.style.opacity = '1'; assistant.style.pointerEvents = 'auto'; }
});

// Acción: Eliminar
btnDelete.addEventListener('click', async () => {
    if (!selectedNodeId) return;

    btnDelete.innerText = "Borrando...";
    try {
        const res = await fetch(`/api/ideas/${selectedNodeId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (res.status === 401) return handleSessionExpired();

        if (res.ok) {
            // Eliminar del DOM Visual
            selectedNodeElement.style.opacity = '0';
            selectedNodeElement.style.transform = 'scale(0)';

            // Sacar del arreglo de arrays flotantes para que deje de estar conectado
            floatNodes = floatNodes.filter(n => n !== selectedNodeElement);
            drawNeuralConnections(); // Redibujar líneas sin el nodo borrado

            setTimeout(() => {
                if (selectedNodeElement && selectedNodeElement.parentNode) {
                    selectedNodeElement.parentNode.removeChild(selectedNodeElement);
                }
            }, 500);
            nodeModal.classList.add('hidden');
        }
    } catch (err) {
        console.error("Error al borrar:", err);
    }
    btnDelete.innerText = "🗑️ Borrar";
});

// ====== LÓGICA DE EDICIÓN MANUAL Y COLORES ======
const btnSaveEdit = document.getElementById('btn-save-edit');
const colorSwatches = document.querySelectorAll('.color-swatch');

// Función render de satélites a nivel superior: la usa openNodeModal.
function renderSatellite(satelliteData) {
    const item = document.createElement('div');
    item.className = 'satellite-item';
    item.dataset.id = satelliteData.id || Date.now().toString();

    const text = document.createElement('span');
    text.className = 'satellite-text';
    text.innerText = satelliteData.texto;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-satellite';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Eliminar próximo paso';

    removeBtn.onclick = () => {
        item.remove();
        btnSaveEdit.classList.remove('hidden');
    };

    item.appendChild(text);
    item.appendChild(removeBtn);
    satellitesList.appendChild(item);
}
window.renderSatellite = renderSatellite; // Exponer para compatibilidad

if (btnSaveEdit && modalOriginalText) {
    // Mostrar botón "Guardar" al editar el texto
    modalOriginalText.addEventListener('input', () => {
        btnSaveEdit.classList.remove('hidden');
    });

    // Mostrar botón "Guardar" y limpiar inputs
    [newSatelliteInput, modalDate, modalObservations, modalStatus, modalPriority, modalProgress].forEach(el => {
        if (el) el.addEventListener('input', () => {
            btnSaveEdit.classList.remove('hidden');
            if (el === modalProgress) modalProgressValue.textContent = `${modalProgress.value}%`;
        });
    });

    // Validar paste en puro texto para mantener diseño premium sin formatos raros
    modalOriginalText.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        btnSaveEdit.classList.remove('hidden');
    });

    // Cambiar color visualmente y mostrar botón guardar
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            colorSwatches.forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');
            btnSaveEdit.classList.remove('hidden');
        });
    });

    // ---- Lógica de Satélites (UI interactiva local) ----

    // Añadir satélite manual
    btnAddSatellite.addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir cualquier acción por defecto (como envío de formularios invisibles)

        const text = newSatelliteInput.value.trim();
        if (text) {
            renderSatellite({ texto: text });
            newSatelliteInput.value = '';

            // Forzar vista de botón guardar
            const btnSave = document.getElementById('btn-save-edit');
            if (btnSave) btnSave.classList.remove('hidden');
        }
    });

    newSatelliteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnAddSatellite.click();
        }
    });

    // Inspirar satélites con IA
    btnAiSatellites.addEventListener('click', async () => {
        if (!selectedNodeId) return;

        btnAiSatellites.disabled = true;
        btnAiSatellites.innerText = "Pensando...";
        if (typeof AudioEngine !== 'undefined') AudioEngine.playMagic();

        try {
            const response = await fetch(`/api/ideas/${selectedNodeId}/subideas-ai`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (response.status === 401) return handleSessionExpired();
            if (!response.ok) throw new Error("Error en API IA");

            const data = await response.json();

            if (modalStatus.value !== (selectedIdeaData.estado || 'pendiente') ||
                modalPriority.value !== (selectedIdeaData.prioridad || 'media') ||
                Number(modalProgress.value) !== Number(selectedIdeaData.progreso || 0)) {
                await updateNodeOperational(selectedIdeaData, {
                    estado: modalStatus.value,
                    prioridad: modalPriority.value,
                    progreso: Number(modalProgress.value)
                }, selectedNodeElement, false);
            }

            // Renderizar los nuevos obtenidos
            if (data.satelites) {
                data.satelites.forEach(sub => renderSatellite(sub));
                btnSaveEdit.classList.remove('hidden'); // Necesita guardar para persistir al instante o los guarda el backend ya
            }

        } catch (error) {
            console.error(error);
            alert("No pudimos inspirar nuevas ideas en este momento.");
        } finally {
            btnAiSatellites.disabled = false;
            btnAiSatellites.innerText = "✨ Inspirar";
        }
    });

    // Guardar los cambios (Patch Master)
    btnSaveEdit.addEventListener('click', async () => {
        if (!selectedNodeId) return;

        const newText = modalOriginalText.innerText.trim();
        const activeSwatch = document.querySelector('.color-swatch.active');
        const newColor = activeSwatch ? activeSwatch.dataset.color : 'default';

        const newDate = modalDate.value;
        const newObs = modalObservations.value;
        // Obtenemos los data-id y textos de los satelites renderizados
        const newSubIdeas = Array.from(document.querySelectorAll('.satellite-item')).map(item => ({
            id: item.dataset.id,
            texto: item.querySelector('.satellite-text').innerText,
            completado: false
        }));

        btnSaveEdit.innerText = "Guardando...";
        btnSaveEdit.disabled = true;

        try {
            const response = await fetch(`/api/ideas/${selectedNodeId}/edicion`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({
                    textoOriginal: newText,
                    color: newColor,
                    fechaObjetivo: newDate,
                    observaciones: newObs,
                    subIdeas: newSubIdeas
                })
            });

            if (response.status === 401) return handleSessionExpired();
            if (!response.ok) throw new Error("Error al guardar cambios");

            const data = await response.json();

            // Actualizar referencias visuales
            if (selectedNodeElement) {
                selectedNodeElement.dataset.color = data.idea.color;
                selectedNodeElement.dataset.original = data.idea.textoOriginal;
                if (data.idea.fechaObjetivo) selectedNodeElement.dataset.date = data.idea.fechaObjetivo;
                const nodeMain = selectedNodeElement.querySelector('.node-main');
                if (nodeMain) nodeMain.textContent = data.idea.resumen || data.idea.textoOriginal;
            }

            if (selectedIdeaData) {
                selectedIdeaData.textoOriginal = data.idea.textoOriginal;
                selectedIdeaData.resumen = data.idea.resumen;
                selectedIdeaData.color = data.idea.color;
                selectedIdeaData.fechaObjetivo = data.idea.fechaObjetivo;
                selectedIdeaData.observaciones = data.idea.observaciones;
                selectedIdeaData.subIdeas = data.idea.subIdeas;
            }

            btnSaveEdit.classList.add('hidden');
            if (typeof AudioEngine !== 'undefined' && AudioEngine.ctx) AudioEngine.playClick();

        } catch (err) {
            console.error(err);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            btnSaveEdit.innerText = "💾 Guardar";
            btnSaveEdit.disabled = false;
        }
    });
}

// Acción: Expandir Mágicamente
btnExpand.addEventListener('click', async () => {
    if (!selectedNodeId) return;

    btnExpand.disabled = true;
    btnExpand.innerText = "Destilando inteligencia...";
    statusText.innerText = "Lumina expandiendo horizontes cruzados...";

    try {
        const response = await fetch('/api/expandir', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ id: selectedNodeId })
        });

        if (response.status === 401) return handleSessionExpired();

        if (!response.ok) throw new Error("Fallo API expansión");

        const data = await response.json();

        // Actualizar referencia visual rápida
        if (selectedIdeaData) selectedIdeaData.expansion = data.expansion;

        // Formatear respuesta (Reemplazar saltos por <br> o viñetas)
        const formattedExp = safeMultiline(data.expansion);

        modalExpansionText.innerHTML = formattedExp;
        modalExpansionArea.classList.remove('hidden'); // Mostrar zona
        btnExpand.innerText = "✅ Expandido";

        // Guardar texto para que la Mariposa lo lea si el usuario le da clic
        window.lastAIResponse = data.expansion;

    } catch (e) {
        console.error(e);
        btnExpand.innerText = "Error. Reintentar.";
        btnExpand.disabled = false;
    }

    setTimeout(() => {
        statusText.innerText = "Lumina en reposo";
    }, 3000);
});

// ====== LÓGICA DE CONEXIONES NEURONALES ======
function drawNeuralConnections() {
    // Si no existe el canvas o hay menos de 2 nodos, salir
    if (!neuralCanvas || floatNodes.length < 2) {
        if (neuralCanvas) {
            // Preservar <defs> (gradientes de sinergias), solo limpiar líneas
            neuralCanvas.querySelectorAll('line.neural-line').forEach(l => l.remove());
        }
        return;
    }

    // Limpiar solo líneas neuronales, preservando <defs> y líneas de sinergia
    neuralCanvas.querySelectorAll('line.neural-line').forEach(l => l.remove());

    // Distancia máxima para conectar nodos
    const maxDistanceInfo = window.innerWidth * 0.25;

    for (let i = 0; i < floatNodes.length; i++) {
        for (let j = i + 1; j < floatNodes.length; j++) {
            const nodeA = floatNodes[i];
            const nodeB = floatNodes[j];

            // Obtener centros de los nodos
            const rectA = nodeA.getBoundingClientRect();
            const rectB = nodeB.getBoundingClientRect();

            const centerX_A = rectA.left + (rectA.width / 2);
            const centerY_A = rectA.top + (rectA.height / 2);

            const centerX_B = rectB.left + (rectB.width / 2);
            const centerY_B = rectB.top + (rectB.height / 2);

            // Calcular distancia Euclidiana
            const distance = Math.sqrt(Math.pow(centerX_B - centerX_A, 2) + Math.pow(centerY_B - centerY_A, 2));

            // Si están lo suficientemente cerca, dibujar línea
            if (distance < maxDistanceInfo) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', centerX_A);
                line.setAttribute('y1', centerY_A);
                line.setAttribute('x2', centerX_B);
                line.setAttribute('y2', centerY_B);
                line.classList.add('neural-line');

                // Variar la opacidad según la distancia (más cerca = más fuerte)
                const opacity = 1 - (distance / maxDistanceInfo);
                line.style.opacity = Math.max(0.05, opacity * 0.7);

                neuralCanvas.appendChild(line);
            }
        }
    }
}

// Escuchar resize de ventana para redibujar
window.addEventListener('resize', () => {
    // Mantenemos también los resizes extras que puedan haber
    requestAnimationFrame(drawNeuralConnections);
});

// ====== LÓGICA DE ORGANIZACIÓN AUTOMÁTICA ======
if (btnOrganize) {
    btnOrganize.addEventListener('click', async () => {
        if (floatNodes.length === 0) return;

        btnOrganize.disabled = true;
        btnOrganize.innerText = "Organizando...";
        statusText.innerText = "Lumina reorganizando el mapa…";
        statusText.classList.add('listening-text');

        // Simular un tiempo de "pensamiento" de la IA para organizar
        await new Promise(r => setTimeout(r, 1000));

        // Clustering simple: distribuir en pequeños grupos o anillos
        const total = floatNodes.length;
        const cols = Math.ceil(Math.sqrt(total));
        const rows = Math.ceil(total / cols);

        const cellWidth = 80 / cols; // Espacio util de 80% ancho
        const cellHeight = 70 / rows; // Espacio util de 70% alto

        let i = 0;
        const updates = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (i >= total) break;

                const node = floatNodes[i];
                const nodeId = node.dataset.id;

                // Calcular posición base en la cuadrícula + algo de aleatoriedad orgánica
                let finalX = 10 + (c * cellWidth) + (Math.random() * (cellWidth * 0.4));
                let finalY = 15 + (r * cellHeight) + (Math.random() * (cellHeight * 0.4));

                // Límites de seguridad
                finalX = Math.max(2, Math.min(finalX, 90));
                finalY = Math.max(5, Math.min(finalY, 85));

                // Aplicar estilos
                node.style.transition = 'all 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
                node.style.left = `${finalX}%`;
                node.style.top = `${finalY}%`;

                // Guardar para actualizar en DB
                if (nodeId && nodeId !== "temp" && authToken) {
                    updates.push(
                        fetch(`/api/ideas/${nodeId}/posicion`, {
                            method: 'PATCH',
                            headers: getHeaders(),
                            body: JSON.stringify({ x: finalX, y: finalY })
                        }).catch(e => console.error(e))
                    );
                }

                i++;
            }
        }

        // Animar las conexiones mientras se mueven
        const animInterval = setInterval(drawNeuralConnections, 50);

        setTimeout(() => {
            clearInterval(animInterval);
            drawNeuralConnections(); // Dibujado final

            btnOrganize.disabled = false;
            btnOrganize.innerText = "Organizar";
            statusText.innerText = "Lumina en reposo";
            statusText.classList.remove('listening-text');
        }, 1500);

        // Disparar las actualizaciones a la DB de fondo
        Promise.all(updates);
    });
}

// ====== LÓGICA DE SÍNTESIS GLOBAL ======
const sintesisModal = document.getElementById('sintesis-modal');
const closeSintesis = document.getElementById('close-sintesis');
const sintesisContent = document.getElementById('sintesis-content');

if (closeSintesis && sintesisModal) {
    closeSintesis.addEventListener('click', () => {
        sintesisModal.classList.add('hidden');
    });
}

if (btnSynthesize) {
    btnSynthesize.addEventListener('click', async () => {
        if (floatNodes.length === 0) {
            alert("No hay iniciativas en tu mapa para resumir.");
            return;
        }

        btnSynthesize.disabled = true;
        btnSynthesize.innerText = "Destilando Visión...";
        statusText.innerText = "Lumina conectando todos los puntos...";
        statusText.classList.add('listening-text');

        // Extraer texto de todos los nodos actuales
        const ideasOriginales = floatNodes.map(n => n.dataset.original).filter(Boolean);

        try {
            const response = await fetch('/api/sintesis', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ideas: ideasOriginales })
            });

            if (response.status === 401) return handleSessionExpired();
            if (!response.ok) throw new Error("Fallo API síntesis");

            const data = await response.json();

            // Reemplazar saltos de línea con <br> y detectar listas para bold
            let formattedSintesis = safeMultiline(data.sintesis);
            // Hacer bold los números o viñetas al principio
            formattedSintesis = formattedSintesis.replace(/(\d+\.\s.*?)(<br\/>|$)/g, '<strong>$1</strong>$2');

            sintesisContent.innerHTML = formattedSintesis;
            sintesisModal.classList.remove('hidden');

            // Guardar síntesis para que la Mariposa lo lea si el usuario le da clic
            window.lastAIResponse = data.sintesis;
        } catch (error) {
            console.error(error);
            alert("Hubo un error al generar la Síntesis Global.");
        } finally {
            btnSynthesize.disabled = false;
            btnSynthesize.innerText = "Sintetizar Global";
            statusText.innerText = "Lumina en reposo";
            statusText.classList.remove('listening-text');
        }
    });
}

// ====== MOTOR DE AUDIO ESTRUCTURAL (WEB AUDIO API) ======
// Ultra-premium spatial sound design without external assets
const AudioEngine = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Función base para generar tonos suaves y espaciales (glassmorphism auditivo)
    playTone(freq, type = 'sine', duration = 0.1, vol = 0.05) {
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            // Envolvente de volumen (ataque rápido, caída exponencial)
            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio silenciado por navegador", e);
        }
    },

    // Sonido sutil al pasar el mouse por encima
    playHover() {
        this.playTone(800, 'sine', 0.1, 0.02);
    },

    // Sonido al hacer clic de confirmación suave (como cristal)
    playClick() {
        this.playTone(1200, 'sine', 0.1, 0.05);
        setTimeout(() => this.playTone(1600, 'sine', 0.15, 0.03), 30);
    },

    // Secuencia mágica al invocar la IA o Acciones Especiales
    playMagic() {
        const chord = [880, 1108, 1318]; // A5, C#6, E6
        chord.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.04), i * 100);
        });
    }
};

// Delegación global de eventos de Audio
document.addEventListener('click', (e) => {
    AudioEngine.init(); // El primer clic habilita el motor en el navegador

    const target = e.target;

    // Reproducir magia
    if (target.closest('.btn-magic') || target.closest('#ai-assistant')) {
        AudioEngine.playMagic();
    }
    // Reproducir click estándar cristalino
    else if (
        target.closest('.idea-node') ||
        target.closest('button') ||
        target.closest('.tabs button') ||
        target.closest('.close-btn')
    ) {
        AudioEngine.playClick();
    }
});

document.addEventListener('mouseover', (e) => {
    const target = e.target;

    // Solo reproducir si es interactivo y el audio ya fue inicializado por un clic previo
    if (AudioEngine.ctx && AudioEngine.ctx.state === 'running') {
        if (
            target.closest('.idea-node') ||
            target.closest('button') ||
            target.closest('.tabs button') ||
            target.closest('#ai-assistant')
        ) {
            // Evitar spam de sonido con un debounce/bandera simple
            if (!target.dataset.audioHovered) {
                target.dataset.audioHovered = "true";
                AudioEngine.playHover();

                // Limpiar la bandera al salir
                target.addEventListener('mouseout', function onOut() {
                    delete target.dataset.audioHovered;
                    target.removeEventListener('mouseout', onOut);
                }, { once: true });
            }
        }
    }
});

// ====== PHASE 3: ULTIMATE LUMINA ======

// === Feature 9: Agujeros Negros ===
const btnBlackHole = document.getElementById('btn-black-hole');
const blackholeModal = document.getElementById('blackhole-modal');
const closeBlackhole = document.getElementById('close-blackhole');
const blackholeContents = document.getElementById('blackhole-contents');
const blackholeTitle = document.getElementById('blackhole-title');

if (btnBlackHole) {
    btnBlackHole.addEventListener('click', async () => {
        const nombre = prompt('Nombre de la carpeta de archivo:');
        if (!nombre || !nombre.trim()) return;

        btnBlackHole.disabled = true;
        try {
            const response = await fetch('/api/agujero-negro', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ nombre: nombre.trim() })
            });
            if (response.status === 401) return handleSessionExpired();
            const data = await response.json();
            if (data.nodo) {
                createNewIdeaNode(data.nodo);
                statusText.innerText = `Carpeta de archivo "${nombre}" creada.`;
                setTimeout(() => statusText.innerText = "Lumina en reposo", 3000);
            }
        } catch (err) {
            console.error(err);
        }
        btnBlackHole.disabled = false;
    });
}

if (closeBlackhole && blackholeModal) {
    closeBlackhole.addEventListener('click', () => blackholeModal.classList.add('hidden'));
}

// Detección de colisión al soltar un nodo sobre un agujero negro
function checkBlackHoleCollision(draggedNode) {
    if (draggedNode.dataset.tipo === 'agujero_negro') return false; // BH no se absorbe a sí mismo

    const blackHoles = document.querySelectorAll('.idea-node.black-hole');
    const dragRect = draggedNode.getBoundingClientRect();
    const dragCX = dragRect.left + dragRect.width / 2;
    const dragCY = dragRect.top + dragRect.height / 2;

    for (const bh of blackHoles) {
        if (bh === draggedNode) continue;
        const bhRect = bh.getBoundingClientRect();
        const bhCX = bhRect.left + bhRect.width / 2;
        const bhCY = bhRect.top + bhRect.height / 2;

        const dist = Math.sqrt(Math.pow(bhCX - dragCX, 2) + Math.pow(bhCY - dragCY, 2));

        if (dist < 80) { // Estamos dentro del radio gravitacional
            absorbNode(draggedNode, bh);
            return true;
        }
    }
    return false;
}

async function absorbNode(ideaNode, blackHoleNode) {
    const ideaId = ideaNode.dataset.id;
    const bhId = blackHoleNode.dataset.id;

    // Animación de absorción
    blackHoleNode.classList.add('absorbing');
    ideaNode.style.transition = 'all 0.5s ease-in';
    ideaNode.style.transform = 'scale(0)';
    ideaNode.style.opacity = '0';

    if (typeof AudioEngine !== 'undefined') AudioEngine.playMagic();

    setTimeout(() => {
        blackHoleNode.classList.remove('absorbing');
        // Remover del DOM y del array
        if (ideaNode.parentNode) ideaNode.parentNode.removeChild(ideaNode);
        floatNodes = floatNodes.filter(n => n !== ideaNode);
        drawNeuralConnections();
    }, 500);

    // Persistir en el servidor
    try {
        await fetch(`/api/agujero-negro/${bhId}/absorber`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ ideaId })
        });
    } catch (err) {
        console.error('Error al absorber:', err);
    }
}

function openBlackholeModal(bhData) {
    blackholeTitle.innerText = `Archivo · ${bhData.textoOriginal}`;
    blackholeContents.innerHTML = '';

    if (!bhData.capturedIds || bhData.capturedIds.length === 0) {
        blackholeContents.innerHTML = '<p style="color:var(--color-silver); opacity:0.5; text-align:center;">Vacío. Arrastra burbujas aquí para absorberlas.</p>';
    } else {
        // Necesitamos cargar los datos de las ideas capturadas
        fetch('/api/ideas', { headers: getHeaders() })
            .then(r => r.json())
            .then(allIdeas => {
                const captured = allIdeas.filter(i => bhData.capturedIds.includes(i.id));
                captured.forEach(idea => {
                    const item = document.createElement('div');
                    item.className = 'bh-captured-item';
                    const label = document.createElement('span');
                    label.textContent = idea.resumen || idea.textoOriginal;
                    const releaseButton = document.createElement('button');
                    releaseButton.dataset.id = idea.id;
                    releaseButton.textContent = 'Recuperar';
                    item.append(label, releaseButton);
                    releaseButton.addEventListener('click', async () => {
                        try {
                            const res = await fetch(`/api/agujero-negro/${bhData.id}/liberar`, {
                                method: 'PATCH',
                                headers: getHeaders(),
                                body: JSON.stringify({ ideaId: idea.id })
                            });
                            if (res.ok) {
                                const rData = await res.json();
                                item.remove();
                                // Re-crear el nodo en el lienzo
                                delete rData.idea.hidden;
                                delete rData.idea.parentId;
                                createNewIdeaNode(rData.idea);
                                bhData.capturedIds = bhData.capturedIds.filter(cid => cid !== idea.id);
                            }
                        } catch (err) { console.error(err); }
                    });
                    blackholeContents.appendChild(item);
                });
                if (captured.length === 0) {
                    blackholeContents.innerHTML = '<p style="color:var(--color-silver); opacity:0.5; text-align:center;">Vacío.</p>';
                }
            })
            .catch(err => {
                console.error('Error cargando ideas del agujero negro:', err);
                blackholeContents.innerHTML = '<p style="color:#ff6b6b; text-align:center;">Error al cargar contenido.</p>';
            });
    }
    blackholeModal.classList.remove('hidden');
}

// === Feature 10: Cronología Estelar ===
const btnTimeline = document.getElementById('btn-timeline');
let timelineMode = false;
let timelineBar = null;

if (btnTimeline) {
    btnTimeline.addEventListener('click', () => {
        timelineMode = !timelineMode;
        const uiLayerEl = document.getElementById('ui-layer');

        if (timelineMode) {
            btnTimeline.innerText = '🗺️ Mapa';
            uiLayerEl.classList.add('timeline-active');

            // Crear barra de timeline
            timelineBar = document.createElement('div');
            timelineBar.className = 'timeline-bar';
            document.body.appendChild(timelineBar);

            // Reordenar nodos por fecha
            const nodesWithDate = floatNodes
                .map(n => ({ node: n, date: n.dataset.date || '9999-12-31' }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const constellation = document.getElementById('constellation');
            nodesWithDate.forEach(({ node }) => {
                constellation.appendChild(node);
                // Añadir label de fecha si existe
                const existingLabel = node.querySelector('.timeline-date-label');
                if (existingLabel) existingLabel.remove();

                if (node.dataset.date && node.dataset.date !== '9999-12-31') {
                    const label = document.createElement('div');
                    label.className = 'timeline-date-label';
                    label.innerText = node.dataset.date;
                    node.style.position = 'relative';
                    node.appendChild(label);
                }
            });

            statusText.innerText = 'Modo Cronología activado.';
        } else {
            btnTimeline.innerText = '📅 Cronología';
            uiLayerEl.classList.remove('timeline-active');

            if (timelineBar) { timelineBar.remove(); timelineBar = null; }

            // Restaurar posiciones absolutas
            floatNodes.forEach(n => {
                n.style.position = 'absolute';
                const label = n.querySelector('.timeline-date-label');
                if (label) label.remove();
            });

            statusText.innerText = 'Mapa estratégico restaurado.';
        }
        setTimeout(() => statusText.innerText = "Lumina en reposo", 3000);
    });
}

// === Feature 11: Conexiones Semánticas IA ===
const btnSynergies = document.getElementById('btn-synergies');

if (btnSynergies) {
    btnSynergies.addEventListener('click', async () => {
        if (floatNodes.length < 2) {
            alert('Necesitas al menos 2 ideas para revelar sinergias y conflictos.');
            return;
        }

        btnSynergies.disabled = true;
        btnSynergies.innerText = '🔮 Analizando...';
        statusText.innerText = 'Lumina analizando el mapa estratégico…';
        statusText.classList.add('listening-text');

        try {
            const response = await fetch('/api/conexiones-ia', {
                method: 'POST',
                headers: getHeaders()
            });
            if (response.status === 401) return handleSessionExpired();
            const data = await response.json();

            // Limpiar líneas anteriores
            document.querySelectorAll('.synergy-line').forEach(l => l.remove());

            // Asegurar gradiente dorado en el SVG
            if (!document.getElementById('synergy-gradient') && neuralCanvas) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.setAttribute('id', 'synergy-gradient');
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#ffd700');
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#ff8c00');
                gradient.appendChild(stop1); gradient.appendChild(stop2);
                defs.appendChild(gradient);
                neuralCanvas.appendChild(defs);
            }

            if (data.connections && data.connections.length > 0) {
                data.connections.forEach(conn => {
                    const nodeA = document.querySelector(`.idea-node[data-id="${conn.id_origen}"]`);
                    const nodeB = document.querySelector(`.idea-node[data-id="${conn.id_destino}"]`);
                    if (!nodeA || !nodeB) return;

                    const rectA = nodeA.getBoundingClientRect();
                    const rectB = nodeB.getBoundingClientRect();

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', rectA.left + rectA.width / 2);
                    line.setAttribute('y1', rectA.top + rectA.height / 2);
                    line.setAttribute('x2', rectB.left + rectB.width / 2);
                    line.setAttribute('y2', rectB.top + rectB.height / 2);
                    line.setAttribute('stroke-width', '2.5');
                    line.classList.add('synergy-line');
                    line.dataset.tipo = conn.tipo;

                    if (conn.tipo === 'roja') {
                        // ⚠️ CONFLICTO: línea roja pulsante y discontinua
                        line.setAttribute('stroke', '#ff2244');
                        line.setAttribute('stroke-dasharray', '8 5');
                        line.setAttribute('opacity', '0.85');
                        line.style.filter = 'drop-shadow(0 0 8px #ff003388)';
                    } else {
                        // ✨ SINERGIA: línea dorada resplandeciente
                        line.setAttribute('stroke', 'url(#synergy-gradient)');
                        line.setAttribute('opacity', '0.9');
                        line.style.filter = 'drop-shadow(0 0 8px #ffd70066)';
                    }

                    // Tooltip al hacer hover → muestra razón en el status bar
                    if (conn.razon_breve) {
                        line.style.cursor = 'help';
                        const icon = conn.tipo === 'roja' ? '⚠️ Conflicto' : '✨ Sinergia';
                        line.addEventListener('mouseenter', () => {
                            statusText.innerText = `${icon}: ${conn.razon_breve}`;
                        });
                        line.addEventListener('mouseleave', () => {
                            statusText.innerText = 'Lumina en reposo';
                        });
                    }

                    if (neuralCanvas) neuralCanvas.appendChild(line);
                });

                const doradas = data.connections.filter(c => c.tipo !== 'roja').length;
                const rojas = data.connections.filter(c => c.tipo === 'roja').length;
                statusText.innerText = `✨ ${doradas} sinergias doradas  ·  ⚠️ ${rojas} conflictos detectados — Pasa el ratón sobre las líneas para ver el análisis`;
            } else {
                statusText.innerText = 'No se encontraron conexiones evidentes aún.';
            }

        } catch (error) {
            console.error(error);
            alert('Error al revelar sinergias y conflictos.');
        } finally {
            btnSynergies.disabled = false;
            btnSynergies.innerText = '🔮 Sinergias';
            statusText.classList.remove('listening-text');
            setTimeout(() => statusText.innerText = "Lumina en reposo", 10000);
        }
    });
}

// === Feature 12: Chat Global (Consultoría Lumina) ===
const chatPanel = document.getElementById('chat-panel');
const btnChatGlobal = document.getElementById('btn-chat-global');
const closeChat = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');
let chatHistorial = [];

if (btnChatGlobal) {
    btnChatGlobal.addEventListener('click', () => {
        chatPanel.classList.remove('hidden');
        // Auto-dim butterfly so it doesn't distract during chat
        if (assistant) { assistant.style.opacity = '0.3'; assistant.style.pointerEvents = 'none'; }
    });
}
if (closeChat) {
    closeChat.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
        // Restore butterfly
        if (assistant) { assistant.style.opacity = '1'; assistant.style.pointerEvents = 'auto'; }
    });
}

function addChatMessage(role, content) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    // El contenido procede del usuario o del modelo: mostrarlo como texto, nunca como HTML.
    msg.textContent = String(content || '');
    msg.style.whiteSpace = 'pre-line';
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLuminaToast(message, actionLabel, action) {
    const previous = document.querySelector('.lumina-toast');
    if (previous) previous.remove();
    const toast = document.createElement('div');
    toast.className = 'lumina-toast';
    toast.textContent = message;
    if (actionLabel && action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-action';
        button.textContent = actionLabel;
        button.style.marginLeft = '12px';
        button.addEventListener('click', async () => {
            await action();
            toast.remove();
        });
        toast.appendChild(button);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}

function applyNodeOperationalVisual(nodeElement, idea) {
    if (!nodeElement) return;
    nodeElement.dataset.status = idea.estado || 'pendiente';
    nodeElement.dataset.priority = idea.prioridad || 'media';
    nodeElement.classList.toggle('node-completed', idea.estado === 'completado');
    const meta = nodeElement.querySelector('.node-meta');
    if (meta) {
        let stateChip = meta.querySelector('.node-state-chip');
        if (!stateChip) {
            stateChip = document.createElement('span');
            stateChip.className = 'node-chip node-state-chip';
            meta.appendChild(stateChip);
        }
        const labels = { pendiente: 'Pendiente', en_progreso: 'En progreso', bloqueado: 'Bloqueado', completado: 'Completado' };
        stateChip.textContent = labels[idea.estado || 'pendiente'];
    }
}

async function updateNodeOperational(idea, changes, nodeElement, offerUndo = true) {
    const response = await fetch(`/api/ideas/${idea.id}/estado`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify(changes)
    });
    if (response.status === 401) return handleSessionExpired();
    if (!response.ok) throw new Error('No se pudo actualizar el nodo');
    const data = await response.json();
    Object.assign(idea, data.idea);
    applyNodeOperationalVisual(nodeElement, idea);
    const stateLabel = String(idea.estado || '').replace('_', ' ');
    if (offerUndo) {
    showLuminaToast(`✓ Iniciativa actualizada: ${stateLabel}`, 'Deshacer', async () => {
            await updateNodeOperational(idea, data.anterior, nodeElement, false);
            showLuminaToast('Cambio deshecho');
        });
    }
    return data;
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addChatMessage('user', text);
    chatInput.value = '';
    chatHistorial.push({ role: 'user', content: text });

    btnSendChat.disabled = true;
    btnSendChat.innerText = '...';

    try {
        const response = await fetch('/api/chat-global', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ mensaje: text, historial: chatHistorial })
        });
        if (response.status === 401) return handleSessionExpired();
        const data = await response.json();

        addChatMessage('assistant', data.respuesta);
        chatHistorial.push({ role: 'assistant', content: data.respuesta });
        showLuminaToast('✓ Mensaje guardado en Actividad');

        // Lumi responde con la voz local del Mac (VOICE_ENGINE=macos → say)
        if (typeof LuminaVoice !== 'undefined' && LuminaVoice.speak) LuminaVoice.speak(data.respuesta);

        // Guardar respuesta para que la Mariposa la lea si el usuario le da clic
        window.lastAIResponse = data.respuesta;
    } catch (error) {
        console.error(error);
        addChatMessage('system', 'Error al conectar con Lumina. Intenta de nuevo.');
    } finally {
        btnSendChat.disabled = false;
        btnSendChat.innerText = 'Enviar';
    }
}

// === Historial persistente de actividad ===
const activityModal = document.getElementById('activity-modal');
const btnActivity = document.getElementById('btn-activity');
const closeActivityModal = document.getElementById('close-activity-modal');
const activityList = document.getElementById('activity-list');
const activitySummary = document.getElementById('activity-summary');
const activityPeriod = document.getElementById('activity-period');
const activityType = document.getElementById('activity-type');
const activityOrigin = document.getElementById('activity-origin');
const btnRefreshActivity = document.getElementById('btn-refresh-activity');

function activityDateRange(period) {
    const now = new Date();
    if (period === 'all') return {};
    const start = period === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = period === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { desde: start.toISOString(), hasta: end.toISOString() };
}

function renderActivity(entries) {
    activityList.replaceChildren();
    if (!entries.length) {
        const empty = document.createElement('p');
        empty.className = 'activity-empty';
        empty.textContent = 'No hay actividad para estos filtros.';
        activityList.appendChild(empty);
        return;
    }
    const labels = {
        mensaje_recibido: ['↓', 'Mensaje recibido'],
        respuesta_lumina: ['✦', 'Respuesta de Lumina'],
        accion_realizada: ['✓', 'Acción realizada']
    };
    entries.forEach(entry => {
        const [iconText, labelText] = labels[entry.tipo] || ['•', entry.tipo];
        const item = document.createElement('article');
        item.className = 'activity-item';
        const icon = document.createElement('span');
        icon.className = 'activity-icon';
        icon.textContent = iconText;
        const body = document.createElement('div');
        const label = document.createElement('div');
        label.className = 'activity-label';
        label.textContent = `${labelText} · ${entry.origen || 'app'}`;
        const content = document.createElement('div');
        content.className = 'activity-content';
        content.textContent = entry.contenido;
        body.append(label, content);
        const date = document.createElement('time');
        date.className = 'activity-date';
        date.dateTime = entry.fecha;
        date.textContent = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }).format(new Date(entry.fecha));
        item.append(icon, body, date);
        activityList.appendChild(item);
    });
}

async function loadActivity() {
    activitySummary.textContent = 'Cargando historial…';
    activityList.replaceChildren();
    const params = new URLSearchParams({ limite: '500', ...activityDateRange(activityPeriod.value) });
    if (activityType.value) params.set('tipo', activityType.value);
    if (activityOrigin.value) params.set('origen', activityOrigin.value);
    try {
        const response = await fetch(`/api/actividad?${params}`, { headers: getHeaders() });
        if (response.status === 401) return handleSessionExpired();
        if (!response.ok) throw new Error('No se pudo cargar la actividad');
        const data = await response.json();
        activitySummary.textContent = `${data.total} registro${data.total === 1 ? '' : 's'} encontrado${data.total === 1 ? '' : 's'}`;
        renderActivity(data.actividad || []);
    } catch (error) {
        activitySummary.textContent = 'No se pudo cargar el historial';
        renderActivity([]);
        console.error(error);
    }
}

if (btnActivity) btnActivity.addEventListener('click', () => {
    activityModal.classList.remove('hidden');
    loadActivity();
});
if (closeActivityModal) closeActivityModal.addEventListener('click', () => activityModal.classList.add('hidden'));
if (btnRefreshActivity) btnRefreshActivity.addEventListener('click', loadActivity);
[activityPeriod, activityType, activityOrigin].forEach(control => {
    if (control) control.addEventListener('change', loadActivity);
});

// === Centro Hoy ===
const todayModal = document.getElementById('today-modal');
const btnToday = document.getElementById('btn-today');
const btnMap = document.getElementById('btn-map');
const btnStats = document.getElementById('btn-stats');
const closeTodayModal = document.getElementById('close-today-modal');
const todayDate = document.getElementById('today-date');
const todayMetrics = document.getElementById('today-metrics');
const todayPriorities = document.getElementById('today-priorities');
const todayOverdue = document.getElementById('today-overdue');
const todayBlocked = document.getElementById('today-blocked');
const todayGreeting = document.getElementById('today-greeting');
const momentumScore = document.getElementById('momentum-score');
const momentumLabel = document.getElementById('momentum-label');
const momentumVisual = document.getElementById('momentum-visual');
const lumiInsight = document.getElementById('lumi-insight');
const strategicSignals = document.getElementById('strategic-signals');
const navCapture = document.getElementById('nav-capture');
const todayCapture = document.getElementById('today-capture');
const closeCapture = document.getElementById('close-capture');
const btnOpenLumi = document.getElementById('btn-open-lumi');

const focusMode = document.getElementById('focus-mode');
const focusTitle = document.getElementById('focus-title');
const focusMeta = document.getElementById('focus-meta');
const focusTime = document.getElementById('focus-time');
const focusTimer = document.getElementById('focus-timer');
const focusToggle = document.getElementById('focus-toggle');
const focusComplete = document.getElementById('focus-complete');
const closeFocus = document.getElementById('close-focus');
let activeFocusNode = null;
let focusRemainingSeconds = 25 * 60;
let focusInterval = null;
let focusRunning = false;

function renderTodayNodes(container, nodes, emptyText, allowFocus = false) {
    container.replaceChildren();
    if (!nodes.length) {
        const empty = document.createElement('div');
        empty.className = 'today-empty';
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
    }
    nodes.forEach((node, index) => {
        const card = document.createElement('article');
        card.className = 'today-card';
        const accent = node.estado === 'bloqueado' ? '#ff7c88' : node.prioridad === 'alta' ? '#ffc96b' : '#68e5d2';
        card.style.setProperty('--card-accent', accent);
        const cardIndex = document.createElement('span');
        cardIndex.className = 'today-card-index';
        cardIndex.textContent = String(index + 1).padStart(2, '0');
        const body = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'today-card-title';
        title.textContent = node.resumen || node.textoOriginal;
        const meta = document.createElement('div');
        meta.className = 'today-card-meta';
        const due = node.fechaObjetivo || node.dueDate;
        const priorityMeta = document.createElement('span');
        priorityMeta.textContent = `◆ ${node.prioridad || 'media'}`;
        meta.appendChild(priorityMeta);
        if (due) {
            const dueMeta = document.createElement('span');
            dueMeta.textContent = `◷ ${due.slice(0, 10)}`;
            meta.appendChild(dueMeta);
        }
        if (node.estado) {
            const stateMeta = document.createElement('span');
            stateMeta.textContent = `● ${node.estado.replace('_', ' ')}`;
            meta.appendChild(stateMeta);
        }
        body.append(title, meta);
        const actions = document.createElement('div');
        actions.className = 'today-card-actions';
        if (allowFocus) {
            const focus = document.createElement('button');
            focus.className = 'quick-action focus-action';
            focus.textContent = '◎ Foco';
            focus.addEventListener('click', () => openFocusMode(node));
            actions.appendChild(focus);
        }
        const start = document.createElement('button');
        start.className = 'quick-action';
        start.textContent = '▶ Mover';
        const complete = document.createElement('button');
        complete.className = 'quick-action complete';
        complete.textContent = '✓ Hecho';
        start.addEventListener('click', async () => { await updateNodeOperational(node, { estado: 'en_progreso' }); await loadToday(); });
        complete.addEventListener('click', async () => { await updateNodeOperational(node, { estado: 'completado' }); await loadToday(); });
        actions.append(start, complete);
        card.append(cardIndex, body, actions);
        container.appendChild(card);
    });
}

function clampScore(value) {
    return Math.max(35, Math.min(98, Math.round(value)));
}

function addStrategicSignal(label, value, color) {
    const signal = document.createElement('div');
    signal.className = 'strategic-signal';
    const labelWrap = document.createElement('span');
    const dot = document.createElement('i');
    dot.className = 'signal-dot';
    dot.style.setProperty('--signal-color', color);
    const text = document.createElement('span');
    text.textContent = label;
    labelWrap.append(dot, text);
    const strong = document.createElement('strong');
    strong.textContent = value;
    signal.append(labelWrap, strong);
    strategicSignals.appendChild(signal);
}

function renderStrategicPulse(data) {
    const summary = data.resumen || {};
    const score = clampScore(90 - ((summary.vencidos || 0) * 13) - ((summary.bloqueados || 0) * 9) + Math.min((summary.hoy || 0) * 2, 6));
    momentumScore.textContent = score;
    momentumVisual.querySelector('.momentum-ring')?.style.setProperty('--score-angle', `${score * 3.6}deg`);
    momentumLabel.textContent = score >= 80 ? 'Ritmo saludable' : score >= 60 ? 'Atención selectiva' : 'Necesita foco';

    if ((summary.bloqueados || 0) > 0) {
        lumiInsight.textContent = `Hay ${summary.bloqueados} bloqueo${summary.bloqueados === 1 ? '' : 's'} limitando el ritmo. Resolver uno hoy tendrá más impacto que abrir otro frente.`;
    } else if ((summary.vencidos || 0) > 0) {
        lumiInsight.textContent = 'Tu mapa avanza, pero hay fechas que piden una decisión. Reprograma o completa antes de sumar trabajo.';
    } else {
        lumiInsight.textContent = 'El mapa está despejado. Protege este ritmo concentrándote en una prioridad antes de abrir la siguiente.';
    }

    strategicSignals.replaceChildren();
    addStrategicSignal('Foco disponible', `${Math.max(0, 3 - (summary.bloqueados || 0))} de 3`, '#68e5d2');
    addStrategicSignal('Presión de fecha', summary.vencidos ? `${summary.vencidos} alta` : 'Baja', summary.vencidos ? '#ff7c88' : '#c9ff63');
    addStrategicSignal('Decisiones pendientes', String(summary.bloqueados || 0), '#8e7dff');
}

function formatFocusTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function paintFocusTimer() {
    focusTime.textContent = formatFocusTime(focusRemainingSeconds);
    focusTimer.style.setProperty('--focus-angle', `${(focusRemainingSeconds / (25 * 60)) * 360}deg`);
}

function stopFocusTimer() {
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = null;
}

function startFocusTimer() {
    stopFocusTimer();
    focusRunning = true;
    focusToggle.textContent = 'Pausar';
    focusInterval = setInterval(() => {
        focusRemainingSeconds = Math.max(0, focusRemainingSeconds - 1);
        paintFocusTimer();
        if (focusRemainingSeconds === 0) {
            stopFocusTimer();
            focusRunning = false;
            focusToggle.textContent = 'Reiniciar 25 min';
            showLuminaToast('Sesión de foco completada. Decide el siguiente movimiento.');
        }
    }, 1000);
}

async function openFocusMode(node) {
    activeFocusNode = node;
    focusRemainingSeconds = 25 * 60;
    focusTitle.textContent = node.resumen || node.textoOriginal || 'Iniciativa seleccionada';
    const due = node.fechaObjetivo || node.dueDate;
    focusMeta.textContent = `${node.prioridad || 'media'} prioridad${due ? ` · objetivo ${due.slice(0, 10)}` : ''}`;
    focusMode.classList.remove('hidden');
    paintFocusTimer();
    startFocusTimer();
    try {
        const visualNode = document.querySelector(`.idea-node[data-id="${node.id}"]`);
        await updateNodeOperational(node, { estado: 'en_progreso' }, visualNode, false);
    } catch (error) {
        console.error('[Focus] No se pudo actualizar el estado:', error);
    }
}

function closeFocusMode() {
    stopFocusTimer();
    focusRunning = false;
    focusMode.classList.add('hidden');
}

async function cargarBriefing() {
    if (!lumiInsight) return;
    try {
        const response = await fetch('/api/briefing', { method: 'POST', headers: getHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        if (data.briefing) lumiInsight.textContent = data.briefing; // textContent = sin XSS
    } catch (error) {
        // El insight estático de renderStrategicPulse queda como respaldo.
        console.warn('[Briefing] No disponible, se mantiene el insight estático:', error.message);
    }
}

async function loadToday() {
    todayDate.textContent = 'Preparando tus prioridades…';
    try {
        const response = await fetch('/api/hoy', { headers: getHeaders() });
        if (response.status === 401) return handleSessionExpired();
        if (!response.ok) throw new Error('No se pudo cargar Hoy');
        const data = await response.json();
        todayDate.textContent = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${data.fecha}T12:00:00`));
        const hour = new Date().getHours();
        const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
        todayGreeting.textContent = `${greeting}, ${currentUsername}.`;
        const metrics = [['Activos', data.resumen.activos, '↗'], ['Vencidos', data.resumen.vencidos, '!'], ['Para hoy', data.resumen.hoy, '◷'], ['Bloqueados', data.resumen.bloqueados, '◇']];
        todayMetrics.replaceChildren(...metrics.map(([label, value, icon]) => {
            const item = document.createElement('div'); item.className = 'today-metric';
            const strong = document.createElement('strong'); strong.textContent = value;
            const span = document.createElement('span'); span.textContent = label;
            const small = document.createElement('small'); small.textContent = icon;
            item.append(strong, span, small); return item;
        }));
        renderTodayNodes(todayPriorities, data.priorities || [], 'No hay prioridades activas.', true);
        renderTodayNodes(todayOverdue, [...(data.dueToday || []), ...(data.overdue || [])], 'No tienes vencimientos pendientes.');
        renderTodayNodes(todayBlocked, data.blocked || [], 'No hay iniciativas bloqueadas.');
        renderStrategicPulse(data);
        cargarBriefing(); // Bucle Autónomo: briefing IA que reemplaza al insight estático
    } catch (error) {
        todayDate.textContent = 'No se pudo cargar el resumen';
        console.error(error);
    }
}

function openTodayView() {
    if (!todayModal || !currentUsername) return;
    activityModal?.classList.add('hidden');
    document.getElementById('chat-panel')?.classList.add('hidden');
    if (typeof StatsPanel !== 'undefined') StatsPanel.close();
    todayModal.classList.remove('hidden');
    btnToday?.classList.add('is-active');
    btnMap?.classList.remove('is-active');
    btnActivity?.classList.remove('is-active');
    btnStats?.classList.remove('is-active');
    loadToday();
}

if (btnToday) btnToday.addEventListener('click', openTodayView);
function openMapView() {
    todayModal?.classList.add('hidden');
    btnToday?.classList.remove('is-active');
    btnMap?.classList.add('is-active');
    btnActivity?.classList.remove('is-active');
    btnStats?.classList.remove('is-active');
}
if (closeTodayModal) closeTodayModal.addEventListener('click', openMapView);
if (btnMap) btnMap.addEventListener('click', () => {
    openMapView();
    activityModal?.classList.add('hidden');
    document.getElementById('chat-panel')?.classList.add('hidden');
    if (typeof StatsPanel !== 'undefined') StatsPanel.close();
    closePlanetView();
    statusText.innerText = 'Mapa estratégico';
});

function openCaptureCommand() {
    inputContainer.classList.remove('hidden');
    ideaInput.value = '';
    ideaInput.focus();
    statusText.innerText = 'Captura lo que no quieres perder';
}

function closeCaptureCommand() {
    inputContainer.classList.add('hidden');
    ideaInput.value = '';
    statusText.innerText = 'Lumina lista';
}

[navCapture, todayCapture].forEach(button => button?.addEventListener('click', openCaptureCommand));
closeCapture?.addEventListener('click', closeCaptureCommand);
document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCaptureCommand();
    }
    if (event.key === 'Escape' && !focusMode?.classList.contains('hidden')) closeFocusMode();
});

focusToggle?.addEventListener('click', () => {
    if (!focusRunning && focusRemainingSeconds === 0) focusRemainingSeconds = 25 * 60;
    if (focusRunning) {
        stopFocusTimer();
        focusRunning = false;
        focusToggle.textContent = 'Continuar';
    } else {
        paintFocusTimer();
        startFocusTimer();
    }
});
closeFocus?.addEventListener('click', closeFocusMode);
focusComplete?.addEventListener('click', async () => {
    if (!activeFocusNode) return;
    try {
        const visualNode = document.querySelector(`.idea-node[data-id="${activeFocusNode.id}"]`);
        await updateNodeOperational(activeFocusNode, { estado: 'completado', progreso: 100 }, visualNode);
        closeFocusMode();
        await loadToday();
    } catch (error) {
        console.error('[Focus] No se pudo completar la iniciativa:', error);
    }
});

btnOpenLumi?.addEventListener('click', () => {
    todayModal?.classList.add('hidden');
    chatPanel?.classList.remove('hidden');
    chatInput?.focus();
});

btnActivity?.addEventListener('click', () => {
    todayModal?.classList.add('hidden');
    btnToday?.classList.remove('is-active');
    btnMap?.classList.remove('is-active');
    btnStats?.classList.remove('is-active');
    btnActivity.classList.add('is-active');
});
btnStats?.addEventListener('click', () => {
    todayModal?.classList.add('hidden');
    btnToday?.classList.remove('is-active');
    btnMap?.classList.remove('is-active');
    btnActivity?.classList.remove('is-active');
    btnStats.classList.add('is-active');
});
closeActivityModal?.addEventListener('click', openMapView);
document.addEventListener('click', event => {
    if (event.target?.id === 'close-stats-panel' || event.target?.id === 'stats-overlay') {
        openMapView();
    }
});

if (btnSendChat) {
    btnSendChat.addEventListener('click', sendChatMessage);
}
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

// === Feature 13: Speech-to-Star ===
const btnSpeechStar = document.getElementById('btn-speech-star');
let speechRecognition = null;
let isSpeechRecording = false;

if (btnSpeechStar && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRec();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'es-ES';

    let speechBuffer = '';

    speechRecognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                speechBuffer += event.results[i][0].transcript + ' ';
            }
        }
    };

    speechRecognition.onend = () => {
        if (isSpeechRecording) {
            // Si se detuvo de forma abrupta, reiniciar
            speechRecognition.start();
        }
    };

    btnSpeechStar.addEventListener('click', async () => {
        if (!isSpeechRecording) {
            // Iniciar grabación
            isSpeechRecording = true;
            speechBuffer = '';
            btnSpeechStar.classList.add('recording');
            btnSpeechStar.innerText = '⏹️ Detener';
            statusText.innerText = 'Dictando ideas... Pulsa de nuevo para procesar.';
            statusText.classList.add('listening-text');
            try { speechRecognition.start(); } catch { /* ya iniciado */ }
        } else {
            // Detener y procesar
            isSpeechRecording = false;
            btnSpeechStar.classList.remove('recording');
            btnSpeechStar.disabled = true;
            btnSpeechStar.innerText = 'Procesando...';
            statusText.innerText = 'Lumina desglosando tus ideas dictadas...';
            try { speechRecognition.stop(); } catch { /* ignore */ }

            // Enviar al backend (pequeño delay para asegurar que llegan las últimas palabras)
            await new Promise(r => setTimeout(r, 500));

            if (speechBuffer.trim().length === 0) {
                alert('No se detectaron palabras. Intenta de nuevo.');
                btnSpeechStar.disabled = false;
                btnSpeechStar.innerText = '🎙️ Dictar ideas';
                statusText.innerText = 'Lumina en reposo';
                statusText.classList.remove('listening-text');
                return;
            }

            try {
                const response = await fetch('/api/speech-to-star', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ texto: speechBuffer.trim() })
                });

                if (response.status === 401) return handleSessionExpired();
                const data = await response.json();

                if (data.ideas && data.ideas.length > 0) {
                    data.ideas.forEach((idea, i) => {
                        setTimeout(() => createNewIdeaNode(idea), i * 400);
                    });
                    statusText.innerText = `${data.ideas.length} estrellas creadas desde tu dictado.`;
                    if (typeof AudioEngine !== 'undefined') AudioEngine.playMagic();
                }
            } catch (error) {
                console.error(error);
                alert('Error al procesar el dictado.');
            } finally {
                btnSpeechStar.disabled = false;
                btnSpeechStar.innerText = '🎙️ Dictar ideas';
                statusText.classList.remove('listening-text');
                setTimeout(() => statusText.innerText = "Lumina en reposo", 5000);
            }
        }
    });
} else if (btnSpeechStar) {
    // Navegador sin soporte
    btnSpeechStar.title = 'Tu navegador no soporta reconocimiento de voz.';
    btnSpeechStar.style.opacity = '0.4';
    btnSpeechStar.disabled = true;
}

// ====== MODO DEMO Y ONBOARDING CINEMÁTICO ======
const btnDemo = document.getElementById('btn-demo');
if (btnDemo) {
    btnDemo.addEventListener('click', async () => {
        authError.innerText = '';
        btnDemo.disabled = true;
        const originalContent = btnDemo.innerHTML;
        btnDemo.innerText = 'Preparando demo…';
        try {
            const response = await fetch('/api/demo/login', { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Modo demo no disponible');

            currentUsername = data.username;
            localStorage.setItem('lumina_demo', '1');

            showApp();

            if (data.bienvenida && data.bienvenida.trim().length > 0) {
                window.lastAIResponse = data.bienvenida;
            }
        } catch (err) {
            authError.innerText = err.message;
            authError.style.color = '#ff6b6b';
        } finally {
            btnDemo.disabled = false;
            btnDemo.innerHTML = originalContent;
        }
    });
}

const ONBOARDING_KEY = 'lumina_onboarded';
const onboardSteps = [
    {
        icon: '✦',
        title: 'Lee tu pulso estratégico',
        text: 'Lumina reúne prioridades, presión de fechas y bloqueos en una señal clara para decidir dónde actuar primero.'
    },
    {
        icon: '🗺️',
        title: 'Explora tu mapa estratégico',
        text: 'Las iniciativas se conectan visualmente para descubrir relaciones, tensiones y oportunidades sin perder claridad.'
    },
    {
        icon: '💬',
        title: 'Captura tu primera iniciativa',
        text: 'Escribe o dicta una idea. Lumi te ayudará a aclararla, decidir el próximo paso y convertirla en ejecución.',
        focusInput: true,
        final: true
    }
];

let onboardStepIndex = 0;
let onboardingActive = false;

function maybeStartOnboarding() {
    if (localStorage.getItem(ONBOARDING_KEY) === '1') return;
    attachOnboardingListeners();
    onboardStepIndex = 0;
    onboardingActive = true;
    renderOnboardingStep();
    const overlay = document.getElementById('onboarding');
    if (overlay) overlay.classList.remove('hidden');
}

function renderOnboardingStep() {
    const step = onboardSteps[onboardStepIndex];
    const icon = document.getElementById('onboarding-icon');
    const title = document.getElementById('onboarding-title');
    const text = document.getElementById('onboarding-text');
    const dots = document.getElementById('onboarding-dots');
    const nextBtn = document.getElementById('btn-onboard-next');

    if (!icon || !title || !text || !dots || !nextBtn) return;

    icon.innerText = step.icon;
    title.innerText = step.title;
    text.innerText = step.text;
    nextBtn.innerText = step.final ? 'Comenzar ✨' : 'Siguiente →';

    dots.innerHTML = '';
    onboardSteps.forEach((_, i) => {
        const dot = document.createElement('span');
        if (i === onboardStepIndex) dot.className = 'active';
        dots.appendChild(dot);
    });

    if (ideaInput) ideaInput.classList.toggle('onboarding-hint', !!step.focusInput);

    if (step.speak && typeof LuminaVoice !== 'undefined') {
        try { LuminaVoice.speak(step.text); } catch { /* sin voz, sin problema */ }
    }
}

function closeOnboarding() {
    onboardingActive = false;
    const overlay = document.getElementById('onboarding');
    if (overlay) overlay.classList.add('hidden');
    if (ideaInput) ideaInput.classList.remove('onboarding-hint');
    localStorage.setItem(ONBOARDING_KEY, '1');
    setTimeout(openTodayView, 250);
}

// Los listeners se enganchan de forma perezosa (la primera vez que se abre el
// onboarding) para no depender del orden del DOM respecto a los <script>.
let onboardListenersAttached = false;

function attachOnboardingListeners() {
    if (onboardListenersAttached) return;
    const nextBtn = document.getElementById('btn-onboard-next');
    const skipBtn = document.getElementById('btn-onboard-skip');
    if (!nextBtn || !skipBtn) return;

    nextBtn.addEventListener('click', () => {
        if (!onboardingActive) return;
        if (onboardStepIndex < onboardSteps.length - 1) {
            onboardStepIndex++;
            renderOnboardingStep();
        } else {
            closeOnboarding();
        }
    });
    skipBtn.addEventListener('click', closeOnboarding);
    onboardListenersAttached = true;
}

attachOnboardingListeners();
