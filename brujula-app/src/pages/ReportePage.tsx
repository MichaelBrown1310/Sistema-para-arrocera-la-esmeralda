import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { copyOutline, documentTextOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { hoy, useDatos } from '../data/store';
import { armarReporte, generarPDF, reporteCSV } from '../data/reporte';
import Semaforo from '../components/Semaforo';

/** Reporte para auditorías: vista en pantalla + PDF + CSV. */
const ReportePage = () => {
  const datos = useDatos();
  const [toast] = useIonToast();
  const [generando, setGenerando] = useState(false);
  const reporte = useMemo(() => {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    return armarReporte(datos, `${hoy(ahora)} ${hora}`);
  }, [datos]);

  const pdf = async () => {
    setGenerando(true);
    try {
      await generarPDF(reporte);
    } catch {
      toast({ message: 'No se pudo generar el PDF aquí. Usa «Copiar CSV».', duration: 3000, position: 'top', color: 'warning' });
    } finally {
      setGenerando(false);
    }
  };

  const copiarCSV = async () => {
    try {
      await navigator.clipboard.writeText(reporteCSV(reporte));
      toast({ message: 'CSV copiado. Pégalo en Excel o en un correo.', duration: 2500, position: 'top', color: 'success' });
    } catch {
      toast({ message: 'Este navegador no permitió copiar.', duration: 2500, position: 'top', color: 'warning' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/bitacora" />
          </IonButtons>
          <IonTitle>Reporte para auditorías</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          <IonNote>
            Evidencia para Empresa B, comercio justo, orgánico y Amigo de las Aves · Generado: {reporte.generado}
          </IonNote>
          <div className="botones-reporte">
            <IonButton onClick={pdf} disabled={generando}>
              <IonIcon slot="start" icon={documentTextOutline} />
              {generando ? 'Generando…' : 'Descargar PDF'}
            </IonButton>
            <IonButton fill="outline" onClick={copiarCSV}>
              <IonIcon slot="start" icon={copyOutline} />
              Copiar CSV
            </IonButton>
          </div>
        </div>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="titulo-seccion">1. Decisiones aprobadas ({reporte.decisiones.length})</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {reporte.decisiones.length === 0 ? (
              <p>Aún no hay decisiones aprobadas. Aprueba una opción en «Decidir».</p>
            ) : (
              reporte.decisiones.map((x, i) => (
                <div key={i} className="bloque-reporte">
                  <p>
                    <strong>{x.decision}</strong> · {x.fecha}
                  </p>
                  <p>
                    Elegida: {x.opcion} · PTI {x.pti} · riesgo <Semaforo valor={x.riesgo} compacto /> · aprobó {x.aprobadoPor}
                  </p>
                  <p>{x.candados}</p>
                  {x.supuestos && <p>Supuestos: {x.supuestos}</p>}
                  {x.escenarios && <p>Escenarios simulados: {x.escenarios}</p>}
                  <p>
                    Revisión: {x.revision}
                    {x.resultado ? ` · Resultado: ${x.resultado}` : ''}
                  </p>
                </div>
              ))
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="titulo-seccion">2. Indicadores de fincas</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <table className="tabla-reporte">
              <tbody>
                {reporte.indicadores.map((x) => (
                  <tr key={x.indicador}>
                    <th scope="row">{x.indicador}</th>
                    <td>{x.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="titulo-seccion">3. Riesgos</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <table className="tabla-reporte">
              <thead>
                <tr>
                  <th>Riesgo</th>
                  <th>Inherente</th>
                  <th>Con controles</th>
                </tr>
              </thead>
              <tbody>
                {reporte.riesgos.map((x) => (
                  <tr key={x.riesgo}>
                    <td>{x.riesgo}</td>
                    <td><Semaforo valor={x.inherente} compacto /></td>
                    <td><Semaforo valor={x.residual} compacto /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </IonCardContent>
        </IonCard>
        <p className="aviso-ejemplo">Prototipo con datos de ejemplo: no son datos reales de la empresa.</p>
      </IonContent>
    </IonPage>
  );
};

export default ReportePage;
