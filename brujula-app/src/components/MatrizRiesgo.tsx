import { nivelRiesgo } from '../domain/calculos';

/**
 * Matriz 5×5: filas = probabilidad (5 arriba), columnas = impacto.
 * Cada celda muestra cuántos riesgos caen ahí y se colorea por su nivel.
 */
const MatrizRiesgo = ({ conteo }: { conteo: number[][] }) => {
  const filas = [5, 4, 3, 2, 1];
  const columnas = [1, 2, 3, 4, 5];
  return (
    <div>
      <div className="matriz-titulo-y">Probabilidad ↑</div>
      <div className="matriz" role="table" aria-label="Matriz de riesgo probabilidad por impacto">
        {filas.map((p) => (
          <div key={p} style={{ display: 'contents' }} role="row">
            <div className="eje">{p}</div>
            {columnas.map((i) => {
              const n = conteo[p - 1][i - 1];
              return (
                <div
                  key={i}
                  role="cell"
                  className={`celda ${nivelRiesgo(p * i)} ${n === 0 ? 'vacia' : ''}`}
                  aria-label={`Probabilidad ${p}, impacto ${i}: ${n} riesgos`}
                >
                  {n}
                </div>
              );
            })}
          </div>
        ))}
        <div />
        {columnas.map((i) => (
          <div key={i} className="eje">{i}</div>
        ))}
      </div>
      <div className="matriz-titulo-x">Impacto →</div>
    </div>
  );
};

export default MatrizRiesgo;
