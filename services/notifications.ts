// Push Notifications Service for Duarte Delivery
import { PushNotificationLog, PushNotificationRecipient, UserProfile, UserRole } from '../types';

/**
 * Audio chime synthesizer using Web Audio API for push alert sound
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play two-tone alert chime (E5 -> A5)
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.4, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.warn('Audio context playback issue:', err);
  }
}

/**
 * Request native browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Trigger browser native desktop / mobile push notification
 */
export function showBrowserNotification(title: string, body: string, onClickUrl?: string) {
  playNotificationSound();

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
        tag: 'duarte-delivery-ride',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Error showing native notification:', e);
    }
  }
}

/**
 * Dispatch Push Notification to all online drivers
 */
export function dispatchPushToDrivers(
  rideId: string,
  productName: string,
  price: number,
  driverEarnings: number,
  distanceStr: string,
  city: string,
  onlineDrivers: UserProfile[]
): PushNotificationLog {
  const title = '🚚 Nova corrida disponível';
  const message = `Nova entrega: ${productName}. Ganho motorista: R$ ${driverEarnings.toFixed(2)}. Distância: ${distanceStr}. ${city}`;

  const recipients: PushNotificationRecipient[] = onlineDrivers.map(driver => ({
    driverId: driver.id,
    driverName: driver.name,
    status: 'DELIVERED' as const
  }));

  // Play alert audio and send browser push
  showBrowserNotification(title, message);

  return {
    id: `push-${Date.now()}`,
    rideId,
    title,
    message,
    amount: driverEarnings,
    distance: distanceStr,
    city,
    sentAt: new Date().toISOString(),
    targetDriverCount: onlineDrivers.length,
    deliveredCount: recipients.length,
    failedCount: 0,
    status: 'SENT',
    recipients
  };
}
