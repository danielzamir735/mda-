import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export interface PushPrefs {
  medication: boolean;
  disease: boolean;
  concept: boolean;
  chosenHour: number;
  chosenMinute: number;
}

function getSessionId(): string {
  const key = 'medic_session_id';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

// web-push VAPID keys are base64url — atob() needs standard base64 + padding
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

async function upsertSubscription(sub: PushSubscription, prefs: PushPrefs): Promise<void> {
  const json = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
    session_id: getSessionId(),
    medication: prefs.medication,
    disease: prefs.disease,
    concept: prefs.concept,
    chosen_hour: prefs.chosenHour,
    chosen_minute: prefs.chosenMinute,
    enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  if (error) {
    console.error('[pushNotifications] upsertSubscription failed:', error.message);
    throw new Error(`db-upsert-failed: ${error.message}`);
  }
}

export async function enableDailyPush(prefs: PushPrefs): Promise<PushSubscription> {
  if (!isPushSupported()) throw new Error('push-unsupported');
  if (!VAPID_PUBLIC_KEY) {
    console.error('[pushNotifications] VITE_VAPID_PUBLIC_KEY is not set');
    throw new Error('vapid-key-missing');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') throw new Error(`permission-${permission}`);

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  let subscription: PushSubscription;
  try {
    subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } catch (err) {
    console.error('[pushNotifications] pushManager.subscribe failed:', err);
    throw new Error('subscribe-failed');
  }

  await upsertSubscription(subscription, prefs);
  return subscription;
}

export async function updatePushPrefs(prefs: PushPrefs): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await upsertSubscription(subscription, prefs);
}

export async function disableDailyPush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await supabase.from('push_subscriptions')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('endpoint', subscription.endpoint);

  await subscription.unsubscribe();
}
