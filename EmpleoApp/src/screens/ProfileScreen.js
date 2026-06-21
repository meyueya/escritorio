import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../utils/colors';
import { hapticImpact, hapticSuccess, hapticError, hapticLight } from '../utils/haptics';
import { useProfile } from '../hooks/useProfile';

const TagInput = ({ tags, onAdd, onRemove, placeholder, accent = colors.primary }) => {
  const [input, setInput] = useState('');
  return (
    <View style={tagStyles.wrap}>
      {tags.map(tag => (
        <TouchableOpacity
          key={tag}
          style={[tagStyles.tag, { backgroundColor: `${accent}14`, borderColor: `${accent}40` }]}
          onPress={() => { hapticLight(); onRemove(tag); }}
        >
          <Text style={[tagStyles.tagText, { color: accent }]}>{tag}</Text>
          <Ionicons name="close" size={12} color={accent} />
        </TouchableOpacity>
      ))}
      <TextInput
        style={tagStyles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  );
};

const tagStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 8,
    minHeight: 48,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  input: { minWidth: 100, color: colors.textMain, fontSize: 13, flex: 1 },
});

export default function ProfileScreen() {
  const { profile, loading, fetchProfile, saveProfile } = useProfile();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile().then(p => { if (p) setForm(p); }); }, []);

  if (loading || !form) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    hapticImpact();
    setSaving(true);
    try {
      await saveProfile(form);
      hapticSuccess();
      Alert.alert('✅ Guardado', 'Tu perfil ha sido actualizado correctamente');
    } catch (err) {
      hapticError();
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.pageTitle}>Mi Perfil de Candidato</Text>
          <Text style={styles.pageSubtitle}>Datos que Gemini usará para adaptar tu CV a cada oferta</Text>

          {/* Basic Info */}
          <View style={[glassCard, { gap: 14 }]}>
            <Text style={styles.sectionTitle}>👤 Datos Profesionales</Text>

            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput style={styles.input} value={form.name} onChangeText={v => update('name', v)} placeholder="Pedro Castillo..." placeholderTextColor={colors.textMuted} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Título Profesional</Text>
                <TextInput style={styles.input} value={form.title} onChangeText={v => update('title', v)} placeholder="Senior Full Stack..." placeholderTextColor={colors.textMuted} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Email de Contacto</Text>
                <TextInput style={styles.input} value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" placeholder="correo@gmail.com" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput style={styles.input} value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" placeholder="+34 600..." placeholderTextColor={colors.textMuted} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ubicación / Residencia</Text>
              <TextInput style={styles.input} value={form.location} onChangeText={v => update('location', v)} placeholder="Madrid, España / Remoto" placeholderTextColor={colors.textMuted} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Currículum en Texto (CV Base para la IA)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.cvText}
                onChangeText={v => update('cvText', v)}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholder="Pega aquí el texto completo de tu CV..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Autopilot Preferences */}
          <View style={[glassCard, { gap: 14 }]}>
            <Text style={styles.sectionTitle}>🎯 Preferencias del Autopilot</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Palabras Clave de Búsqueda (Puestos)</Text>
              <TagInput
                tags={form.targetKeywords || []}
                onAdd={kw => update('targetKeywords', [...(form.targetKeywords || []), kw])}
                onRemove={kw => update('targetKeywords', (form.targetKeywords || []).filter(k => k !== kw))}
                placeholder="Nuevo puesto..."
                accent={colors.secondary}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Salario Mínimo (€/año)</Text>
                <TextInput
                  style={styles.input}
                  value={String(form.minSalary || '')}
                  onChangeText={v => update('minSalary', parseInt(v) || 0)}
                  keyboardType="numeric"
                  placeholder="35000"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Modalidad</Text>
                <View style={styles.selectWrap}>
                  {['Remote', 'Hybrid', 'Onsite', 'All'].map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.selectOpt, form.targetLocation === opt && styles.selectOptActive]}
                      onPress={() => { hapticLight(); update('targetLocation', opt); }}
                    >
                      <Text style={[styles.selectOptText, form.targetLocation === opt && { color: colors.primary }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Skills */}
          <View style={[glassCard, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>🛠️ Habilidades Técnicas</Text>
            <TagInput
              tags={form.skills || []}
              onAdd={s => update('skills', [...(form.skills || []), s])}
              onRemove={s => update('skills', (form.skills || []).filter(x => x !== s))}
              placeholder="Nueva skill..."
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save" size={20} color="#fff" />}
            <Text style={styles.saveBtnText}>Guardar Perfil Completo</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.textMain, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: colors.textMuted },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textMain },
  field: { gap: 6 },
  fieldHalf: { flex: 1, gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    color: colors.textMain,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textarea: { minHeight: 140, paddingTop: 12 },
  selectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectOpt: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  selectOptActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  selectOptText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  saveBtn: {
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
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
