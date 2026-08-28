import { useActionState } from "react";

import styles from "./Form.module.scss";

interface Props {
  onAddConocimiento: (data: FormData) => void;
}

export const ConocimientoForm = ({ onAddConocimiento }: Props) => {
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, queryData: FormData) =>
      onAddConocimiento(queryData),
    null
  );

  return (
    <form action={formAction} className={styles.Form}>
      <div className={styles.field}>
        <label htmlFor="titulo">Título:</label>
        <input type="text" id="titulo" name="titulo" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="nivel">Nivel:</label>
        <select id="nivel" name="nivel" required>
          <option value="Básico">Básico</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>
      <button type="submit">Agregar Conocimiento</button>
    </form>
  );
};
