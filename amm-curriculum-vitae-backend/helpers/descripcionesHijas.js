// Utilidades para las colecciones "hijas" que solo guardan un texto y la
// referencia a su padre (Hito → Experiencia, Extra → Formacion).

// La descripción es { es, en }; un string suelto (formato antiguo) es el texto
// en español.
const normalizarDescripcion = (descripcion) =>
  typeof descripcion === 'string'
    ? { es: descripcion.trim(), en: '' }
    : {
        es: String(descripcion?.es ?? '').trim(),
        en: String(descripcion?.en ?? '').trim(),
      };

// Acepta ["texto", ...] (formato antiguo del form) y [{ id?, descripcion }, ...]
// (formato nuevo). Devuelve siempre [{ id, descripcion: { es, en } }] sin las
// que tienen `es` vacío. No se parte por comas: el texto libre puede contenerlas.
const normalizarDescripciones = (items) =>
  []
    .concat(items ?? [])
    .map((item) =>
      typeof item === 'string'
        ? { id: undefined, descripcion: normalizarDescripcion(item) }
        : {
            id: item?.id,
            descripcion: normalizarDescripcion(item?.descripcion),
          },
    )
    .filter(({ descripcion }) => descripcion.es !== '');

// Al crear el padre todos los hijos son nuevos: se descarta cualquier id recibido.
const crearDescripciones = async (Modelo, campoPadre, padreId, items) => {
  const descripciones = normalizarDescripciones(items).map(
    ({ descripcion }) => descripcion,
  );

  if (descripciones.length > 0) {
    await Modelo.insertMany(
      descripciones.map((descripcion) => ({
        descripcion,
        [campoPadre]: padreId,
      })),
    );
  }
};

// Reconciliación por id: se conservan los _id de los que siguen en el form.
// Un id que no pertenezca a este padre (huérfano o de otro) se descarta y el
// hijo se crea nuevo, nunca se reasigna.
const reconciliarDescripciones = async (Modelo, campoPadre, padreId, items) => {
  const normalizados = normalizarDescripciones(items);
  const enBd = await Modelo.find({ [campoPadre]: padreId });
  const idsEnBd = new Set(enBd.map((doc) => String(doc._id)));

  const aActualizar = normalizados.filter(
    (item) => item.id && idsEnBd.has(String(item.id)),
  );
  const aCrear = normalizados.filter(
    (item) => !item.id || !idsEnBd.has(String(item.id)),
  );
  const idsRecibidos = new Set(aActualizar.map((item) => String(item.id)));
  const aBorrar = [...idsEnBd].filter((id) => !idsRecibidos.has(id));

  for (const { id, descripcion } of aActualizar) {
    await Modelo.updateOne({ _id: id }, { descripcion });
  }

  if (aCrear.length > 0) {
    await Modelo.insertMany(
      aCrear.map(({ descripcion }) => ({
        descripcion,
        [campoPadre]: padreId,
      })),
    );
  }

  if (aBorrar.length > 0) {
    await Modelo.deleteMany({ _id: { $in: aBorrar } });
  }
};

module.exports = {
  crearDescripciones,
  reconciliarDescripciones,
};
