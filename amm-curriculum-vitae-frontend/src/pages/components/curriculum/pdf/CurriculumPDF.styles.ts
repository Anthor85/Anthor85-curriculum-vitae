import { StyleSheet } from '@react-pdf/renderer';
import colores from './CurriculumPDF.module.scss';

const {
  colorPrimario: COLOR_PRIMARIO,
  colorPrimarioOscuro: COLOR_PRIMARIO_OSCURO,
  colorPrimarioSuave: COLOR_PRIMARIO_SUAVE,
  colorTexto: COLOR_TEXTO,
  colorTextoSuave: COLOR_TEXTO_SUAVE,
  colorSecundario: COLOR_SECUNDARIO,
} = colores;

// A4 en puntos
const ALTO_PAGINA = 841.89;
const ANCHO_LATERAL = 188;

export const styles = StyleSheet.create({
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
    marginBottom: 4,
  },

  puesto: { marginBottom: 3 },
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
  hitos: { marginTop: 5, gap: 2.5 },
  hito: { flexDirection: 'row' },
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
