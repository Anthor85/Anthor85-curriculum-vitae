const ID_DRIVE = [
  /^https?:\/\/drive\.google\.com\/(?:thumbnail|uc|open)\?(?:.*&)?id=([\w-]+)/,
  /^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/,
];

// Los enlaces de Drive redirigen sin cabeceras CORS y html2canvas no puede
// pintarlos: se usa la URL final de la imagen, que sí las trae
export const urlFoto = (url: string) => {
  for (const patron of ID_DRIVE) {
    const id = url.match(patron)?.[1];
    if (id) return `https://lh3.googleusercontent.com/d/${id}=w1000`;
  }

  return url;
};
