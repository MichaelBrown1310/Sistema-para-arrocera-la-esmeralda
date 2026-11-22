import { nivelRiesgo } from '../domain/calculos';

const TEXTO = { verde: 'Bajo', amarillo: 'Medio', rojo: 'Alto' } as const;

/** Píldora de color con el valor del riesgo (1 a 25) y su nivel. */
const Semaforo = ({ valor, compacto = false }: { valor: number; compacto?: boolean }) => {
  const nivel = nivelRiesgo(valor);
  return (
    <span className={`semaforo ${nivel}`} aria-label={`Riesgo ${valor}, nivel ${TEXTO[nivel]}`}>
      <span className="punto" />
      {compacto ? valor : `${valor} · ${TEXTO[nivel]}`}
    </span>
  );
};

export default Semaforo;
