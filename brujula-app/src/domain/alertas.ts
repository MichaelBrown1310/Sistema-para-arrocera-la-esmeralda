// Reglas de alertas automáticas. Funciones puras: reciben los datos y la fecha de hoy
// y devuelven la lista de alertas activas. La app las muestra y, si el usuario lo activa,
// envía notificaciones de las nuevas.

import { evaluarDecision, nivelRiesgo, valorRiesgo } from './calculos';
import type { Ajustes, Alerta, Decision, Finca, Gravedad, RegistroBitacora, Riesgo } from './tipos';

/** Días entre dos fechas AAAA-MM-DD (b - a). */
export const diasEntre = (a: string, b: string): number =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

const ORDEN: Record<Gravedad, number> = { alta: 0, media: 1, info: 2 };

export interface DatosAlertas {
  riesgos: Riesgo[];
  fincas: Finca[];
  decisiones: Decision[];
  bitacora: RegistroBitacora[];
  ajustes: Ajustes;
}

export const generarAlertas = (d: DatosAlertas, hoy: string): Alerta[] => {
  const alertas: Alerta[] = [];
  const meta = d.ajustes.metaAguaM3Ha;

  // Riesgos
  for (const r of d.riesgos) {
    const residual = valorRiesgo(r.probResidual, r.impactoResidual);
    const inherente = valorRiesgo(r.probabilidad, r.impacto);
    if (residual > d.ajustes.apetitoRiesgo) {
      alertas.push({
        id: `riesgo-apetito-${r.id}`,
        gravedad: 'alta',
        titulo: `Riesgo sobre el apetito: ${r.nombre}`,
        detalle: `Con controles queda en ${residual}; el máximo aceptado es ${d.ajustes.apetitoRiesgo}. Necesita plan de mitigación.`,
        enlace: `/riesgos/${r.id}`,
      });
    } else if (nivelRiesgo(inherente) === 'rojo' && !r.controles.trim()) {
      alertas.push({
        id: `riesgo-sin-controles-${r.id}`,
        gravedad: 'alta',
        titulo: `Riesgo en rojo sin controles: ${r.nombre}`,
        detalle: `Valor ${inherente}. Registra qué controles lo reducen.`,
        enlace: `/riesgos/${r.id}`,
      });
    }
  }

  // Fincas
  for (const f of d.fincas) {
    const enlace = `/fincas/${f.id}`;
    if (f.intencionSiembra === 'no') {
      alertas.push({ id: `finca-no-siembra-${f.id}`, gravedad: 'alta', enlace,
        titulo: `${f.nombre}: no volverá a sembrar`,
        detalle: `El agricultor ${f.codigoAgricultor} dijo que no siembra el próximo semestre.` });
    } else if (f.intencionSiembra === 'duda') {
      alertas.push({ id: `finca-duda-siembra-${f.id}`, gravedad: 'media', enlace,
        titulo: `${f.nombre}: duda si volverá a sembrar`,
        detalle: `Conviene contactar al agricultor ${f.codigoAgricultor} antes de la próxima siembra.` });
    }
    if (f.loteOrganico && f.insumoNoPermitido) {
      alertas.push({ id: `finca-organico-${f.id}`, gravedad: 'alta', enlace,
        titulo: `${f.nombre}: candado del sello orgánico`,
        detalle: 'Se usó un insumo no permitido en el lote orgánico.' });
    }
    if (f.aguaM3Ha > meta) {
      alertas.push({ id: `finca-agua-${f.id}`, gravedad: 'media', enlace,
        titulo: `${f.nombre}: agua sobre la meta`,
        detalle: `${f.aguaM3Ha.toLocaleString('es-CO')} m³/ha (meta ${meta.toLocaleString('es-CO')}).` });
    }
    if (f.problemasRiego) {
      alertas.push({ id: `finca-riego-${f.id}`, gravedad: 'media', enlace,
        titulo: `${f.nombre}: problema de riego`,
        detalle: f.detalleRiego || 'El agrónomo reportó un problema de riego.' });
    }
    if (f.fechaCosechaEsperada) {
      const dias = diasEntre(hoy, f.fechaCosechaEsperada);
      if (dias >= 0 && dias <= 15) {
        alertas.push({ id: `finca-cosecha-${f.id}-${f.fechaCosechaEsperada}`, gravedad: 'info', enlace,
          titulo: `${f.nombre}: cosecha en ${dias} días`,
          detalle: `Se esperan unas ${f.produccionEsperadaT} t. Programa la recolección.` });
      }
    }
    if (f.ultimaVisita && diasEntre(f.ultimaVisita, hoy) > 60) {
      alertas.push({ id: `finca-sin-visita-${f.id}`, gravedad: 'info', enlace,
        titulo: `${f.nombre}: sin visita reciente`,
        detalle: `La última visita fue hace ${diasEntre(f.ultimaVisita, hoy)} días.` });
    }
  }

  // Bitácora: revisiones
  for (const b of d.bitacora) {
    if (b.estadoRevision !== 'pendiente' || !b.fechaRevision) continue;
    const dias = diasEntre(hoy, b.fechaRevision);
    if (dias < 0) {
      alertas.push({ id: `bitacora-vencida-${b.id}`, gravedad: 'alta', enlace: '/bitacora',
        titulo: `Revisión vencida: ${b.tituloDecision}`,
        detalle: `Debía revisarse el ${b.fechaRevision}. Registra el resultado real.` });
    } else if (dias <= 7) {
      alertas.push({ id: `bitacora-proxima-${b.id}`, gravedad: 'media', enlace: '/bitacora',
        titulo: `Revisión en ${dias} días: ${b.tituloDecision}`,
        detalle: `Fecha de revisión: ${b.fechaRevision}.` });
    }
  }

  // Decisiones abiertas sin opción recomendable
  for (const dec of d.decisiones) {
    if (dec.estado !== 'abierta' || dec.opciones.length === 0) continue;
    const r = evaluarDecision(dec, d.ajustes);
    if (!r.some((x) => x.estado === 'recomendada')) {
      alertas.push({ id: `decision-sin-opcion-${dec.id}`, gravedad: 'media', enlace: `/decidir/${dec.id}`,
        titulo: `Sin opción recomendable: ${dec.titulo}`,
        detalle: 'Todas las opciones rompen un candado o superan el apetito de riesgo.' });
    }
  }

  return alertas.sort((a, b) => ORDEN[a.gravedad] - ORDEN[b.gravedad]);
};
