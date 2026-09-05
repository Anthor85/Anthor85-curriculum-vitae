import { Expandable } from '../../components/Expandable';
import { dateConverter } from '../../helpers/dateConverter';
import { Conocimiento } from '../../interfaces/conocimiento.interface';
import { Experiencia } from '../../interfaces/experiencia.interface';

import styles from './Curriculum.module.scss';

interface Props {
  experiencia: Experiencia;
  conocimiento: Conocimiento[];
}

export const ExperienciaItem = ({ experiencia, conocimiento }: Props) => {
  const tecnologias = conocimiento.filter((tech) =>
    experiencia.tecnologias.includes(tech.id),
  );

  return (
    <div className={styles.Item}>
      <Expandable cabecera={<h2 className={styles.titulo}>{experiencia.empresa}</h2>}>
        <span className={styles.fechas}>
          {dateConverter(new Date(experiencia.fechaInicio))} -{' '}
          {experiencia.fechaFin
            ? dateConverter(new Date(experiencia.fechaFin))
            : 'En la actualidad'}
        </span>
        <p className={styles.descripcion}>{experiencia.descripcion}</p>
        {tecnologias.length > 0 && (
          <div className={styles.coleccion}>
            <Expandable cabecera={<p className={styles.etiqueta}>Tecnologías:</p>}>
              <ul className={styles.tecnologias}>
                {tecnologias.map((tech) => (
                  <li key={tech.id}>{tech.titulo}</li>
                ))}
              </ul>
            </Expandable>
          </div>
        )}
        {experiencia.hitos?.length ? (
          <div className={styles.coleccion}>
            <Expandable cabecera={<p className={styles.etiqueta}>Hitos:</p>}>
              <ul>
                {experiencia.hitos.map((hito) => (
                  <li key={hito.id}>{hito.descripcion}</li>
                ))}
              </ul>
            </Expandable>
          </div>
        ) : null}
      </Expandable>
    </div>
  );
};
