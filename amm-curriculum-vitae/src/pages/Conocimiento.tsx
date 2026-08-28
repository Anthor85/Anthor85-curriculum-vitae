// import { createConocimientoAction } from "../actions/Conocimiento/createConocimiento.action"; //En lugar de actions usamos el hook
import { useEffect } from "react";
import { useConocimientoStore } from "../hooks";
import { ConocimientoForm } from "./forms/ConocimientoForm";
import { Conocimiento as IConocimiento } from "../interfaces/conocimiento.interface";
import { ConocimientoCard } from "./cards";

import styles from "./Layout.module.scss";

export const Conocimiento = () => {
  const {
    conocimiento,
    loading,
    error,

    getConocimiento,
    createConocimiento,
    deleteConocimiento,
  } = useConocimientoStore();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  useEffect(() => {
    conocimiento.length === 0 && getConocimiento();
  }, [getConocimiento]);

  return (
    <div className={styles.Page}>
      <div className={styles.data}>
        {(conocimiento as IConocimiento[]).map((con) => (
          <ConocimientoCard
            key={con.id}
            conocimiento={con}
            deleteConocimiento={() => deleteConocimiento(con.id)}
          />
        ))}
      </div>
      <div className={styles.form}>
        <h1>Crear Conocimiento</h1>
        <ConocimientoForm onAddConocimiento={createConocimiento} />
      </div>
    </div>
  );
};
