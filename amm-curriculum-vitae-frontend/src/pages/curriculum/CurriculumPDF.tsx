import { ReactNode } from 'react';
import { dateConverter } from '../../helpers/dateConverter';
import { getIcons } from '../../helpers/getIcons';
import { Conocimiento } from '../../interfaces/conocimiento.interface';
import { Experiencia } from '../../interfaces/experiencia.interface';
import { Formacion } from '../../interfaces/formacion.interface';
import { FormacionComplementaria } from '../../interfaces/formacionComplementaria.interface';
import { Perfil } from '../../interfaces/perfil.interface';
import { ExperienciaItem } from './ExperienciaItem';
import { FormacionItem } from './FormacionItem';

import styles from './CurriculumPDF.module.scss';

interface Props {
  perfil: Perfil | null;
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  conocimiento: Conocimiento[];
}

interface SeccionProps {
  titulo: string;
  vacia: boolean;
  plana?: boolean;
  children: ReactNode;
}

const Seccion = ({ titulo, vacia, plana, children }: SeccionProps) => {
  if (vacia) return null;

  const clases = plana
    ? `${styles.seccion} ${styles.seccionPlana}`
    : styles.seccion;

  return (
    <div className={clases}>
      <h2 className={styles.tituloSeccion}>{titulo}</h2>
      {children}
    </div>
  );
};

const detalleComplementaria = ({
  institucion,
  fechaFin,
}: FormacionComplementaria) => {
  const partes = [
    institucion,
    fechaFin ? dateConverter(new Date(fechaFin)) : '',
  ].filter(Boolean);

  return partes.length ? ` (${partes.join(' - ')})` : '';
};

export const CurriculumPDF = ({
  perfil,
  experiencia,
  formaciones,
  formacionesComplementarias,
  conocimiento,
}: Props) => {
  return (
    <div className={styles.CurriculumPDF}>
      <div className={styles.izquierda}>
        <img
          className={styles.photo}
          src={perfil?.foto || '/references/foto.jpg'}
          alt="Profile"
        />
        {perfil && (
          <div className={styles.contacto}>
            <div className={styles.contacto__linea}>
              <img src={getIcons('chincheta')} alt="" width={16} />
              <span>{perfil.direccion}</span>
            </div>
            <div className={styles.contacto__linea}>
              <img src={getIcons('telefono')} alt="" width={16} />
              <span>{perfil.telefono}</span>
            </div>
            <div className={styles.contacto__linea}>
              <img src={getIcons('sobre')} alt="" width={16} />
              <span>{perfil.email}</span>
            </div>
          </div>
        )}
        <Seccion titulo="Conocimientos" vacia={!conocimiento.length}>
          <div className={`${styles.lineas} ${styles['lineas--sangrada']}`}>
            {conocimiento.map((item) => (
              <p key={item.id} className={styles.linea}>
                <strong>{item.titulo}</strong>
                {item.nivel ? ` (${item.nivel})` : ''}
              </p>
            ))}
          </div>
        </Seccion>
      </div>

      <div className={styles.derecha}>
        {perfil && (
          <>
            <div className={styles.name}>
              {perfil.nombre} {perfil.apellidos}
            </div>
            <span className={styles.role}>{perfil.descripcion}</span>
          </>
        )}
        <Seccion titulo="Experiencia" vacia={!experiencia.length} plana>
          {experiencia.map((item) => (
            <ExperienciaItem
              key={item.id}
              experiencia={item}
              conocimiento={conocimiento}
            />
          ))}
        </Seccion>
        <Seccion titulo="Formación Académica" vacia={!formaciones.length} plana>
          {formaciones.map((item) => (
            <FormacionItem key={item.id} formacion={item} />
          ))}
        </Seccion>
        <Seccion
          titulo="Formación Complementaria"
          vacia={!formacionesComplementarias.length}
        >
          <div className={styles.lineas}>
            {formacionesComplementarias.map((item) => (
              <p key={item.id} className={styles.linea}>
                <strong>{item.titulo}</strong>
                {detalleComplementaria(item)}
              </p>
            ))}
          </div>
        </Seccion>
      </div>
    </div>
  );
};
