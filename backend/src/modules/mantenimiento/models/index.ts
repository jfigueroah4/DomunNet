import { TablaConfig } from '../mantenimiento.types';
import { auditoriaOperativaConfig } from './auditoria_operativa.model';
import { backupSistemaConfig } from './backup_sistema.model';
import { bitacoraAvanceConfig } from './bitacora_avance.model';
import { bitacoraEntradaConfig } from './bitacora_entrada.model';
import { bitacoraPendienteConfig } from './bitacora_pendiente.model';
import { bitacoraPendienteAjusteConfig } from './bitacora_pendiente_ajuste.model';
import { capituloSabanaConfig } from './capitulo_sabana.model';
import { catalogoConfig } from './catalogo.model';
import { catalogoDescuentoTecnicoConfig } from './catalogo_descuento_tecnico.model';
import { catalogoItemConfig } from './catalogo_item.model';
import { categoriaActividadConfig } from './categoria_actividad.model';
import { condicionClimaticaConfig } from './condicion_climatica.model';
import { configuracionGeneralConfig } from './configuracion_general.model';
import { contactoContratistaConfig } from './contacto_contratista.model';
import { contactoEmpresaExternaConfig } from './contacto_empresa_externa.model';
import { contactoEntidadConfig } from './contacto_entidad.model';
import { controlAnticipoConfig } from './control_anticipo.model';
import { controlPlazoConfig } from './control_plazo.model';
import { cronogramaPlanificadoConfig } from './cronograma_planificado.model';
import { datoUsuarioConfig } from './dato_usuario.model';
import { departamentoConfig } from './departamento.model';
import { documentoProyectoConfig } from './documento_proyecto.model';
import { empresaConfig } from './empresa.model';
import { empresaContratistaConfig } from './empresa_contratista.model';
import { empresaExternaConfig } from './empresa_externa.model';
import { ensayoLaboratorioConfig } from './ensayo_laboratorio.model';
import { entidadContratanteConfig } from './entidad_contratante.model';
import { especificacionTecnicaConfig } from './especificacion_tecnica.model';
import { estacionKilometricaConfig } from './estacion_kilometrica.model';
import { estadoUsuarioConfig } from './estado_usuario.model';
import { evidenciaFotograficaConfig } from './evidencia_fotografica.model';
import { faseProyectoConfig } from './fase_proyecto.model';
import { incidenteEvidenciaConfig } from './incidente_evidencia.model';
import { incidenteObraConfig } from './incidente_obra.model';
import { modificativoRenglonConfig } from './modificativo_renglon.model';
import { municipioConfig } from './municipio.model';
import { parametroProyectoConfig } from './parametro_proyecto.model';
import { proyectoConfig } from './proyecto.model';
import { proyectoDetalleConfig } from './proyecto_detalle.model';
import { proyectoUsuarioConfig } from './proyecto_usuario.model';
import { renglonTrabajoConfig } from './renglon_trabajo.model';
import { renglonTrabajoCatalogoConfig } from './renglon_trabajo_catalogo.model';
import { renglonTrabajoPlantillaConfig } from './renglon_trabajo_plantilla.model';
import { reporteConfig } from './reporte.model';
import { restauracionSistemaConfig } from './restauracion_sistema.model';
import { rolConfig } from './rol.model';
import { seguridadLogConfig } from './seguridad_log.model';
import { suspensionPlazoConfig } from './suspension_plazo.model';
import { ticketMensajeConfig } from './ticket_mensaje.model';
import { ticketSoporteConfig } from './ticket_soporte.model';
import { tipoEnsayoConfig } from './tipo_ensayo.model';
import { unidadMedidaConfig } from './unidad_medida.model';
import { usuarioConfig } from './usuario.model';

export const tablasPermitidas: Record<string, TablaConfig> = {
  'auditoria_operativa': auditoriaOperativaConfig,
  'backup_sistema': backupSistemaConfig,
  'bitacora_avance': bitacoraAvanceConfig,
  'bitacora_entrada': bitacoraEntradaConfig,
  'bitacora_pendiente': bitacoraPendienteConfig,
  'bitacora_pendiente_ajuste': bitacoraPendienteAjusteConfig,
  'capitulo_sabana': capituloSabanaConfig,
  'catalogo': catalogoConfig,
  'catalogo_descuento_tecnico': catalogoDescuentoTecnicoConfig,
  'catalogo_item': catalogoItemConfig,
  'categoria_actividad': categoriaActividadConfig,
  'condicion_climatica': condicionClimaticaConfig,
  'configuracion_general': configuracionGeneralConfig,
  'contacto_contratista': contactoContratistaConfig,
  'contacto_empresa_externa': contactoEmpresaExternaConfig,
  'contacto_entidad': contactoEntidadConfig,
  'control_anticipo': controlAnticipoConfig,
  'control_plazo': controlPlazoConfig,
  'cronograma_planificado': cronogramaPlanificadoConfig,
  'dato_usuario': datoUsuarioConfig,
  'departamento': departamentoConfig,
  'documento_proyecto': documentoProyectoConfig,
  'empresa': empresaConfig,
  'empresa_contratista': empresaContratistaConfig,
  'empresa_externa': empresaExternaConfig,
  'ensayo_laboratorio': ensayoLaboratorioConfig,
  'entidad_contratante': entidadContratanteConfig,
  'especificacion_tecnica': especificacionTecnicaConfig,
  'estacion_kilometrica': estacionKilometricaConfig,
  'estado_usuario': estadoUsuarioConfig,
  'evidencia_fotografica': evidenciaFotograficaConfig,
  'fase_proyecto': faseProyectoConfig,
  'incidente_evidencia': incidenteEvidenciaConfig,
  'incidente_obra': incidenteObraConfig,
  'modificativo_renglon': modificativoRenglonConfig,
  'municipio': municipioConfig,
  'parametro_proyecto': parametroProyectoConfig,
  'proyecto': proyectoConfig,
  'proyecto_detalle': proyectoDetalleConfig,
  'proyecto_usuario': proyectoUsuarioConfig,
  'renglon_trabajo': renglonTrabajoConfig,
  'renglon_trabajo_catalogo': renglonTrabajoCatalogoConfig,
  'renglon_trabajo_plantilla': renglonTrabajoPlantillaConfig,
  'reporte': reporteConfig,
  'restauracion_sistema': restauracionSistemaConfig,
  'rol': rolConfig,
  'seguridad_log': seguridadLogConfig,
  'suspension_plazo': suspensionPlazoConfig,
  'ticket_mensaje': ticketMensajeConfig,
  'ticket_soporte': ticketSoporteConfig,
  'tipo_ensayo': tipoEnsayoConfig,
  'unidad_medida': unidadMedidaConfig,
  'usuario': usuarioConfig,
};
