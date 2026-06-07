/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNotification } from './types';

/**
 * Solicita permisos de notificación nativa en el navegador
 */
export async function requestBrowserPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  
  // En iframes con sandbox, a veces puede fallar de forma silenciosa o lanzar una excepción
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('No se pudieron solicitar permisos de notificación nativa debido al entorno iFrame Sandbox:', error);
    return 'default';
  }
}

/**
 * Dispara una notificación push nativa del navegador y emite un evento dentro de la app
 */
export function triggerNotification(
  title: string,
  message: string,
  type: AppNotification['type'],
  fileId?: string,
  senderName?: string
) {
  // 1. Notificación nativa del navegador (si se tienen los permisos)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const options: NotificationOptions = {
        body: message,
        icon: '/icon_launcher.svg',
        tag: `todoarchivos-${type}`,
        badge: '/app_logo.svg',
      };
      
      new Notification(`TodoArchivos: ${title}`, options);
    } catch (e) {
      console.warn('Notificación de navegador bloqueada por las restricciones de origen/sandbox:', e);
    }
  }

  // 2. Notificación en sonido (Haptic/Audio Feedback)
  try {
    if (typeof window !== 'undefined') {
      const synth = window.speechSynthesis;
      // Podemos reproducir un sutil aviso sonoro
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      // Ajustar Hertz según el tipo para que suene dinámico
      oscillator.frequency.setValueAtTime(type === 'update' ? 523.25 : type === 'download' ? 440 : 349.23, audioCtx.currentTime); // C5 o A4 o F4
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    // Silencio si no está permitido reproducir sonido sin previa interacción del usuario
  }

  // 3. Emisión de Evento Personalizado para el gestor reactivo
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('todoarchivos-push-event', {
      detail: {
        id: 'notif_' + Math.random().toString(36).substring(2, 11),
        title,
        message,
        type,
        fileId,
        senderName,
        createdAt: new Date().toISOString(),
        read: false
      }
    });
    window.dispatchEvent(event);
  }
}
