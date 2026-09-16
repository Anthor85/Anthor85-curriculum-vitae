import { useCallback, useState } from 'react';
import type { MensajeAccion } from '../interfaces/mensajeAccion.interface';

const MENSAJE_ERROR = 'Ha ocurrido un error inesperado';

export const useMensajeAccion = () => {
  const [mensaje, setMensaje] = useState<MensajeAccion | null>(null);

  const mostrarMensaje = useCallback(
    (texto: string) =>
      setMensaje((anterior) => ({ texto, id: (anterior?.id ?? 0) + 1 })),
    [],
  );

  const mostrarError = useCallback(
    () => mostrarMensaje(MENSAJE_ERROR),
    [mostrarMensaje],
  );

  return { mensaje, mostrarMensaje, mostrarError };
};
