export interface Extra {
  id: string;
  descripcion: string;
  formacion: string;
}

export interface ExtraPayload {
  id?: string;
  descripcion: string;
}

export interface Formacion {
  id: string;
  titulo: string;
  institucion: string;
  fechaFin: string;
  extras: Extra[];
}

export interface FormacionPayload extends Omit<Formacion, 'id' | 'extras'> {
  extras: ExtraPayload[];
}
