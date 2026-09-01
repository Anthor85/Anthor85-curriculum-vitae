import { useEffect, useState } from 'react';
import { useConocimientoStore } from '../../hooks';
import { MultiSelect } from '../../components/MultiSelect';
import type { Conocimiento } from '../../interfaces/conocimiento.interface';
import type {
  Experiencia,
  ExperienciaPayload,
} from '../../interfaces/experiencia.interface';

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

  const [experiencia, setExperiencia] =
    useState<Omit<Experiencia, 'id'>>(EXPERIENCIA_VACIA);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!conocimiento || conocimiento.length === 0) {
      getConocimiento();
    }
  }, []);

  useEffect(() => {
    if (!experienciaEnEdicion) {
      setExperiencia(EXPERIENCIA_VACIA);
      return;
    }

    setExperiencia({
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
    } as Experiencia);
  }, [experienciaEnEdicion]);

  const anadirHito = () =>
    setExperiencia(
      (prev) =>
        ({
          ...prev,
          hitos: [...(prev.hitos || []), { descripcion: '' }],
        }) as Experiencia,
    );

  const borrarHito = (indice: number) =>
    setExperiencia(
      (prev) =>
        ({
          ...prev,
          hitos: prev.hitos?.filter((_, i) => i !== indice) || [],
        }) as Experiencia,
    );

  const cambiarHito = (indice: number, valor: string) =>
    setExperiencia(
      (prev) =>
        ({
          ...prev,
          hitos:
            prev.hitos?.map((hito, i) =>
              i === indice ? { ...hito, descripcion: valor } : hito,
            ) || [],
        }) as Experiencia,
    );

  const limpiarFormulario = () => {
    setExperiencia(EXPERIENCIA_VACIA);
    onLimpiar();
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: ExperienciaPayload = {
      ...experiencia,
      fechaFin: experiencia.fechaFin ?? '',
      hitos: experiencia.hitos.filter((hito) => hito.descripcion.trim() !== ''),
    };

    setIsPending(true);
    try {
      await onAddExperiencia(payload);
      limpiarFormulario();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <div className={styles.field}>
        <label htmlFor="empresa">Company:</label>
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
          <label>Tecnologías:</label>
          <MultiSelect
            name="tecnologias"
            options={conocimiento.map((tecnologia: Conocimiento) => ({
              id: tecnologia.id,
              label: tecnologia.titulo,
            }))}
            selected={experiencia.tecnologias}
            onChange={(selectedTecnologias) =>
              setExperiencia(
                (prev) =>
                  ({
                    ...prev,
                    tecnologias: selectedTecnologias,
                  }) as Experiencia,
              )
            }
          />
        </div>
      ) : (
        <p>No hay tecnologías disponibles</p>
      )}
      <div className={styles.hitos}>
        <label>Hitos:</label>
        {experiencia.hitos &&
          experiencia.hitos.length > 0 &&
          experiencia.hitos.map((hito, indice) => (
            <div key={indice} className={styles.hitoFila}>
              <input
                type="text"
                name="hitos"
                value={hito.descripcion}
                onChange={(e) => cambiarHito(indice, e.target.value)}
              />
              <button
                type="button"
                className={styles.hitoBoton}
                onClick={() => borrarHito(indice)}
              >
                X
              </button>
            </div>
          ))}
        <button type="button" className={styles.hitoBoton} onClick={anadirHito}>
          + Añadir hito
        </button>
      </div>
      <div className={styles.actions}>
        <button type="submit" disabled={isPending}>
          {experienciaEnEdicion
            ? isPending
              ? 'Actualizando...'
              : 'Actualizar Experiencia'
            : isPending
              ? 'Agregando...'
              : 'Agregar Experiencia'}
        </button>
        <button type="button" onClick={limpiarFormulario}>
          Borrar formulario
        </button>
      </div>
      <MensajeAccion mensaje={mensaje} />
    </form>
  );
};
