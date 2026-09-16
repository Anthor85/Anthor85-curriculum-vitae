import { useState } from 'react';
import {
  ConocimientoNivel,
  type Conocimiento,
  type ConocimientoPayload,
} from '../../interfaces/conocimiento.interface';

import { Button } from '../../components/Button';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const CONOCIMIENTO_VACIO: ConocimientoPayload = {
  titulo: '',
  nivel: ConocimientoNivel.BASICO,
};

interface Props {
  conocimientoEnEdicion: Conocimiento | null;
  onAddConocimiento: (payload: ConocimientoPayload) => Promise<void> | void;
  onLimpiar: () => void;
  mensaje: MensajeAccionType | null;
}

export const ConocimientoForm = ({
  conocimientoEnEdicion,
  onAddConocimiento,
  onLimpiar,
  mensaje,
}: Props) => {
  // El padre remonta el form con `key` al cambiar la entidad en edición.
  const [conocimiento, setConocimiento] = useState<ConocimientoPayload>(() =>
    conocimientoEnEdicion
      ? {
          titulo: conocimientoEnEdicion.titulo,
          nivel: conocimientoEnEdicion.nivel,
        }
      : CONOCIMIENTO_VACIO,
  );
  const [isPending, setIsPending] = useState<boolean>(false);

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
      limpiarFormulario();
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
        <Button
          type="submit"
          disabled={isPending}
          name={
            conocimientoEnEdicion
              ? isPending
                ? 'Actualizando...'
                : 'Actualizar Conocimiento'
              : isPending
                ? 'Agregando...'
                : 'Agregar Conocimiento'
          }
        />
        <Button
          type="button"
          name="Borrar formulario"
          onClick={limpiarFormulario}
        />
      </div>
      <MensajeAccion mensaje={mensaje} />
    </form>
  );
};
