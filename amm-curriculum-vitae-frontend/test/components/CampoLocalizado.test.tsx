import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { errorAxios } from '../utils';
import type { TextoLocalizado } from '../../src/interfaces/idioma.interface';

const apiMock = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('../../src/api/api', () => ({ default: apiMock, api: apiMock }));

import { CampoLocalizado } from '../../src/components/CampoLocalizado';

// Envoltorio con estado: el campo es controlado
const Campo = ({
  inicial,
  multilinea,
}: {
  inicial: TextoLocalizado;
  multilinea?: boolean;
}) => {
  const [valor, setValor] = useState(inicial);
  return (
    <CampoLocalizado
      id="titulo"
      etiqueta="Título"
      valor={valor}
      onChange={setValor}
      multilinea={multilinea}
      required
    />
  );
};

const renderCampo = (inicial: TextoLocalizado, multilinea?: boolean) =>
  render(<Campo inicial={inicial} multilinea={multilinea} />);

const sugerir = () => screen.getByRole('button', { name: 'Sugerir EN' });

const pulsarSugerir = async () => {
  await act(async () => {
    fireEvent.click(sugerir());
  });
};

describe('<CampoLocalizado />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('pinta un input por idioma con sus ids y solo ES es obligatorio', () => {
    renderCampo({ es: '', en: '' });

    const es = screen.getByLabelText('Título (ES)');
    const en = screen.getByLabelText('Título (EN)');
    expect(es).toHaveAttribute('id', 'titulo-es');
    expect(en).toHaveAttribute('id', 'titulo-en');
    expect(es).toBeRequired();
    expect(en).not.toBeRequired();
  });

  test('con multilinea usa textarea', () => {
    renderCampo({ es: '', en: '' }, true);

    expect(screen.getByLabelText('Título (ES)').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Título (EN)').tagName).toBe('TEXTAREA');
  });

  test('«Sugerir EN» está deshabilitado con ES vacío o en blanco', () => {
    renderCampo({ es: '', en: '' });
    expect(sugerir()).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Título (ES)'), {
      target: { value: '   ' },
    });
    expect(sugerir()).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Título (ES)'), {
      target: { value: 'Grado' },
    });
    expect(sugerir()).toBeEnabled();
  });

  test('rellena EN con la respuesta de /traduccion y sobrescribe lo que había', async () => {
    apiMock.post.mockResolvedValue({ data: { textos: ['BSc'] } });
    renderCampo({ es: ' Grado ', en: 'Antiguo' });

    await pulsarSugerir();

    expect(apiMock.post).toHaveBeenCalledWith('/traduccion', {
      textos: ['Grado'],
    });
    expect(screen.getByLabelText('Título (EN)')).toHaveValue('BSc');
    expect(screen.getByLabelText('Título (ES)')).toHaveValue(' Grado ');
  });

  test('mientras traduce dice «Traduciendo…» y se deshabilita', async () => {
    let resolver!: (valor: unknown) => void;
    apiMock.post.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );
    renderCampo({ es: 'Grado', en: '' });

    fireEvent.click(sugerir());

    expect(screen.getByRole('button', { name: 'Traduciendo…' })).toBeDisabled();

    await act(async () => {
      resolver({ data: { textos: ['BSc'] } });
    });
    expect(sugerir()).toBeEnabled();
  });

  test.each([
    [429, 'Cuota de traducción agotada'],
    [503, 'Traducción no disponible'],
    [500, 'No se pudo traducir'],
  ])(
    'si /traduccion responde %i muestra «%s» y no toca EN',
    async (status, mensaje) => {
      apiMock.post.mockRejectedValue(errorAxios(status));
      renderCampo({ es: 'Grado', en: 'Previo' });

      await pulsarSugerir();

      expect(screen.getByRole('alert')).toHaveTextContent(mensaje);
      expect(screen.getByLabelText('Título (EN)')).toHaveValue('Previo');
    },
  );

  test('un error de red sin respuesta muestra el mensaje genérico', async () => {
    apiMock.post.mockRejectedValue(new Error('Network Error'));
    renderCampo({ es: 'Grado', en: '' });

    await pulsarSugerir();

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo traducir');
  });
});
