import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { hapticHeavy, hapticLight, hapticSuccess } from '../utils/haptics';

const PORTALS = ['Remotive', 'Arbeitnow', 'Jobicy', 'The Muse', 'WWR', 'RemoteOK', 'Jooble', 'Adzuna'];

const FLOW_STEPS = [
  { id: 1, label: '🌐 Scrapeo Multicanal', desc: 'Consultando 8 portales en paralelo...', type: 'scrape', delay: 0 },
  { id: 2, label: '🎯 Match Detectado', desc: '"Senior Full Stack" en Remotive — Match 94%', type: 'success', delay: 4500 },
  { id: 3, label: '🤖 Cascada Gemini IA', desc: 'gemini-2.5-flash → Rate Limit (429)! → gemini-2.0-flash ✅', type: 'nlp', delay: 9000 },
  { id: 4, label: '📝 CV Personalizado', desc: 'Generando CV adaptado (+600 palabras) para este puesto...', type: 'nlp', delay: 13500 },
  { id: 5, label: '💾 Base de Datos', desc: 'Guardando candidatura en pipeline local...', type: 'info', delay: 18000 },
  { id: 6, label: '📨 Email SMTP', desc: '¡Candidatura enviada a jobs@empresa.io!', type: 'success', delay: 22500 },
];

const LOG_COLORS = {
  info: colors.logInfo,
  scrape: colors.logScrape,
  nlp: colors.logNlp,
  success: colors.logSuccess,
  warning: colors.logWarning,
  error: colors.logError,
};

export default function SimulatorScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [logs, setLogs] = useState([]);
  const [activePortal, setActivePortal] = useState(null);
  const timeoutsRef = useRef([]);
  const logsScrollRef = useRef(null);

  // Pulsing animations for active nodes
  const pulseAnims = useRef(FLOW_STEPS.map(() => new Animated.Value(1))).current;
  const flowLineAnim = useRef(new Animated.Value(0)).current;

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const startPulse = (index) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnims[index], { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnims[index], { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  };

  const animateFlowLine = () => {
    Animated.loop(
      Animated.timing(flowLineAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: false })
    ).start();
  };

  const addLog = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), timestamp, message: text, status: type }]);
    setTimeout(() => logsScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const startSimulation = () => {
    if (isPlaying) return;
    hapticHeavy();
    setIsPlaying(true);
    setCurrentStep(-1);
    setLogs([]);
    setActivePortal(null);
    flowLineAnim.setValue(0);
    clearTimeouts();

    addLog('Iniciando simulación de arquitectura EmpleoAutopilot...', 'info');

    // Portal cycling during scrape phase
    let pIdx = 0;
    const portalInterval = setInterval(() => {
      setActivePortal(PORTALS[pIdx % PORTALS.length]);
      pIdx++;
    }, 500);
    const clearPortals = setTimeout(() => { clearInterval(portalInterval); setActivePortal(null); }, 4000);
    timeoutsRef.current.push(clearPortals);

    animateFlowLine();

    FLOW_STEPS.forEach((step, index) => {
      const t = setTimeout(() => {
        setCurrentStep(index);
        startPulse(index);
        addLog(step.desc, step.type);

        if (index === FLOW_STEPS.length - 1) {
          // Last step — done
          hapticSuccess();
          const doneT = setTimeout(() => {
            setIsPlaying(false);
            addLog('══════ SIMULACIÓN COMPLETADA CON ÉXITO ══════', 'success');
          }, 1500);
          timeoutsRef.current.push(doneT);
        }
      }, step.delay);
      timeoutsRef.current.push(t);
    });
  };

  const resetSimulation = () => {
    hapticLight();
    clearTimeouts();
    setIsPlaying(false);
    setCurrentStep(-1);
    setLogs([]);
    setActivePortal(null);
    flowLineAnim.setValue(0);
    pulseAnims.forEach(a => a.setValue(1));
  };

  useEffect(() => () => clearTimeouts(), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Simulador de Flujo</Text>
            <Text style={styles.subtitle}>Visualiza la arquitectura funcionando en tiempo real</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetSimulation}>
              <Ionicons name="refresh" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, isPlaying && styles.playBtnDisabled]}
              onPress={startSimulation}
              disabled={isPlaying}
              activeOpacity={0.8}
            >
              <Ionicons name={isPlaying ? 'ellipsis-horizontal' : 'play'} size={18} color={colors.textInverse} />
              <Text style={styles.playBtnText}>{isPlaying ? 'Simulando...' : 'Iniciar'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Layer 1: Portales */}
        <View style={styles.layerBox}>
          <Text style={styles.layerLabel}>CAPA 1 — FUENTES DE EMPLEO</Text>
          <View style={styles.portalGrid}>
            {PORTALS.map(p => (
              <Animated.View
                key={p}
                style={[
                  styles.portalChip,
                  activePortal === p && styles.portalChipActive,
                ]}
              >
                <Text style={[styles.portalChipText, activePortal === p && { color: colors.primary }]}>{p}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowWrap}>
          <Ionicons name="arrow-down" size={20} color={currentStep >= 0 ? colors.primary : colors.borderGlass} />
        </View>

        {/* Layer 2: Backend */}
        <View style={styles.layerBox}>
          <Text style={styles.layerLabel}>CAPA 2 — MOTOR BACKEND (Node.js + Gemini)</Text>
          <View style={styles.stepsList}>
            {FLOW_STEPS.slice(0, 4).map((step, index) => {
              const isActive = currentStep === index;
              const isDone = currentStep > index;
              return (
                <Animated.View
                  key={step.id}
                  style={[
                    styles.stepCard,
                    isActive && styles.stepCardActive,
                    isDone && styles.stepCardDone,
                    { transform: [{ scale: isActive ? pulseAnims[index] : 1 }] }
                  ]}
                >
                  <View style={styles.stepDot}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color={colors.success} />
                    ) : isActive ? (
                      <Ionicons name="ellipsis-horizontal" size={14} color={colors.primary} />
                    ) : (
                      <View style={styles.stepDotInner} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepLabel, isActive && { color: colors.primary }, isDone && { color: colors.success }]}>
                      {step.label}
                    </Text>
                    {isActive && <Text style={styles.stepDesc}>{step.desc}</Text>}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowWrap}>
          <Ionicons name="arrow-down" size={20} color={currentStep >= 4 ? colors.success : colors.borderGlass} />
        </View>

        {/* Layer 3: Outputs */}
        <View style={styles.layerBox}>
          <Text style={styles.layerLabel}>CAPA 3 — DESTINOS DE SALIDA</Text>
          <View style={styles.outputRow}>
            {FLOW_STEPS.slice(4).map((step, i) => {
              const realIndex = i + 4;
              const isActive = currentStep === realIndex;
              const isDone = currentStep > realIndex;
              return (
                <View key={step.id} style={[
                  styles.outputCard,
                  isActive && styles.outputCardActive,
                  isDone && styles.outputCardDone,
                ]}>
                  <Text style={styles.outputLabel}>{step.label}</Text>
                  <Text style={styles.outputDesc} numberOfLines={2}>{step.desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Live Terminal */}
        <View style={styles.terminal}>
          <View style={styles.termHeader}>
            <View style={styles.termDots}>
              <View style={[styles.termDot, { backgroundColor: '#ff5f56' }]} />
              <View style={[styles.termDot, { backgroundColor: '#ffbd2e' }]} />
              <View style={[styles.termDot, { backgroundColor: '#27c93f' }]} />
            </View>
            <Text style={styles.termTitle}>LIVE FLUX TERMINAL</Text>
            <View style={styles.recDot} />
          </View>
          <ScrollView ref={logsScrollRef} style={styles.termLogs} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {logs.length === 0 ? (
              <Text style={styles.termEmpty}>Pulsa "Iniciar" para comenzar la simulación...</Text>
            ) : (
              logs.map(log => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logTime}>[{log.timestamp}]</Text>
                  <Text style={[styles.logMsg, { color: LOG_COLORS[log.status] || colors.logInfo }]}>{log.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <View style={styles.termFooter}>
            <Text style={styles.termStat}>Paso: {Math.max(currentStep + 1, 0)}/{FLOW_STEPS.length}</Text>
            <Text style={[styles.termStat, { color: colors.primary }]}>EmpleoAutopilot v2.0</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: colors.textMain, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  resetBtn: {
    width: 38, height: 38, borderRadius: 10,
    borderWidth: 1, borderColor: colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  playBtnDisabled: { opacity: 0.6 },
  playBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },
  layerBox: {
    backgroundColor: 'rgba(12, 21, 40, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 14,
    gap: 10,
  },
  layerLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  portalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  portalChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8, borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  portalChipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  portalChipText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  arrowWrap: { alignItems: 'center' },
  stepsList: { gap: 8 },
  stepCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10, borderWidth: 1,
    borderColor: colors.borderGlass, padding: 12,
  },
  stepCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  stepCardDone: { borderColor: colors.success, backgroundColor: colors.successGlow },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  stepLabel: { fontSize: 13, fontWeight: '700', color: colors.textMain },
  stepDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  outputRow: { flexDirection: 'row', gap: 10 },
  outputCard: {
    flex: 1, padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10, borderWidth: 1,
    borderColor: colors.borderGlass, gap: 4,
  },
  outputCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  outputCardDone: { borderColor: colors.success, backgroundColor: colors.successGlow },
  outputLabel: { fontSize: 12, fontWeight: '700', color: colors.textMain },
  outputDesc: { fontSize: 10, color: colors.textMuted, lineHeight: 14 },
  terminal: {
    backgroundColor: colors.terminalBg,
    borderRadius: 14, borderWidth: 1,
    borderColor: colors.borderGlass, overflow: 'hidden',
  },
  termHeader: {
    backgroundColor: colors.terminalHeader,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderGlass,
  },
  termDots: { flexDirection: 'row', gap: 5, marginRight: 10 },
  termDot: { width: 10, height: 10, borderRadius: 5 },
  termTitle: { flex: 1, fontSize: 11, color: colors.textMuted, fontFamily: 'Courier New' },
  recDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger,
  },
  termLogs: { padding: 14, maxHeight: 200 },
  termEmpty: { color: '#4c566a', fontStyle: 'italic', fontSize: 12, fontFamily: 'Courier New' },
  logRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  logTime: { color: '#3b4252', fontSize: 10, fontFamily: 'Courier New', flexShrink: 0 },
  logMsg: { fontSize: 10, fontFamily: 'Courier New', flex: 1, flexWrap: 'wrap' },
  termFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#05070a', borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  termStat: { fontSize: 10, color: colors.textMuted, fontFamily: 'Courier New' },
});
