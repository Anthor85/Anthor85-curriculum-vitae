export interface Perfil {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  descripcion: string;
  foto?: string;
  linkedinURL?: string;
  githubURL?: string;
}

export interface PerfilPayload extends Omit<Perfil, 'id'> {
  foto: string;
  linkedinURL: string;
  githubURL: string;
}
