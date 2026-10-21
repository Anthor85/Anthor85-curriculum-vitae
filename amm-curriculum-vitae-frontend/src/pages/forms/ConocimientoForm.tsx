import { useState } from 'react';
import { useEnvioFormulario } from '../../hooks';
import {
  ConocimientoPrioridad,
  type Conocimiento,
  type ConocimientoPayload,
} from '../../interfaces/conocimiento.interface';

import { Button } from '../../components/Button';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const CONOCIMIENTO_VACIO: ConocimientoPayload = {
  titulo: '',
  prioridad: ConocimientoPrioridad.MEDIA,
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
          prioridad: conocimientoEnEdicion.prioridad,
        }
      : CONOCIMIENTO_VACIO,
  );
  const limpiarFormulario = () => {
    setConocimiento(CONOCIMIENTO_VACIO);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: ConocimientoPayload = {
      ...conocimiento,
      titulo: conocimiento.titulo.trim(),
    };

    await onAddConocimiento(payload);
    limpiarFormulario();
  });

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
        <label htmlFor="prioridad">Prioridad:</label>
        <select
          id="prioridad"
          name="prioridad"
          value={conocimiento.prioridad}
          onChange={(e) =>
            setConocimiento({
              ...conocimiento,
              prioridad: e.target.value as ConocimientoPrioridad,
            })
          }
          required
        >
          {Object.values(ConocimientoPrioridad).map((valor) => (
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
