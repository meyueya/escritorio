import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../utils/colors';
import { hapticImpact, hapticSuccess, hapticError } from '../utils/haptics';
import { useJobs } from '../hooks/useJobs';

const getScoreColor = (s) => s >= 85 ? colors.success : s >= 70 ? colors.warning : colors.danger;

const STATUS_OPTIONS = ['Found', 'Needs Approval', 'Applied', 'Interviewing', 'Offer'];

export default function JobDetailScreen({ route, navigation }) {
  const { job: initialJob } = route.params;
  const [job, setJob] = useState(initialJob);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'cv' | 'cover'
  const [sending, setSending] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const { updateJobStatus, deleteJob, reanalyzeJob, sendApplication } = useJobs();

  const scoreColor = getScoreColor(job.matchScore);

  const handleStatusChange = async (newStatus) => {
    hapticImpact();
    try {
      const updated = await updateJobStatus(job.id, { status: newStatus });
      setJob(updated);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar Candidatura', '¿Seguro que quieres eliminarla del tablero?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          hapticError();
          await deleteJob(job.id);
          navigation.goBack();
        }
      }
    ]);
  };

  const handleReanalyze = async () => {
    hapticImpact();
    setReanalyzing(true);
    try {
      const updated = await reanalyzeJob(job.id);
      setJob(updated);
      hapticSuccess();
      Alert.alert('¡Listo!', `Análisis actualizado: ${updated.matchScore}% de match`);
    } catch (err) {
      hapticError();
      Alert.alert('Error', err.message);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSend = async () => {
    Alert.alert(
      'Enviar Candidatura',
      `¿Enviar el CV y carta de presentación a ${job.company} por email?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar', onPress: async () => {
            hapticHeavy?.();
            setSending(true);
            try {
              await sendApplication(job.id, job.coverLetter, job.cvTailored);
              hapticSuccess();
              Alert.alert('✅ Enviado', 'Tu candidatura fue enviada con éxito');
              navigation.goBack();
            } catch (err) {
              hapticError();
              Alert.alert('Error al enviar', err.message);
            } finally {
              setSending(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top navigation bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Pipeline</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Job Header Card */}
        <View style={glassCard}>
          <View style={styles.jobHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company}</Text>
              <View style={styles.jobMeta}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.jobMetaText}>{job.location}</Text>
                {job.salary && job.salary !== 'No especificado' && (
                  <>
                    <Text style={styles.dot}>·</Text>
                    <Text style={styles.jobMetaText}>{job.salary}</Text>
                  </>
                )}
              </View>
            </View>
            {/* Match Score Circle */}
            <View style={[styles.scoreCircle, { borderColor: scoreColor, shadowColor: scoreColor }]}>
              <Text style={[styles.scoreNum, { color: scoreColor }]}>{job.matchScore}</Text>
              <Text style={styles.scorePct}>%</Text>
            </View>
          </View>

          {/* Status Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusPill, job.status === s && styles.statusPillActive]}
                  onPress={() => handleStatusChange(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusPillText, job.status === s && styles.statusPillTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {job.url ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { hapticLight?.(); Linking.openURL(job.url); }}>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Ver Oferta</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.actionBtn} onPress={handleReanalyze} disabled={reanalyzing}>
              {reanalyzing ? <ActivityIndicator size="small" color={colors.secondary} /> : <Ionicons name="refresh" size={16} color={colors.secondary} />}
              <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Re-analizar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[{ id: 'info', label: 'Análisis' }, { id: 'cv', label: 'CV Adaptado' }, { id: 'cover', label: 'Carta' }].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => { hapticLight?.(); setActiveTab(tab.id); }}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <View style={glassCard}>
            <Text style={styles.cardTitle}>Análisis de Match IA</Text>
            {job.matchAnalysis?.strengths?.length > 0 && (
              <View style={{ gap: 6, marginTop: 8 }}>
                <Text style={styles.analysisLabel}>✅ Puntos Fuertes</Text>
                {job.matchAnalysis.strengths.map((s, i) => (
                  <Text key={i} style={styles.analysisBullet}>• {s}</Text>
                ))}
              </View>
            )}
            {job.matchAnalysis?.gaps?.length > 0 && (
              <View style={{ gap: 6, marginTop: 12 }}>
                <Text style={styles.analysisLabel}>⚠️ Brechas Detectadas</Text>
                {job.matchAnalysis.gaps.map((g, i) => (
                  <Text key={i} style={[styles.analysisBullet, { color: colors.warning }]}>• {g}</Text>
                ))}
              </View>
            )}
            {job.matchAnalysis?.salaryRelevance && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.analysisLabel}>💰 Relevancia Salarial</Text>
                <Text style={styles.analysisBullet}>{job.matchAnalysis.salaryRelevance}</Text>
              </View>
            )}
            {job.description && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.analysisLabel}>📋 Descripción del Puesto</Text>
                <Text style={styles.descText} numberOfLines={8}>{job.description}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'cv' && (
          <View style={glassCard}>
            <Text style={styles.cardTitle}>CV Adaptado por Gemini</Text>
            <ScrollView style={styles.textAreaWrap} nestedScrollEnabled>
              <Text style={styles.cvText}>{job.cvTailored || 'Sin CV generado aún. Pulsa "Re-analizar" para que Gemini genere el CV adaptado.'}</Text>
            </ScrollView>
          </View>
        )}

        {activeTab === 'cover' && (
          <View style={glassCard}>
            <Text style={styles.cardTitle}>Carta de Presentación</Text>
            <ScrollView style={styles.textAreaWrap} nestedScrollEnabled>
              <Text style={styles.cvText}>{job.coverLetter || 'Sin carta generada. Pulsa "Re-analizar" para generarla.'}</Text>
            </ScrollView>
          </View>
        )}

        {/* Send Button */}
        {job.status !== 'Applied' && (
          <TouchableOpacity
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
            <Text style={styles.sendBtnText}>Enviar Candidatura por Email</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// Quick import fix for hapticHeavy missing
const hapticHeavy = () => import('../utils/haptics').then(m => m.hapticHeavy());
const hapticLight = () => import('../utils/haptics').then(m => m.hapticLight());

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  jobTitle: { fontSize: 18, fontWeight: '800', color: colors.textMain, lineHeight: 24, flex: 1 },
  jobCompany: { fontSize: 14, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  jobMetaText: { fontSize: 12, color: colors.textMuted },
  dot: { color: colors.textMuted },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    flexShrink: 0,
  },
  scoreNum: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  scorePct: { fontSize: 10, color: colors.textMuted, lineHeight: 12 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  statusPillActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  statusPillText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  statusPillTextActive: { color: colors.primary },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderGlass,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.primaryGlow },
  tabText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textMain, marginBottom: 4 },
  analysisLabel: { fontSize: 13, fontWeight: '700', color: colors.textMain },
  analysisBullet: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  descText: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: 4 },
  textAreaWrap: { maxHeight: 400, marginTop: 8 },
  cvText: { fontSize: 12, color: colors.textMain, lineHeight: 20, fontFamily: 'Courier New' },
  sendBtn: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
