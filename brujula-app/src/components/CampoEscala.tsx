import { IonItem, IonLabel, IonRange } from '@ionic/react';
import type { Escala } from '../domain/tipos';

/** Deslizador de 1 a 5 para probabilidad o impacto. */
const CampoEscala = ({
  etiqueta,
  valor,
  onCambio,
}: {
  etiqueta: string;
  valor: Escala;
  onCambio: (v: Escala) => void;
}) => (
  <IonItem>
    <IonLabel position="stacked">
      {etiqueta}: <strong>{valor}</strong>
    </IonLabel>
    <IonRange
      aria-label={etiqueta}
      min={1}
      max={5}
      step={1}
      snaps
      ticks
      pin
      value={valor}
      onIonChange={(e) => onCambio(Number(e.detail.value) as Escala)}
    >
      <span slot="start">1</span>
      <span slot="end">5</span>
    </IonRange>
  </IonItem>
);

export default CampoEscala;
