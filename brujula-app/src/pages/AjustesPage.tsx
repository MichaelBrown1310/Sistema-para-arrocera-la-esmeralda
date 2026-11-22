import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonRange,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonAlert,
  useIonToast,
  IonButtons,
} from '@ionic/react';
import { useState } from 'react';
import { useDatos } from '../data/store';
import { notificacionesDisponibles, nativo, pedirPermiso } from '../data/notificaciones';
import EstadoSync from '../components/EstadoSync';
import BotonAlertas from '../components/BotonAlertas';
import { sumaPesos } from '../domain/calculos';
import type { Pesos } from '../domain/tipos';

/** Pesos del puntaje, apetito de riesgo y metas: los define la gerencia. */
const AjustesPage = () => {
  const { ajustes, guardarAjustes, restablecer, sincronizar, sync, sincronizando } = useDatos();
  const [url, setUrl] = useState(ajustes.servidorUrl);
  const [alerta] = useIonAlert();
  const [toast] = useIonToast();
  const suma = sumaPesos(ajustes.pesos);

  const peso = (k: keyof Pesos, etiqueta: string) => (
    <IonItem>
      <IonLabel position="stacked">{etiqueta}: <strong>{ajustes.pesos[k]}%</strong></IonLabel>
      <IonRange aria-label={etiqueta} min={0} max={100} step={5} value={ajustes.pesos[k]}
        onIonChange={(e) => guardarAjustes({ ...ajustes, pesos: { ...ajustes.pesos, [k]: Number(e.detail.value) } })} />
    </IonItem>
  );

  const guardarServidor = () => {
    const limpia = url.trim().replace(/\/+$/, '');
    if (limpia && !/^https?:\/\//.test(limpia)) {
      toast({ message: 'La dirección debe empezar por http:// o https://', duration: 2500, position: 'top', color: 'warning' });
      return;
    }
    guardarAjustes({ ...ajustes, servidorUrl: limpia });
    toast({
      message: limpia ? 'Servidor guardado. Se sincronizará automáticamente.' : 'Sincronización desactivada.',
      duration: 2000,
      position: 'top',
    });
  };

  const sincronizarAhora = async () => {
    const r = await sincronizar();
    toast({ message: r.mensaje, duration: 3000, position: 'top', color: r.ok ? 'success' : 'warning' });
  };

  const cambiarNotificaciones = async (activar: boolean) => {
    if (!activar) {
      guardarAjustes({ ...ajustes, notificaciones: false });
      return;
    }
    const ok = await pedirPermiso();
    guardarAjustes({ ...ajustes, notificaciones: ok });
    toast({
      message: ok
        ? 'Notificaciones activadas.'
        : 'No se dio permiso para notificaciones. Las alertas siguen visibles en la campana.',
      duration: 3000,
      position: 'top',
      color: ok ? 'success' : 'warning',
    });
  };

  const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-CO') : 'nunca');

  const confirmarRestablecer = () =>
    alerta({
      header: '¿Restablecer datos de ejemplo?',
      message: 'Se borran los cambios, las decisiones nuevas y la bitácora.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Restablecer',
          role: 'destructive',
          handler: () => { restablecer(); toast({ message: 'Datos de ejemplo restablecidos.', duration: 2000, position: 'top' }); },
        },
      ],
    });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Ajustes</IonTitle>
          <IonButtons slot="end">
            <BotonAlertas />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonListHeader><IonLabel>Pesos del puntaje triple impacto</IonLabel></IonListHeader>
          {peso('E', 'Económico')}
          {peso('S', 'Social')}
          {peso('A', 'Ambiental')}
          <IonItem lines="none">
            {suma === 100 ? (
              <IonNote>Suman 100%. Propuesta inicial: 35 / 35 / 30, a validar con la gerencia.</IonNote>
            ) : (
              <IonText color="danger"><p>Los pesos suman {suma}%. Deben sumar 100% para que el puntaje sea comparable.</p></IonText>
            )}
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Apetito de riesgo</IonLabel></IonListHeader>
          <IonItem>
            <IonLabel position="stacked">Máximo riesgo residual aceptado sin plan: <strong>{ajustes.apetitoRiesgo}</strong></IonLabel>
            <IonRange aria-label="Apetito de riesgo" min={1} max={25} step={1} value={ajustes.apetitoRiesgo}
              onIonChange={(e) => guardarAjustes({ ...ajustes, apetitoRiesgo: Number(e.detail.value) })} />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Metas ambientales</IonLabel></IonListHeader>
          <IonItem>
            <IonInput label="Meta de agua (m³ por hectárea)" labelPlacement="stacked" type="number" inputmode="numeric"
              value={ajustes.metaAguaM3Ha}
              onIonChange={(e) => {
                const n = Number(e.detail.value);
                if (Number.isFinite(n) && n > 0) guardarAjustes({ ...ajustes, metaAguaM3Ha: n });
              }} />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Sincronización con el servidor</IonLabel></IonListHeader>
          <IonItem>
            <IonInput
              label="Dirección del servidor"
              labelPlacement="stacked"
              type="url"
              inputmode="url"
              placeholder="Ej.: http://192.168.1.20:8000"
              value={url}
              onIonInput={(e) => setUrl(String(e.detail.value ?? ''))}
            />
          </IonItem>
          <IonItem lines="none">
            <IonNote>
              Déjala vacía para trabajar solo en este dispositivo. Sin señal, los cambios se guardan aquí y
              se envían solos cuando vuelve la conexión.
            </IonNote>
          </IonItem>
          <EstadoSync />
          <IonItem lines="none">
            <IonNote>
              Pendientes: {sync.pendientes.length} · Última sincronización: {fecha(sync.ultimaSync)}
              {sync.ultimoError ? ` · ${sync.ultimoError}` : ''}
            </IonNote>
          </IonItem>
          <div className="ion-padding-horizontal ion-padding-bottom">
            <IonButton fill="outline" onClick={guardarServidor}>Guardar dirección</IonButton>
            <IonButton onClick={sincronizarAhora} disabled={!ajustes.servidorUrl || sincronizando}>
              {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
            </IonButton>
          </div>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Notificaciones</IonLabel></IonListHeader>
          <IonItem>
            <IonToggle
              checked={ajustes.notificaciones}
              disabled={!notificacionesDisponibles()}
              onIonChange={(e) => void cambiarNotificaciones(e.detail.checked)}
            >
              Avisarme de alertas nuevas
            </IonToggle>
          </IonItem>
          <IonItem lines="none">
            <IonNote>
              {notificacionesDisponibles()
                ? nativo()
                  ? 'Llegan como notificaciones del celular.'
                  : 'Llegan como notificaciones del navegador mientras la app está abierta.'
                : 'Este navegador no permite notificaciones aquí. Las alertas siguen visibles en la campana.'}
            </IonNote>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Sobre este prototipo</IonLabel></IonListHeader>
          <IonItem lines="none">
            <IonNote>
              <p>Brújula Triple Impacto · versión 0.2 (prototipo académico).</p>
              <p>
                Guarda los datos en este dispositivo y, si configuras un servidor, los sincroniza con los
                demás. Los datos de ejemplo no provienen de Arrocera La Esmeralda.
              </p>
            </IonNote>
          </IonItem>
        </IonList>

        <div className="ion-padding">
          <IonButton expand="block" color="medium" fill="outline" onClick={confirmarRestablecer}>
            Restablecer datos de ejemplo
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AjustesPage;
