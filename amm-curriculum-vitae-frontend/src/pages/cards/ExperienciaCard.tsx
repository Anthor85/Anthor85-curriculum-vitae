import { Button } from '../../components/Button';
import { rangoFechas } from '../../helpers/rangoFechas';
import { faltaEn } from '../../helpers/textoLocalizado';
import i18n from '../../i18n';
import { tecnologiasFilter } from '../../helpers/tecnologiasFilter';
import { useConocimientoStore } from '../../hooks';
import { Conocimiento } from '../../interfaces/conocimiento.interface';
import { Experiencia } from '../../interfaces/experiencia.interface';

import { MarcaSinEn } from './MarcaSinEn';

import styles from './Cards.module.scss';

// El admin no se traduce: las fechas siempre en español.
const tEs = i18n.getFixedT('es');

interface Props {
  experiencia: Experiencia;
  deleteExperiencia: (id: string) => void;
  onEditar: (experiencia: Experiencia) => void;
  enEdicion: boolean;
}

export const ExperienciaCard = ({
  experiencia,
  deleteExperiencia,
  onEditar,
  enEdicion,
}: Props) => {
  const { conocimiento } = useConocimientoStore();
  const sinEn = [
    experiencia.descripcion,
    ...(experiencia.hitos ?? []).map(({ descripcion }) => descripcion),
  ].some(faltaEn);

  return (
    <div
      className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}
      key={experiencia.id}
    >
      <div className={styles.data}>
        <h2>{experiencia.empresa}</h2>
        {sinEn && <MarcaSinEn />}
        <p>{experiencia.descripcion.es}</p>
        <p>{rangoFechas(tEs, experiencia.fechaInicio, experiencia.fechaFin)}</p>
        {experiencia.tecnologias.length > 0 && (
          <div className={styles.coleccion}>
            <p>Tecnologías:</p>
            <ul className={styles.colecciones}>
              {conocimiento &&
                tecnologiasFilter(experiencia.tecnologias, conocimiento).map(
                  (tech: Conocimiento) => (
                    <li key={tech.id}>{tech.titulo.es}</li>
                  ),
                )}
            </ul>
          </div>
        )}
        {experiencia.hitos?.length ? (
          <div className={styles.coleccion}>
            <p>Hitos:</p>
            <ul className={styles.colecciones}>
              {experiencia.hitos.map((hito) => (
                <li key={hito.id}>{hito.descripcion.es}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <Button onClick={() => onEditar(experiencia)} name="Editar" />
        <Button
          onClick={() => deleteExperiencia(experiencia.id)}
          name="Eliminar"
        />
      </div>
    </div>
  );
};
