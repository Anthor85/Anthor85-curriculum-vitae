import { useEffect, useState } from 'react';
import { MENSAJE_ERROR, useExperienciaStore, useMensajeAccion } from '../hooks';
import {
  Experiencia as IExperiencia,
  ExperienciaPayload,
} from '../interfaces/experiencia.interface';
import { ExperienciaForm } from './forms/ExperienciaForm';
import { ExperienciaCard } from './cards/ExperienciaCard';

import styles from './Layout.module.scss';

export const Experiencia = () => {
  const {
    experiencia,
    loading,
    getExperiencia,
    createExperiencia,
    updateExperiencia,
    deleteExperiencia,
  } = useExperienciaStore();

  const { mensaje, mostrarMensaje, mostrarError } = useMensajeAccion();

  const [experienciaEnEdicion, setExperienciaEnEdicion] =
    useState<IExperiencia | null>(null);

  const enviarExperiencia = async (payload: ExperienciaPayload) => {
    if (experienciaEnEdicion) {
      const actualizada = await updateExperiencia(
        experienciaEnEdicion.id,
        payload,
      );
      mostrarMensaje(actualizada ? 'Experiencia actualizada' : MENSAJE_ERROR);
      return;
    }

    const creada = await createExperiencia(payload);
    mostrarMensaje(creada ? 'Experiencia creada' : MENSAJE_ERROR);
  };

  const eliminarExperiencia = async (id: string) => {
    const eliminada = await deleteExperiencia(id);
    mostrarMensaje(eliminada ? 'Experiencia eliminada' : MENSAJE_ERROR);
  };

  useEffect(() => {
    if (experiencia === null)
      getExperiencia().then((obtenida) => {
        if (!obtenida) mostrarError();
      });
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className={styles.Page}>
      {experiencia && experiencia.length > 0 && (
        <div className={styles.data}>
          {(experiencia as IExperiencia[]).map((exp) => (
            <ExperienciaCard
              key={exp.id}
              experiencia={exp}
              deleteExperiencia={() => eliminarExperiencia(exp.id)}
              onEditar={setExperienciaEnEdicion}
              enEdicion={exp.id === experienciaEnEdicion?.id}
            />
          ))}
        </div>
      )}
      <div className={styles.form}>
        <h1>
          {experienciaEnEdicion ? 'Editar Experiencia' : 'Crear Experiencia'}
        </h1>
        <ExperienciaForm
          experienciaEnEdicion={experienciaEnEdicion}
          onAddExperiencia={enviarExperiencia}
          onLimpiar={() => setExperienciaEnEdicion(null)}
          mensaje={mensaje}
        />
      </div>
    </div>
  );
};
