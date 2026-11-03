import { useState } from 'react';
import { useEnvioFormulario } from '../../hooks';
import type {
  FormacionComplementaria,
  FormacionComplementariaPayload,
} from '../../interfaces/formacionComplementaria.interface';

import { Button } from '../../components/Button';
import { CampoLocalizado } from '../../components/CampoLocalizado';
import { TEXTO_VACIO, trimLocalizado } from '../../helpers/textoLocalizado';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const FORMACION_COMPLEMENTARIA_VACIA: FormacionComplementariaPayload = {
  titulo: TEXTO_VACIO,
  institucion: TEXTO_VACIO,
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
  // El padre remonta el form con `key` al cambiar la entidad en edición.
  const [formacionComplementaria, setFormacionComplementaria] =
    useState<FormacionComplementariaPayload>(() =>
      formacionComplementariaEnEdicion
        ? {
            titulo: formacionComplementariaEnEdicion.titulo,
            institucion: formacionComplementariaEnEdicion.institucion,
            fechaFin:
              formacionComplementariaEnEdicion.fechaFin?.slice(0, 10) ?? '',
          }
        : FORMACION_COMPLEMENTARIA_VACIA,
    );
  const limpiarFormulario = () => {
    setFormacionComplementaria(FORMACION_COMPLEMENTARIA_VACIA);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: FormacionComplementariaPayload = {
      ...formacionComplementaria,
      titulo: trimLocalizado(formacionComplementaria.titulo),
      institucion: trimLocalizado(formacionComplementaria.institucion),
    };

    await onSubmitFormacionComplementaria(payload);
    limpiarFormulario();
  });

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <CampoLocalizado
        id="titulo"
        etiqueta="Título"
        valor={formacionComplementaria.titulo}
        onChange={(titulo) =>
          setFormacionComplementaria((prev) => ({ ...prev, titulo }))
        }
        required
      />
      <CampoLocalizado
        id="institucion"
        etiqueta="Institución"
        valor={formacionComplementaria.institucion}
        onChange={(institucion) =>
          setFormacionComplementaria((prev) => ({ ...prev, institucion }))
        }
        required
      />
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
        <Button
          type="submit"
          disabled={isPending}
          name={
            formacionComplementariaEnEdicion
              ? isPending
                ? 'Actualizando...'
                : 'Actualizar Formación Complementaria'
              : isPending
                ? 'Agregando...'
                : 'Agregar Formación Complementaria'
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
