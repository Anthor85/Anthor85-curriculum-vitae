import { Expandable } from '../../../../components/Expandable';
import { rangoFechas } from '../../../../helpers/rangoFechas';
import { tecnologiasFilter } from '../../../../helpers/tecnologiasFilter';
import { Conocimiento } from '../../../../interfaces/conocimiento.interface';
import { Experiencia } from '../../../../interfaces/experiencia.interface';

import styles from './Items.module.scss';

interface Props {
  experiencia: Experiencia;
  conocimiento: Conocimiento[];
  expandible?: boolean;
}

export const ExperienciaItem = ({
  experiencia,
  conocimiento,
  expandible = true,
}: Props) => {
  const tecnologias = tecnologiasFilter(experiencia.tecnologias, conocimiento);

  const clases = [styles.Item, expandible && styles.expandable]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clases}>
      <Expandable
        cabecera={
          <span className={styles.cabecera}>
            <span className={styles.titulo}>{experiencia.empresa}</span>
            <span className={styles.descripcion}>
              {experiencia.descripcion}
            </span>
            <span className={styles.fechas}>
              {rangoFechas(experiencia.fechaInicio, experiencia.fechaFin)}
            </span>
          </span>
        }
        desactivado={!expandible}
        encabezado="h3"
      >
        <div className={styles.items}>
          {tecnologias.length > 0 && (
            <div className={styles.coleccion}>
              <p className={styles.etiqueta}>Tecnologías utilizadas:</p>
              <ul className={styles.tecnologias}>
                {tecnologias.map((tech) => (
                  <li key={tech.id}>{tech.titulo}</li>
                ))}
              </ul>
            </div>
          )}
          {experiencia.hitos?.length ? (
            <div className={styles.coleccion}>
              <p className={styles.etiqueta}>Algunas tareas destacadas:</p>
              <ul>
                {experiencia.hitos.map((hito) => (
                  <li key={hito.id}>{hito.descripcion}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Expandable>
    </div>
  );
};
