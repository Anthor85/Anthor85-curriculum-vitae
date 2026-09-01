import { useState } from 'react';
import type { MensajeAccion } from '../interfaces/mensajeAccion.interface';

export const useMensajeAccion = () => {
  const [mensaje, setMensaje] = useState<MensajeAccion | null>(null);

  const mostrarMensaje = (texto: string) =>
    setMensaje((anterior) => ({ texto, id: (anterior?.id ?? 0) + 1 }));

  return { mensaje, mostrarMensaje };
};
