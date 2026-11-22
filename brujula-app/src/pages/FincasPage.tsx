import {
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonButtons,
  useIonRouter,
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useDatos } from '../data/store';
import BotonAlertas from '../components/BotonAlertas';
import EstadoSync from '../components/EstadoSync';
import { alertasFinca, resumenFincas, tieneAlerta } from '../domain/calculos';
import AvisoEjemplo from '../components/AvisoEjemplo';
import MapaFincas from '../components/MapaFincas';

const fmt = (n: number) => n.toLocaleString('es-CO');

/** Módulo 2: Mapa de agricultores y fincas (lo que registran los agrónomos). */
const FincasPage = () => {
  const { fincas, ajustes } = useDatos();
  const [filtro, setFiltro] = useState<'todas' | 'alerta'>('todas');
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
  const router = useIonRouter();
  const [texto, setTexto] = useState('');
  const meta = ajustes.metaAguaM3Ha;
  const resumen = resumenFincas(fincas, meta);

  const porTexto = fincas.filter((f) =>
    `${f.nombre} ${f.codigoAgricultor} ${f.municipio} ${f.zona}`.toLowerCase().includes(texto.toLowerCase()),
  );
  const visibles = porTexto.filter((f) => filtro === 'todas' || tieneAlerta(f, meta));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Agricultores y fincas</IonTitle>
          <IonButtons slot="end">
            <BotonAlertas />
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Buscar finca, código o municipio"
            value={texto}
            onIonInput={(e) => setTexto(String(e.detail.value ?? ''))}
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <EstadoSync />
        <IonCard>
          <IonCardContent>
            <div className="resumen-grid">
              <div>
                <div className="dato">{resumen.total}</div>
                <div className="etiqueta">fincas · {fmt(resumen.areaHa)} ha</div>
              </div>
              <div>
                <div className="dato" style={{ color: resumen.aguaPromedio > meta ? 'var(--ion-color-danger)' : undefined }}>
                  {fmt(resumen.aguaPromedio)}
                </div>
                <div className="etiqueta">m³/ha promedio (meta {fmt(meta)})</div>
              </div>
              <div>
                <div className="dato">{resumen.enAlerta}</div>
                <div className="etiqueta">fincas con alguna alerta</div>
              </div>
              <div>
                <div className="dato">{resumen.riesgoAbandono}</div>
                <div className="etiqueta">podrían no volver a sembrar</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonSegment value={vista} onIonChange={(e) => setVista(e.detail.value as typeof vista)} style={{ padding: '0 16px' }}>
          <IonSegmentButton value="lista"><IonLabel>Lista</IonLabel></IonSegmentButton>
          <IonSegmentButton value="mapa"><IonLabel>Mapa</IonLabel></IonSegmentButton>
        </IonSegment>

        {vista === 'mapa' ? (
          <MapaFincas fincas={porTexto} metaAgua={meta} onAbrir={(id) => router.push(`/fincas/${id}`, 'forward')} />
        ) : (
          <>
          <IonSegment value={filtro} onIonChange={(e) => setFiltro(e.detail.value as typeof filtro)} style={{ padding: '8px 16px 0' }}>
            <IonSegmentButton value="todas"><IonLabel>Todas</IonLabel></IonSegmentButton>
            <IonSegmentButton value="alerta"><IonLabel>Con alerta</IonLabel></IonSegmentButton>
          </IonSegment>

          <IonList inset>
            {visibles.map((f) => {
              const a = alertasFinca(f, meta);
              return (
                <IonItem key={f.id} routerLink={`/fincas/${f.id}`} detail>
                  <IonLabel>
                    <h2>{f.nombre}</h2>
                    <p>{f.codigoAgricultor} · {f.municipio} ({f.zona}) · {fmt(f.areaHa)} ha · {fmt(f.aguaM3Ha)} m³/ha</p>
                    <div>
                      {a.abandono && <IonChip color="warning">{f.intencionSiembra === 'no' ? 'No volverá a sembrar' : 'Duda si sembrar'}</IonChip>}
                      {a.agua && <IonChip color="danger">Sobre la meta de agua</IonChip>}
                      {a.organico && <IonChip color="danger">Candado orgánico</IonChip>}
                      {a.riego && <IonChip color="warning">Problema de riego</IonChip>}
                      {!a.abandono && !a.agua && !a.organico && !a.riego && <IonChip color="success">Sin alertas</IonChip>}
                    </div>
                  </IonLabel>
                </IonItem>
              );
            })}
            {visibles.length === 0 && (
              <IonItem><IonLabel>No hay fincas que coincidan.</IonLabel></IonItem>
            )}
          </IonList>
          </>
        )}
        <AvisoEjemplo />
        <div style={{ height: 72 }} />

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton routerLink="/fincas/nuevo" aria-label="Registrar visita de finca">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default FincasPage;
