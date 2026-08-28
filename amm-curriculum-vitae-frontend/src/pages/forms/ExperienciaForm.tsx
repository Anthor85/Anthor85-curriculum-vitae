import { useActionState, useEffect, useState } from "react";
import { useConocimientoStore } from "../../hooks";

import styles from "./Form.module.scss";

interface Props {
  onAddExperiencia: (data: FormData) => void;
}

export const ExperienciaForm = ({ onAddExperiencia }: Props) => {

  const { conocimiento, getConocimiento } = useConocimientoStore();
  
  //TODO Cambiar esto a conocimiento
  const [selectedTecnologias, setSelectedTecnologias] = useState<string[]>([]);

  const [hitos, setHitos] = useState<string[]>([""]);

  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, queryData: FormData) =>
      onAddExperiencia(queryData),
    null
    // { initialState: { submitted: false } }
  );

  useEffect(() => {
    if (!conocimiento || conocimiento.length === 0) {
      getConocimiento();
    }
  }, []);

  var expanded = false;

  function showCheckboxes() {
    var checkboxes = document.getElementById("checkboxes");
    if (!expanded) {
      checkboxes!.classList.add(styles.show);
      expanded = true;
    } else {
      checkboxes!.classList.remove(styles.show);
      expanded = false;
    }
  }

  const anadirHito = () => setHitos((prev) => [...prev, ""]);

  const borrarHito = (indice: number) =>
    setHitos((prev) => prev.filter((_, i) => i !== indice));

  const cambiarHito = (indice: number, valor: string) =>
    setHitos((prev) => prev.map((hito, i) => (i === indice ? valor : hito)));

  return (
    <form
      action={formAction}
      method="post"
      className={styles.Form}
    >
      <div className={styles.field}>
        <label htmlFor="empresa">Company:</label>
        <input type="text" id="empresa" name="empresa" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="descripcion">Position:</label>
        <input type="text" id="descripcion" name="descripcion" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaInicio">Start Date:</label>
        <input type="date" id="fechaInicio" name="fechaInicio" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaFin">End Date:</label>
        <input type="date" id="fechaFin" name="fechaFin" />
      </div>
      {conocimiento && conocimiento.length > 0 ? (
        <div className={styles.multiselect}>
          <div className={styles.selectBox} onClick={showCheckboxes}>
            <select>
              <option>Select option</option>
            </select>
            <div className={styles.overSelect}></div>
          </div>
          <div id="checkboxes" className={styles.checkboxes}>
            {conocimiento.map((tecnologia: any) => (
              <label key={tecnologia.id} htmlFor={tecnologia.id}>
                <input
                  type="checkbox"
                  id={tecnologia.id}
                  name="tecnologias"
                  value={tecnologia.id}
                  checked={selectedTecnologias.includes(tecnologia.id)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    if (isChecked) {
                      setSelectedTecnologias((prev) => [
                        ...prev,
                        tecnologia.id,
                      ]);
                    } else {
                      setSelectedTecnologias((prev) =>
                        prev.filter((item) => item !== tecnologia.id)
                      );
                    }
                  }}
                />
                {tecnologia.titulo}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p>No technologies available</p>
      )}
      <div className={styles.hitos}>
        <label>Hitos:</label>
        {hitos.map((hito, indice) => (
          <div key={indice} className={styles.hitoFila}>
            <input
              type="text"
              name="hitos"
              value={hito}
              onChange={(e) => cambiarHito(indice, e.target.value)}
            />
            <button
              type="button"
              className={styles.hitoBoton}
              onClick={() => borrarHito(indice)}
            >
              X
            </button>
          </div>
        ))}
        <button type="button" className={styles.hitoBoton} onClick={anadirHito}>
          + Añadir hito
        </button>
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};
