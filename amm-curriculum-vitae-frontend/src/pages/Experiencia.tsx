import { useEffect, useState } from 'react';
import { useExperienciaStore } from '../hooks/useExperienciaStore';
import { useMensajeAccion } from '../hooks';
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
    error,
    getExperiencia,
    createExperiencia,
    updateExperiencia,
    deleteExperiencia,
  } = useExperienciaStore();

  const { mensaje, mostrarMensaje } = useMensajeAccion();

  const [experienciaEnEdicion, setExperienciaEnEdicion] =
    useState<IExperiencia | null>(null);

  const enviarExperiencia = async (payload: ExperienciaPayload) => {
    if (experienciaEnEdicion) {
      const actualizada = await updateExperiencia(
        experienciaEnEdicion.id,
        payload,
      );
      if (actualizada) mostrarMensaje('Experiencia actualizada');
      return;
    }

    const creada = await createExperiencia(payload);
    if (creada) mostrarMensaje('Experiencia creada');
  };

  const eliminarExperiencia = async (id: string) => {
    const eliminada = await deleteExperiencia(id);
    if (eliminada) mostrarMensaje('Experiencia eliminada');
  };

  useEffect(() => {
    if (experiencia === null) getExperiencia();
  }, [getExperiencia]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

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
