export interface Formacion {
  id: string;
  titulo: string;
  institucion: string;
  descripcion?: string;
  fechaFin: string;
}

export type FormacionPayload = Omit<Formacion, 'id'>;
