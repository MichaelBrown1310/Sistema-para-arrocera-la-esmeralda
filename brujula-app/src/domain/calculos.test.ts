import { describe, expect, it } from 'vitest';
import {
  calcularPTI,
  conteoMatriz,
  evaluarDecision,
  nivelRiesgo,
  pesosValidos,
  puntajesBajoEscenarios,
  resumenFincas,
  alertasFinca,
  valorRiesgo,
} from './calculos';
import { AJUSTES_INICIALES, DECISIONES_EJEMPLO, FINCAS_EJEMPLO, RIESGOS_EJEMPLO } from './datosEjemplo';

describe('matriz de riesgo', () => {
  it('multiplica probabilidad por impacto', () => {
    expect(valorRiesgo(5, 4)).toBe(20);
  });
  it('clasifica por semáforo', () => {
    expect(nivelRiesgo(6)).toBe('verde');
    expect(nivelRiesgo(8)).toBe('amarillo');
    expect(nivelRiesgo(12)).toBe('amarillo');
    expect(nivelRiesgo(15)).toBe('rojo');
  });
  it('cuenta riesgos por celda', () => {
    const m = conteoMatriz(RIESGOS_EJEMPLO);
    expect(m[4][3]).toBe(1); // El Niño: P5 I4
    expect(m.flat().reduce((a, b) => a + b, 0)).toBe(RIESGOS_EJEMPLO.length);
  });
});

describe('puntaje triple impacto', () => {
  it('reproduce los puntajes del documento (61, 70, 73)', () => {
    const p = AJUSTES_INICIALES.pesos;
    expect(calcularPTI(82, 45, 55, p)).toBe(61);
    expect(calcularPTI(50, 85, 75, p)).toBe(70);
    expect(calcularPTI(70, 78, 72, p)).toBe(73);
  });
  it('valida que los pesos sumen 100', () => {
    expect(pesosValidos({ E: 35, S: 35, A: 30 })).toBe(true);
    expect(pesosValidos({ E: 40, S: 35, A: 30 })).toBe(false);
  });
});

describe('evaluación de la decisión de ejemplo', () => {
  const decision = DECISIONES_EJEMPLO[0];

  it('descarta A por candado y recomienda C', () => {
    const r = evaluarDecision(decision, AJUSTES_INICIALES);
    const porId = Object.fromEntries(r.map((x) => [x.opcion.id, x]));
    expect(porId['o-a'].estado).toBe('descartada');
    expect(porId['o-b'].estado).toBe('viable');
    expect(porId['o-c'].estado).toBe('recomendada');
    expect(r[0].opcion.id).toBe('o-c');
  });

  it('marca para mitigar si el riesgo supera el apetito', () => {
    const r = evaluarDecision(decision, { ...AJUSTES_INICIALES, apetitoRiesgo: 8 });
    const b = r.find((x) => x.opcion.id === 'o-b')!;
    expect(b.estado).toBe('mitigar');
  });

  it('el simulador resta puntos según la sensibilidad', () => {
    const b = decision.opciones[1];
    const sim = puntajesBajoEscenarios(b, ['nino', 'bloqueo']);
    // nino (alta, -20) afecta E y A; bloqueo (alta, -20) afecta E y S
    expect(sim).toEqual({ E: 10, S: 65, A: 55 });
  });

  it('con El Niño fuerte la opción C sigue siendo la recomendada', () => {
    const r = evaluarDecision(decision, AJUSTES_INICIALES, ['nino']);
    expect(r[0].opcion.id).toBe('o-c');
    expect(r[0].ptiEscenario).toBeLessThan(r[0].ptiBase);
  });
});

describe('fincas', () => {
  it('detecta alertas de abandono, agua y orgánico', () => {
    const meta = AJUSTES_INICIALES.metaAguaM3Ha;
    expect(alertasFinca(FINCAS_EJEMPLO[1], meta)).toEqual({ abandono: true, agua: true, organico: false, riego: true });
    expect(alertasFinca(FINCAS_EJEMPLO[3], meta).organico).toBe(true);
  });
  it('calcula el resumen', () => {
    const r = resumenFincas(FINCAS_EJEMPLO, AJUSTES_INICIALES.metaAguaM3Ha);
    expect(r.total).toBe(6);
    expect(r.areaHa).toBe(91);
    expect(r.riesgoAbandono).toBe(2);
    expect(r.enAlerta).toBe(3);
  });
});
