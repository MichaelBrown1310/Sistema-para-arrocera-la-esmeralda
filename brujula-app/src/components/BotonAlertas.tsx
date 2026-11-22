import { IonBadge, IonButton, IonIcon } from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';
import { useAlertas } from '../data/useAlertas';

/** Campana de la barra superior con el número de alertas altas y medias. */
const BotonAlertas = () => {
  const alertas = useAlertas();
  const importantes = alertas.filter((a) => a.gravedad !== 'info').length;
  const hayAltas = alertas.some((a) => a.gravedad === 'alta');
  return (
    <IonButton routerLink="/alertas" aria-label={`Alertas: ${importantes} importantes`} className="boton-alertas">
      <IonIcon slot="icon-only" icon={notificationsOutline} />
      {importantes > 0 && (
        <IonBadge color={hayAltas ? 'danger' : 'warning'} className="insignia-alertas">
          {importantes}
        </IonBadge>
      )}
    </IonButton>
  );
};

export default BotonAlertas;
