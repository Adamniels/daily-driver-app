/**
 * Haptics with one voice: tick on small wins, success on level up,
 * heavy on evolution. No-ops on web; failures are swallowed (haptics
 * must never break a tap).
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS === 'ios' || Platform.OS === 'android';

export function hapticTick(): void {
  if (!native) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function hapticSuccess(): void {
  if (!native) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function hapticHeavy(): void {
  if (!native) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
}
