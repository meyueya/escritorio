import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../utils/colors';
import { hapticLight } from '../utils/haptics';

export const StatCard = ({ icon, label, value, accent = colors.primary, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: accent, borderLeftWidth: 3 }]}
    onPress={() => { hapticLight(); onPress?.(); }}
    activeOpacity={0.8}
  >
    <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>
      <Ionicons name={icon} size={20} color={accent} />
    </View>
    <View style={styles.info}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    ...glassCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 140,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
});
