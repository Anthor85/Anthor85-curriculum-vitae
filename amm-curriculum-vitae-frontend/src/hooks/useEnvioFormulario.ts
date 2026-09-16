import { useState } from 'react';

// Centraliza el `preventDefault` y el estado `isPending` de los envíos de formulario.
export const useEnvioFormulario = (
  accion: () => Promise<unknown> | unknown,
) => {
  const [isPending, setIsPending] = useState<boolean>(false);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsPending(true);
    try {
      await accion();
    } finally {
      setIsPending(false);
    }
  };

  return { isPending, enviar };
};
