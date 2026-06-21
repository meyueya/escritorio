import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, FlatList, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../utils/colors';
import { hapticHeavy, hapticSuccess, hapticError, hapticLight } from '../utils/haptics';
import { useAutopilot } from '../hooks/useAutopilot';
import { StatCard } from '../components/StatCard';

const PORTALS = [
  { name: 'Remotive', flag: '🌐', desc: 'Remote Tech' },
  { name: 'Arbeitnow', flag: '🇪🇺', desc: 'Europa' },
  { name: 'Jobicy', flag: '🌍', desc: 'EMEA' },
  { name: 'We Work Remotely', flag: '🌐', desc: 'Remote' },
  { name: 'RemoteOK', flag: '🔍', desc: 'Tech' },
  { name: 'The Muse', flag: '✨', desc: 'Startups' },
  { name: 'Jooble', flag: '🇪🇸', desc: 'España' },
  { name: 'Adzuna', flag: '🇬🇧', desc: 'Europa' },
  { name: '+InfoJobs', flag: '🔗', desc: 'Manual' },
];

const LOG_COLORS = {
  info: colors.logInfo,
  scrape: colors.logScrape,
  nlp: colors.logNlp,
  success: colors.logSuccess,
  warning: colors.logWarning,
  error: colors.logError,
};

export default function AutopilotScreen({ navigation }) {
  const [manualUrl, setManualUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const logsRef = useRef(null);

  const { isRunning, logs, scrapedCount, successCount, error, startAutopilot, clearLogs } = useAutopilot(() => {
    // Callback: cuando se encuentra un nuevo empleo
    hapticSuccess();
  });

  useEffect(() => {
    if (logs.length > 0 && logsRef.current) {
      logsRef.current.scrollToEnd({ animated: true });
    }
  }, [logs]);

  const handleStart = async () => {
    if (isRunning) return;
    hapticHeavy();
    const ok = await startAutopilot();
    if (!ok) {
      hapticError();
      Alert.alert('Error', error || 'No se pudo iniciar el Autopilot. ¿Está el servidor Node.js corriendo?');
    }
  };

  const handleManualImport = async () => {
    if (!manualUrl.trim() || importing) return;
    const { importJobUrl } = await import('../hooks/useJobs').then(m => ({ importJobUrl: null }));

    setImporting(true);
    hapticLight();
    try {
      const { createApiClient } = await import('../api/client');
      const api = await createApiClient();
      const result = await api.post('/api/jobs', { url: manualUrl.trim() });
      hapticSuccess();
      Alert.alert('¡Éxito!', `Empleo importado con un match del ${result.matchScore}%`);
      setManualUrl('');
    } catch (err) {
      hapticError();
      Alert.alert('Error', err.message || 'No se pudo importar el empleo');
    } finally {
      setImporting(false);
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logEntry}>
      <Text style={styles.logTime}>[{formatTime(item.timestamp)}]</Text>
      <Text style={[styles.logMsg, { color: LOG_COLORS[item.status] || colors.logInfo }]} numberOfLines={3}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Autopilot Room</Text>
              <Text style={styles.subtitle}>Motor de búsqueda IA activo en 9 portales</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isRunning ? colors.primary : colors.success }]} />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard icon="search-outline" label="Escaneados" value={scrapedCount} accent={colors.primary} />
            <StatCard icon="checkmark-circle-outline" label="Matches" value={successCount} accent={colors.success} />
          </View>

          {/* Portal Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PORTALES ACTIVOS</Text>
            <View style={styles.portalGrid}>
              {PORTALS.map((p) => (
                <View key={p.name} style={styles.portalBadge}>
                  <Text style={styles.portalFlag}>{p.flag}</Text>
                  <Text style={styles.portalName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.portalDesc}>{p.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Launch Button */}
          <TouchableOpacity
            style={[styles.launchBtn, isRunning && styles.launchBtnDisabled]}
            onPress={handleStart}
            disabled={isRunning}
            activeOpacity={0.8}
          >
            {isRunning ? (
              <>
                <ActivityIndicator color={colors.textInverse} size="small" />
                <Text style={styles.launchBtnText}>Buscando en 9 portales...</Text>
              </>
            ) : (
              <>
                <Ionicons name="play-circle" size={22} color={colors.textInverse} />
                <Text style={styles.launchBtnText}>Lanzar Autopilot</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Manual URL Import */}
          <View style={[glassCard, styles.section]}>
            <Text style={styles.sectionTitle}>EXTRACCIÓN RÁPIDA DE URL</Text>
            <Text style={styles.sectionSubtitle}>Pega un enlace de LinkedIn, Indeed u otra web de empleo</Text>
            <View style={styles.urlRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://linkedin.com/jobs/view/..."
                placeholderTextColor={colors.textMuted}
                value={manualUrl}
                onChangeText={setManualUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!importing}
              />
              <TouchableOpacity
                style={[styles.analyzeBtn, importing && { opacity: 0.5 }]}
                onPress={handleManualImport}
                disabled={importing || !manualUrl.trim()}
                activeOpacity={0.8}
              >
                {importing ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons name="flash" size={20} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: '700' }}>Human-in-the-Loop activo: </Text>
              Ningún correo se envía de forma automática. Siempre revisas el CV y la carta antes de enviar.
            </Text>
          </View>

          {/* Live Terminal */}
          <View style={[styles.terminal]}>
            <View style={styles.terminalHeader}>
              <View style={styles.termDots}>
                <View style={[styles.termDot, { backgroundColor: '#ff5f56' }]} />
                <View style={[styles.termDot, { backgroundColor: '#ffbd2e' }]} />
                <View style={[styles.termDot, { backgroundColor: '#27c93f' }]} />
              </View>
              <Text style={styles.termTitle}>autopilot_agent@empleo-node</Text>
              <TouchableOpacity onPress={() => { hapticLight(); clearLogs(); }}>
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={logsRef}
              style={styles.termLogs}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {logs.length === 0 ? (
                <Text style={styles.termEmpty}>
                  Consola lista. Pulsa "Lanzar Autopilot" para ver los logs en tiempo real.
                </Text>
              ) : (
                logs.map((log, idx) => (
                  <View key={log.id || idx} style={styles.logEntry}>
                    <Text style={styles.logTime}>[{formatTime(log.timestamp)}]</Text>
                    <Text style={[styles.logMsg, { color: LOG_COLORS[log.status] || colors.logInfo }]}>
                      {log.message}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.termFooter}>
              <Text style={styles.termStat}>Status: {isRunning ? 'ACTIVO' : 'EN ESPERA'}</Text>
              <Text style={[styles.termStat, { color: colors.primary }]}>EmpleoAutopilot v2.0 🇪🇸🇪🇺</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textMain, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: { fontSize: 12, color: colors.textMuted },
  portalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portalBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  portalFlag: { fontSize: 16 },
  portalName: { fontSize: 11, fontWeight: '700', color: colors.textMain, marginTop: 2 },
  portalDesc: { fontSize: 10, color: colors.textMuted },
  launchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  launchBtnDisabled: { opacity: 0.6 },
  launchBtnText: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
  urlRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  urlInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    color: colors.textMain,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  analyzeBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlassGlow,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primaryGlow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,242,254,0.2)',
    padding: 14,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textMain, lineHeight: 18 },
  terminal: {
    backgroundColor: colors.terminalBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    overflow: 'hidden',
    minHeight: 250,
  },
  terminalHeader: {
    backgroundColor: colors.terminalHeader,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  termDots: { flexDirection: 'row', gap: 5, marginRight: 10 },
  termDot: { width: 10, height: 10, borderRadius: 5 },
  termTitle: { flex: 1, fontSize: 11, color: colors.textMuted, fontFamily: 'Courier New' },
  termLogs: { padding: 14, maxHeight: 220 },
  termEmpty: { color: '#4c566a', fontStyle: 'italic', fontSize: 13, fontFamily: 'Courier New' },
  logEntry: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  logTime: { color: '#3b4252', fontSize: 11, fontFamily: 'Courier New', flexShrink: 0 },
  logMsg: { fontSize: 11, fontFamily: 'Courier New', flex: 1, flexWrap: 'wrap' },
  termFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#05070a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  termStat: { fontSize: 10, color: colors.textMuted, fontFamily: 'Courier New' },
});
