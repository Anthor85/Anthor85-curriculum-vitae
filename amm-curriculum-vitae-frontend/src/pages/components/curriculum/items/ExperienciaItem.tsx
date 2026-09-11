import { Expandable } from '../../../../components/Expandable';
import { dateConverter } from '../../../../helpers/dateConverter';
import { rangoFechas } from '../../../../helpers/rangoFechas';
import { tecnologiasFilter } from '../../../../helpers/tecnologiasFilter';
import { Conocimiento } from '../../../../interfaces/conocimiento.interface';
import { Experiencia } from '../../../../interfaces/experiencia.interface';

import styles from './Items.module.scss';

interface Props {
  experiencia: Experiencia;
  conocimiento: Conocimiento[];
  expandible?: boolean;
  enPDF?: boolean;
}

export const ExperienciaItem = ({
  experiencia,
  conocimiento,
  expandible = true,
  enPDF = false,
}: Props) => {
  const tecnologias = tecnologiasFilter(experiencia.tecnologias, conocimiento);

  const clases = [
    styles.Item,
    expandible && styles.expandable,
    enPDF && styles.pdf,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clases}>
      <Expandable
        cabecera={<h2 className={styles.titulo}>{experiencia.empresa}</h2>}
        desactivado={!expandible}
      >
        <div className={styles.items}>
          <span className={styles.fechas}>
            {rangoFechas(experiencia.fechaInicio, experiencia.fechaFin)}
          </span>
          <p className={styles.descripcion}>{experiencia.descripcion}</p>
          {tecnologias.length > 0 && (
            <div className={styles.coleccion}>
              <p className={styles.etiqueta} data-pdf-con-siguiente>
                Tecnologías utilizadas:
              </p>
              <ul className={styles.tecnologias}>
                {tecnologias.map((tech) => (
                  <li key={tech.id}>{tech.titulo}</li>
                ))}
              </ul>
            </div>
          )}
          {experiencia.hitos?.length ? (
            <div className={styles.coleccion}>
              <p className={styles.etiqueta} data-pdf-con-siguiente>
                Algunos Hitos:
              </p>
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
