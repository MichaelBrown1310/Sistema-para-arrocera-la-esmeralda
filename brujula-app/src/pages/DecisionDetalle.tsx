import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
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
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonAlert,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircle, lockClosed, trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { hoy, nuevoId, useDatos } from '../data/store';
import { CANDADOS, CANDADOS_CUMPLIDOS, ESCENARIOS, SENSIBILIDAD_TEXTO, evaluarDecision, puntajesBajoEscenarios } from '../domain/calculos';
import { opcionVacia } from '../domain/datosEjemplo';
import type { CandadoId, Decision, EscenarioId, EstadoOpcion, Opcion, ResultadoOpcion, Sensibilidad } from '../domain/tipos';
import BarraPilar from '../components/BarraPilar';
import CampoEscala from '../components/CampoEscala';
import Semaforo from '../components/Semaforo';
import AvisoEjemplo from '../components/AvisoEjemplo';

const ESTADO: Record<EstadoOpcion, { texto: string; color: string }> = {
  recomendada: { texto: 'Recomendada', color: 'success' },
  viable: { texto: 'Viable', color: 'primary' },
  mitigar: { texto: 'Requiere mitigación', color: 'warning' },
  descartada: { texto: 'Descartada', color: 'danger' },
};

const enSeisMeses = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return hoy(d);
};

/** Módulos 3 y 4: simulador "¿qué pasa si?" y evaluador triple impacto. */
const DecisionDetalle = () => {
  const { id } = useParams();
  const { search } = useLocation();
  const { decisiones, ajustes, guardarDecision, borrarDecision, aprobar } = useDatos();
  const router = useIonRouter();
  // vuelve a la pantalla anterior; si se abrió directo (sin historial), a la lista
  const volver = () => (router.canGoBack() ? router.goBack() : router.push('/decidir', 'back', 'replace'));
  const [alerta] = useIonAlert();
  const [toast] = useIonToast();
  const [vista, setVista] = useState<'resultado' | 'editar'>(
    new URLSearchParams(search).get('editar') ? 'editar' : 'resultado',
  );
  const [escenarios, setEscenarios] = useState<EscenarioId[]>([]);

  const d = decisiones.find((x) => x.id === id);
  if (!d) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start"><IonBackButton defaultHref="/decidir" /></IonButtons>
            <IonTitle>Decisión</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">Esta decisión ya no existe.</IonContent>
      </IonPage>
    );
  }

  const resultados = evaluarDecision(d, ajustes, escenarios);
  const aprobada = d.estado === 'aprobada';

  const guardar = (cambio: Partial<Decision>) => guardarDecision({ ...d, ...cambio });
  const actualizarOpcion = (oid: string, cambio: Partial<Opcion>) =>
    guardar({ opciones: d.opciones.map((o) => (o.id === oid ? { ...o, ...cambio } : o)) });

  const alternarEscenario = (e: EscenarioId) =>
    setEscenarios((xs) => (xs.includes(e) ? xs.filter((x) => x !== e) : [...xs, e]));

  const pedirAprobacion = (r: ResultadoOpcion) => {
    const nombresEsc = ESCENARIOS.filter((e) => escenarios.includes(e.id)).map((e) => e.nombre);
    alerta({
      header: `Aprobar «${r.opcion.nombre}»`,
      message: `PTI ${r.ptiBase} · riesgo residual ${r.riesgo}. Quedará registrada en la bitácora.`,
      inputs: [
        { name: 'aprobadoPor', type: 'text', placeholder: 'Aprobado por (cargo o nombre)' },
        {
          name: 'supuestos',
          type: 'textarea',
          placeholder: 'Supuestos: probabilidad de El Niño, precio esperado…',
          value: nombresEsc.length ? `Escenarios simulados: ${nombresEsc.join(', ')}.` : '',
        },
        { name: 'fechaRevision', type: 'date', value: enSeisMeses(), label: 'Fecha de revisión' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: (datos: { aprobadoPor: string; supuestos: string; fechaRevision: string }) => {
            if (!datos.aprobadoPor?.trim()) {
              toast({ message: 'Indica quién aprueba la decisión.', duration: 2000, color: 'warning', position: 'top' });
              return false;
            }
            aprobar({
              id: nuevoId('b'),
              decisionId: d.id,
              tituloDecision: d.titulo,
              opcionElegida: r.opcion.nombre,
              pti: r.ptiBase,
              riesgoResidual: r.riesgo,
              candadosVerificados: Object.values(CANDADOS_CUMPLIDOS),
              escenariosSimulados: nombresEsc,
              supuestos: datos.supuestos?.trim() ?? '',
              aprobadoPor: datos.aprobadoPor.trim(),
              fechaAprobacion: hoy(),
              fechaRevision: datos.fechaRevision || enSeisMeses(),
              resultadoReal: '',
              estadoRevision: 'pendiente',
            });
            toast({ message: 'Decisión aprobada y registrada en la bitácora.', duration: 2500, color: 'success', position: 'top' });
            router.push('/bitacora', 'root');
            return true;
          },
        },
      ],
    });
  };

  const borrar = () =>
    alerta({
      header: '¿Borrar esta decisión?',
      message: 'Lo registrado en la bitácora se conserva.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => { borrarDecision(d.id); volver(); } },
      ],
    });

  const agregarOpcion = () => {
    const letra = String.fromCharCode(65 + d.opciones.length);
    guardar({ opciones: [...d.opciones, opcionVacia(nuevoId('o'), `Opción ${letra}`)] });
  };

  const quitarOpcion = (oid: string) => guardar({ opciones: d.opciones.filter((o) => o.id !== oid) });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/decidir" /></IonButtons>
          <IonTitle>{d.titulo}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={borrar} aria-label="Borrar decisión"><IonIcon icon={trashOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={vista} onIonChange={(e) => setVista(e.detail.value as typeof vista)}>
            <IonSegmentButton value="resultado"><IonLabel>Comparar</IonLabel></IonSegmentButton>
            <IonSegmentButton value="editar"><IonLabel>Opciones</IonLabel></IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {vista === 'resultado' ? (
          <>
            <div className="ion-padding-horizontal ion-padding-top">
              <p className="pregunta-decision">{d.pregunta || 'Define la pregunta en «Opciones».'}</p>
              {aprobada && <IonBadge color="success">Ya aprobada</IonBadge>}
            </div>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: 18 }}>Simulador: ¿qué pasa si…?</IonCardTitle>
                <IonCardSubtitle>Activa uno o varios escenarios y mira qué opción aguanta mejor</IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                {ESCENARIOS.map((e) => (
                  <IonChip
                    key={e.id}
                    color={escenarios.includes(e.id) ? 'warning' : 'medium'}
                    outline={!escenarios.includes(e.id)}
                    onClick={() => alternarEscenario(e.id)}
                    aria-pressed={escenarios.includes(e.id)}
                  >
                    {e.nombre}
                  </IonChip>
                ))}
                {escenarios.length > 0 && (
                  <IonNote>
                    <p>
                      {ESCENARIOS.filter((e) => escenarios.includes(e.id)).map((e) => e.descripcion).join(' ')}
                    </p>
                  </IonNote>
                )}
              </IonCardContent>
            </IonCard>

            {resultados.map((r) => {
              const sim = puntajesBajoEscenarios(r.opcion, escenarios);
              const conEsc = escenarios.length > 0;
              return (
                <IonCard key={r.opcion.id} className={`tarjeta-opcion ${r.estado}`}>
                  <IonCardHeader>
                    <IonBadge color={ESTADO[r.estado].color} style={{ alignSelf: 'flex-start' }}>
                      {r.estado === 'recomendada' && <IonIcon icon={checkmarkCircle} style={{ marginRight: 4, verticalAlign: '-2px' }} />}
                      {ESTADO[r.estado].texto}
                    </IonBadge>
                    <IonCardTitle style={{ fontSize: 18, marginTop: 6 }}>{r.opcion.nombre}</IonCardTitle>
                    {r.opcion.descripcion && <IonCardSubtitle>{r.opcion.descripcion}</IonCardSubtitle>}
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                      <div className="pti-grande">
                        {conEsc && r.ptiEscenario !== r.ptiBase ? (
                          <>
                            {r.ptiEscenario} <small>de {r.ptiBase}</small>
                          </>
                        ) : (
                          r.ptiBase
                        )}
                        <div><small>Puntaje triple impacto{conEsc ? ' bajo escenario' : ''}</small></div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Semaforo valor={r.riesgo} />
                        <div><small>riesgo residual · apetito {ajustes.apetitoRiesgo}</small></div>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <BarraPilar etiqueta="Económico" valor={r.opcion.E} escenario={conEsc ? sim.E : undefined} />
                      <BarraPilar etiqueta="Social" valor={r.opcion.S} escenario={conEsc ? sim.S : undefined} />
                      <BarraPilar etiqueta="Ambiental" valor={r.opcion.A} escenario={conEsc ? sim.A : undefined} />
                    </div>
                    {r.candadosRotos.map((c) => (
                      <IonText color="danger" key={c}>
                        <p><IonIcon icon={lockClosed} style={{ verticalAlign: '-2px' }} /> {c}</p>
                      </IonText>
                    ))}
                    <IonNote><p>{r.razon}</p></IonNote>
                    {!aprobada && r.estado !== 'descartada' && (
                      <IonButton
                        expand="block"
                        fill={r.estado === 'recomendada' ? 'solid' : 'outline'}
                        className="ion-margin-top"
                        onClick={() => pedirAprobacion(r)}
                      >
                        Aprobar esta opción
                      </IonButton>
                    )}
                  </IonCardContent>
                </IonCard>
              );
            })}
            <p className="aviso-ejemplo">
              PTI = {ajustes.pesos.E}% económico + {ajustes.pesos.S}% social + {ajustes.pesos.A}% ambiental. Una
              opción con un candado roto queda descartada aunque tenga buen puntaje.
            </p>
            <AvisoEjemplo />
          </>
        ) : (
          <>
            <IonList inset>
              <IonListHeader><IonLabel>La decisión</IonLabel></IonListHeader>
              <IonItem>
                <IonInput label="Título" labelPlacement="stacked" value={d.titulo}
                  onIonInput={(e) => guardar({ titulo: String(e.detail.value ?? '') })} />
              </IonItem>
              <IonItem>
                <IonTextarea label="Pregunta que se quiere responder" labelPlacement="stacked" autoGrow value={d.pregunta}
                  onIonInput={(e) => guardar({ pregunta: String(e.detail.value ?? '') })} />
              </IonItem>
              <IonItem>
                <IonInput label="Responsable" labelPlacement="stacked" value={d.responsable}
                  onIonInput={(e) => guardar({ responsable: String(e.detail.value ?? '') })} />
              </IonItem>
            </IonList>

            <IonAccordionGroup expand="inset">
              {d.opciones.map((o) => (
                <IonAccordion key={o.id} value={o.id}>
                  <IonItem slot="header">
                    <IonLabel>
                      <h2>{o.nombre}</h2>
                      <p>E {o.E} · S {o.S} · A {o.A}</p>
                    </IonLabel>
                  </IonItem>
                  <div slot="content">
                    <EditorOpcion
                      opcion={o}
                      onCambio={(c) => actualizarOpcion(o.id, c)}
                      onQuitar={d.opciones.length > 2 ? () => quitarOpcion(o.id) : undefined}
                    />
                  </div>
                </IonAccordion>
              ))}
            </IonAccordionGroup>

            <div className="ion-padding">
              <IonButton expand="block" fill="outline" onClick={agregarOpcion}>
                <IonIcon slot="start" icon={addOutline} /> Agregar opción
              </IonButton>
              <IonButton expand="block" onClick={() => setVista('resultado')}>Comparar opciones</IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

/** Formulario de una opción: puntajes, riesgo, candados y sensibilidad a escenarios. */
const EditorOpcion = ({
  opcion: o,
  onCambio,
  onQuitar,
}: {
  opcion: Opcion;
  onCambio: (c: Partial<Opcion>) => void;
  onQuitar?: () => void;
}) => {
  const pilar = (k: 'E' | 'S' | 'A', etiqueta: string) => (
    <IonItem>
      <IonLabel position="stacked">{etiqueta}: <strong>{o[k]}</strong> / 100</IonLabel>
      <IonRange aria-label={etiqueta} min={0} max={100} step={1} value={o[k]}
        onIonChange={(e) => onCambio({ [k]: Number(e.detail.value) } as Partial<Opcion>)} />
    </IonItem>
  );

  return (
    <IonList>
      <IonItem>
        <IonInput label="Nombre" labelPlacement="stacked" value={o.nombre}
          onIonInput={(e) => onCambio({ nombre: String(e.detail.value ?? '') })} />
      </IonItem>
      <IonItem>
        <IonTextarea label="Descripción" labelPlacement="stacked" autoGrow value={o.descripcion}
          onIonInput={(e) => onCambio({ descripcion: String(e.detail.value ?? '') })} />
      </IonItem>

      <IonListHeader><IonLabel>Puntaje por pilar</IonLabel></IonListHeader>
      {pilar('E', 'Económico (margen, costo, volumen asegurado)')}
      {pilar('S', 'Social (ingreso del agricultor, permanencia, pago)')}
      {pilar('A', 'Ambiental (agua, carbono, control biológico, aves)')}

      <IonListHeader><IonLabel>Riesgo residual</IonLabel></IonListHeader>
      <CampoEscala etiqueta="Probabilidad" valor={o.probResidual} onCambio={(v) => onCambio({ probResidual: v })} />
      <CampoEscala etiqueta="Impacto" valor={o.impactoResidual} onCambio={(v) => onCambio({ impactoResidual: v })} />

      <IonListHeader><IonLabel>Candados de certificación</IonLabel></IonListHeader>
      {(Object.keys(CANDADOS) as CandadoId[]).map((c) => (
        <IonItem key={c}>
          <IonToggle color="danger" checked={o.candados[c]}
            onIonChange={(e) => onCambio({ candados: { ...o.candados, [c]: e.detail.checked } })}>
            {CANDADOS[c]}
          </IonToggle>
        </IonItem>
      ))}

      <IonListHeader><IonLabel>Sensibilidad a escenarios</IonLabel></IonListHeader>
      {ESCENARIOS.map((esc) => (
        <IonItem key={esc.id}>
          <IonLabel position="stacked">{esc.nombre} (afecta {esc.pilares.join(', ')})</IonLabel>
          <IonSegment
            value={String(o.sensibilidad[esc.id])}
            onIonChange={(e) =>
              onCambio({ sensibilidad: { ...o.sensibilidad, [esc.id]: Number(e.detail.value) as Sensibilidad } })
            }
          >
            {SENSIBILIDAD_TEXTO.map((t, i) => (
              <IonSegmentButton key={t} value={String(i)}><IonLabel>{t}</IonLabel></IonSegmentButton>
            ))}
          </IonSegment>
        </IonItem>
      ))}
      <IonItem lines="none">
        <IonNote>Sensibilidad media resta 10 puntos a cada pilar afectado; alta resta 20.</IonNote>
      </IonItem>

      {onQuitar && (
        <div className="ion-padding">
          <IonButton expand="block" color="danger" fill="clear" onClick={onQuitar}>
            <IonIcon slot="start" icon={trashOutline} /> Quitar esta opción
          </IonButton>
        </div>
      )}
    </IonList>
  );
};

export default DecisionDetalle;
