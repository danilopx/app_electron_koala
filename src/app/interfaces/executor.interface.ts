import { Especialidade } from './especialidade.interface';

export interface Executor {
  especialidades: Especialidade[];
  executor_ccusto: string;
  executor_email: string;
  executor_filial: string;
  executor_matricula: string;
  executor_nome: string;
  executor_turno: string;
  executor_usuario: string;
}
