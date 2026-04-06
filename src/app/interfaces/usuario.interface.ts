import { FilialDoUsuario } from './filial-usuario.interface';

export interface UsuarioDaApi {
  filiais?: FilialDoUsuario[];
  usuario_bloqueado?: string;
  usuario_codigo?: string;
  usuario_login?: string;
  usuario_nome?: string;
}
