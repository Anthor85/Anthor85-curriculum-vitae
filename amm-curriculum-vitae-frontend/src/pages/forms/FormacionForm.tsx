import { useState } from 'react';
import { useEnvioFormulario } from '../../hooks';
import type {
  Formacion,
  FormacionPayload,
} from '../../interfaces/formacion.interface';

import { Button } from '../../components/Button';
import { CampoLocalizado } from '../../components/CampoLocalizado';
import { SugerirVacios } from '../../components/SugerirVacios';
import type { Traduccion } from '../../components/SugerirVacios';
import { TEXTO_VACIO, trimLocalizado } from '../../helpers/textoLocalizado';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const FORMACION_VACIA: FormacionPayload = {
  titulo: TEXTO_VACIO,
  institucion: TEXTO_VACIO,
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
              : [{ descripcion: TEXTO_VACIO }],
        }
      : FORMACION_VACIA,
  );

  const anadirExtra = () =>
    setFormacion((prev) => ({
      ...prev,
      extras: [...prev.extras, { descripcion: TEXTO_VACIO }],
    }));

  const borrarExtra = (indice: number) =>
    setFormacion((prev) => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== indice),
    }));

  const cambiarExtra = (indice: number, idioma: 'es' | 'en', valor: string) =>
    setFormacion((prev) => ({
      ...prev,
      extras: prev.extras.map((extra, i) =>
        i === indice
          ? { ...extra, descripcion: { ...extra.descripcion, [idioma]: valor } }
          : extra,
      ),
    }));

  const aplicarTraducciones = (traducciones: Traduccion[]) =>
    setFormacion((prev) => ({
      ...prev,
      extras: prev.extras.map((extra, i) => {
        const traduccion = traducciones.find(({ indice }) => indice === i);
        return traduccion
          ? {
              ...extra,
              descripcion: { ...extra.descripcion, en: traduccion.en },
            }
          : extra;
      }),
    }));

  const limpiarFormulario = () => {
    setFormacion(FORMACION_VACIA);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: FormacionPayload = {
      ...formacion,
      titulo: trimLocalizado(formacion.titulo),
      institucion: trimLocalizado(formacion.institucion),
      extras: formacion.extras
        .map((extra) => ({
          ...extra,
          descripcion: trimLocalizado(extra.descripcion),
        }))
        .filter((extra) => extra.descripcion.es !== ''),
    };

    await onSubmitFormacion(payload);
    limpiarFormulario();
  });

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <CampoLocalizado
        id="titulo"
        etiqueta="Título"
        valor={formacion.titulo}
        onChange={(titulo) => setFormacion((prev) => ({ ...prev, titulo }))}
        required
      />
      <CampoLocalizado
        id="institucion"
        etiqueta="Institución"
        valor={formacion.institucion}
        onChange={(institucion) =>
          setFormacion((prev) => ({ ...prev, institucion }))
        }
        required
      />
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
              name="extras-es"
              aria-label={`Extra ${indice + 1} (ES)`}
              value={extra.descripcion.es}
              onChange={(e) => cambiarExtra(indice, 'es', e.target.value)}
            />
            <input
              type="text"
              name="extras-en"
              aria-label={`Extra ${indice + 1} (EN)`}
              value={extra.descripcion.en}
              onChange={(e) => cambiarExtra(indice, 'en', e.target.value)}
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
        <SugerirVacios
          valores={formacion.extras.map(({ descripcion }) => descripcion)}
          onTraducidos={aplicarTraducciones}
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
