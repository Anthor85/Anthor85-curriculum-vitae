export interface Bloque {
  top: number;
  bottom: number;
}

// Posiciones de corte entre páginas, de 0 a altoTotal, evitando partir bloques.
// Los bloques más altos que una página no se pueden respetar y se ignoran.
export const calcularCortesPDF = (
  bloques: Bloque[],
  altoTotal: number,
  altoPagina: number,
): number[] => {
  const respetables = bloques.filter((b) => b.bottom - b.top <= altoPagina);
  const partido = (corte: number) =>
    respetables.find((b) => b.top < corte && b.bottom > corte);

  const cortes = [0];
  let inicio = 0;

  while (altoTotal - inicio > altoPagina) {
    const maximo = inicio + altoPagina;
    let corte = maximo;
    let bloque = partido(corte);

    while (bloque) {
      corte = bloque.top;
      bloque = partido(corte);
    }

    if (corte <= inicio) corte = maximo;

    cortes.push(corte);
    inicio = corte;
  }

  cortes.push(altoTotal);
  return cortes;
};
