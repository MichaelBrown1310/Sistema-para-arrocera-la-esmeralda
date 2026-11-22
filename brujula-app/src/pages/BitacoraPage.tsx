import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
  IonButtons,
} from '@ionic/react';
import { useDatos } from '../data/store';
import BotonAlertas from '../components/BotonAlertas';
import Semaforo from '../components/Semaforo';
import type { RegistroBitacora } from '../domain/tipos';

/** Módulo 5: bitácora de decisiones y evidencia para auditorías. */
const BitacoraPage = () => {
  const { bitacora, guardarRegistro } = useDatos();
  const [alerta] = useIonAlert();

  const registrarResultado = (r: RegistroBitacora) =>
    alerta({
      header: 'Resultado real',
      message: 'Compara lo previsto con lo que pasó. Esto alimenta el aprendizaje del radar.',
      inputs: [{ name: 'resultado', type: 'textarea', placeholder: '¿Qué pasó realmente?', value: r.resultadoReal }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (d: { resultado: string }) =>
            guardarRegistro({ ...r, resultadoReal: d.resultado?.trim() ?? '', estadoRevision: d.resultado?.trim() ? 'revisada' : 'pendiente' }),
        },
      ],
    });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Bitácora</IonTitle>
          <IonButtons slot="end">
            <BotonAlertas />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {bitacora.length === 0 ? (
          <div className="vacio">
            <h2>Aún no hay decisiones aprobadas</h2>
            <p>Cuando apruebes una opción en «Decidir», quedará aquí con sus supuestos, quién la aprobó y su fecha de revisión.</p>
            <IonButton routerLink="/decidir" routerDirection="root">Ir a decisiones</IonButton>
          </div>
        ) : (
          bitacora.map((r) => (
            <IonCard key={r.id}>
              <IonCardHeader>
                <IonBadge color={r.estadoRevision === 'revisada' ? 'success' : 'warning'} style={{ alignSelf: 'flex-start' }}>
                  {r.estadoRevision === 'revisada' ? 'Revisada' : `Revisión pendiente · ${r.fechaRevision}`}
                </IonBadge>
                <IonCardTitle style={{ fontSize: 18, marginTop: 6 }}>{r.tituloDecision}</IonCardTitle>
                <IonCardSubtitle>Elegida: {r.opcionElegida}</IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  PTI <strong>{r.pti}</strong> · riesgo residual <Semaforo valor={r.riesgoResidual} compacto />
                </p>
                {r.escenariosSimulados.length > 0 && <p>Escenarios simulados: {r.escenariosSimulados.join(', ')}</p>}
                <p>Aprobada por <strong>{r.aprobadoPor}</strong> el {r.fechaAprobacion}</p>
                {r.supuestos && <p><strong>Supuestos:</strong> {r.supuestos}</p>}
                {r.resultadoReal && <p><strong>Lo que pasó:</strong> {r.resultadoReal}</p>}
                <IonButton fill="outline" size="small" className="ion-margin-top" onClick={() => registrarResultado(r)}>
                  {r.resultadoReal ? 'Editar resultado real' : 'Registrar resultado real'}
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))
        )}
        <div className="ion-padding">
          <IonButton expand="block" fill="outline" routerLink="/reporte">
            Ver reporte para auditorías (PDF / CSV)
          </IonButton>
          <IonNote>
            <p>Este registro es la evidencia para las auditorías de Empresa B y comercio justo.</p>
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BitacoraPage;
