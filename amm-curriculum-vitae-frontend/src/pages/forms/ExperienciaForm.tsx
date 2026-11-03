import { useEffect, useState } from 'react';
import { useConocimientoStore, useEnvioFormulario } from '../../hooks';
import { CampoLocalizado } from '../../components/CampoLocalizado';
import { MultiSelect } from '../../components/MultiSelect';
import { SugerirVacios } from '../../components/SugerirVacios';
import type { Traduccion } from '../../components/SugerirVacios';
import { TEXTO_VACIO, trimLocalizado } from '../../helpers/textoLocalizado';
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
  descripcion: TEXTO_VACIO,
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
              : [{ descripcion: TEXTO_VACIO }],
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
      hitos: [...(prev.hitos || []), { descripcion: TEXTO_VACIO }],
    }));

  const borrarHito = (indice: number) =>
    setExperiencia((prev) => ({
      ...prev,
      hitos: prev.hitos?.filter((_, i) => i !== indice) || [],
    }));

  const cambiarHito = (indice: number, idioma: 'es' | 'en', valor: string) =>
    setExperiencia((prev) => ({
      ...prev,
      hitos:
        prev.hitos?.map((hito, i) =>
          i === indice
            ? { ...hito, descripcion: { ...hito.descripcion, [idioma]: valor } }
            : hito,
        ) || [],
    }));

  const aplicarTraducciones = (traducciones: Traduccion[]) =>
    setExperiencia((prev) => ({
      ...prev,
      hitos: prev.hitos.map((hito, i) => {
        const traduccion = traducciones.find(({ indice }) => indice === i);
        return traduccion
          ? { ...hito, descripcion: { ...hito.descripcion, en: traduccion.en } }
          : hito;
      }),
    }));

  const limpiarFormulario = () => {
    setExperiencia(EXPERIENCIA_VACIA);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: ExperienciaPayload = {
      ...experiencia,
      descripcion: trimLocalizado(experiencia.descripcion),
      fechaFin: experiencia.fechaFin ?? '',
      hitos: experiencia.hitos
        .map((hito) => ({
          ...hito,
          descripcion: trimLocalizado(hito.descripcion),
        }))
        .filter((hito) => hito.descripcion.es !== ''),
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
      <CampoLocalizado
        id="descripcion"
        etiqueta="Posición"
        valor={experiencia.descripcion}
        onChange={(descripcion) =>
          setExperiencia((prev) => ({ ...prev, descripcion }))
        }
        multilinea
        required
      />
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
              label: tecnologia.titulo.es,
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
                name="hitos-es"
                aria-label={`Hito ${indice + 1} (ES)`}
                value={hito.descripcion.es}
                onChange={(e) => cambiarHito(indice, 'es', e.target.value)}
              />
              <input
                type="text"
                name="hitos-en"
                aria-label={`Hito ${indice + 1} (EN)`}
                value={hito.descripcion.en}
                onChange={(e) => cambiarHito(indice, 'en', e.target.value)}
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
        <SugerirVacios
          valores={experiencia.hitos.map(({ descripcion }) => descripcion)}
          onTraducidos={aplicarTraducciones}
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
