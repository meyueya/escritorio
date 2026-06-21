import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Solicitar permisos de notificaciones (llamar al iniciar la app)
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') return true;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

// Enviar notificación local inmediata cuando el autopilot encuentra un empleo
export const notifyJobFound = async (jobTitle, company, matchScore) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 Match ${matchScore}% — ¡Empleo Encontrado!`,
        body: `${jobTitle} en ${company}`,
        sound: true,
        badge: 1,
        data: { type: 'job_found' },
      },
      trigger: null, // Inmediata
    });
  } catch (err) {
    console.warn('Notification error:', err);
  }
};

// Notificación cuando el autopilot termina la búsqueda
export const notifyAutopilotDone = async (jobsFound) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Autopilot Completado',
        body: `Búsqueda finalizada: ${jobsFound} empleos procesados.`,
        sound: true,
        data: { type: 'autopilot_done' },
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('Notification error:', err);
  }
};
