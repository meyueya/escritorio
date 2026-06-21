import * as Haptics from 'expo-haptics';

// Feedback medio para botones normales
export const hapticImpact = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Impacto pesado para acciones importantes (Lanzar Autopilot)
export const hapticHeavy = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Notificación de éxito (cuando se encuentra un empleo)
export const hapticSuccess = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Notificación de error
export const hapticError = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Feedback ligero para selecciones de tabs o chips
export const hapticLight = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
