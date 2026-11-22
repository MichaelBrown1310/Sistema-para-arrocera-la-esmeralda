// Envío de notificaciones de alertas.
// - En Android/iOS (Capacitor): notificaciones locales del sistema.
// - En el navegador: API de notificaciones web, si el usuario da permiso.
// - Si nada de eso está disponible (por ejemplo, en la demo de Claude), no hace nada:
//   las alertas siguen visibles dentro de la app.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Alerta } from '../domain/tipos';

const CLAVE_ENVIADAS = 'brujula-triple-impacto:notificadas';

export const nativo = () => Capacitor.isNativePlatform();

export const notificacionesDisponibles = (): boolean => {
  if (nativo()) return true;
  try {
    return typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext;
  } catch {
    return false;
  }
};

/** Pide permiso al usuario. Devuelve true si quedó concedido. */
export const pedirPermiso = async (): Promise<boolean> => {
  try {
    if (nativo()) {
      const r = await LocalNotifications.requestPermissions();
      return r.display === 'granted';
    }
    if (!notificacionesDisponibles()) return false;
    const r = await Notification.requestPermission();
    return r === 'granted';
  } catch {
    return false;
  }
};

const leerEnviadas = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_ENVIADAS) ?? '[]'));
  } catch {
    return new Set();
  }
};

const guardarEnviadas = (ids: Set<string>) => {
  try {
    localStorage.setItem(CLAVE_ENVIADAS, JSON.stringify([...ids]));
  } catch {
    /* sin almacenamiento: puede repetir alguna notificación */
  }
};

const mostrar = async (titulo: string, cuerpo: string, numero: number) => {
  if (nativo()) {
    await LocalNotifications.schedule({
      notifications: [{ id: numero, title: titulo, body: cuerpo, schedule: { at: new Date(Date.now() + 500) } }],
    });
    return;
  }
  if (notificacionesDisponibles() && Notification.permission === 'granted') {
    new Notification(titulo, { body: cuerpo, tag: titulo });
  }
};

/**
 * Notifica solo las alertas altas y medias que no se hayan notificado antes.
 * Si son más de 3 nuevas, envía un resumen en lugar de una por una.
 */
export const notificarNuevas = async (alertas: Alerta[]): Promise<number> => {
  const enviadas = leerEnviadas();
  const nuevas = alertas.filter((a) => a.gravedad !== 'info' && !enviadas.has(a.id));
  if (nuevas.length === 0) return 0;
  try {
    if (nuevas.length > 3) {
      await mostrar('Brújula Triple Impacto', `Tienes ${nuevas.length} alertas nuevas. Ábrelas en la app.`, Date.now() % 100000);
    } else {
      for (const [i, a] of nuevas.entries()) await mostrar(a.titulo, a.detalle, (Date.now() + i) % 100000);
    }
  } catch {
    return 0;
  }
  nuevas.forEach((a) => enviadas.add(a.id));
  // se conservan solo las alertas aún activas, para volver a avisar si reaparecen
  guardarEnviadas(new Set([...enviadas].filter((id) => alertas.some((a) => a.id === id))));
  return nuevas.length;
};
