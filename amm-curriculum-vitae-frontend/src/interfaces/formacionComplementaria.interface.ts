export interface FormacionComplementaria {
  id: string;
  titulo: string;
  institucion: string;
  fechaFin?: string;
}

export type FormacionComplementariaPayload = Omit<
  FormacionComplementaria,
  'id'
>;
