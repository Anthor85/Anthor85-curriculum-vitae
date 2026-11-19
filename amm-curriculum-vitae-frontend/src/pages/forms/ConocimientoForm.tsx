import { useState } from 'react';
import { useBuscarIcono, useEnvioFormulario } from '../../hooks';
import {
  ConocimientoPrioridad,
  ETIQUETAS_PRIORIDAD,
  type Conocimiento,
  type ConocimientoPayload,
  type ResultadoIcono,
} from '../../interfaces/conocimiento.interface';

import { Button } from '../../components/Button';
import { CampoLocalizado } from '../../components/CampoLocalizado';
import { IconoSvg } from '../../components/IconoSvg';
import { TEXTO_VACIO, trimLocalizado } from '../../helpers/textoLocalizado';
import { MensajeAccion } from '../../components/MensajeAccion';
import type { MensajeAccion as MensajeAccionType } from '../../interfaces/mensajeAccion.interface';

import styles from './Form.module.scss';

const CONOCIMIENTO_VACIO: ConocimientoPayload = {
  titulo: TEXTO_VACIO,
  prioridad: ConocimientoPrioridad.MEDIA,
  icono: '',
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
          icono: conocimientoEnEdicion.icono ?? '',
        }
      : CONOCIMIENTO_VACIO,
  );
  const [resultados, setResultados] = useState<ResultadoIcono[]>([]);
  const { buscar, buscando, error: errorIcono } = useBuscarIcono();

  const icono = conocimiento.icono ?? '';
  const setIcono = (nuevo: string) =>
    setConocimiento((prev) => ({ ...prev, icono: nuevo }));

  const buscarIcono = async () => {
    try {
      setResultados(await buscar(conocimiento.titulo.es.trim()));
    } catch {
      // El mensaje ya está en `errorIcono`
      setResultados([]);
    }
  };

  const elegirIcono = (resultado: ResultadoIcono) => {
    setIcono(resultado.icono);
    setResultados([]);
  };

  const limpiarFormulario = () => {
    setConocimiento(CONOCIMIENTO_VACIO);
    setResultados([]);
    onLimpiar();
  };

  const { isPending, enviar } = useEnvioFormulario(async () => {
    const payload: ConocimientoPayload = {
      ...conocimiento,
      titulo: trimLocalizado(conocimiento.titulo),
      icono: icono.trim(),
    };

    await onAddConocimiento(payload);
    limpiarFormulario();
  });

  return (
    <form onSubmit={enviar} className={styles.Form}>
      <CampoLocalizado
        id="titulo"
        etiqueta="Título"
        valor={conocimiento.titulo}
        onChange={(titulo) => setConocimiento((prev) => ({ ...prev, titulo }))}
        required
      />
      <fieldset className={styles.icono}>
        <legend>Icono:</legend>
        <div className={styles.iconoFila}>
          <div className={styles.iconoPrevia} data-testid="icono-previa">
            {icono ? (
              <IconoSvg svg={icono} className={styles.iconoPreviaSvg} />
            ) : (
              <span>Sin icono</span>
            )}
          </div>
          <Button
            type="button"
            onClick={buscarIcono}
            disabled={!conocimiento.titulo.es.trim() || buscando}
            name={buscando ? 'Buscando…' : 'Buscar icono'}
          />
          <Button
            type="button"
            onClick={() => setIcono('')}
            disabled={!icono}
            name="Quitar icono"
          />
        </div>
        {errorIcono && (
          <p className={styles.error} role="alert">
            {errorIcono}
          </p>
        )}
        {resultados.length > 0 && (
          <div className={styles.iconoResultados}>
            {resultados.map((resultado, i) => (
              <button
                key={`${resultado.fuente}-${resultado.nombre}-${i}`}
                type="button"
                aria-label={`Usar icono ${resultado.nombre} (${resultado.fuente})`}
                aria-pressed={resultado.icono === icono}
                title={resultado.nombre}
                onClick={() => elegirIcono(resultado)}
              >
                <IconoSvg svg={resultado.icono} />
              </button>
            ))}
          </div>
        )}
        <details>
          <summary>Editar SVG a mano</summary>
          <div className={styles.field}>
            <label htmlFor="icono">SVG:</label>
            <textarea
              id="icono"
              name="icono"
              rows={5}
              value={icono}
              onChange={(e) => setIcono(e.target.value)}
            />
          </div>
        </details>
      </fieldset>
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
              {ETIQUETAS_PRIORIDAD[valor]}
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
