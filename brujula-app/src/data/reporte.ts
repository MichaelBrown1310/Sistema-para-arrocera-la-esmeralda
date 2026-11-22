// Reporte para auditorías (Empresa B, comercio justo, orgánico, Amigo de las Aves).
// Arma el contenido una sola vez y lo entrega como vista en pantalla, PDF o CSV.

import { Capacitor } from '@capacitor/core';
import { resumenFincas, valorRiesgo, ordenarRiesgos } from '../domain/calculos';
import type { Datos } from './store';

export interface Reporte {
  generado: string;
  decisiones: {
    fecha: string;
    decision: string;
    opcion: string;
    pti: number;
    riesgo: number;
    aprobadoPor: string;
    revision: string;
    supuestos: string;
    escenarios: string;
    candados: string;
    resultado: string;
  }[];
  indicadores: { indicador: string; valor: string }[];
  riesgos: { riesgo: string; categoria: string; inherente: number; residual: number; controles: string }[];
}

const fmt = (n: number) => n.toLocaleString('es-CO');

export const armarReporte = (d: Datos, generado: string): Reporte => {
  const r = resumenFincas(d.fincas, d.ajustes.metaAguaM3Ha);
  const intencion = (v: string) => d.fincas.filter((f) => f.intencionSiembra === v).length;
  return {
    generado,
    decisiones: [...d.bitacora]
      .sort((a, b) => b.fechaAprobacion.localeCompare(a.fechaAprobacion))
      .map((b) => ({
        fecha: b.fechaAprobacion,
        decision: b.tituloDecision,
        opcion: b.opcionElegida,
        pti: b.pti,
        riesgo: b.riesgoResidual,
        aprobadoPor: b.aprobadoPor,
        revision: b.estadoRevision === 'revisada' ? 'Revisada' : `Pendiente (${b.fechaRevision})`,
        supuestos: b.supuestos,
        escenarios: b.escenariosSimulados.join(', '),
        candados: b.candadosVerificados.length ? `Candados verificados: ${b.candadosVerificados.join('; ')}` : 'Candados: sin registro',
        resultado: b.resultadoReal,
      })),
    indicadores: [
      { indicador: 'Fincas registradas', valor: `${r.total} (${fmt(r.areaHa)} ha)` },
      { indicador: 'Producción esperada', valor: `${fmt(r.produccionEsperadaT)} t de paddy` },
      { indicador: 'Agua promedio (ponderada por área)', valor: `${fmt(r.aguaPromedio)} m³/ha (meta ${fmt(d.ajustes.metaAguaM3Ha)})` },
      { indicador: 'Fincas con problemas de riego', valor: `${r.conProblemasRiego}` },
      { indicador: 'Área con control biológico (promedio)', valor: `${r.controlBiologicoPct} %` },
      { indicador: 'Fincas con nivelación láser', valor: `${r.conLaser} de ${r.total}` },
      { indicador: 'Fincas con lote orgánico', valor: `${r.conOrganico} (incumplen: ${r.incumplenOrganico})` },
      { indicador: 'Aves observadas en visitas', valor: `${fmt(r.avesTotal)}` },
      { indicador: 'Intención de volver a sembrar', valor: `Sí ${intencion('si')} · Duda ${intencion('duda')} · No ${intencion('no')}` },
    ],
    riesgos: ordenarRiesgos(d.riesgos).map((x) => ({
      riesgo: x.nombre,
      categoria: x.categoria,
      inherente: valorRiesgo(x.probabilidad, x.impacto),
      residual: valorRiesgo(x.probResidual, x.impactoResidual),
      controles: x.controles,
    })),
  };
};

/* ---------- CSV (para Excel; separador punto y coma) ---------- */

const celda = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export const reporteCSV = (r: Reporte): string => {
  const filas = [
    ['Fecha', 'Decisión', 'Opción elegida', 'PTI', 'Riesgo residual', 'Aprobado por', 'Revisión', 'Supuestos', 'Escenarios simulados', 'Candados', 'Resultado real'],
    ...r.decisiones.map((x) => [x.fecha, x.decision, x.opcion, x.pti, x.riesgo, x.aprobadoPor, x.revision, x.supuestos, x.escenarios, x.candados, x.resultado]),
  ];
  return filas.map((f) => f.map(celda).join(';')).join('\r\n');
};

/* ---------- PDF ---------- */

export const generarPDF = async (r: Reporte) => {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const verde: [number, number, number] = [47, 125, 79];

  doc.setFontSize(16);
  doc.text('Brújula Triple Impacto · Reporte para auditorías', 40, 50);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Generado: ${r.generado} · Prototipo académico con datos de ejemplo`, 40, 66);
  doc.setTextColor(0);

  doc.setFontSize(12);
  doc.text('1. Decisiones aprobadas', 40, 94);
  autoTable(doc, {
    startY: 102,
    head: [['Fecha', 'Decisión', 'Opción', 'PTI', 'Riesgo', 'Aprobó', 'Revisión']],
    body: r.decisiones.length
      ? r.decisiones.map((x) => [x.fecha, x.decision, x.opcion, x.pti, x.riesgo, x.aprobadoPor, x.revision])
      : [['—', 'Aún no hay decisiones aprobadas', '', '', '', '', '']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: verde },
  });

  const despues = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  if (r.decisiones.length) {
    autoTable(doc, {
      startY: despues + 10,
      head: [['Decisión', 'Supuestos y escenarios', 'Candados verificados', 'Resultado real']],
      body: r.decisiones.map((x) => [
        x.decision,
        [x.supuestos, x.escenarios && `Escenarios: ${x.escenarios}`].filter(Boolean).join('\n'),
        x.candados,
        x.resultado || 'Pendiente',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: verde },
    });
  }

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
  doc.setFontSize(12);
  doc.text('2. Indicadores de fincas', 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [['Indicador', 'Valor']],
    // la fuente estándar del PDF no tiene el carácter ³
    body: r.indicadores.map((x) => [x.indicador, x.valor.replace(/³/g, '3')]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: verde },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
  doc.setFontSize(12);
  doc.text('3. Riesgos (probabilidad × impacto)', 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [['Riesgo', 'Categoría', 'Inherente', 'Con controles', 'Controles']],
    body: r.riesgos.map((x) => [x.riesgo, x.categoria, x.inherente, x.residual, x.controles]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: verde },
  });

  const nombre = `reporte-auditoria-${r.generado.slice(0, 10)}.pdf`; // generado empieza por la fecha local AAAA-MM-DD

  if (Capacitor.isNativePlatform()) {
    // En el celular: se guarda y se abre el menú de compartir (correo, WhatsApp, Drive…)
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const base64 = doc.output('datauristring').split(',')[1];
    const archivo = await Filesystem.writeFile({ path: nombre, data: base64, directory: Directory.Cache });
    await Share.share({ title: 'Reporte para auditorías', url: archivo.uri });
  } else {
    doc.save(nombre); // en el navegador: descarga
  }
};
