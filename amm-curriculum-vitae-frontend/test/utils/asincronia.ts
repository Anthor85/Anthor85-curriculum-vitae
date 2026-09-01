import { act } from '@testing-library/react';

// Vacia la cola de microtareas dentro de act() para que se apliquen los
// cambios de estado que cuelgan de las promesas del mock de api.
export const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

// MensajeAccion escribe el texto letra a letra en 1s: avanzamos los timers
// para poder assertar el mensaje completo.
export const avanzarMensaje = async () => {
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
};

export const textoMensaje = () =>
  document.querySelector('[aria-live="polite"]')?.textContent ?? '';
