import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../utils/colors';
import { hapticLight } from '../utils/haptics';

const getScoreColor = (score) => {
  if (score >= 85) return colors.success;
  if (score >= 70) return colors.warning;
  return colors.danger;
};

const getAccentColor = (status) => {
  switch (status) {
    case 'Found': return colors.primary;
    case 'Needs Approval': return colors.secondary;
    case 'Applied': return colors.success;
    case 'Interviewing': return colors.warning;
    case 'Offer': return '#ff7300';
    default: return colors.textMuted;
  }
};

export const JobCard = ({ job, onPress }) => {
  const scoreColor = getScoreColor(job.matchScore);
  const accent = getAccentColor(job.status);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accent }]}
      onPress={() => { hapticLight(); onPress?.(); }}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}18`, borderColor: `${scoreColor}40` }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{job.matchScore}%</Text>
        </View>
      </View>

      <Text style={styles.company} numberOfLines={1}>{job.company}</Text>

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{job.location}</Text>
        </View>
        {job.salary && job.salary !== 'No especificado' && (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{job.salary}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.sourceBadge}>
          <View style={[styles.sourceDot, { backgroundColor: job.isSimulated === false ? colors.success : colors.warning }]} />
          <Text style={styles.sourceText}>{job.source}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={styles.dateText}>{formatDate(job.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...glassCard,
    borderLeftWidth: 3,
    marginBottom: 8,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMain,
    lineHeight: 18,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
  company: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  meta: { gap: 3 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 6,
    marginTop: 4,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dateText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
