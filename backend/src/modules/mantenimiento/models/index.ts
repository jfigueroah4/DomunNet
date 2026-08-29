import { TablaConfig } from '../mantenimiento.types';
import { rolConfig } from './rol.model';
import { usuarioConfig } from './usuario.model';
import { datoUsuarioConfig } from './dato_usuario.model';
import { empresaConfig } from './empresa.model';
import { catalogoConfig } from './catalogo.model';
import { catalogoItemConfig } from './catalogo_item.model';
import { configuracionGeneralConfig } from './configuracion_general.model';
import { departamentoConfig } from './departamento.model';
import { municipioConfig } from './municipio.model';
import { empresaContratanteConfig } from './empresa_contratante.model';
import { contactoContratanteConfig } from './contacto_contratante.model';
import { proyectoConfig } from './proyecto.model';
import { proyectoUsuarioConfig } from './proyecto_usuario.model';
import { proyectoDetalleConfig } from './proyecto_detalle.model';
import { faseProyectoConfig } from './fase_proyecto.model';
import { documentoProyectoConfig } from './documento_proyecto.model';
import { categoriaActividadConfig } from './categoria_actividad.model';
import { especificacionTecnicaConfig } from './especificacion_tecnica.model';
import { tipoEnsayoConfig } from './tipo_ensayo.model';
import { capituloSabanaConfig } from './capitulo_sabana.model';
import { unidadMedidaConfig } from './unidad_medida.model';
import { renglonTrabajoConfig } from './renglon_trabajo.model';
import { modificativoRenglonConfig } from './modificativo_renglon.model';
import { bitacoraEntradaConfig } from './bitacora_entrada.model';
import { ensayoLaboratorioConfig } from './ensayo_laboratorio.model';
import { condicionClimaticaConfig } from './condicion_climatica.model';
import { estacionKilometricaConfig } from './estacion_kilometrica.model';
import { bitacoraAvanceConfig } from './bitacora_avance.model';
import { cronogramaPlanificadoConfig } from './cronograma_planificado.model';
import { catalogoDescuentoTecnicoConfig } from './catalogo_descuento_tecnico.model';
import { bitacoraPendienteConfig } from './bitacora_pendiente.model';
import { bitacoraPendienteAjusteConfig } from './bitacora_pendiente_ajuste.model';
import { parametroProyectoConfig } from './parametro_proyecto.model';
import { controlAnticipoConfig } from './control_anticipo.model';
import { controlPlazoConfig } from './control_plazo.model';
import { suspensionPlazoConfig } from './suspension_plazo.model';
import { incidenteObraConfig } from './incidente_obra.model';
import { incidenteEvidenciaConfig } from './incidente_evidencia.model';
import { evidenciaFotograficaConfig } from './evidencia_fotografica.model';

export const tablasPermitidas: Record<string, TablaConfig> = {
  'rol': rolConfig,
  'usuario': usuarioConfig,
  'dato_usuario': datoUsuarioConfig,
  'empresa': empresaConfig,
  'catalogo': catalogoConfig,
  'catalogo_item': catalogoItemConfig,
  'configuracion_general': configuracionGeneralConfig,
  'departamento': departamentoConfig,
  'municipio': municipioConfig,
  'empresa_contratante': empresaContratanteConfig,
  'contacto_contratante': contactoContratanteConfig,
  'proyecto': proyectoConfig,
  'proyecto_usuario': proyectoUsuarioConfig,
  'proyecto_detalle': proyectoDetalleConfig,
  'fase_proyecto': faseProyectoConfig,
  'documento_proyecto': documentoProyectoConfig,
  'categoria_actividad': categoriaActividadConfig,
  'especificacion_tecnica': especificacionTecnicaConfig,
  'tipo_ensayo': tipoEnsayoConfig,
  'capitulo_sabana': capituloSabanaConfig,
  'unidad_medida': unidadMedidaConfig,
  'renglon_trabajo': renglonTrabajoConfig,
  'modificativo_renglon': modificativoRenglonConfig,
  'bitacora_entrada': bitacoraEntradaConfig,
  'ensayo_laboratorio': ensayoLaboratorioConfig,
  'condicion_climatica': condicionClimaticaConfig,
  'estacion_kilometrica': estacionKilometricaConfig,
  'bitacora_avance': bitacoraAvanceConfig,
  'cronograma_planificado': cronogramaPlanificadoConfig,
  'catalogo_descuento_tecnico': catalogoDescuentoTecnicoConfig,
  'bitacora_pendiente': bitacoraPendienteConfig,
  'bitacora_pendiente_ajuste': bitacoraPendienteAjusteConfig,
  'parametro_proyecto': parametroProyectoConfig,
  'control_anticipo': controlAnticipoConfig,
  'control_plazo': controlPlazoConfig,
  'suspension_plazo': suspensionPlazoConfig,
  'incidente_obra': incidenteObraConfig,
  'incidente_evidencia': incidenteEvidenciaConfig,
  'evidencia_fotografica': evidenciaFotograficaConfig
};
