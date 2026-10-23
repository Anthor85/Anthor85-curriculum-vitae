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
  fechaFin: '',
  extras: [],
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
          fechaFin: formacionEnEdicion.fechaFin.slice(0, 10),
          extras:
            formacionEnEdicion.extras?.length > 0
              ? formacionEnEdicion.extras.map(({ id, descripcion }) => ({
                  id,
                  descripcion,
                }))
              : [{ descripcion: '' }],
        }
      : FORMACION_VACIA,
  );

  const anadirExtra = () =>
    setFormacion((prev) => ({
      ...prev,
      extras: [...prev.extras, { descripcion: '' }],
    }));

  const borrarExtra = (indice: number) =>
    setFormacion((prev) => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== indice),
    }));

  const cambiarExtra = (indice: number, valor: string) =>
    setFormacion((prev) => ({
      ...prev,
      extras: prev.extras.map((extra, i) =>
        i === indice ? { ...extra, descripcion: valor } : extra,
      ),
    }));

  const limpiarFormulario = () => {
    setFormacion(FORMACION_VACIA);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: FormacionPayload = {
      ...formacion,
      titulo: formacion.titulo.trim(),
      institucion: formacion.institucion.trim(),
      extras: formacion.extras.filter(
        (extra) => extra.descripcion.trim() !== '',
      ),
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
      <div
        className={styles.hitos}
        role="group"
        aria-labelledby="extras-titulo"
      >
        <span id="extras-titulo">Extra:</span>
        {formacion.extras.map((extra, indice) => (
          <div key={indice} className={styles.hitoFila}>
            <input
              type="text"
              name="extras"
              aria-label={`Extra ${indice + 1}`}
              value={extra.descripcion}
              onChange={(e) => cambiarExtra(indice, e.target.value)}
            />
            <button
              type="button"
              className={styles.hitoBoton}
              aria-label={`Borrar extra ${indice + 1}`}
              onClick={() => borrarExtra(indice)}
            >
              X
            </button>
          </div>
        ))}
        <Button type="button" onClick={anadirExtra} name="+ Añadir extra" />
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
