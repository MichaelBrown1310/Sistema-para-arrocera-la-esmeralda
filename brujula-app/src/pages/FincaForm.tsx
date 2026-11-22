import {
  IonBackButton,
  IonButton,
  IonButtons,
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonAlert,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import { locateOutline, trashOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { hoy, nuevoId, useDatos } from '../data/store';
import { fincaVacia } from '../domain/datosEjemplo';
import { alertasFinca } from '../domain/calculos';
import type { Finca, IntencionSiembra, Zona } from '../domain/tipos';

const numero = (v: unknown) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Formulario de visita del agrónomo (corto plazo en la hoja de ruta). */
const FincaForm = () => {
  const { id } = useParams();
  const { fincas, ajustes, guardarFinca, borrarFinca } = useDatos();
  const router = useIonRouter();
  // vuelve a la pantalla anterior; si se abrió directo (sin historial), a la lista
  const volver = () => (router.canGoBack() ? router.goBack() : router.push('/fincas', 'back', 'replace'));
  const [alerta] = useIonAlert();
  const existente = fincas.find((f) => f.id === id);
  const [f, setF] = useState<Finca>(existente ?? fincaVacia(nuevoId('f'), hoy()));
  const [toast] = useIonToast();
  const [ubicando, setUbicando] = useState(false);
  const cambiar = <K extends keyof Finca>(k: K, v: Finca[K]) => setF((x) => ({ ...x, [k]: v }));
  const a = alertasFinca(f, ajustes.metaAguaM3Ha);

  const guardar = () => {
    if (!f.nombre.trim() || !f.codigoAgricultor.trim()) {
      alerta({ header: 'Faltan datos', message: 'Escribe el nombre de la finca y el código del agricultor.', buttons: ['OK'] });
      return;
    }
    guardarFinca({ ...f, nombre: f.nombre.trim(), codigoAgricultor: f.codigoAgricultor.trim() });
    volver();
  };

  const usarUbicacion = async () => {
    setUbicando(true);
    try {
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      setF((x) => ({
        ...x,
        latitud: Math.round(p.coords.latitude * 1e5) / 1e5,
        longitud: Math.round(p.coords.longitude * 1e5) / 1e5,
      }));
      toast({ message: 'Ubicación tomada.', duration: 1500, position: 'top', color: 'success' });
    } catch {
      toast({
        message: 'No se pudo obtener la ubicación. Revisa el permiso de ubicación o escríbela a mano.',
        duration: 3000,
        position: 'top',
        color: 'warning',
      });
    } finally {
      setUbicando(false);
    }
  };

  const coordenada = (v: unknown): number | null => {
    const t = String(v ?? '').trim().replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const borrar = () =>
    alerta({
      header: '¿Borrar esta finca?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => { borrarFinca(f.id); volver(); } },
      ],
    });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/fincas" />
          </IonButtons>
          <IonTitle>{existente ? 'Visita de finca' : 'Nueva visita'}</IonTitle>
          {existente && (
            <IonButtons slot="end">
              <IonButton onClick={borrar} aria-label="Borrar finca"><IonIcon icon={trashOutline} /></IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonListHeader><IonLabel>Identificación</IonLabel></IonListHeader>
          <IonItem>
            <IonInput label="Nombre de la finca" labelPlacement="stacked" value={f.nombre}
              onIonInput={(e) => cambiar('nombre', String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonInput label="Código del agricultor" labelPlacement="stacked" value={f.codigoAgricultor} placeholder="AG-000"
              onIonInput={(e) => cambiar('codigoAgricultor', String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonSelect label="Zona" labelPlacement="stacked" value={f.zona}
              onIonChange={(e) => cambiar('zona', e.detail.value as Zona)}>
              <IonSelectOption value="Valle">Valle del Cauca</IonSelectOption>
              <IonSelectOption value="Cauca">Cauca</IonSelectOption>
              <IonSelectOption value="Casanare">Casanare</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonInput label="Municipio" labelPlacement="stacked" value={f.municipio}
              onIonInput={(e) => cambiar('municipio', String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonInput label="Fecha de la visita" labelPlacement="stacked" type="date" value={f.ultimaVisita}
              onIonInput={(e) => cambiar('ultimaVisita', String(e.detail.value ?? ''))} />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Producción, agua y riego</IonLabel></IonListHeader>
          <IonItem>
            <IonInput label="Área sembrada (ha)" labelPlacement="stacked" type="number" inputmode="decimal" value={f.areaHa}
              onIonInput={(e) => cambiar('areaHa', numero(e.detail.value))} />
          </IonItem>
          <IonItem>
            <IonInput label="Fecha de siembra" labelPlacement="stacked" type="date" value={f.fechaSiembra}
              onIonInput={(e) => cambiar('fechaSiembra', String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonInput label="Cosecha esperada (fecha)" labelPlacement="stacked" type="date" value={f.fechaCosechaEsperada}
              onIonInput={(e) => cambiar('fechaCosechaEsperada', String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonInput label="Producción esperada (toneladas de paddy)" labelPlacement="stacked" type="number" inputmode="decimal" value={f.produccionEsperadaT}
              onIonInput={(e) => cambiar('produccionEsperadaT', numero(e.detail.value))} />
          </IonItem>
          <IonItem>
            <IonInput label="Agua usada (m³ por ha)" labelPlacement="stacked" type="number" inputmode="numeric" value={f.aguaM3Ha}
              onIonInput={(e) => cambiar('aguaM3Ha', numero(e.detail.value))} />
          </IonItem>
          <IonItem lines="none">
            <IonNote color={a.agua ? 'danger' : 'medium'}>
              Meta: {ajustes.metaAguaM3Ha.toLocaleString('es-CO')} m³/ha. {a.agua ? 'Esta finca la supera.' : ''}
            </IonNote>
          </IonItem>
          <IonItem>
            <IonToggle checked={f.problemasRiego} onIonChange={(e) => cambiar('problemasRiego', e.detail.checked)}>
              Hay problemas de riego
            </IonToggle>
          </IonItem>
          {f.problemasRiego && (
            <IonItem>
              <IonTextarea label="¿Qué problema de riego hay?" labelPlacement="stacked" autoGrow value={f.detalleRiego}
                placeholder="Ej.: bomba dañada, canal sin agua, turno de riego insuficiente"
                onIonInput={(e) => cambiar('detalleRiego', String(e.detail.value ?? ''))} />
            </IonItem>
          )}
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Prácticas y biodiversidad</IonLabel></IonListHeader>
          <IonItem>
            <IonLabel position="stacked">Área con control biológico: <strong>{f.controlBiologicoPct}%</strong></IonLabel>
            <IonRange aria-label="Área con control biológico" min={0} max={100} step={5} value={f.controlBiologicoPct}
              onIonChange={(e) => cambiar('controlBiologicoPct', Number(e.detail.value))} />
          </IonItem>
          <IonItem>
            <IonToggle checked={f.nivelacionLaser} onIonChange={(e) => cambiar('nivelacionLaser', e.detail.checked)}>
              Nivelación láser
            </IonToggle>
          </IonItem>
          <IonItem>
            <IonToggle checked={f.loteOrganico} onIonChange={(e) => cambiar('loteOrganico', e.detail.checked)}>
              Tiene lote orgánico
            </IonToggle>
          </IonItem>
          {f.loteOrganico && (
            <IonItem>
              <IonToggle color="danger" checked={f.insumoNoPermitido}
                onIonChange={(e) => cambiar('insumoNoPermitido', e.detail.checked)}>
                Se usó un insumo no permitido
              </IonToggle>
            </IonItem>
          )}
          <IonItem>
            <IonInput label="Aves observadas en la visita" labelPlacement="stacked" type="number" inputmode="numeric" value={f.avesObservadas}
              onIonInput={(e) => cambiar('avesObservadas', Math.round(numero(e.detail.value)))} />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>Ubicación (para el mapa)</IonLabel></IonListHeader>
          <IonItem>
            <IonInput label="Latitud" labelPlacement="stacked" inputmode="decimal" value={f.latitud ?? ''} placeholder="Ej.: 3.245"
              onIonChange={(e) => cambiar('latitud', coordenada(e.detail.value))} />
          </IonItem>
          <IonItem>
            <IonInput label="Longitud" labelPlacement="stacked" inputmode="decimal" value={f.longitud ?? ''} placeholder="Ej.: -76.56"
              onIonChange={(e) => cambiar('longitud', coordenada(e.detail.value))} />
          </IonItem>
          <div className="ion-padding-horizontal ion-padding-bottom">
            <IonButton fill="outline" size="small" onClick={usarUbicacion} disabled={ubicando}>
              <IonIcon slot="start" icon={locateOutline} />
              {ubicando ? 'Buscando…' : 'Usar mi ubicación actual'}
            </IonButton>
          </div>
        </IonList>

        <IonList inset>
          <IonListHeader><IonLabel>¿Volverá a sembrar el próximo semestre?</IonLabel></IonListHeader>
          <IonItem lines="none">
            <IonSegment value={f.intencionSiembra} onIonChange={(e) => cambiar('intencionSiembra', e.detail.value as IntencionSiembra)}>
              <IonSegmentButton value="si"><IonLabel>Sí</IonLabel></IonSegmentButton>
              <IonSegmentButton value="duda"><IonLabel>Duda</IonLabel></IonSegmentButton>
              <IonSegmentButton value="no"><IonLabel>No</IonLabel></IonSegmentButton>
            </IonSegment>
          </IonItem>
          <IonItem>
            <IonTextarea label="Notas de la visita" labelPlacement="stacked" autoGrow value={f.notas}
              onIonInput={(e) => cambiar('notas', String(e.detail.value ?? ''))} />
          </IonItem>
        </IonList>

        {(a.abandono || a.agua || a.organico || a.riego) && (
          <div className="ion-padding-horizontal">
            <IonText color="danger">
              <p>
                <strong>Alertas:</strong>{' '}
                {[a.abandono && 'riesgo de que no vuelva a sembrar', a.agua && 'agua sobre la meta', a.organico && 'candado del sello orgánico', a.riego && 'problema de riego']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </IonText>
          </div>
        )}

        <div className="ion-padding">
          <IonButton expand="block" onClick={guardar}>Guardar visita</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FincaForm;
