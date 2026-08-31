export interface Formacion {
  id: string;
  titulo: string;
  institucion: string;
  descripcion?: string;
  fechaFin: string;
}

export interface FormacionPayload extends Omit<Formacion, 'id'> {}

export interface FormacionState {
  formacion: Formacion[];
  loading: boolean;
  error: string | null;
}

export interface FormacionAction {
  type: string;
  payload: any;
}

export type FormacionDispatch = (action: FormacionAction) => void;
