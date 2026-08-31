import { useEffect, useState } from 'react';
import {
  ConocimientoNivel,
  type Conocimiento,
  type ConocimientoPayload,
} from '../../interfaces/conocimiento.interface';

import styles from './Form.module.scss';

const CONOCIMIENTO_VACIO: ConocimientoPayload = {
  titulo: '',
  nivel: ConocimientoNivel.BASICO,
};

interface Props {
  conocimientoEnEdicion: Conocimiento | null;
  onAddConocimiento: (payload: ConocimientoPayload) => Promise<void> | void;
  onLimpiar: () => void;
}

export const ConocimientoForm = ({
  conocimientoEnEdicion,
  onAddConocimiento,
  onLimpiar,
}: Props) => {
  const [conocimiento, setConocimiento] =
    useState<ConocimientoPayload>(CONOCIMIENTO_VACIO);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!conocimientoEnEdicion) {
      setConocimiento(CONOCIMIENTO_VACIO);
      return;
    }

    setConocimiento({
      titulo: conocimientoEnEdicion.titulo,
      nivel: conocimientoEnEdicion.nivel,
    });
  }, [conocimientoEnEdicion]);

  const limpiarFormulario = () => {
    setConocimiento(CONOCIMIENTO_VACIO);
    onLimpiar();
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: ConocimientoPayload = {
      ...conocimiento,
      titulo: conocimiento.titulo.trim(),
    };

    setIsPending(true);
    try {
      await onAddConocimiento(payload);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <div className={styles.field}>
        <label htmlFor="titulo">Título:</label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          value={conocimiento.titulo}
          onChange={(e) =>
            setConocimiento({ ...conocimiento, titulo: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="nivel">Nivel:</label>
        <select
          id="nivel"
          name="nivel"
          value={conocimiento.nivel}
          onChange={(e) =>
            setConocimiento({
              ...conocimiento,
              nivel: e.target.value as ConocimientoNivel,
            })
          }
          required
        >
          {Object.values(ConocimientoNivel).map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Agregando...' : 'Agregar Conocimiento'}
        </button>
        <button type="button" onClick={limpiarFormulario}>
          Borrar formulario
        </button>
      </div>
    </form>
  );
};
