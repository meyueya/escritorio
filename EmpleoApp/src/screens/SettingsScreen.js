import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, glassCard } from '../utils/colors';
import { hapticImpact, hapticSuccess, hapticError } from '../utils/haptics';
import { createApiClient, getBaseUrl, setBaseUrl } from '../api/client';
import { DEFAULT_SERVER_URL } from '../constants/config';

const SettingRow = ({ icon, label, subtitle, value, onChangeText, placeholder, secure = false, keyboardType = 'default' }) => (
  <View style={rowStyles.wrap}>
    <View style={rowStyles.labelWrap}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={rowStyles.label}>{label}</Text>
        {subtitle && <Text style={rowStyles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
    <TextInput
      style={rowStyles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secure}
      keyboardType={keyboardType}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);

const rowStyles = StyleSheet.create({
  wrap: { gap: 8 },
  labelWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textMain },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    color: colors.textMain,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: 'Courier New',
  },
});

export default function SettingsScreen() {
  const [serverUrl, setServerUrlLocal] = useState('');
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    joobleApiKey: '',
    adzunaAppId: '',
    adzunaAppKey: '',
    pushoverUserKey: '',
    pushoverToken: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = await getBaseUrl();
      setServerUrlLocal(url);
      const api = await createApiClient();
      const data = await api.get('/api/settings');
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      Alert.alert('Sin conexión', `No se pudo conectar al servidor.\n\nVerifica que:\n• El servidor Node.js está corriendo en tu Mac (npm run dev)\n• La IP del servidor es correcta: ${await getBaseUrl()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServer = async () => {
    hapticImpact();
    const cleaned = serverUrl.trim().replace(/\/$/, '');
    await setBaseUrl(cleaned);
    hapticSuccess();
    Alert.alert('✅ URL Guardada', `La app ahora apuntará a:\n${cleaned}\n\nRecarga la pantalla para verificar la conexión.`);
  };

  const handleSaveSettings = async () => {
    hapticImpact();
    setSaving(true);
    try {
      const api = await createApiClient();
      await api.post('/api/settings', settings);
      hapticSuccess();
      Alert.alert('✅ Ajustes Guardados', 'La configuración ha sido actualizada y sincronizada con el servidor.');
    } catch (err) {
      hapticError();
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestPush = async () => {
    setTesting(true);
    hapticImpact();
    try {
      const api = await createApiClient();
      const result = await api.post('/api/test-push');
      hapticSuccess();
      Alert.alert('✅ Notificación Enviada', result.message || 'Revisa tu iPhone para ver la notificación de prueba.');
    } catch (err) {
      hapticError();
      Alert.alert('Error', err.message);
    } finally {
      setTesting(false);
    }
  };

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Conectando al servidor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.pageTitle}>Ajustes</Text>
          <Text style={styles.pageSubtitle}>Configura APIs, SMTP y la URL del servidor</Text>

          {/* Server URL */}
          <View style={[glassCard, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>🖥️ Servidor Backend</Text>
            <Text style={styles.sectionDesc}>IP de tu Mac en la red WiFi local. La app iOS se conecta aquí.</Text>
            <SettingRow
              icon="server-outline"
              label="URL del Servidor"
              subtitle="Cambia si tu IP local cambia"
              value={serverUrl}
              onChangeText={setServerUrlLocal}
              placeholder={DEFAULT_SERVER_URL}
              keyboardType="url"
            />
            <TouchableOpacity style={styles.saveSecondary} onPress={handleSaveServer}>
              <Ionicons name="save-outline" size={16} color={colors.primary} />
              <Text style={[styles.saveBtnText, { color: colors.primary }]}>Guardar URL del Servidor</Text>
            </TouchableOpacity>
          </View>

          {/* Gemini AI */}
          <View style={[glassCard, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>🤖 Gemini AI</Text>
            <SettingRow
              icon="key-outline"
              label="API Key de Gemini"
              subtitle="Obtén tu clave en aistudio.google.com"
              value={settings.geminiApiKey}
              onChangeText={v => update('geminiApiKey', v)}
              placeholder="AIzaSy..."
              secure
            />
          </View>

          {/* SMTP */}
          <View style={[glassCard, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>📧 Email SMTP</Text>
            <SettingRow icon="mail-outline" label="Servidor SMTP" value={settings.smtpHost} onChangeText={v => update('smtpHost', v)} placeholder="smtp.gmail.com" />
            <SettingRow icon="at-outline" label="Correo Remitente" value={settings.smtpUser} onChangeText={v => update('smtpUser', v)} placeholder="tu@gmail.com" keyboardType="email-address" />
            <SettingRow icon="lock-closed-outline" label="Contraseña de App" subtitle="Genera una en tu cuenta Google > Seguridad" value={settings.smtpPass} onChangeText={v => update('smtpPass', v)} placeholder="xxxx xxxx xxxx xxxx" secure />
          </View>

          {/* European Job Portals */}
          <View style={[glassCard, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>🇪🇺 Portales Europeos</Text>
            <SettingRow icon="globe-outline" label="Jooble API Key" subtitle="Gratis en jooble.org/api/about" value={settings.joobleApiKey} onChangeText={v => update('joobleApiKey', v)} placeholder="Tu Jooble API Key" secure />
            <SettingRow icon="briefcase-outline" label="Adzuna App ID" subtitle="Gratis en developer.adzuna.com" value={settings.adzunaAppId} onChangeText={v => update('adzunaAppId', v)} placeholder="Tu Adzuna App ID" />
            <SettingRow icon="briefcase-outline" label="Adzuna App Key" value={settings.adzunaAppKey} onChangeText={v => update('adzunaAppKey', v)} placeholder="Tu Adzuna App Key" secure />
          </View>

          {/* Pushover */}
          <View style={[glassCard, { gap: 12 }]}>
            <Text style={styles.sectionTitle}>🔔 Notificaciones Push (Pushover)</Text>
            <SettingRow icon="notifications-outline" label="User Key" value={settings.pushoverUserKey} onChangeText={v => update('pushoverUserKey', v)} placeholder="Tu Pushover User Key" secure />
            <SettingRow icon="notifications-outline" label="API Token" value={settings.pushoverToken} onChangeText={v => update('pushoverToken', v)} placeholder="Tu Pushover Token" secure />
            <TouchableOpacity style={styles.testBtn} onPress={handleTestPush} disabled={testing}>
              {testing ? <ActivityIndicator color={colors.secondary} size="small" /> : <Ionicons name="send-outline" size={16} color={colors.secondary} />}
              <Text style={[styles.saveBtnText, { color: colors.secondary }]}>Probar Notificación Push</Text>
            </TouchableOpacity>
          </View>

          {/* Save All */}
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveSettings} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="save" size={20} color="#fff" />}
            <Text style={styles.saveBtnTextWhite}>Guardar Todos los Ajustes</Text>
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
  sectionDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  saveSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryGlow,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
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
  saveBtnTextWhite: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
