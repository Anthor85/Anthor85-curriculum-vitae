import { useEffect, useState } from 'react';
import type {
  FormacionComplementaria,
  FormacionComplementariaPayload,
} from '../../interfaces/formacionComplementaria.interface';

import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const FORMACION_COMPLEMENTARIA_VACIA: FormacionComplementariaPayload = {
  titulo: '',
  institucion: '',
  fechaFin: '',
};

interface Props {
  formacionComplementariaEnEdicion: FormacionComplementaria | null;
  onSubmitFormacionComplementaria: (
    payload: FormacionComplementariaPayload,
  ) => Promise<void> | void;
  onLimpiar: () => void;
  mensaje: MensajeAccionType | null;
}

export const FormacionComplementariaForm = ({
  formacionComplementariaEnEdicion,
  onSubmitFormacionComplementaria,
  onLimpiar,
  mensaje,
}: Props) => {
  const [formacionComplementaria, setFormacionComplementaria] =
    useState<FormacionComplementariaPayload>(FORMACION_COMPLEMENTARIA_VACIA);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!formacionComplementariaEnEdicion) {
      setFormacionComplementaria(FORMACION_COMPLEMENTARIA_VACIA);
      return;
    }

    setFormacionComplementaria({
      titulo: formacionComplementariaEnEdicion.titulo,
      institucion: formacionComplementariaEnEdicion.institucion,
      fechaFin: formacionComplementariaEnEdicion.fechaFin?.slice(0, 10) ?? '',
    });
  }, [formacionComplementariaEnEdicion]);

  const limpiarFormulario = () => {
    setFormacionComplementaria(FORMACION_COMPLEMENTARIA_VACIA);
    onLimpiar();
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: FormacionComplementariaPayload = {
      ...formacionComplementaria,
      titulo: formacionComplementaria.titulo.trim(),
      institucion: formacionComplementaria.institucion.trim(),
    };

    setIsPending(true);
    try {
      await onSubmitFormacionComplementaria(payload);
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
          value={formacionComplementaria.titulo}
          onChange={(e) =>
            setFormacionComplementaria({
              ...formacionComplementaria,
              titulo: e.target.value,
            })
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
          value={formacionComplementaria.institucion}
          onChange={(e) =>
            setFormacionComplementaria({
              ...formacionComplementaria,
              institucion: e.target.value,
            })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaFin">Fecha de Fin:</label>
        <input
          type="date"
          id="fechaFin"
          name="fechaFin"
          value={formacionComplementaria.fechaFin}
          onChange={(e) =>
            setFormacionComplementaria({
              ...formacionComplementaria,
              fechaFin: e.target.value,
            })
          }
        />
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={isPending}>
          {formacionComplementariaEnEdicion
            ? isPending
              ? 'Actualizando...'
              : 'Actualizar Formación Complementaria'
            : isPending
              ? 'Agregando...'
              : 'Agregar Formación Complementaria'}
        </button>
        <button type="button" onClick={limpiarFormulario}>
          Borrar formulario
        </button>
      </div>
      <MensajeAccion mensaje={mensaje} />
    </form>
  );
};
