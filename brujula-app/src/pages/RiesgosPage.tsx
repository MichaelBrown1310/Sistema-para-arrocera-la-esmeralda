import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonButtons,
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useDatos } from '../data/store';
import BotonAlertas from '../components/BotonAlertas';
import { conteoMatriz, nivelRiesgo, valorRiesgo } from '../domain/calculos';
import MatrizRiesgo from '../components/MatrizRiesgo';
import Semaforo from '../components/Semaforo';
import AvisoEjemplo from '../components/AvisoEjemplo';

/** Módulo 1: Radar de riesgos. */
const RiesgosPage = () => {
  const { riesgos, ajustes } = useDatos();
  const [vista, setVista] = useState<'inherente' | 'residual'>('inherente');
  const residual = vista === 'residual';

  const valor = (r: (typeof riesgos)[number]) =>
    residual ? valorRiesgo(r.probResidual, r.impactoResidual) : valorRiesgo(r.probabilidad, r.impacto);
  const ordenados = [...riesgos].sort((a, b) => valor(b) - valor(a));
  const rojos = ordenados.filter((r) => nivelRiesgo(valor(r)) === 'rojo').length;
  const sobreApetito = riesgos.filter(
    (r) => valorRiesgo(r.probResidual, r.impactoResidual) > ajustes.apetitoRiesgo,
  ).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Radar de riesgos</IonTitle>
          <IonButtons slot="end">
            <BotonAlertas />
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={vista} onIonChange={(e) => setVista(e.detail.value as typeof vista)}>
            <IonSegmentButton value="inherente">
              <IonLabel>Inherente</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="residual">
              <IonLabel>Con controles</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {rojos} {rojos === 1 ? 'riesgo en rojo' : 'riesgos en rojo'}
            </IonCardTitle>
            <IonCardSubtitle>
              {residual
                ? `${sobreApetito} por encima del apetito de riesgo (${ajustes.apetitoRiesgo})`
                : 'Antes de aplicar controles'}
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <MatrizRiesgo conteo={conteoMatriz(riesgos, residual)} />
          </IonCardContent>
        </IonCard>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Riesgos ordenados de mayor a menor</IonLabel>
          </IonListHeader>
          {ordenados.map((r) => (
            <IonItem key={r.id} routerLink={`/riesgos/${r.id}`} detail>
              <IonLabel>
                <h2>{r.nombre}</h2>
                <p>
                  {r.categoria} · P{residual ? r.probResidual : r.probabilidad} × I
                  {residual ? r.impactoResidual : r.impacto} · Pilares {r.pilares.join(', ')}
                </p>
              </IonLabel>
              <div slot="end">
                <Semaforo valor={valor(r)} />
              </div>
            </IonItem>
          ))}
          {ordenados.length === 0 && (
            <IonItem>
              <IonLabel>No hay riesgos registrados.</IonLabel>
            </IonItem>
          )}
        </IonList>
        <p className="aviso-ejemplo">
          <IonBadge color="medium">Fuentes sugeridas</IonBadge> IDEAM (clima), Fedearroz (precios), DIAN y
          Fedearroz (importaciones), Defensoría del Pueblo (alertas de orden público).
        </p>
        <AvisoEjemplo />
        <div style={{ height: 72 }} />

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton routerLink="/riesgos/nuevo" aria-label="Agregar riesgo">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default RiesgosPage;
