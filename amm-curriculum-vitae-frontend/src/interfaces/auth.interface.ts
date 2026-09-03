export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
}

export interface AuthState {
  status: 'checking' | 'authenticated' | 'not-authenticated';
  user: Usuario | null;
  errorMessage: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse extends Usuario {
  token: string;
}
