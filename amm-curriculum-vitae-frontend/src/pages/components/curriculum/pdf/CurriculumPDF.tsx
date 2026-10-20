import { ReactNode } from 'react';
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { competenciasClave } from '../../../../helpers/competenciasClave';
import { dateConverter } from '../../../../helpers/dateConverter';
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
import { Conocimiento } from '../../../../interfaces/conocimiento.interface';
import { Experiencia } from '../../../../interfaces/experiencia.interface';
import { Formacion } from '../../../../interfaces/formacion.interface';
import { FormacionComplementaria } from '../../../../interfaces/formacionComplementaria.interface';
import { Perfil } from '../../../../interfaces/perfil.interface';

export interface DatosCurriculumPDF {
  perfil: Perfil | null;
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  conocimiento: Conocimiento[];
}

// El PDF no puede leer el SCSS: mismos valores que _variables.scss
const COLOR_PRIMARIO = '#0024ea';
const COLOR_PRIMARIO_OSCURO = '#3d3db8';
const COLOR_PRIMARIO_SUAVE = '#eef1ff';
const COLOR_TEXTO = '#222222';
const COLOR_TEXTO_SUAVE = '#333333';
const COLOR_SECUNDARIO = '#555555';

// A4 en puntos
const ALTO_PAGINA = 841.89;
const ANCHO_LATERAL = 188;

// La separacion silabica por defecto es inglesa y parte palabras en español
Font.registerHyphenationCallback((palabra) => [palabra]);

const styles = StyleSheet.create({
  pagina: {
    paddingTop: 28,
    paddingBottom: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLOR_TEXTO,
  },
  // Se repite en todas las páginas para que la barra lateral no deje huecos
  fondoLateral: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ANCHO_LATERAL,
    height: ALTO_PAGINA,
    backgroundColor: COLOR_PRIMARIO_SUAVE,
  },
  fila: { flexDirection: 'row' },

  lateral: { width: ANCHO_LATERAL, paddingHorizontal: 18, gap: 16 },
  foto: {
    width: 128,
    height: 128,
    borderRadius: 22,
    objectFit: 'cover',
    alignSelf: 'center',
  },
  contacto: { gap: 7 },
  etiquetaContacto: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLOR_PRIMARIO_OSCURO,
  },
  valorContacto: { fontSize: 8.5, lineHeight: 1.3, color: COLOR_TEXTO_SUAVE },
  enlace: { color: COLOR_TEXTO_SUAVE, textDecoration: 'none' },
  tituloLateral: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: COLOR_PRIMARIO,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_PRIMARIO,
    paddingBottom: 3,
    marginBottom: 6,
  },
  nivel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLOR_PRIMARIO_OSCURO,
    marginTop: 4,
    marginBottom: 3,
  },
  competencia: { flexDirection: 'row', marginBottom: 2 },
  competenciaTexto: { flex: 1, fontSize: 8.5, lineHeight: 1.25 },

  principal: { flex: 1, paddingLeft: 26, paddingRight: 34 },
  nombre: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 23,
    lineHeight: 1.15,
    color: COLOR_TEXTO,
  },
  resumen: {
    fontSize: 10,
    lineHeight: 1.35,
    color: COLOR_SECUNDARIO,
    marginTop: 5,
  },
  seccion: { marginTop: 12 },
  tituloSeccion: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: COLOR_PRIMARIO,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_PRIMARIO,
    paddingBottom: 3,
    marginBottom: 6,
  },

  puesto: { marginBottom: 9 },
  puestoCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  empresa: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12.5,
    color: COLOR_TEXTO,
  },
  fechas: { fontSize: 8.5, color: COLOR_SECUNDARIO },
  cargo: { fontSize: 9.5, color: COLOR_SECUNDARIO, marginTop: 1 },
  tecnologias: { fontSize: 8.5, lineHeight: 1.3, marginTop: 5 },
  etiquetaTecnologias: {
    fontFamily: 'Helvetica-Bold',
    color: COLOR_PRIMARIO_OSCURO,
  },
  hitos: { marginTop: 5 },
  hito: { flexDirection: 'row', marginBottom: 2.5 },
  vineta: { width: 9, color: COLOR_PRIMARIO },
  hitoTexto: { flex: 1, fontSize: 9, lineHeight: 1.3 },

  formacion: { marginBottom: 3, fontSize: 9, lineHeight: 1.3 },
  titulacion: { fontFamily: 'Helvetica-Bold' },
  detalleFormacion: { color: COLOR_SECUNDARIO },

  // Con `top` y sin lineHeight por encima: con `bottom` o lineHeight en la
  // página, react-pdf no pinta este Text fijo con render
  pie: {
    position: 'absolute',
    top: ALTO_PAGINA - 30,
    left: ANCHO_LATERAL + 26,
    right: 34,
    textAlign: 'right',
    fontSize: 7.5,
    color: COLOR_SECUNDARIO,
  },
});

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
  const partes = [
    institucion,
    fechaFin ? dateConverter(new Date(fechaFin)) : '',
  ].filter(Boolean);

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
  const { direccion, telefono, email, linkedinURL, githubURL } = perfil;

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
    </View>
  );
};

const ListaCompetencias = ({
  nivel,
  titulos,
}: {
  nivel: string;
  titulos: string[];
}) => {
  if (!titulos.length) return null;

  return (
    <View>
      <Text style={styles.nivel}>{nivel}</Text>
      {titulos.map((titulo) => (
        <View key={titulo} style={styles.competencia} wrap={false}>
          <Text style={styles.vineta}>•</Text>
          <Text style={styles.competenciaTexto}>{titulo}</Text>
        </View>
      ))}
    </View>
  );
};

const Competencias = ({ conocimiento }: { conocimiento: Conocimiento[] }) => {
  const { avanzado, intermedio } = competenciasClave(conocimiento);
  if (!avanzado.length && !intermedio.length) return null;

  return (
    <View>
      <Text style={styles.tituloLateral} minPresenceAhead={40}>
        Competencias clave
      </Text>
      <ListaCompetencias nivel="Avanzado" titulos={avanzado} />
      <ListaCompetencias nivel="Intermedio" titulos={intermedio} />
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
