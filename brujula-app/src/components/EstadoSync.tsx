import { IonIcon } from '@ionic/react';
import { cloudDoneOutline, cloudOfflineOutline, cloudUploadOutline, syncOutline } from 'ionicons/icons';
import { useDatos } from '../data/store';

/** Línea pequeña que dice si hay conexión y cuántos cambios faltan por enviar. */
const EstadoSync = () => {
  const { enLinea, sync, ajustes, sincronizando } = useDatos();
  const n = sync.pendientes.length;
  const cambios = n === 1 ? '1 cambio' : `${n} cambios`;
  let icono = cloudDoneOutline;
  let texto = 'Todo sincronizado';
  if (!ajustes.servidorUrl) {
    icono = cloudOfflineOutline;
    texto = 'Datos guardados solo en este dispositivo';
  } else if (sincronizando) {
    icono = syncOutline;
    texto = 'Sincronizando…';
  } else if (!enLinea) {
    icono = cloudOfflineOutline;
    texto = n ? `Sin señal · ${cambios} esperando para enviarse` : 'Sin señal · los cambios se guardan aquí';
  } else if (n) {
    icono = cloudUploadOutline;
    texto = `${cambios} por enviar`;
  } else if (sync.ultimoError) {
    icono = cloudOfflineOutline;
    texto = 'No se pudo sincronizar';
  }
  return (
    <p className="estado-sync" role="status">
      <IonIcon icon={icono} aria-hidden="true" /> {texto}
    </p>
  );
};

export default EstadoSync;
