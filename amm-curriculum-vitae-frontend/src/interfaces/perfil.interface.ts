import { TextoLocalizado } from './idioma.interface';

// Idioma que habla el dueño del CV (no confundir con `Idioma` de la web).
export interface IdiomaPerfil<T = TextoLocalizado> {
  idioma: T;
  nivel: T;
}

export interface Perfil<T = TextoLocalizado> {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: T;
  descripcion: T;
  foto?: string;
  linkedinURL?: string;
  githubURL?: string;
  disponibilidad?: T;
  idiomas?: IdiomaPerfil<T>[];
}

export interface PerfilPayload extends Omit<Perfil, 'id'> {
  foto: string;
  linkedinURL: string;
  githubURL: string;
  disponibilidad: TextoLocalizado;
  idiomas: IdiomaPerfil[];
}
