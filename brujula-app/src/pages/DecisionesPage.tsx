import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  IonButtons,
} from '@ionic/react';
import { hoy, nuevoId, useDatos } from '../data/store';
import BotonAlertas from '../components/BotonAlertas';
import EstadoSync from '../components/EstadoSync';
import { evaluarDecision } from '../domain/calculos';
import { opcionVacia } from '../domain/datosEjemplo';
import AvisoEjemplo from '../components/AvisoEjemplo';

/** Lista de decisiones en curso y aprobadas. */
const DecisionesPage = () => {
  const { decisiones, ajustes, guardarDecision } = useDatos();
  const router = useIonRouter();

  const nueva = () => {
    const id = nuevoId('d');
    guardarDecision({
      id,
      titulo: 'Nueva decisión',
      pregunta: '',
      responsable: '',
      fechaCreacion: hoy(),
      estado: 'abierta',
      opciones: [opcionVacia(nuevoId('o'), 'Opción A'), opcionVacia(nuevoId('o'), 'Opción B')],
    });
    router.push(`/decidir/${id}?editar=1`, 'forward');
  };

  const abiertas = decisiones.filter((d) => d.estado === 'abierta');
  const aprobadas = decisiones.filter((d) => d.estado === 'aprobada');

  const fila = (d: (typeof decisiones)[number]) => {
    const rec = evaluarDecision(d, ajustes).find((r) => r.estado === 'recomendada');
    return (
      <IonItem key={d.id} routerLink={`/decidir/${d.id}`} detail>
        <IonLabel>
          <h2>{d.titulo}</h2>
          <p>{d.pregunta || 'Sin pregunta definida'}</p>
          <p>
            {d.opciones.length} opciones
            {rec ? ` · Recomendada: ${rec.opcion.nombre} (PTI ${rec.ptiBase})` : ' · Sin opción recomendable'}
          </p>
        </IonLabel>
        <IonBadge slot="end" color={d.estado === 'aprobada' ? 'success' : 'medium'}>
          {d.estado === 'aprobada' ? 'Aprobada' : 'Abierta'}
        </IonBadge>
      </IonItem>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Decisiones</IonTitle>
          <IonButtons slot="end">
            <BotonAlertas />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <EstadoSync />
        <div className="ion-padding">
          <IonNote>
            Plantea opciones, compáralas por riesgo y triple impacto, pruébalas con el simulador y aprueba
            una. La aprobación queda en la bitácora.
          </IonNote>
          <IonButton expand="block" className="ion-margin-top" onClick={nueva}>
            Plantear una nueva decisión
          </IonButton>
        </div>

        <IonList inset>
          <IonListHeader><IonLabel>En curso</IonLabel></IonListHeader>
          {abiertas.map(fila)}
          {abiertas.length === 0 && <IonItem><IonLabel>No hay decisiones abiertas.</IonLabel></IonItem>}
        </IonList>

        {aprobadas.length > 0 && (
          <IonList inset>
            <IonListHeader><IonLabel>Aprobadas</IonLabel></IonListHeader>
            {aprobadas.map(fila)}
          </IonList>
        )}
        <AvisoEjemplo />
      </IonContent>
    </IonPage>
  );
};

export default DecisionesPage;
