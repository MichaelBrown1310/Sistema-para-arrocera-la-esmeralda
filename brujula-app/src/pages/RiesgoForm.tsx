import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonRouter,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { nuevoId, useDatos } from '../data/store';
import { valorRiesgo } from '../domain/calculos';
import type { CategoriaRiesgo, Pilar, Riesgo } from '../domain/tipos';
import CampoEscala from '../components/CampoEscala';
import Semaforo from '../components/Semaforo';

const CATEGORIAS: CategoriaRiesgo[] = ['Clima', 'Mercado', 'Comercio', 'Regulatorio', 'Orden público', 'Otro'];
const PILARES: { id: Pilar; nombre: string }[] = [
  { id: 'E', nombre: 'Económico' },
  { id: 'S', nombre: 'Social' },
  { id: 'A', nombre: 'Ambiental' },
];

const riesgoVacio = (): Riesgo => ({
  id: nuevoId('r'),
  nombre: '',
  categoria: 'Otro',
  descripcion: '',
  probabilidad: 3,
  impacto: 3,
  pilares: [],
  controles: '',
  probResidual: 3,
  impactoResidual: 3,
});

/** Crear o editar un riesgo del radar. */
const RiesgoForm = () => {
  const { id } = useParams();
  const { riesgos, guardarRiesgo, borrarRiesgo } = useDatos();
  const router = useIonRouter();
  // vuelve a la pantalla anterior; si se abrió directo (sin historial), a la lista
  const volver = () => (router.canGoBack() ? router.goBack() : router.push('/riesgos', 'back', 'replace'));
  const [alerta] = useIonAlert();
  const existente = riesgos.find((r) => r.id === id);
  const [r, setR] = useState<Riesgo>(existente ?? riesgoVacio());
  const cambiar = <K extends keyof Riesgo>(k: K, v: Riesgo[K]) => setR((x) => ({ ...x, [k]: v }));

  const guardar = () => {
    if (!r.nombre.trim()) {
      alerta({ header: 'Falta el nombre', message: 'Escribe un nombre para el riesgo.', buttons: ['OK'] });
      return;
    }
    guardarRiesgo({ ...r, nombre: r.nombre.trim() });
    volver();
  };

  const borrar = () =>
    alerta({
      header: '¿Borrar este riesgo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => { borrarRiesgo(r.id); volver(); } },
      ],
    });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/riesgos" />
          </IonButtons>
          <IonTitle>{existente ? 'Editar riesgo' : 'Nuevo riesgo'}</IonTitle>
          {existente && (
            <IonButtons slot="end">
              <IonButton onClick={borrar} aria-label="Borrar riesgo">
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonInput
              label="Nombre"
              labelPlacement="stacked"
              value={r.nombre}
              placeholder="Ej.: El Niño 2026-2027"
              onIonInput={(e) => cambiar('nombre', String(e.detail.value ?? ''))}
            />
          </IonItem>
          <IonItem>
            <IonSelect
              label="Categoría"
              labelPlacement="stacked"
              value={r.categoria}
              onIonChange={(e) => cambiar('categoria', e.detail.value)}
            >
              {CATEGORIAS.map((c) => (
                <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonTextarea
              label="Descripción"
              labelPlacement="stacked"
              autoGrow
              value={r.descripcion}
              onIonInput={(e) => cambiar('descripcion', String(e.detail.value ?? ''))}
            />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Riesgo inherente</IonLabel>
            <Semaforo valor={valorRiesgo(r.probabilidad, r.impacto)} />
          </IonListHeader>
          <CampoEscala etiqueta="Probabilidad" valor={r.probabilidad} onCambio={(v) => cambiar('probabilidad', v)} />
          <CampoEscala etiqueta="Impacto" valor={r.impacto} onCambio={(v) => cambiar('impacto', v)} />
          <IonItem lines="none">
            <IonLabel>Pilares que golpea</IonLabel>
          </IonItem>
          {PILARES.map((p) => (
            <IonItem key={p.id}>
              <IonCheckbox
                checked={r.pilares.includes(p.id)}
                onIonChange={(e) =>
                  cambiar(
                    'pilares',
                    e.detail.checked ? [...r.pilares, p.id] : r.pilares.filter((x) => x !== p.id),
                  )
                }
              >
                {p.nombre}
              </IonCheckbox>
            </IonItem>
          ))}
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Con controles (residual)</IonLabel>
            <Semaforo valor={valorRiesgo(r.probResidual, r.impactoResidual)} />
          </IonListHeader>
          <IonItem>
            <IonTextarea
              label="Controles o mitigación"
              labelPlacement="stacked"
              autoGrow
              value={r.controles}
              onIonInput={(e) => cambiar('controles', String(e.detail.value ?? ''))}
            />
          </IonItem>
          <CampoEscala etiqueta="Probabilidad residual" valor={r.probResidual} onCambio={(v) => cambiar('probResidual', v)} />
          <CampoEscala etiqueta="Impacto residual" valor={r.impactoResidual} onCambio={(v) => cambiar('impactoResidual', v)} />
          <IonItem lines="none">
            <IonNote>Riesgo = probabilidad × impacto. Verde 1–6, amarillo 8–12, rojo 15–25.</IonNote>
          </IonItem>
        </IonList>

        <div className="ion-padding">
          <IonButton expand="block" onClick={guardar}>Guardar riesgo</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RiesgoForm;
