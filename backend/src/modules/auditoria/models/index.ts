import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';
import { estadoUsuarioConfig } from './estado_usuario.model';
import { backupSistemaConfig } from './backup_sistema.model';
import { restauracionSistemaConfig } from './restauracion_sistema.model';
import { reporteConfig } from './reporte.model';
import { auditoriaOperativaConfig } from './auditoria_operativa.model';
import { seguridadLogConfig } from './seguridad_log.model';

export const auditoriaTablasPermitidas: Record<string, AuditoriaTablaConfig> = {
  'estado_usuario': estadoUsuarioConfig,
  'backup_sistema': backupSistemaConfig,
  'restauracion_sistema': restauracionSistemaConfig,
  'reporte': reporteConfig,
  'auditoria_operativa': auditoriaOperativaConfig,
  'seguridad_log': seguridadLogConfig
};
