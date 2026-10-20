import { urlFoto } from './urlFoto';

const aDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(blob);
  });

// Hay servidores que rechazan peticiones con Referer: la foto se descarga sin
// el y se devuelve incrustada. Si falla, null (el PDF se genera sin foto)
export const fotoComoDataURL = async (url: string) => {
  try {
    const respuesta = await fetch(urlFoto(url), {
      referrerPolicy: 'no-referrer',
    });
    if (!respuesta.ok) return null;

    return await aDataURL(await respuesta.blob());
  } catch {
    return null;
  }
};
