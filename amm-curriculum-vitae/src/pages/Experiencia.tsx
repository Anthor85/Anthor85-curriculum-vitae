import { useEffect } from "react";
import { useExperienciaStore } from "../hooks/useExperienciaStore";
import { Experiencia as IExperiencia } from "../interfaces/experiencia.interface";
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
    deleteExperiencia,
  } = useExperienciaStore();

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
          />
        ))}
      </div>)}
      <div className={styles.form}>
        <h1>Crear Experiencia</h1>
        <ExperienciaForm onAddExperiencia={createExperiencia} />
      </div>
    </div>
  );
};
