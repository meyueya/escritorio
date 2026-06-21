import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { hapticLight } from '../utils/haptics';
import { useJobs } from '../hooks/useJobs';
import { JobCard } from '../components/JobCard';

const COLUMNS = [
  { id: 'Found', title: 'Nuevos Matches', color: colors.primary, icon: 'sparkles' },
  { id: 'Needs Approval', title: 'Revisión / IA', color: colors.secondary, icon: 'hourglass' },
  { id: 'Applied', title: 'Postulados', color: colors.success, icon: 'paper-plane' },
  { id: 'Interviewing', title: 'Entrevistas', color: colors.warning, icon: 'people' },
  { id: 'Offer', title: 'Ofertas', color: '#ff7300', icon: 'trophy' },
];

export default function PipelineScreen({ navigation }) {
  const { jobs, loading, fetchJobs } = useJobs();

  useEffect(() => { fetchJobs(); }, []);

  const getByStatus = (id) => jobs.filter(j => j.status === id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pipeline CRM</Text>
        <Text style={styles.subtitle}>Gestión de candidaturas activas</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.board}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchJobs} tintColor={colors.primary} />
        }
      >
        {COLUMNS.map((col) => {
          const colJobs = getByStatus(col.id);
          return (
            <View key={col.id} style={styles.column}>
              {/* Column Header */}
              <View style={[styles.colHeader, { borderBottomColor: col.color }]}>
                <View style={styles.colTitleRow}>
                  <View style={[styles.colDot, { backgroundColor: col.color }]} />
                  <Ionicons name={col.icon} size={14} color={col.color} />
                  <Text style={[styles.colTitle, { color: col.color }]}>{col.title}</Text>
                </View>
                <View style={[styles.colCount, { backgroundColor: `${col.color}18` }]}>
                  <Text style={[styles.colCountText, { color: col.color }]}>{colJobs.length}</Text>
                </View>
              </View>

              {/* Cards */}
              <ScrollView style={styles.colScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {colJobs.length === 0 ? (
                  <Text style={styles.empty}>Sin candidaturas</Text>
                ) : (
                  colJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onPress={() => navigation.navigate('JobDetail', { job })}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textMain, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  board: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, alignItems: 'flex-start' },
  column: {
    width: 240,
    backgroundColor: 'rgba(15, 22, 36, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    overflow: 'hidden',
    maxHeight: 600,
  },
  colHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 2,
    backgroundColor: 'rgba(10,15,26,0.4)',
  },
  colTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  colDot: { width: 6, height: 6, borderRadius: 3 },
  colTitle: { fontSize: 13, fontWeight: '700' },
  colCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  colCountText: { fontSize: 12, fontWeight: '700' },
  colScroll: { padding: 8, flex: 1 },
  empty: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
});
