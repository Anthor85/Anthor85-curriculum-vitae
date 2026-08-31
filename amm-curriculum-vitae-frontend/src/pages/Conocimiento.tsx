import { useEffect, useState } from 'react';
import { useConocimientoStore } from '../hooks';
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
    error,

    getConocimiento,
    createConocimiento,
    updateConocimiento,
    deleteConocimiento,
  } = useConocimientoStore();

  const [conocimientoEnEdicion, setConocimientoEnEdicion] =
    useState<IConocimiento | null>(null);

  const enviarConocimiento = async (payload: ConocimientoPayload) => {
    if (conocimientoEnEdicion) {
      await updateConocimiento(conocimientoEnEdicion.id, payload);
      return;
    }

    await createConocimiento(payload);
  };

  useEffect(() => {
    if (conocimiento.length === 0) getConocimiento();
  }, [getConocimiento]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.Page}>
      <div className={styles.data}>
        {(conocimiento as IConocimiento[]).map((con) => (
          <ConocimientoCard
            key={con.id}
            conocimiento={con}
            deleteConocimiento={() => deleteConocimiento(con.id)}
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
        />
      </div>
    </div>
  );
};
