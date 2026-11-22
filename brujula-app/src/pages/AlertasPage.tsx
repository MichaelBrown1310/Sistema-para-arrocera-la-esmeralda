import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { alertCircle, informationCircle, warning } from 'ionicons/icons';
import { useAlertas } from '../data/useAlertas';
import { useDatos } from '../data/store';
import type { Gravedad } from '../domain/tipos';

const GRUPOS: { gravedad: Gravedad; titulo: string; icono: string; color: string }[] = [
  { gravedad: 'alta', titulo: 'Atender ya', icono: alertCircle, color: 'danger' },
  { gravedad: 'media', titulo: 'Revisar pronto', icono: warning, color: 'warning' },
  { gravedad: 'info', titulo: 'Para tener en cuenta', icono: informationCircle, color: 'medium' },
];

/** Centro de alertas automáticas. */
const AlertasPage = () => {
  const alertas = useAlertas();
  const { ajustes } = useDatos();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/decidir" />
          </IonButtons>
          <IonTitle>Alertas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {alertas.length === 0 && (
          <div className="vacio">
            <h2>No hay alertas</h2>
            <p>Las fincas, los riesgos y las revisiones de la bitácora están en orden.</p>
          </div>
        )}
        {GRUPOS.map((g) => {
          const lista = alertas.filter((a) => a.gravedad === g.gravedad);
          if (lista.length === 0) return null;
          return (
            <IonList inset key={g.gravedad}>
              <IonListHeader>
                <IonLabel>
                  {g.titulo} ({lista.length})
                </IonLabel>
              </IonListHeader>
              {lista.map((a) => (
                <IonItem key={a.id} routerLink={a.enlace} detail>
                  <IonIcon slot="start" icon={g.icono} color={g.color} aria-hidden="true" />
                  <IonLabel className="ion-text-wrap">
                    <h2>{a.titulo}</h2>
                    <p>{a.detalle}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          );
        })}
        <div className="ion-padding">
          <IonNote>
            Las alertas se calculan solas con los datos de riesgos, fincas, decisiones y bitácora.
            {ajustes.notificaciones
              ? ' Las notificaciones están activadas: avisaremos cuando aparezca una alerta nueva.'
              : ' Puedes activar las notificaciones en Ajustes.'}
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AlertasPage;
