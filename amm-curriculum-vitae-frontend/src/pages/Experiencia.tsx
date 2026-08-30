import { useEffect, useState } from "react";
import { useExperienciaStore } from "../hooks/useExperienciaStore";
import {
  Experiencia as IExperiencia,
  ExperienciaPayload,
} from "../interfaces/experiencia.interface";
import { ExperienciaForm } from "./forms/ExperienciaForm";
import { ExperienciaCard } from "./cards/ExperienciaCard";

import styles from "./Layout.module.scss";

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

  const [experienciaEnEdicion, setExperienciaEnEdicion] =
    useState<IExperiencia | null>(null);

  const enviarExperiencia = async (payload: ExperienciaPayload) => {
    if (experienciaEnEdicion) {
      await updateExperiencia(experienciaEnEdicion.id, payload);
      return;
    }

    await createExperiencia(payload);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  useEffect(() => {
    experiencia === null && getExperiencia();
  }, [getExperiencia]);

  return (
    <div className={styles.Page}>
    {experiencia && experiencia.length > 0 && (
      <div className={styles.data}>
        {(experiencia as IExperiencia[]).map((exp) => (
          <ExperienciaCard
            key={exp.id}
            experiencia={exp}
            deleteExperiencia={() => deleteExperiencia(exp.id)}
            onEditar={setExperienciaEnEdicion}
            enEdicion={exp.id === experienciaEnEdicion?.id}
          />
        ))}
      </div>)}
      <div className={styles.form}>
        <h1>{experienciaEnEdicion ? "Editar Experiencia" : "Crear Experiencia"}</h1>
        <ExperienciaForm
          experienciaEnEdicion={experienciaEnEdicion}
          onSubmitExperiencia={enviarExperiencia}
          onLimpiar={() => setExperienciaEnEdicion(null)}
        />
      </div>
    </div>
  );
};
