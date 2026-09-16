import { useEffect, useState } from 'react';
import { useConocimientoStore, useEnvioFormulario } from '../../hooks';
import { MultiSelect } from '../../components/MultiSelect';
import type { Conocimiento } from '../../interfaces/conocimiento.interface';
import type {
  Experiencia,
  ExperienciaPayload,
} from '../../interfaces/experiencia.interface';

import { Button } from '../../components/Button';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const EXPERIENCIA_VACIA: ExperienciaPayload = {
  empresa: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  tecnologias: [],
  hitos: [],
};

interface Props {
  experienciaEnEdicion: Experiencia | null;
  onAddExperiencia: (payload: ExperienciaPayload) => Promise<void> | void;
  onLimpiar: () => void;
  mensaje: MensajeAccionType | null;
}

export const ExperienciaForm = ({
  experienciaEnEdicion,
  onAddExperiencia,
  onLimpiar,
  mensaje,
}: Props) => {
  const { conocimiento, getConocimiento } = useConocimientoStore();

  // El padre remonta el form con `key` al cambiar la entidad en edición.
  const [experiencia, setExperiencia] = useState<ExperienciaPayload>(() =>
    experienciaEnEdicion
      ? {
          ...experienciaEnEdicion,
          fechaInicio: experienciaEnEdicion.fechaInicio.slice(0, 10),
          fechaFin: experienciaEnEdicion.fechaFin
            ? experienciaEnEdicion.fechaFin.slice(0, 10)
            : '',
          hitos:
            experienciaEnEdicion.hitos.length > 0
              ? experienciaEnEdicion.hitos.map(({ id, descripcion }) => ({
                  id,
                  descripcion,
                }))
              : [{ descripcion: '' }],
        }
      : EXPERIENCIA_VACIA,
  );
  useEffect(() => {
    if (conocimiento === null) {
      getConocimiento();
    }
  }, [conocimiento, getConocimiento]);

  const anadirHito = () =>
    setExperiencia((prev) => ({
      ...prev,
      hitos: [...(prev.hitos || []), { descripcion: '' }],
    }));

  const borrarHito = (indice: number) =>
    setExperiencia((prev) => ({
      ...prev,
      hitos: prev.hitos?.filter((_, i) => i !== indice) || [],
    }));

  const cambiarHito = (indice: number, valor: string) =>
    setExperiencia((prev) => ({
      ...prev,
      hitos:
        prev.hitos?.map((hito, i) =>
          i === indice ? { ...hito, descripcion: valor } : hito,
        ) || [],
    }));

  const limpiarFormulario = () => {
    setExperiencia(EXPERIENCIA_VACIA);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: ExperienciaPayload = {
      ...experiencia,
      fechaFin: experiencia.fechaFin ?? '',
      hitos: experiencia.hitos.filter((hito) => hito.descripcion.trim() !== ''),
    };

    await onAddExperiencia(payload);
    limpiarFormulario();
  });

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <div className={styles.field}>
        <label htmlFor="empresa">Empresa:</label>
        <input
          type="text"
          id="empresa"
          name="empresa"
          value={experiencia.empresa}
          onChange={(e) =>
            setExperiencia({ ...experiencia, empresa: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="descripcion">Posición:</label>
        <input
          type="text"
          id="descripcion"
          name="descripcion"
          value={experiencia.descripcion}
          onChange={(e) =>
            setExperiencia({ ...experiencia, descripcion: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaInicio">Fecha inicio:</label>
        <input
          type="date"
          id="fechaInicio"
          name="fechaInicio"
          value={experiencia.fechaInicio}
          onChange={(e) =>
            setExperiencia({ ...experiencia, fechaInicio: e.target.value })
          }
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="fechaFin">Fecha fin:</label>
        <input
          type="date"
          id="fechaFin"
          name="fechaFin"
          value={experiencia.fechaFin}
          onChange={(e) =>
            setExperiencia({ ...experiencia, fechaFin: e.target.value })
          }
        />
      </div>
      {conocimiento && conocimiento.length > 0 ? (
        <div className={styles.tecnologias}>
          <span id="tecnologias-titulo">Tecnologías:</span>
          <MultiSelect
            name="tecnologias"
            ariaLabelledBy="tecnologias-titulo"
            options={conocimiento.map((tecnologia: Conocimiento) => ({
              id: tecnologia.id,
              label: tecnologia.titulo,
            }))}
            selected={experiencia.tecnologias}
            onChange={(selectedTecnologias) =>
              setExperiencia((prev) => ({
                ...prev,
                tecnologias: selectedTecnologias,
              }))
            }
          />
        </div>
      ) : (
        <p>No hay tecnologías disponibles</p>
      )}
      <div className={styles.hitos} role="group" aria-labelledby="hitos-titulo">
        <span id="hitos-titulo">Hitos:</span>
        {experiencia.hitos &&
          experiencia.hitos.length > 0 &&
          experiencia.hitos.map((hito, indice) => (
            <div key={indice} className={styles.hitoFila}>
              <input
                type="text"
                name="hitos"
                aria-label={`Hito ${indice + 1}`}
                value={hito.descripcion}
                onChange={(e) => cambiarHito(indice, e.target.value)}
              />
              <button
                type="button"
                className={styles.hitoBoton}
                aria-label={`Borrar hito ${indice + 1}`}
                onClick={() => borrarHito(indice)}
              >
                X
              </button>
            </div>
          ))}
        <Button
          type="button"
          // className={styles.hitoBoton}
          onClick={anadirHito}
          name="+ Añadir hito"
        />
      </div>
      <div className={styles.actions}>
        <Button
          type="submit"
          disabled={isPending}
          name={
            experienciaEnEdicion
              ? isPending
                ? 'Actualizando...'
                : 'Actualizar Experiencia'
              : isPending
                ? 'Agregando...'
                : 'Agregar Experiencia'
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
