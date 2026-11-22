import { describe, expect, it } from 'vitest';
import { diasEntre, generarAlertas } from './alertas';
import { aplicarRemotos, encolar, llamarServidor, quitarEnviados } from './sync';
import { AJUSTES_INICIALES, DECISIONES_EJEMPLO, FINCAS_EJEMPLO, RIESGOS_EJEMPLO, normalizarFinca } from './datosEjemplo';
import type { Cambio, RegistroBitacora } from './tipos';

const base = {
  riesgos: RIESGOS_EJEMPLO,
  fincas: FINCAS_EJEMPLO,
  decisiones: DECISIONES_EJEMPLO,
  bitacora: [] as RegistroBitacora[],
  ajustes: AJUSTES_INICIALES,
};

describe('alertas automáticas', () => {
  it('calcula días entre fechas', () => {
    expect(diasEntre('2026-11-08', '2026-11-20')).toBe(12);
  });

  it('genera las alertas de las fincas de ejemplo, ordenadas por gravedad', () => {
    const a = generarAlertas(base, '2026-11-08');
    const ids = a.map((x) => x.id);
    expect(ids).toContain('finca-no-siembra-f-05');
    expect(ids).toContain('finca-organico-f-04');
    expect(ids).toContain('finca-duda-siembra-f-02');
    expect(ids).toContain('finca-riego-f-02');
    expect(ids).toContain('finca-cosecha-f-03-2026-11-20');
    expect(a[0].gravedad).toBe('alta');
    expect(a.at(-1)!.gravedad).toBe('info');
    // con controles ningún riesgo de ejemplo supera el apetito
    expect(ids.some((i) => i.startsWith('riesgo-'))).toBe(false);
  });

  it('avisa si un riesgo supera el apetito y si una revisión está vencida', () => {
    const registro = {
      id: 'b1', decisionId: 'd', tituloDecision: 'Compra', opcionElegida: 'C', pti: 73, riesgoResidual: 8,
      candadosVerificados: [], escenariosSimulados: [], supuestos: '', aprobadoPor: 'Gerencia',
      fechaAprobacion: '2026-05-01', fechaRevision: '2026-11-01', resultadoReal: '', estadoRevision: 'pendiente',
    } as RegistroBitacora;
    const a = generarAlertas({ ...base, bitacora: [registro], ajustes: { ...AJUSTES_INICIALES, apetitoRiesgo: 9 } }, '2026-11-08');
    const ids = a.map((x) => x.id);
    expect(ids).toContain('riesgo-apetito-r-nino');
    expect(ids).toContain('bitacora-vencida-b1');
  });
});

describe('sincronización', () => {
  const c = (id: string, actualizado: string, datos: unknown = { id }): Cambio => ({ coleccion: 'fincas', id, datos, actualizado });

  it('la cola guarda solo el cambio más reciente de cada registro', () => {
    let p = encolar([], c('f1', '2026-11-08T10:00:00Z'));
    p = encolar(p, c('f1', '2026-11-08T11:00:00Z'));
    p = encolar(p, c('f2', '2026-11-08T11:00:00Z'));
    expect(p).toHaveLength(2);
    expect(p.find((x) => x.id === 'f1')!.actualizado).toBe('2026-11-08T11:00:00Z');
  });

  it('quita los enviados, pero no si se modificaron durante el envío', () => {
    const enviados = [c('f1', 't1'), c('f2', 't1')];
    const actuales = [c('f1', 't1'), c('f2', 't2')];
    expect(quitarEnviados(actuales, enviados)).toEqual([c('f2', 't2')]);
  });

  it('aplica cambios remotos: gana el más reciente y respeta borrados', () => {
    const local = { riesgos: [], decisiones: [], bitacora: [], fincas: [
      { id: 'f-01', actualizado: '2026-11-08T12:00:00Z', nombre: 'local' },
      { id: 'f-02', actualizado: '2026-11-08T09:00:00Z', nombre: 'viejo' },
      { id: 'f-03', actualizado: '2026-11-08T09:00:00Z' },
    ] };
    const remotos = [
      c('f-01', '2026-11-08T10:00:00Z', { nombre: 'remoto viejo' }), // pierde
      c('f-02', '2026-11-08T10:00:00Z', { nombre: 'remoto nuevo' }), // gana
      c('f-03', '2026-11-08T10:00:00Z', null), // borrado
      c('f-09', '2026-11-08T10:00:00Z', { nombre: 'nueva' }), // nueva
    ];
    const r = aplicarRemotos(local, remotos, (_col, x) => normalizarFinca(x as never));
    const porId = Object.fromEntries(r.fincas.map((f) => [f.id, f as { nombre?: string; areaHa?: number }]));
    expect(porId['f-01'].nombre).toBe('local');
    expect(porId['f-02'].nombre).toBe('remoto nuevo');
    expect(porId['f-03']).toBeUndefined();
    expect(porId['f-09'].nombre).toBe('nueva');
    expect(porId['f-09'].areaHa).toBe(0); // normalizada
  });

  it('llama al servidor con los pendientes y el cursor', async () => {
    let cuerpo: unknown;
    const falso = (async (url: string, init: RequestInit) => {
      expect(url).toBe('http://servidor:8000/sync');
      cuerpo = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ cambios: [], cursor: 7 }), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await llamarServidor('http://servidor:8000/', [c('f1', 't1')], 3, falso);
    expect(r.cursor).toBe(7);
    expect(cuerpo).toEqual({ cambios: [c('f1', 't1')], cursor: 3 });
  });
});
