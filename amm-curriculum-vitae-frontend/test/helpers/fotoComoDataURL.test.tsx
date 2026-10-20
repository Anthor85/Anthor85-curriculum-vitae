import { fotoComoDataURL } from '../../src/helpers/fotoComoDataURL';

const URL_FOTO = 'https://fotos.example.com/foto.jpg';

describe('fotoComoDataURL', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('descarga sin Referer y devuelve una data URL', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(['foto'], { type: 'image/jpeg' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await fotoComoDataURL(URL_FOTO);

    expect(fetchMock).toHaveBeenCalledWith(URL_FOTO, {
      referrerPolicy: 'no-referrer',
    });
    expect(resultado).toMatch(/^data:image\/jpeg;base64,/);
  });

  test('transforma los enlaces de Drive con urlFoto', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(['foto'], { type: 'image/jpeg' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await fotoComoDataURL('https://drive.google.com/file/d/abc123/view');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://lh3.googleusercontent.com/d/abc123=w1000',
      { referrerPolicy: 'no-referrer' },
    );
  });

  test('devuelve null si la respuesta no es correcta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    );

    expect(await fotoComoDataURL(URL_FOTO)).toBeNull();
  });

  test('devuelve null si la descarga falla', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    expect(await fotoComoDataURL(URL_FOTO)).toBeNull();
  });
});
