import {
  metasCurriculum,
  tituloCurriculum,
} from '../../src/helpers/metasCurriculum';

const SITE_URL = 'https://cv.ejemplo.com';

const PERFIL = {
  nombre: 'Ada',
  apellidos: 'Lovelace',
  descripcion: 'Desarrolladora de software',
};

describe('tituloCurriculum', () => {
  test('con nombre y apellidos compone el titulo completo', () => {
    expect(tituloCurriculum(PERFIL)).toBe('Ada Lovelace | Curriculum Vitae');
  });

  test('sin perfil devuelve el titulo por defecto', () => {
    expect(tituloCurriculum(null)).toBe('Curriculum Vitae');
    expect(tituloCurriculum(undefined)).toBe('Curriculum Vitae');
  });

  test('ignora las partes vacias o en blanco', () => {
    expect(tituloCurriculum({ nombre: 'Ada', apellidos: '  ' })).toBe(
      'Ada | Curriculum Vitae',
    );
    expect(tituloCurriculum({ nombre: '', apellidos: '' })).toBe(
      'Curriculum Vitae',
    );
  });
});

describe('metasCurriculum', () => {
  test('sin foto usa la tarjeta por defecto y deja el favicon SVG', () => {
    expect(metasCurriculum(PERFIL, SITE_URL)).toEqual({
      titulo: 'Ada Lovelace | Curriculum Vitae',
      descripcion: 'Desarrolladora de software',
      url: 'https://cv.ejemplo.com/',
      imagen: 'https://cv.ejemplo.com/og-image.png',
      tarjeta: 'summary_large_image',
      favicon: null,
    });
  });

  test('con foto la usa como imagen y favicon, con tarjeta summary', () => {
    const foto = 'https://fotos.ejemplo.com/ada.jpg';
    const metas = metasCurriculum({ ...PERFIL, foto }, SITE_URL);

    expect(metas.imagen).toBe(foto);
    expect(metas.favicon).toBe(foto);
    expect(metas.tarjeta).toBe('summary');
  });

  test('una foto vacia se trata como sin foto', () => {
    const metas = metasCurriculum({ ...PERFIL, foto: '' }, SITE_URL);

    expect(metas.imagen).toBe('https://cv.ejemplo.com/og-image.png');
    expect(metas.favicon).toBeNull();
    expect(metas.tarjeta).toBe('summary_large_image');
  });

  test('colapsa los espacios y saltos de linea de la descripcion', () => {
    const metas = metasCurriculum(
      { ...PERFIL, descripcion: '  Desarrolladora \n\n de   software\t' },
      SITE_URL,
    );

    expect(metas.descripcion).toBe('Desarrolladora de software');
  });

  test('recorta la descripcion a 160 caracteres', () => {
    const metas = metasCurriculum(
      { ...PERFIL, descripcion: 'a'.repeat(200) },
      SITE_URL,
    );

    expect(metas.descripcion).toBe('a'.repeat(160));
  });

  test('el recorte no deja un espacio al final', () => {
    const descripcion = `${'a'.repeat(159)} ${'b'.repeat(40)}`;
    const metas = metasCurriculum({ ...PERFIL, descripcion }, SITE_URL);

    expect(metas.descripcion).toBe('a'.repeat(159));
  });

  test('sin perfil devuelve titulo por defecto y descripcion vacia', () => {
    expect(metasCurriculum(null, SITE_URL)).toEqual({
      titulo: 'Curriculum Vitae',
      descripcion: '',
      url: 'https://cv.ejemplo.com/',
      imagen: 'https://cv.ejemplo.com/og-image.png',
      tarjeta: 'summary_large_image',
      favicon: null,
    });
  });
});
