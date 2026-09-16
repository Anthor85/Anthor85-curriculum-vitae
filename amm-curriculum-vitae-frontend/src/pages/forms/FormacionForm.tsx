import { useState } from 'react';
import { useEnvioFormulario } from '../../hooks';
import type {
  Formacion,
  FormacionPayload,
} from '../../interfaces/formacion.interface';

import { Button } from '../../components/Button';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const FORMACION_VACIA: FormacionPayload = {
  titulo: '',
  institucion: '',
  descripcion: '',
  fechaFin: '',
};

interface Props {
  formacionEnEdicion: Formacion | null;
  onSubmitFormacion: (payload: FormacionPayload) => Promise<void> | void;
  onLimpiar: () => void;
  mensaje: MensajeAccionType | null;
}

export const FormacionForm = ({
  formacionEnEdicion,
  onSubmitFormacion,
  onLimpiar,
  mensaje,
}: Props) => {
  // El padre remonta el form con `key` al cambiar la entidad en edición.
  const [formacion, setFormacion] = useState<FormacionPayload>(() =>
    formacionEnEdicion
      ? {
          titulo: formacionEnEdicion.titulo,
          institucion: formacionEnEdicion.institucion,
          descripcion: formacionEnEdicion.descripcion ?? '',
          fechaFin: formacionEnEdicion.fechaFin.slice(0, 10),
        }
      : FORMACION_VACIA,
  );
  const limpiarFormulario = () => {
    setFormacion(FORMACION_VACIA);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: FormacionPayload = {
      ...formacion,
      titulo: formacion.titulo.trim(),
      institucion: formacion.institucion.trim(),
    };

    await onSubmitFormacion(payload);
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
          value={formacion.titulo}
          onChange={(e) =>
            setFormacion({ ...formacion, titulo: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="institucion">Institución:</label>
        <input
          type="text"
          id="institucion"
          name="institucion"
          value={formacion.institucion}
          onChange={(e) =>
            setFormacion({ ...formacion, institucion: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="descripcion">A tener en cuenta:</label>
        <input
          type="text"
          id="descripcion"
          name="descripcion"
          value={formacion.descripcion}
          onChange={(e) =>
            setFormacion({ ...formacion, descripcion: e.target.value })
          }
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaFin">Fecha de Fin:</label>
        <input
          type="date"
          id="fechaFin"
          name="fechaFin"
          value={formacion.fechaFin}
          onChange={(e) =>
            setFormacion({ ...formacion, fechaFin: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.actions}>
        <Button
          type="submit"
          disabled={isPending}
          name={
            formacionEnEdicion
              ? isPending
                ? 'Actualizando...'
                : 'Actualizar Formación'
              : isPending
                ? 'Agregando...'
                : 'Agregar Formación'
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
