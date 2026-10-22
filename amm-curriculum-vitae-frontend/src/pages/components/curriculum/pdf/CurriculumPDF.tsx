import { ReactNode } from 'react';
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import { anioFecha } from '../../../../helpers/anioFecha';
import {
  enlaceEmail,
  enlaceMaps,
  enlaceTelefono,
} from '../../../../helpers/enlacesContacto';
import {
  metasCurriculum,
  tituloCurriculum,
} from '../../../../helpers/metasCurriculum';
import { rangoFechas } from '../../../../helpers/rangoFechas';
import { tecnologiasFilter } from '../../../../helpers/tecnologiasFilter';
import {
  Conocimiento,
  ConocimientoPrioridad,
} from '../../../../interfaces/conocimiento.interface';
import { Experiencia } from '../../../../interfaces/experiencia.interface';
import { Formacion } from '../../../../interfaces/formacion.interface';
import { FormacionComplementaria } from '../../../../interfaces/formacionComplementaria.interface';
import { Perfil } from '../../../../interfaces/perfil.interface';
import { styles } from './CurriculumPDF.styles';

export interface DatosCurriculumPDF {
  perfil: Perfil | null;
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  conocimiento: Conocimiento[];
}

// La separacion silabica por defecto es inglesa y parte palabras en español
Font.registerHyphenationCallback((palabra) => [palabra]);

const sinProtocolo = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/\/$/, '');

// Sin separación silábica una URL larga no parte y desborda la barra lateral:
// el último tramo de la ruta baja a una segunda línea
const MAX_URL_EN_UNA_LINEA = 26;
const urlEnLineas = (url: string) => {
  const texto = sinProtocolo(url);
  const corte = texto.lastIndexOf('/') + 1;

  return texto.length > MAX_URL_EN_UNA_LINEA && corte > 0
    ? `${texto.slice(0, corte)}
${texto.slice(corte)}`
    : texto;
};

const enlaceExterno = (url: string) =>
  /^https?:\/\//.test(url) ? url : `https://${url}`;

const detalleFormacion = ({
  institucion,
  fechaFin,
}: Formacion | FormacionComplementaria) => {
  const partes = [institucion, fechaFin ? anioFecha(fechaFin) : ''].filter(
    Boolean,
  );

  return partes.length ? ` (${partes.join(' - ')})` : '';
};

const Seccion = ({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) => (
  <View style={styles.seccion}>
    <Text style={styles.tituloSeccion} minPresenceAhead={40}>
      {titulo}
    </Text>
    {children}
  </View>
);

const DatoContacto = ({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) => (
  <View>
    <Text style={styles.etiquetaContacto}>{etiqueta}</Text>
    {children}
  </View>
);

const Contacto = ({ perfil }: { perfil: Perfil }) => {
  const {
    direccion,
    telefono,
    email,
    linkedinURL,
    githubURL,
    disponibilidad,
    idiomas,
  } = perfil;

  return (
    <View style={styles.contacto}>
      {direccion ? (
        <DatoContacto etiqueta="Dirección">
          <Link
            src={enlaceMaps(direccion)}
            style={[styles.valorContacto, styles.enlace]}
          >
            {direccion}
          </Link>
        </DatoContacto>
      ) : null}
      {telefono ? (
        <DatoContacto etiqueta="Teléfono">
          <Link
            src={enlaceTelefono(telefono)}
            style={[styles.valorContacto, styles.enlace]}
          >
            {telefono}
          </Link>
        </DatoContacto>
      ) : null}
      {email ? (
        <DatoContacto etiqueta="Email">
          <Link
            src={enlaceEmail(email)}
            style={[styles.valorContacto, styles.enlace]}
          >
            {email}
          </Link>
        </DatoContacto>
      ) : null}
      {linkedinURL ? (
        <DatoContacto etiqueta="LinkedIn">
          <Link
            src={enlaceExterno(linkedinURL)}
            style={[styles.valorContacto, styles.enlace]}
          >
            {urlEnLineas(linkedinURL)}
          </Link>
        </DatoContacto>
      ) : null}
      {githubURL ? (
        <DatoContacto etiqueta="GitHub">
          <Link
            src={enlaceExterno(githubURL)}
            style={[styles.valorContacto, styles.enlace]}
          >
            {urlEnLineas(githubURL)}
          </Link>
        </DatoContacto>
      ) : null}
      {disponibilidad ? (
        <DatoContacto etiqueta="Disponibilidad">
          <Text style={styles.valorContacto}>{disponibilidad}</Text>
        </DatoContacto>
      ) : null}
      {idiomas?.length ? (
        <DatoContacto etiqueta="Idiomas">
          {idiomas.map(({ idioma, nivel }) => (
            <Text key={idioma} style={styles.valorContacto}>
              {idioma} · {nivel}
            </Text>
          ))}
        </DatoContacto>
      ) : null}
    </View>
  );
};

const Competencias = ({ conocimiento }: { conocimiento: Conocimiento[] }) => {
  if (!conocimiento.length) return null;

  return (
    <View>
      <Text style={styles.tituloLateral} minPresenceAhead={40}>
        Competencias
      </Text>
      {conocimiento
        .filter((c) => c.prioridad !== ConocimientoPrioridad.MUY_BAJA)
        .map(({ id, titulo }) => (
          <View key={id} style={styles.competencia} wrap={false}>
            <Text style={styles.vineta}>•</Text>
            <Text style={styles.competenciaTexto}>{titulo}</Text>
          </View>
        ))}
    </View>
  );
};

const Puesto = ({
  experiencia,
  conocimiento,
}: {
  experiencia: Experiencia;
  conocimiento: Conocimiento[];
}) => {
  const tecnologias = tecnologiasFilter(experiencia.tecnologias, conocimiento);

  return (
    <View style={styles.puesto}>
      <View wrap={false} minPresenceAhead={50}>
        <View style={styles.puestoCabecera}>
          <Text style={styles.empresa}>{experiencia.empresa}</Text>
          <Text style={styles.fechas}>
            {rangoFechas(experiencia.fechaInicio, experiencia.fechaFin)}
          </Text>
        </View>
        {experiencia.descripcion ? (
          <Text style={styles.cargo}>{experiencia.descripcion}</Text>
        ) : null}
        {tecnologias.length > 0 && (
          <Text style={styles.tecnologias}>
            <Text style={styles.etiquetaTecnologias}>Tecnologías: </Text>
            {tecnologias.map((t) => t.titulo).join(', ')}
          </Text>
        )}
      </View>
      {experiencia.hitos?.length ? (
        <View style={styles.hitos}>
          {experiencia.hitos.map((hito) => (
            <View key={hito.id} style={styles.hito} wrap={false}>
              <Text style={styles.vineta}>•</Text>
              <Text style={styles.hitoTexto}>{hito.descripcion}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const Formaciones = ({
  titulo,
  items,
}: {
  titulo: string;
  items: (Formacion | FormacionComplementaria)[];
}) => {
  if (!items.length) return null;

  return (
    <Seccion titulo={titulo}>
      {items.map((item) => (
        <Text key={item.id} style={styles.formacion}>
          <Text style={styles.titulacion}>{item.titulo}</Text>
          <Text style={styles.detalleFormacion}>{detalleFormacion(item)}</Text>
        </Text>
      ))}
    </Seccion>
  );
};

export const CurriculumPDF = ({
  perfil,
  experiencia,
  formaciones,
  formacionesComplementarias,
  conocimiento,
}: DatosCurriculumPDF) => {
  const nombreCompleto = perfil
    ? `${perfil.nombre} ${perfil.apellidos}`.trim()
    : '';

  return (
    <Document
      title={tituloCurriculum(perfil)}
      author={nombreCompleto || undefined}
      subject={metasCurriculum(perfil, '').descripcion || undefined}
      language="es"
      creator="Curriculum Vitae"
      producer="Curriculum Vitae"
    >
      <Page size="A4" style={styles.pagina}>
        <View style={styles.fondoLateral} fixed />
        <View style={styles.fila}>
          <View style={styles.lateral}>
            {perfil?.foto ? (
              <Image src={perfil.foto} style={styles.foto} />
            ) : null}
            {perfil && <Contacto perfil={perfil} />}
            <Competencias conocimiento={conocimiento} />
          </View>
          <View style={styles.principal}>
            {perfil && (
              <View>
                <Text style={styles.nombre}>{nombreCompleto}</Text>
                {perfil.descripcion ? (
                  <Text style={styles.resumen}>{perfil.descripcion}</Text>
                ) : null}
              </View>
            )}
            {experiencia.length > 0 && (
              <Seccion titulo="Experiencia">
                {experiencia.map((item) => (
                  <Puesto
                    key={item.id}
                    experiencia={item}
                    conocimiento={conocimiento}
                  />
                ))}
              </Seccion>
            )}
            <Formaciones titulo="Formación Académica" items={formaciones} />
            <Formaciones
              titulo="Formación Complementaria"
              items={formacionesComplementarias}
            />
          </View>
        </View>
        {perfil && (
          <Text
            style={styles.pie}
            fixed
            render={({ pageNumber, totalPages }) =>
              `${nombreCompleto} · Página ${pageNumber} de ${totalPages}`
            }
          />
        )}
      </Page>
    </Document>
  );
};
