/** Barra horizontal para el puntaje de un pilar (0 a 100). */
const BarraPilar = ({ etiqueta, valor, escenario }: { etiqueta: string; valor: number; escenario?: number }) => {
  const mostrado = escenario ?? valor;
  const cambia = escenario !== undefined && escenario !== valor;
  return (
    <div className="barra-pilar">
      <span>{etiqueta}</span>
      <div className="pista">
        <div className={`relleno ${cambia ? 'bajo-escenario' : ''}`} style={{ width: `${mostrado}%` }} />
      </div>
      <span className="valor">{mostrado}</span>
    </div>
  );
};

export default BarraPilar;
