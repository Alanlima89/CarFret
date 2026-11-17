export interface AnonymousUser {
  email: string;
  displayName: string;
  uid: string;
  photoURL?: string | null;
}

export const STORAGE_GOOGLE_TOKEN_KEY = 'cargafret_google_access_token';
export const STORAGE_GOOGLE_USER_KEY = 'cargafret_google_user_email';
export const STORAGE_GOOGLE_USER_NAME_KEY = 'cargafret_google_user_name';
export const STORAGE_GOOGLE_CONNECTED_KEY = 'cargafret_is_sheets_connected';

export const DEFAULT_OPERATOR_USER: AnonymousUser = {
  email: 'operador@cargafret.log.br',
  displayName: 'Operador CargaFret',
  uid: 'operador-publico-equipe',
};

/**
 * Inicializador neutro sem qualquer exigência de login ou popup OAuth.
 * Permite que a aplicação funcione em modo equipe público diretamente.
 */
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  _onAuthFailure?: () => void
) => {
  if (onAuthSuccess) {
    onAuthSuccess(DEFAULT_OPERATOR_USER, '');
  }
  return () => {};
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string }> => {
  return { user: DEFAULT_OPERATOR_USER, accessToken: '' };
};

export const getAccessToken = async (): Promise<string | null> => {
  return null;
};

export const setCachedAccessToken = (_token: string | null) => {};

export const googleSignOut = async (): Promise<void> => {};
