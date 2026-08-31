export interface Formacion {
  id: string;
  titulo: string;
  institucion: string;
  descripcion?: string;
  fechaFin: Date;
}

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
