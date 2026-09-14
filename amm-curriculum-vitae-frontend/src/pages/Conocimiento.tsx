import { useEffect, useState } from 'react';
import {
  MENSAJE_ERROR,
  useConocimientoStore,
  useMensajeAccion,
} from '../hooks';
import { ConocimientoForm } from './forms/ConocimientoForm';
import {
  Conocimiento as IConocimiento,
  ConocimientoPayload,
} from '../interfaces/conocimiento.interface';
import { ConocimientoCard } from './cards';

import styles from './Layout.module.scss';

export const Conocimiento = () => {
  const {
    conocimiento,
    loading,

    getConocimiento,
    createConocimiento,
    updateConocimiento,
    deleteConocimiento,
  } = useConocimientoStore();

  const { mensaje, mostrarMensaje, mostrarError } = useMensajeAccion();

  const [conocimientoEnEdicion, setConocimientoEnEdicion] =
    useState<IConocimiento | null>(null);

  const enviarConocimiento = async (payload: ConocimientoPayload) => {
    if (conocimientoEnEdicion) {
      const actualizado = await updateConocimiento(
        conocimientoEnEdicion.id,
        payload,
      );
      mostrarMensaje(actualizado ? 'Conocimiento actualizado' : MENSAJE_ERROR);
      return;
    }

    const creado = await createConocimiento(payload);
    mostrarMensaje(creado ? 'Conocimiento creado' : MENSAJE_ERROR);
  };

  const eliminarConocimiento = async (id: string) => {
    const eliminado = await deleteConocimiento(id);
    mostrarMensaje(eliminado ? 'Conocimiento eliminado' : MENSAJE_ERROR);
  };

  useEffect(() => {
    if (!conocimiento || conocimiento.length === 0)
      getConocimiento().then((obtenido) => {
        if (!obtenido) mostrarError();
      });
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className={styles.Page}>
      <div className={styles.data}>
        {(conocimiento as IConocimiento[])?.map((con) => (
          <ConocimientoCard
            key={con.id}
            conocimiento={con}
            deleteConocimiento={() => eliminarConocimiento(con.id)}
            onEditar={setConocimientoEnEdicion}
            enEdicion={con.id === conocimientoEnEdicion?.id}
          />
        ))}
      </div>
      <div className={styles.form}>
        <h1>
          {conocimientoEnEdicion ? 'Editar Conocimiento' : 'Crear Conocimiento'}
        </h1>
        <ConocimientoForm
          conocimientoEnEdicion={conocimientoEnEdicion}
          onAddConocimiento={enviarConocimiento}
          onLimpiar={() => setConocimientoEnEdicion(null)}
          mensaje={mensaje}
        />
      </div>
    </div>
  );
};
