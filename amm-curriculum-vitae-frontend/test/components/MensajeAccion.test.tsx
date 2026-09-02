import { act, render } from '@testing-library/react';

import { avanzarMensaje, textoMensaje } from '../utils';
import type { MensajeAccion as IMensajeAccion } from '../../src/interfaces/mensajeAccion.interface';
import { MensajeAccion } from '../../src/components/MensajeAccion';

const MENSAJE: IMensajeAccion = { id: 1, texto: 'Conocimiento creado' };
const MENSAJE_NUEVO: IMensajeAccion = { id: 2, texto: 'Conocimiento borrado' };

// El componente escribe el texto en DURACION_ENTRADA (1000 ms), espera
// DURACION_ESPERA (3000 ms) y lo borra en DURACION_SALIDA (1000 ms).
const MITAD_ENTRADA = 500;
const ESPERA_MAS_SALIDA = 4000;

const avanzar = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('<MensajeAccion />', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no pinta texto cuando mensaje es null', () => {
    render(<MensajeAccion mensaje={null} />);

    expect(textoMensaje()).toBe('');
  });

  it('pinta solo un prefijo del texto a mitad de la entrada', async () => {
    render(<MensajeAccion mensaje={MENSAJE} />);

    await avanzar(MITAD_ENTRADA);

    const visible = textoMensaje();
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(MENSAJE.texto.length);
    expect(MENSAJE.texto.startsWith(visible)).toBe(true);
  });

  it('pinta el texto completo al terminar la entrada', async () => {
    render(<MensajeAccion mensaje={MENSAJE} />);

    await avanzarMensaje();

    expect(textoMensaje()).toBe(MENSAJE.texto);
  });

  it('borra el texto tras la espera y la salida', async () => {
    render(<MensajeAccion mensaje={MENSAJE} />);

    await avanzarMensaje();
    expect(textoMensaje()).toBe(MENSAJE.texto);

    await avanzar(ESPERA_MAS_SALIDA);

    expect(textoMensaje()).toBe('');
  });

  it('reinicia la animacion cuando cambia la prop mensaje a mitad de escritura', async () => {
    const { rerender } = render(<MensajeAccion mensaje={MENSAJE} />);

    await avanzar(MITAD_ENTRADA);
    rerender(<MensajeAccion mensaje={MENSAJE_NUEVO} />);

    await avanzarMensaje();

    expect(textoMensaje()).toBe(MENSAJE_NUEVO.texto);
  });

  it('no actualiza el estado despues de desmontarse a mitad de la animacion', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<MensajeAccion mensaje={MENSAJE} />);

    await avanzar(MITAD_ENTRADA);
    unmount();
    await avanzar(ESPERA_MAS_SALIDA);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
