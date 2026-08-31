import { useEffect, useState } from 'react';
import type {
  Formacion,
  FormacionPayload,
} from '../../interfaces/formacion.interface';

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
}

export const FormacionForm = ({
  formacionEnEdicion,
  onSubmitFormacion,
  onLimpiar,
}: Props) => {
  const [formacion, setFormacion] = useState<FormacionPayload>(FORMACION_VACIA);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!formacionEnEdicion) {
      setFormacion(FORMACION_VACIA);
      return;
    }

    setFormacion({
      titulo: formacionEnEdicion.titulo,
      institucion: formacionEnEdicion.institucion,
      descripcion: formacionEnEdicion.descripcion ?? '',
      fechaFin: formacionEnEdicion.fechaFin.slice(0, 10),
    });
  }, [formacionEnEdicion]);

  const limpiarFormulario = () => {
    setFormacion(FORMACION_VACIA);
    onLimpiar();
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: FormacionPayload = {
      ...formacion,
      titulo: formacion.titulo.trim(),
      institucion: formacion.institucion.trim(),
    };

    setIsPending(true);
    try {
      await onSubmitFormacion(payload);
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
        <label htmlFor="descripcion">Descripción:</label>
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
        <button type="submit" disabled={isPending}>
          {formacionEnEdicion
            ? isPending
              ? 'Actualizando...'
              : 'Actualizar Formación'
            : isPending
              ? 'Agregando...'
              : 'Agregar Formación'}
        </button>
        <button type="button" onClick={limpiarFormulario}>
          Borrar formulario
        </button>
      </div>
    </form>
  );
};
