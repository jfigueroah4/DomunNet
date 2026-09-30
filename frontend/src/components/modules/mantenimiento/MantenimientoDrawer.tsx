'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, CheckCircle2, AlertCircle, Eye, Edit3, PlusCircle } from 'lucide-react'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'

export interface FieldSchema {
  readOnly?: boolean
  name: string
  label: string
  type: 'text' | 'integer' | 'decimal' | 'email' | 'boolean' | 'select' | 'textarea' | 'date' | 'time'
  required?: boolean
  endpoint?: string
  labelKey?: string
  valueKey?: string
  refTable?: string
}

export const TABLES_SCHEMA: Record<string, FieldSchema[]> = {
  "auditoria_operativa": [
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "accion",
      "label": "Accion",
      "type": "text",
      "required": true
    },
    {
      "name": "modulo",
      "label": "Modulo",
      "type": "text",
      "required": false
    },
    {
      "name": "tabla_afectada",
      "label": "Tabla Afectada",
      "type": "text",
      "required": false
    },
    {
      "name": "registro_afectado",
      "label": "Registro Afectado",
      "type": "text",
      "required": false
    },
    {
      "name": "detalles",
      "label": "Detalles",
      "type": "textarea",
      "required": false
    },
    {
      "name": "fecha_hora",
      "label": "Fecha Hora",
      "type": "date",
      "required": false
    }
  ],
  "backup_sistema": [
    {
      "name": "generado_por",
      "label": "Generado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "nombre_archivo",
      "label": "Nombre Archivo",
      "type": "text",
      "required": true
    },
    {
      "name": "url_storage",
      "label": "Url Storage",
      "type": "text",
      "required": true
    },
    {
      "name": "tamanio",
      "label": "Tamanio",
      "type": "text",
      "required": false
    },
    {
      "name": "formato",
      "label": "Formato",
      "type": "text",
      "required": true
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": true
    },
    {
      "name": "fecha_generacion",
      "label": "Fecha Generacion",
      "type": "date",
      "required": false
    }
  ],
  "bitacora_avance": [
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "fase_id",
      "label": "Fase de Proyecto",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/fase_proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "fase_proyecto"
    },
    {
      "name": "renglon_id",
      "label": "Renglón de Trabajo",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/renglon_trabajo",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "renglon_trabajo"
    },
    {
      "name": "cantidad_periodo",
      "label": "Cantidad del Período",
      "type": "decimal",
      "required": false
    },
    {
      "name": "longitud",
      "label": "Longitud",
      "type": "decimal",
      "required": false
    },
    {
      "name": "ancho",
      "label": "Ancho",
      "type": "decimal",
      "required": false
    },
    {
      "name": "altura_espesor",
      "label": "Altura Espesor",
      "type": "decimal",
      "required": false
    },
    {
      "name": "cantidad_unidades",
      "label": "Cantidad Unidades",
      "type": "decimal",
      "required": false
    },
    {
      "name": "cantidad_calculada",
      "label": "Cantidad Calculada",
      "type": "decimal",
      "required": false
    },
    {
      "name": "estacion_inicio",
      "label": "Estacion Inicio",
      "type": "text",
      "required": false
    },
    {
      "name": "estacion_fin",
      "label": "Estacion Fin",
      "type": "text",
      "required": false
    },
    {
      "name": "observaciones",
      "label": "Observaciones",
      "type": "textarea",
      "required": false
    },
    {
      "name": "fecha_corte",
      "label": "Fecha Corte",
      "type": "date",
      "required": false
    }
  ],
  "bitacora_entrada": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "tipo_bitacora_id",
      "label": "Tipo de Bitácora",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/catalogo_item",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "catalogo_item"
    },
    {
      "name": "categoria_actividad_id",
      "label": "Categoría de Actividad",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/categoria_actividad",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "categoria_actividad"
    },
    {
      "name": "titulo",
      "label": "Titulo",
      "type": "text",
      "required": true
    },
    {
      "name": "fecha",
      "label": "Fecha",
      "type": "date",
      "required": true
    },
    {
      "name": "hora",
      "label": "Hora",
      "type": "text",
      "required": true
    },
    {
      "name": "turno",
      "label": "Turno",
      "type": "text",
      "required": false
    },
    {
      "name": "ubicacion",
      "label": "Ubicacion",
      "type": "text",
      "required": false
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "estado_general_id",
      "label": "Estado General",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/catalogo_item",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "catalogo_item"
    },
    {
      "name": "comentarios",
      "label": "Comentarios",
      "type": "textarea",
      "required": false
    },
    {
      "name": "firma_url",
      "label": "Firma Url",
      "type": "text",
      "required": false
    },
    {
      "name": "publicada",
      "label": "Publicada",
      "type": "boolean",
      "required": false
    },
    {
      "name": "bloqueada",
      "label": "Bloqueada",
      "type": "boolean",
      "required": false
    }
  ],
  "bitacora_pendiente": [
    {
      "name": "renglon_id",
      "label": "Renglón de Trabajo",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/renglon_trabajo",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "renglon_trabajo"
    },
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "registrado_por",
      "label": "Registrado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "fecha_medicion",
      "label": "Fecha Medicion",
      "type": "date",
      "required": true
    },
    {
      "name": "estimacion_origen",
      "label": "Estimacion Origen",
      "type": "integer",
      "required": false
    },
    {
      "name": "lado_via",
      "label": "Lado Via",
      "type": "text",
      "required": false
    },
    {
      "name": "ubicacion_especifica",
      "label": "Ubicacion Especifica",
      "type": "text",
      "required": false
    },
    {
      "name": "estacion_inicial",
      "label": "Estacion Inicial",
      "type": "decimal",
      "required": false
    },
    {
      "name": "estacion_final",
      "label": "Estacion Final",
      "type": "decimal",
      "required": false
    },
    {
      "name": "longitud_medida",
      "label": "Longitud Medida",
      "type": "decimal",
      "required": false
    },
    {
      "name": "ancho",
      "label": "Ancho",
      "type": "decimal",
      "required": false
    },
    {
      "name": "altura_espesor",
      "label": "Altura Espesor",
      "type": "decimal",
      "required": false
    },
    {
      "name": "volumen_area_bruto",
      "label": "Volumen Area Bruto",
      "type": "decimal",
      "required": false
    },
    {
      "name": "descuento_aplicado_id",
      "label": "Descuento Técnico",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/catalogo_descuento_tecnico",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "catalogo_descuento_tecnico"
    },
    {
      "name": "cantidad_neta_cobrar",
      "label": "Cantidad Neta Cobrar",
      "type": "decimal",
      "required": false
    },
    {
      "name": "es_derrumbre",
      "label": "Es Derrumbre",
      "type": "boolean",
      "required": true
    },
    {
      "name": "estado_conciliacion",
      "label": "Estado Conciliacion",
      "type": "text",
      "required": true
    },
    {
      "name": "observaciones",
      "label": "Observaciones",
      "type": "textarea",
      "required": false
    },
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "anulado_en",
      "label": "Anulado En",
      "type": "date",
      "required": false
    },
    {
      "name": "anulado_por",
      "label": "Anulado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "motivo_anulacion",
      "label": "Motivo Anulacion",
      "type": "textarea",
      "required": false
    }
  ],
  "bitacora_pendiente_ajuste": [
    {
      "name": "bitacora_pendiente_id",
      "label": "Pendiente Asociado",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/bitacora_pendiente",
      "labelKey": "renglon_id",
      "valueKey": "id",
      "refTable": "bitacora_pendiente"
    },
    {
      "name": "valor_descuento",
      "label": "Valor Descuento",
      "type": "decimal",
      "required": true
    },
    {
      "name": "formula_descuento",
      "label": "Formula Descuento",
      "type": "text",
      "required": false
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "registrado_por",
      "label": "Registrado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    }
  ],
  "capitulo_sabana": [
    {
      "name": "numero_capitulo",
      "label": "Numero Capitulo",
      "type": "integer",
      "required": true
    },
    {
      "name": "nombre_capitulo",
      "label": "Nombre Capitulo",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    }
  ],
  "catalogo": [
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "catalogo_descuento_tecnico": [
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "factor_seccion_transversal",
      "label": "Factor Seccion Transversal",
      "type": "decimal",
      "required": true
    }
  ],
  "catalogo_item": [
    {
      "name": "catalogo_id",
      "label": "Catalogo",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/catalogo",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "catalogo"
    },
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "color",
      "label": "Color",
      "type": "text",
      "required": false
    },
    {
      "name": "orden",
      "label": "Orden",
      "type": "integer",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "categoria_actividad": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "tipo_obra",
      "label": "Tipo Obra",
      "type": "text",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "condicion_climatica": [
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "temperatura",
      "label": "Temperatura",
      "type": "decimal",
      "required": false
    },
    {
      "name": "precipitacion",
      "label": "Precipitacion",
      "type": "decimal",
      "required": false
    },
    {
      "name": "viento",
      "label": "Viento",
      "type": "text",
      "required": false
    },
    {
      "name": "visibilidad",
      "label": "Visibilidad",
      "type": "text",
      "required": false
    },
    {
      "name": "estado_general",
      "label": "Estado General",
      "type": "text",
      "required": false
    }
  ],
  "configuracion_general": [
    {
      "name": "clave",
      "label": "Clave",
      "type": "text",
      "required": true
    },
    {
      "name": "valor",
      "label": "Valor",
      "type": "text",
      "required": false
    },
    {
      "name": "categoria",
      "label": "Categoria",
      "type": "text",
      "required": true
    },
    {
      "name": "cambiado_por",
      "label": "Cambiado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    }
  ],
  "contacto_contratista": [
    {
      "name": "empresa_contratista_id",
      "label": "Empresa Contratista",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/empresa_contratista",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "empresa_contratista"
    },
    {
      "name": "cargo",
      "label": "Cargo",
      "type": "text",
      "required": false
    },
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    }
  ],
  "contacto_empresa_externa": [
    {
      "name": "empresa_externa_id",
      "label": "Empresa Externa",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/empresa_externa",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "empresa_externa"
    },
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "cargo",
      "label": "Cargo",
      "type": "text",
      "required": false
    },
    {
      "name": "telefono",
      "label": "Telefono",
      "type": "text",
      "required": false
    },
    {
      "name": "correo",
      "label": "Correo",
      "type": "email",
      "required": false
    }
  ],
  "contacto_entidad": [
    {
      "name": "entidad_contratante_id",
      "label": "Entidad Contratante",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/entidad_contratante",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "entidad_contratante"
    },
    {
      "name": "cargo",
      "label": "Cargo",
      "type": "text",
      "required": false
    },
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    }
  ],
  "control_anticipo": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "numero_estimacion",
      "label": "Numero Estimacion",
      "type": "integer",
      "required": true
    },
    {
      "name": "monto_anticipo_total",
      "label": "Monto Anticipo Total (Q)",
      "type": "decimal",
      "required": true
    },
    {
      "name": "valor_estimacion_periodo",
      "label": "Valor Estimación Período (Q)",
      "type": "decimal",
      "required": true
    },
    {
      "name": "amortizado_periodo",
      "label": "Amortizado Periodo",
      "type": "decimal",
      "required": false
    },
    {
      "name": "saldo_por_amortizar",
      "label": "Saldo Por Amortizar",
      "type": "decimal",
      "required": false
    },
    {
      "name": "fecha_registro",
      "label": "Fecha Registro",
      "type": "date",
      "required": false
    }
  ],
  "control_plazo": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "fecha_inicio_referencia",
      "label": "Fecha Inicio Referencia",
      "type": "date",
      "required": true
    },
    {
      "name": "dias_contractuales",
      "label": "Días Contractuales",
      "type": "integer",
      "required": true
    },
    {
      "name": "dias_suspendidos_acumulados",
      "label": "Dias Suspendidos Acumulados",
      "type": "integer",
      "required": true
    },
    {
      "name": "fecha_corte_estimacion",
      "label": "Fecha Corte Estimacion",
      "type": "date",
      "required": false
    },
    {
      "name": "fecha_finalizacion_actualizada",
      "label": "Fecha Finalizacion Actualizada",
      "type": "date",
      "required": false
    }
  ],
  "cronograma_planificado": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "fase_id",
      "label": "Fase de Proyecto",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/fase_proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "fase_proyecto"
    },
    {
      "name": "renglon_id",
      "label": "Renglón de Trabajo",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/renglon_trabajo",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "renglon_trabajo"
    },
    {
      "name": "fecha_inicio_plan",
      "label": "Fecha Inicio Planificada",
      "type": "date",
      "required": true
    },
    {
      "name": "fecha_fin_plan",
      "label": "Fecha Fin Planificada",
      "type": "date",
      "required": true
    },
    {
      "name": "porcentaje_esperado",
      "label": "% Esperado",
      "type": "decimal",
      "required": true
    },
    {
      "name": "responsable_id",
      "label": "Responsable",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "linea_base",
      "label": "Linea Base",
      "type": "boolean",
      "required": false
    }
  ],
  "dato_usuario": [
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "email",
      "label": "Email",
      "type": "email",
      "required": false
    },
    {
      "name": "password_hash",
      "label": "Password Hash",
      "type": "text",
      "required": false
    },
    {
      "name": "username",
      "label": "Username",
      "type": "text",
      "required": false
    },
    {
      "name": "primer_nombre",
      "label": "Primer Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "segundo_nombre",
      "label": "Segundo Nombre",
      "type": "text",
      "required": false
    },
    {
      "name": "primer_apellido",
      "label": "Primer Apellido",
      "type": "text",
      "required": true
    },
    {
      "name": "segundo_apellido",
      "label": "Segundo Apellido",
      "type": "text",
      "required": false
    },
    {
      "name": "telefono",
      "label": "Telefono",
      "type": "text",
      "required": false
    },
    {
      "name": "direccion",
      "label": "Direccion",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_nacimiento",
      "label": "Fecha Nacimiento",
      "type": "date",
      "required": false
    },
    {
      "name": "avatar_url",
      "label": "Avatar Url",
      "type": "text",
      "required": false
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_registro",
      "label": "Fecha Registro",
      "type": "date",
      "required": false
    },
    {
      "name": "ultimo_acceso",
      "label": "Ultimo Acceso",
      "type": "date",
      "required": false
    }
  ],
  "departamento": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    }
  ],
  "documento_proyecto": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "subido_por",
      "label": "Subido Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "tipo",
      "label": "Tipo",
      "type": "text",
      "required": false
    },
    {
      "name": "url_storage",
      "label": "Url Storage",
      "type": "text",
      "required": true
    },
    {
      "name": "version",
      "label": "Version",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_subida",
      "label": "Fecha Subida",
      "type": "date",
      "required": false
    }
  ],
  "empresa": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "nit",
      "label": "NIT",
      "type": "text",
      "required": true
    },
    {
      "name": "direccion",
      "label": "Direccion",
      "type": "text",
      "required": false
    },
    {
      "name": "telefono",
      "label": "Telefono",
      "type": "text",
      "required": false
    },
    {
      "name": "correo",
      "label": "Correo",
      "type": "email",
      "required": false
    },
    {
      "name": "logo_url",
      "label": "Logo Url",
      "type": "text",
      "required": false
    },
    {
      "name": "marca_agua_url",
      "label": "Marca Agua Url",
      "type": "text",
      "required": false
    }
  ],
  "empresa_contratista": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "nit",
      "label": "NIT",
      "type": "text",
      "required": false
    },
    {
      "name": "direccion",
      "label": "Direccion",
      "type": "text",
      "required": false
    },
    {
      "name": "telefono",
      "label": "Telefono",
      "type": "text",
      "required": false
    },
    {
      "name": "correo_institucional",
      "label": "Correo Institucional",
      "type": "email",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "empresa_externa": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "nit",
      "label": "NIT",
      "type": "text",
      "required": false
    },
    {
      "name": "direccion",
      "label": "Direccion",
      "type": "text",
      "required": false
    },
    {
      "name": "telefono",
      "label": "Telefono",
      "type": "text",
      "required": false
    },
    {
      "name": "correo_institucional",
      "label": "Correo Institucional",
      "type": "email",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "ensayo_laboratorio": [
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "tipo_ensayo_id",
      "label": "Tipo de Ensayo",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/tipo_ensayo",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "tipo_ensayo"
    },
    {
      "name": "tecnico_id",
      "label": "Técnico Responsable",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "especificacion_id",
      "label": "Especificación Técnica",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/especificacion_tecnica",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "especificacion_tecnica"
    },
    {
      "name": "resultado_obtenido",
      "label": "Resultado Obtenido",
      "type": "decimal",
      "required": true
    },
    {
      "name": "valor_minimo",
      "label": "Valor Minimo",
      "type": "decimal",
      "required": false
    },
    {
      "name": "aprobado",
      "label": "Aprobado",
      "type": "boolean",
      "required": true
    },
    {
      "name": "observaciones",
      "label": "Observaciones",
      "type": "textarea",
      "required": false
    },
    {
      "name": "fecha_hora",
      "label": "Fecha Hora",
      "type": "date",
      "required": false
    }
  ],
  "entidad_contratante": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "nit",
      "label": "NIT",
      "type": "text",
      "required": false
    },
    {
      "name": "direccion",
      "label": "Direccion",
      "type": "text",
      "required": false
    },
    {
      "name": "telefono",
      "label": "Telefono",
      "type": "text",
      "required": false
    },
    {
      "name": "correo_institucional",
      "label": "Correo Institucional",
      "type": "email",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "especificacion_tecnica": [
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "unidad",
      "label": "Unidad",
      "type": "text",
      "required": true
    },
    {
      "name": "parametros_obligatorios",
      "label": "Parametros Obligatorios",
      "type": "text",
      "required": false
    },
    {
      "name": "referencia_normativa",
      "label": "Referencia Normativa",
      "type": "text",
      "required": false
    },
    {
      "name": "edicion",
      "label": "Edicion",
      "type": "text",
      "required": false
    },
    {
      "name": "tolerancia_minima",
      "label": "Tolerancia Minima",
      "type": "decimal",
      "required": false
    },
    {
      "name": "tolerancia_maxima",
      "label": "Tolerancia Maxima",
      "type": "decimal",
      "required": false
    },
    {
      "name": "norma_referencia",
      "label": "Norma Referencia",
      "type": "text",
      "required": false
    }
  ],
  "estacion_kilometrica": [
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "renglon_trabajo_id",
      "label": "Renglón de Trabajo",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/renglon_trabajo",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "renglon_trabajo"
    },
    {
      "name": "numero_eje",
      "label": "Numero Eje",
      "type": "text",
      "required": false
    },
    {
      "name": "estacion_inicial",
      "label": "Estacion Inicial",
      "type": "decimal",
      "required": true
    },
    {
      "name": "estacion_final",
      "label": "Estacion Final",
      "type": "decimal",
      "required": true
    },
    {
      "name": "observacion",
      "label": "Observacion",
      "type": "textarea",
      "required": false
    }
  ],
  "estado_usuario": [
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": true
    },
    {
      "name": "motivo_bloqueo",
      "label": "Motivo Bloqueo",
      "type": "textarea",
      "required": false
    },
    {
      "name": "cambiado_por",
      "label": "Cambiado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "fecha_cambio",
      "label": "Fecha Cambio",
      "type": "date",
      "required": false
    }
  ],
  "evidencia_fotografica": [
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "gps_lat",
      "label": "Latitud GPS",
      "type": "decimal",
      "required": true
    },
    {
      "name": "gps_lng",
      "label": "Longitud GPS",
      "type": "decimal",
      "required": true
    },
    {
      "name": "precision_gps",
      "label": "Precisión GPS (metros)",
      "type": "decimal",
      "required": false
    },
    {
      "name": "fecha_hora",
      "label": "Fecha Hora",
      "type": "date",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "categoria",
      "label": "Categoria",
      "type": "text",
      "required": false
    },
    {
      "name": "url_storage",
      "label": "Url Storage",
      "type": "text",
      "required": true
    }
  ],
  "fase_proyecto": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "orden",
      "label": "Orden",
      "type": "integer",
      "required": false
    },
    {
      "name": "fecha_inicio",
      "label": "Fecha de Inicio",
      "type": "date",
      "required": false
    },
    {
      "name": "fecha_fin",
      "label": "Fecha de Finalización",
      "type": "date",
      "required": false
    },
    {
      "name": "porcentaje_planificado",
      "label": "% Planificado",
      "type": "decimal",
      "required": false
    },
    {
      "name": "porcentaje_real",
      "label": "Porcentaje Real",
      "type": "decimal",
      "required": false
    },
    {
      "name": "porcentaje_avance",
      "label": "Porcentaje Avance",
      "type": "decimal",
      "required": false
    },
    {
      "name": "fecha_corte",
      "label": "Fecha Corte",
      "type": "date",
      "required": false
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": false
    }
  ],
  "incidente_evidencia": [
    {
      "name": "incidente_id",
      "label": "Incidente de Obra",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/incidente_obra",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "incidente_obra"
    },
    {
      "name": "subido_por",
      "label": "Subido Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "tipo",
      "label": "Tipo",
      "type": "text",
      "required": false
    },
    {
      "name": "url_storage",
      "label": "Url Storage",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "fecha_subida",
      "label": "Fecha Subida",
      "type": "date",
      "required": false
    }
  ],
  "incidente_obra": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "bitacora_entrada_id",
      "label": "Entrada de Bitácora",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/bitacora_entrada",
      "labelKey": "titulo",
      "valueKey": "id",
      "refTable": "bitacora_entrada"
    },
    {
      "name": "reportado_por",
      "label": "Reportado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "titulo",
      "label": "Titulo",
      "type": "text",
      "required": true
    },
    {
      "name": "ubicacion",
      "label": "Ubicacion",
      "type": "text",
      "required": false
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "tipo",
      "label": "Tipo",
      "type": "text",
      "required": false
    },
    {
      "name": "nivel_gravedad",
      "label": "Nivel Gravedad",
      "type": "text",
      "required": false
    },
    {
      "name": "acciones_correctivas",
      "label": "Acciones Correctivas",
      "type": "textarea",
      "required": false
    },
    {
      "name": "estado_resolucion",
      "label": "Estado Resolucion",
      "type": "text",
      "required": false
    },
    {
      "name": "cerrado_por",
      "label": "Cerrado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "fecha",
      "label": "Fecha",
      "type": "date",
      "required": false
    },
    {
      "name": "fecha_cierre",
      "label": "Fecha Cierre",
      "type": "date",
      "required": false
    }
  ],
  "modificativo_renglon": [
    {
      "name": "renglon_id",
      "label": "Renglón de Trabajo",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/renglon_trabajo",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "renglon_trabajo"
    },
    {
      "name": "cantidad_delta",
      "label": "Cantidad Delta",
      "type": "decimal",
      "required": true
    },
    {
      "name": "documento_referencia",
      "label": "Documento Referencia",
      "type": "text",
      "required": false
    },
    {
      "name": "motivo",
      "label": "Motivo",
      "type": "textarea",
      "required": false
    },
    {
      "name": "aprobado_por",
      "label": "Aprobado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "fecha_registro",
      "label": "Fecha Registro",
      "type": "date",
      "required": false
    }
  ],
  "municipio": [
    {
      "name": "departamento_id",
      "label": "Departamento",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/departamento",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "departamento"
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    }
  ],
  "parametro_proyecto": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "porcentaje_indirectos",
      "label": "% Indirectos",
      "type": "decimal",
      "required": true
    },
    {
      "name": "porcentaje_iva",
      "label": "% IVA",
      "type": "decimal",
      "required": true
    },
    {
      "name": "porcentaje_amortizacion_anticipo",
      "label": "% Amortización Anticipo",
      "type": "decimal",
      "required": true
    },
    {
      "name": "monto_etapa_construccion",
      "label": "Monto Construcción (Q)",
      "type": "decimal",
      "required": false
    },
    {
      "name": "monto_anticipo_total",
      "label": "Monto Anticipo Total (Q)",
      "type": "decimal",
      "required": false
    },
    {
      "name": "anticipo_total_recibido",
      "label": "Anticipo Total Recibido (Q)",
      "type": "decimal",
      "required": false
    }
  ],
  "proyecto": [
    {
      "name": "empresa_id",
      "label": "Empresa",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/empresa",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "empresa"
    },
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "ubicacion",
      "label": "Ubicacion",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_inicio",
      "label": "Fecha de Inicio",
      "type": "date",
      "required": true
    },
    {
      "name": "fecha_fin_estimada",
      "label": "Fecha Fin Estimada",
      "type": "date",
      "required": true
    },
    {
      "name": "estado_id",
      "label": "Estado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/catalogo_item",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "catalogo_item"
    },
    {
      "name": "responsable_id",
      "label": "Responsable",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "en_replanificacion",
      "label": "En Replanificacion",
      "type": "boolean",
      "required": true
    }
  ],
  "proyecto_detalle": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "tipo_obra",
      "label": "Tipo Obra",
      "type": "text",
      "required": false
    },
    {
      "name": "nombre_oficial",
      "label": "Nombre Oficial",
      "type": "text",
      "required": false
    },
    {
      "name": "descripcion_proyecto",
      "label": "Descripcion Proyecto",
      "type": "textarea",
      "required": false
    },
    {
      "name": "municipio_id",
      "label": "Municipio",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/municipio",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "municipio"
    },
    {
      "name": "tramo",
      "label": "Tramo",
      "type": "text",
      "required": false
    },
    {
      "name": "kilometro_inicio",
      "label": "Kilometro Inicio",
      "type": "decimal",
      "required": false
    },
    {
      "name": "kilometro_fin",
      "label": "Kilometro Fin",
      "type": "decimal",
      "required": false
    },
    {
      "name": "numero_contrato_original",
      "label": "Numero Contrato Original",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_firma_contrato_original",
      "label": "Fecha Firma Contrato Original",
      "type": "date",
      "required": false
    },
    {
      "name": "numero_contrato_modificatorio",
      "label": "Numero Contrato Modificatorio",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_firma_contrato_modificatorio",
      "label": "Fecha Firma Contrato Modificatorio",
      "type": "date",
      "required": false
    },
    {
      "name": "acuerdo_ministerial_original",
      "label": "Acuerdo Ministerial Original",
      "type": "text",
      "required": false
    },
    {
      "name": "acuerdo_ministerial_modificatorio",
      "label": "Acuerdo Ministerial Modificatorio",
      "type": "text",
      "required": false
    },
    {
      "name": "numero_escritura_publica",
      "label": "Numero Escritura Publica",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_adjudicacion",
      "label": "Fecha Adjudicacion",
      "type": "date",
      "required": false
    },
    {
      "name": "fecha_inicio_contractual",
      "label": "Fecha Inicio Contractual",
      "type": "date",
      "required": false
    },
    {
      "name": "fecha_finalizacion_real",
      "label": "Fecha Finalizacion Real",
      "type": "date",
      "required": false
    },
    {
      "name": "monto_original",
      "label": "Monto Original (Q)",
      "type": "decimal",
      "required": false
    },
    {
      "name": "monto_ajustado",
      "label": "Monto Ajustado",
      "type": "decimal",
      "required": false
    },
    {
      "name": "empresa_contratante_id",
      "label": "Entidad Contratante",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/entidad_contratante",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "entidad_contratante"
    },
    {
      "name": "contacto_contratante_id",
      "label": "Contacto de Entidad",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/contacto_entidad",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "contacto_entidad"
    },
    {
      "name": "empresa_supervisora",
      "label": "Empresa Supervisora",
      "type": "text",
      "required": false
    },
    {
      "name": "plazo_ejecucion_original",
      "label": "Plazo Ejecucion Original",
      "type": "integer",
      "required": false
    },
    {
      "name": "plazo_ejecucion_ampliado",
      "label": "Plazo Ejecucion Ampliado",
      "type": "integer",
      "required": false
    },
    {
      "name": "empresa_contratista_id",
      "label": "Empresa Contratista",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/empresa_contratista",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "empresa_contratista"
    },
    {
      "name": "contacto_contratista_id",
      "label": "Contacto de Contratista",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/contacto_contratista",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "contacto_contratista"
    },
    {
      "name": "departamento_id",
      "label": "Departamento",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/departamento",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "departamento"
    },
    {
      "name": "latitud",
      "label": "Latitud",
      "type": "decimal",
      "required": false
    },
    {
      "name": "longitud",
      "label": "Longitud",
      "type": "decimal",
      "required": false
    },
    {
      "name": "direccion",
      "label": "Direccion",
      "type": "text",
      "required": false
    },
    {
      "name": "monto_final",
      "label": "Monto Final",
      "type": "decimal",
      "required": false
    },
    {
      "name": "delegado_residente_id",
      "label": "Delegado Residente",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "departamento_fin_id",
      "label": "Departamento Fin",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/departamento",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "departamento"
    },
    {
      "name": "municipio_fin_id",
      "label": "Municipio Fin",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/municipio",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "municipio"
    },
    {
      "name": "direccion_fin",
      "label": "Direccion Fin",
      "type": "text",
      "required": false
    }
  ],
  "proyecto_usuario": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "rol_proyecto",
      "label": "Rol Proyecto",
      "type": "text",
      "required": true
    },
    {
      "name": "fecha_asignacion",
      "label": "Fecha Asignacion",
      "type": "date",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "renglon_trabajo": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "categoria_id",
      "label": "Categoría de Actividad",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/categoria_actividad",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "categoria_actividad"
    },
    {
      "name": "especificacion_id",
      "label": "Especificación Técnica",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/especificacion_tecnica",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "especificacion_tecnica"
    },
    {
      "name": "capitulo_id",
      "label": "Capítulo (Sábana)",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/capitulo_sabana",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "capitulo_sabana"
    },
    {
      "name": "unidad_id",
      "label": "Unidad de Medida",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/unidad_medida",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "unidad_medida"
    },
    {
      "name": "tipo_renglon",
      "label": "Tipo Renglon",
      "type": "text",
      "required": true
    },
    {
      "name": "aplica_indirectos",
      "label": "Aplica Indirectos",
      "type": "boolean",
      "required": true
    },
    {
      "name": "aplica_iva",
      "label": "Aplica Iva",
      "type": "boolean",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "cantidad_contractual",
      "label": "Cantidad Contractual",
      "type": "decimal",
      "required": false
    },
    {
      "name": "cantidad_ejecutada",
      "label": "Cantidad Ejecutada",
      "type": "decimal",
      "required": false
    },
    {
      "name": "cantidad_ajustada",
      "label": "Cantidad Ajustada",
      "type": "decimal",
      "required": false
    },
    {
      "name": "precio_unitario_directo",
      "label": "Precio Unitario Directo (Q)",
      "type": "decimal",
      "required": false
    },
    {
      "name": "costo_total_directo_ajustado",
      "label": "Costo Total Directo Ajustado",
      "type": "decimal",
      "required": false
    },
    {
      "name": "fecha_ultimo_avance",
      "label": "Fecha Ultimo Avance",
      "type": "date",
      "required": false
    },
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": false
    }
  ],
  "renglon_trabajo_catalogo": [
    {
      "name": "capitulo_id",
      "label": "Capítulo (Sábana)",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/capitulo_sabana",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "capitulo_sabana"
    },
    {
      "name": "unidad_id",
      "label": "Unidad de Medida",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/unidad_medida",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "unidad_medida"
    },
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "tipo_renglon",
      "label": "Tipo Renglon",
      "type": "text",
      "required": true
    },
    {
      "name": "aplica_indirectos",
      "label": "Aplica Indirectos",
      "type": "boolean",
      "required": true
    },
    {
      "name": "aplica_iva",
      "label": "Aplica Iva",
      "type": "boolean",
      "required": true
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "renglon_trabajo_plantilla": [
    {
      "name": "capitulo_id",
      "label": "Capítulo (Sábana)",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/capitulo_sabana",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "capitulo_sabana"
    },
    {
      "name": "unidad_id",
      "label": "Unidad de Medida",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/unidad_medida",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "unidad_medida"
    },
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": true
    },
    {
      "name": "tipo_renglon",
      "label": "Tipo Renglon",
      "type": "text",
      "required": true
    },
    {
      "name": "aplica_indirectos",
      "label": "Aplica Indirectos",
      "type": "boolean",
      "required": true
    },
    {
      "name": "aplica_iva",
      "label": "Aplica Iva",
      "type": "boolean",
      "required": true
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": true
    }
  ],
  "reporte": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "generado_por",
      "label": "Generado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "titulo",
      "label": "Titulo",
      "type": "text",
      "required": true
    },
    {
      "name": "tipo",
      "label": "Tipo",
      "type": "text",
      "required": true
    },
    {
      "name": "filtros_aplicados",
      "label": "Filtros Aplicados",
      "type": "textarea",
      "required": false
    },
    {
      "name": "formato",
      "label": "Formato",
      "type": "text",
      "required": true
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": true
    },
    {
      "name": "nombre_archivo",
      "label": "Nombre Archivo",
      "type": "text",
      "required": true
    },
    {
      "name": "logo_incluido",
      "label": "Logo Incluido",
      "type": "boolean",
      "required": false
    },
    {
      "name": "marca_agua_incluida",
      "label": "Marca Agua Incluida",
      "type": "boolean",
      "required": false
    },
    {
      "name": "logo_url",
      "label": "Logo Url",
      "type": "text",
      "required": false
    },
    {
      "name": "marca_agua_url",
      "label": "Marca Agua Url",
      "type": "text",
      "required": false
    },
    {
      "name": "estructura",
      "label": "Estructura",
      "type": "textarea",
      "required": false
    },
    {
      "name": "campos_incluidos",
      "label": "Campos Incluidos",
      "type": "textarea",
      "required": false
    },
    {
      "name": "url_storage",
      "label": "Url Storage",
      "type": "text",
      "required": false
    },
    {
      "name": "fecha_generacion",
      "label": "Fecha Generacion",
      "type": "date",
      "required": false
    }
  ],
  "restauracion_sistema": [
    {
      "name": "restaurado_por",
      "label": "Restaurado Por",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "archivo_origen",
      "label": "Archivo Origen",
      "type": "text",
      "required": true
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": true
    },
    {
      "name": "observaciones",
      "label": "Observaciones",
      "type": "textarea",
      "required": false
    },
    {
      "name": "fecha_restauracion",
      "label": "Fecha Restauracion",
      "type": "date",
      "required": false
    }
  ],
  "rol": [
    {
      "name": "nombre_rol",
      "label": "Nombre Rol",
      "type": "text",
      "required": true
    },
    {
      "name": "nivel_permisos",
      "label": "Nivel Permisos",
      "type": "integer",
      "required": false
    },
    {
      "name": "permisos",
      "label": "Permisos",
      "type": "textarea",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    }
  ],
  "seguridad_log": [
    {
      "name": "usuario_id",
      "label": "Usuario Asignado",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "accion",
      "label": "Accion",
      "type": "text",
      "required": true
    },
    {
      "name": "ip",
      "label": "Ip",
      "type": "text",
      "required": false
    },
    {
      "name": "user_agent",
      "label": "User Agent",
      "type": "text",
      "required": false
    },
    {
      "name": "exitoso",
      "label": "Exitoso",
      "type": "boolean",
      "required": false
    },
    {
      "name": "detalles",
      "label": "Detalles",
      "type": "textarea",
      "required": false
    },
    {
      "name": "fecha_hora",
      "label": "Fecha Hora",
      "type": "date",
      "required": false
    }
  ],
  "suspension_plazo": [
    {
      "name": "proyecto_id",
      "label": "Proyecto",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/proyecto",
      "labelKey": "nombre",
      "valueKey": "id",
      "refTable": "proyecto"
    },
    {
      "name": "fecha_inicio",
      "label": "Fecha de Inicio",
      "type": "date",
      "required": true
    },
    {
      "name": "fecha_fin",
      "label": "Fecha de Finalización",
      "type": "date",
      "required": false
    },
    {
      "name": "duracion_dias",
      "label": "Duracion Dias",
      "type": "integer",
      "required": false
    },
    {
      "name": "motivo",
      "label": "Motivo",
      "type": "textarea",
      "required": false
    },
    {
      "name": "tipo_suspension",
      "label": "Tipo Suspension",
      "type": "text",
      "required": false
    },
    {
      "name": "numero_acta_resolucion",
      "label": "Numero Acta Resolucion",
      "type": "text",
      "required": true
    }
  ],
  "ticket_mensaje": [
    {
      "name": "ticket_id",
      "label": "Ticket",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/ticket_soporte",
      "labelKey": "codigo",
      "valueKey": "id",
      "refTable": "ticket_soporte"
    },
    {
      "name": "autor_usuario_id",
      "label": "Autor del Mensaje",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "rol_id",
      "label": "Rol de Sistema",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/rol",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "rol"
    },
    {
      "name": "mensaje",
      "label": "Mensaje",
      "type": "text",
      "required": true
    }
  ],
  "ticket_soporte": [
    {
      "name": "codigo",
      "label": "Codigo",
      "type": "text",
      "required": true
    },
    {
      "name": "titulo",
      "label": "Titulo",
      "type": "text",
      "required": true
    },
    {
      "name": "estado",
      "label": "Estado",
      "type": "text",
      "required": false
    },
    {
      "name": "categoria",
      "label": "Categoria",
      "type": "text",
      "required": true
    },
    {
      "name": "creado_por_usuario_id",
      "label": "Creado Por",
      "type": "select",
      "required": true,
      "endpoint": "/mantenimiento/usuario",
      "labelKey": "email",
      "valueKey": "id",
      "refTable": "usuario"
    },
    {
      "name": "asignado_a_rol_id",
      "label": "Asignado al Rol",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/rol",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "rol"
    }
  ],
  "tipo_ensayo": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "descripcion",
      "label": "Descripcion",
      "type": "textarea",
      "required": false
    },
    {
      "name": "unidad_resultado",
      "label": "Unidad Resultado",
      "type": "text",
      "required": false
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    }
  ],
  "unidad_medida": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true
    },
    {
      "name": "abreviatura",
      "label": "Abreviatura",
      "type": "text",
      "required": true
    },
    {
      "name": "es_discreta",
      "label": "Es Discreta",
      "type": "boolean",
      "required": false
    }
  ],
  "usuario": [
    {
      "name": "auth_user_id",
      "label": "Auth User",
      "type": "text",
      "required": false
    },
    {
      "name": "correo",
      "label": "Correo",
      "type": "email",
      "required": true
    },
    {
      "name": "rol_id",
      "label": "Rol de Sistema",
      "type": "select",
      "required": false,
      "endpoint": "/mantenimiento/rol",
      "labelKey": "descripcion",
      "valueKey": "id",
      "refTable": "rol"
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "boolean",
      "required": false
    },
    {
      "name": "ultimo_acceso",
      "label": "Ultimo Acceso",
      "type": "date",
      "required": false
    },
    {
      "name": "fecha_registro",
      "label": "Fecha Registro",
      "type": "date",
      "required": false
    }
  ]
};

interface Props {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  table: string
  tableFriendlyName?: string
  record?: any
  onSave: (data: any) => Promise<void> | void
  dataKeys?: string[]
}

export default function MantenimientoDrawer({
  isOpen,
  onClose,
  mode,
  table,
  tableFriendlyName,
  record,
  onSave,
  dataKeys = []
}: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [optionsMap, setOptionsMap] = useState<Record<string, any[]>>({})
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { showErrorToast } = useCustomToast()



  const schema = useMemo(() => {
    const baseSchema = TABLES_SCHEMA[table] || []
    const newSchema = [...baseSchema]
    
    dataKeys.forEach(key => {
      if (!newSchema.find(f => f.name === key) && key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'dependenciasCount') {
        newSchema.push({
          name: key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: key.includes('fecha') ? 'date' : typeof record?.[key] === 'boolean' ? 'boolean' : typeof record?.[key] === 'number' ? 'decimal' : 'text',
          required: false,
          readOnly: false
        })
      }
    })
    
    return newSchema
  }, [table, dataKeys, record])

  // Carga de opciones de llaves foráneas con deduplicado y sin bucle infinito
  useEffect(() => {
    if (isOpen) {
      let isCancelled = false
      const loadOptions = async () => {
        const selectsToLoad = schema.filter(f => f.type === 'select' && f.endpoint)
        for (const field of selectsToLoad) {
          try {
            setLoadingOptions(prev => ({ ...prev, [field.name]: true }))
            const res = await apiGetDeduplicado(`${field.endpoint}?pagina=1&limite=500`)
            if (!isCancelled) {
              if (res.data?.success && Array.isArray(res.data.data)) {
                setOptionsMap(prev => ({ ...prev, [field.name]: res.data.data }))
              } else if (Array.isArray(res.data?.data)) {
                setOptionsMap(prev => ({ ...prev, [field.name]: res.data.data }))
              } else if (Array.isArray(res.data)) {
                setOptionsMap(prev => ({ ...prev, [field.name]: res.data }))
              }
            }
          } catch (err) {
            console.warn(`Error al cargar opciones para ${field.name}:`, err)
          } finally {
            if (!isCancelled) {
              setLoadingOptions(prev => ({ ...prev, [field.name]: false }))
            }
          }
        }
      }
      loadOptions()
      return () => { isCancelled = true }
    }
  }, [isOpen, table, schema])

  // Inicialización de formData al abrir o cambiar de modo
  useEffect(() => {
    if (isOpen) {
      setIsSaving(false)
      setFieldErrors({})
      setTouchedFields({})

      if (mode === 'create' || !record) {
        const initialData: Record<string, any> = {}
        schema.forEach(field => {
          if (field.type === 'boolean') {
            initialData[field.name] = true
          } else {
            initialData[field.name] = ''
          }
        })
        setFormData(initialData)
      } else {
        const initialData: Record<string, any> = { ...record }
        schema.forEach(field => {
          if (field.type === 'boolean') {
            initialData[field.name] = Boolean(record[field.name])
          } else if (record[field.name] === null || record[field.name] === undefined) {
            initialData[field.name] = ''
          }
        })
        setFormData(initialData)
      }
    }
  }, [isOpen, mode, record, table, schema])

  // Validador individual de campo
  const validateField = useCallback((name: string, value: any, fieldDef?: FieldSchema): string | null => {
    const field = fieldDef || schema.find(f => f.name === name)
    if (!field) return null

    const valStr = value !== undefined && value !== null ? String(value).trim() : ''

    if (field.required && (valStr === '' || value === null || value === undefined)) {
      return 'Este campo es obligatorio'
    }

    if (valStr === '') return null

    if (field.type === 'integer') {
      if (!/^-?\d+$/.test(valStr)) {
        return 'Solo se permiten números enteros'
      }
    }

    if (field.type === 'decimal') {
      if (!/^-?\d+(\.\d+)?$/.test(valStr)) {
        return 'Debe ingresar un número válido (ej. 123.45)'
      }
    }

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(valStr)) {
        return 'Ingrese un formato de correo válido'
      }
    }

    if (field.name.includes('nit') && valStr) {
      if (valStr.length < 4) {
        return 'NIT demasiado corto'
      }
    }

    return null
  }, [schema])

  const handleInputChange = (field: FieldSchema, rawValue: string) => {
    let sanitized = rawValue

    // Filtros de teclado en vivo especializados por tipo de dato
    if (field.type === 'integer') {
      // Permitir solo números y opcional signo negativo al inicio
      sanitized = rawValue.replace(/[^0-9-]/g, '')
      if (sanitized.indexOf('-') > 0) {
        sanitized = sanitized.replace(/(?!^)-/g, '')
      }
    } else if (field.type === 'decimal') {
      // Permitir solo números, un punto decimal y opcional signo negativo
      sanitized = rawValue.replace(/[^0-9.-]/g, '')
      if (sanitized.indexOf('-') > 0) {
        sanitized = sanitized.replace(/(?!^)-/g, '')
      }
      const parts = sanitized.split('.')
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('')
      }
    }

    setFormData(prev => ({ ...prev, [field.name]: sanitized }))
    setTouchedFields(prev => ({ ...prev, [field.name]: true }))

    const error = validateField(field.name, sanitized, field)
    setFieldErrors(prev => ({ ...prev, [field.name]: error || '' }))
  }

  const handleBlur = (field: FieldSchema) => {
    setTouchedFields(prev => ({ ...prev, [field.name]: true }))
    const error = validateField(field.name, formData[field.name], field)
    setFieldErrors(prev => ({ ...prev, [field.name]: error || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving || mode === 'view') return

    // Validar todos los campos del formulario
    const errors: Record<string, string> = {}
    let hasErrors = false

    schema.forEach(field => {
      const error = validateField(field.name, formData[field.name], field)
      if (error) {
        errors[field.name] = error
        hasErrors = true
      }
    })

    if (hasErrors) {
      setFieldErrors(errors)
      // Marcar todos como tocados para mostrar las alertas
      const allTouched: Record<string, boolean> = {}
      schema.forEach(f => { allTouched[f.name] = true })
      setTouchedFields(allTouched)
      showErrorToast('Por favor complete los campos requeridos con formato válido.')
      return
    }

    setIsSaving(true)
    try {
      const payload: Record<string, any> = {}
      schema.forEach(f => {
        const val = formData[f.name]
        if (f.type === 'boolean') {
          payload[f.name] = Boolean(val)
        } else if (f.type === 'integer') {
          payload[f.name] = val !== '' && val !== null && val !== undefined ? parseInt(String(val), 10) : null
        } else if (f.type === 'decimal') {
          payload[f.name] = val !== '' && val !== null && val !== undefined ? parseFloat(String(val)) : null
        } else if (val === '' || val === undefined) {
          payload[f.name] = null
        } else {
          payload[f.name] = val
        }
      })

      await onSave(payload)
    } catch {
      // El toast de error lo maneja el parent
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const isReadOnly = mode === 'view'
  const tableTitle = tableFriendlyName || table.replace(/_/g, ' ')

  const relatedTables = useMemo(() => {
    const refs = schema
      .map(f => f.refTable)
      .filter((ref): ref is string => Boolean(ref) && ref !== table)
    return Array.from(new Set(refs))
  }, [schema, table])

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Cabecera Estilo Institucional */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                mode === 'create'
                  ? 'text-[#9B0F06]'
                  : mode === 'edit'
                  ? 'text-blue-700'
                  : 'text-gray-600'
              }`}>
                {mode === 'create' && <PlusCircle size={10} />}
                {mode === 'edit' && <Edit3 size={10} />}
                {mode === 'view' && <Eye size={10} />}
                {mode === 'create' ? 'Nuevo Registro' : mode === 'edit' ? 'Editar Registro' : 'Detalle'}
              </span>
              <span className="text-[11px] font-mono text-gray-400">({table})</span>
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {tableTitle}
            </h2>
            {relatedTables.length > 0 && (
              <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="font-semibold text-gray-700">Relación de tablas con:</span>
                {relatedTables.map((ref) => (
                  <span key={ref} className="bg-gray-100 text-gray-700 font-mono text-[9.5px] px-1.5 py-0.5 rounded border border-gray-200">
                    {ref}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-500 mt-0.5">
              {mode === 'create'
                ? 'Ingresa los datos para registrar un nuevo elemento'
                : mode === 'edit'
                ? 'Modifica los valores del registro seleccionado'
                : 'Consulta la información registrada'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#FAFAFA]">
          <form id="mantenimiento-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Metadatos de solo lectura si existe registro */}
            {record?.id && (
              <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">ID Registro (UUID)</span>
                  <span className="font-mono text-gray-700 font-medium truncate block" title={record.id}>{record.id}</span>
                </div>
                {record.created_at && (
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Fecha Creación</span>
                    <span className="text-gray-700 font-medium block">{new Date(record.created_at).toLocaleDateString()} {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {schema.map(field => {
                  const isFieldDisabled = isReadOnly || field.readOnly
                  const hasError = touchedFields[field.name] && Boolean(fieldErrors[field.name])
                  const isValid = touchedFields[field.name] && !fieldErrors[field.name] && formData[field.name] !== '' && formData[field.name] !== null

                  const inputClass = `w-full h-8 px-2.5 text-[11px] rounded-lg transition-colors focus:outline-none ${
                    isFieldDisabled
                      ? 'bg-gray-100/70 border-gray-200 text-gray-500 cursor-not-allowed border'
                      : hasError
                      ? 'bg-red-50/20 border-red-500 ring-1 ring-red-400 text-red-900 border'
                      : isValid
                      ? 'bg-emerald-50/15 border-emerald-500 ring-1 ring-emerald-400/80 text-gray-800 border'
                      : 'bg-white border border-gray-200 text-gray-800 focus:border-[#9B0F06]'
                  }`

                  return (
                    <div 
                      key={field.name} 
                      className={`flex flex-col gap-1 ${field.type === 'textarea' ? 'col-span-2' : 'col-span-1'}`}
                    >
                      <label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-[#9B0F06] font-bold">*</span>}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {field.refTable && (
                            <span className="text-[9px] text-gray-400 font-normal normal-case">
                              (Vinculado con: {field.refTable})
                            </span>
                          )}
                          {field.type === 'integer' && <span className="text-[8.5px] text-gray-400 font-mono normal-case">Entero</span>}
                          {field.type === 'decimal' && <span className="text-[8.5px] text-gray-400 font-mono normal-case">Decimal</span>}
                          {field.type === 'email' && <span className="text-[8.5px] text-gray-400 font-mono normal-case">Email</span>}
                        </span>
                      </label>

                      {/* Renderizado según tipo de campo */}
                      {field.type === 'boolean' ? (
                        <div className="flex items-center gap-2.5 h-8 px-1">
                          <button
                            type="button"
                            disabled={isFieldDisabled}
                            onClick={() => setFormData(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                              formData[field.name] ? 'bg-[#9B0F06]' : 'bg-gray-200'
                            } ${isFieldDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                formData[field.name] ? 'translate-x-3.5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-[11px] font-medium text-gray-700">
                            {formData[field.name] ? 'Activo / Sí' : 'Inactivo / No'}
                          </span>
                        </div>
                      ) : field.type === 'select' ? (
                        <div className="relative">
                          <select
                            value={formData[field.name] !== undefined && formData[field.name] !== null ? String(formData[field.name]) : ''}
                            onChange={e => handleInputChange(field, e.target.value)}
                            onBlur={() => handleBlur(field)}
                            disabled={isFieldDisabled}
                            className={inputClass}
                          >
                            <option value="">Seleccione una opción...</option>
                            {(optionsMap[field.name] || []).map((opt: any) => (
                              <option key={opt[field.valueKey || 'id']} value={opt[field.valueKey || 'id']}>
                                {opt[field.labelKey || 'nombre'] || opt.descripcion || opt.codigo || opt.id}
                              </option>
                            ))}
                          </select>
                          {loadingOptions[field.name] && (
                            <span className="absolute right-2 top-2 text-[9px] text-gray-400 animate-pulse">Cargando...</span>
                          )}
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={formData[field.name] !== undefined && formData[field.name] !== null ? formData[field.name] : ''}
                          onChange={e => handleInputChange(field, e.target.value)}
                          onBlur={() => handleBlur(field)}
                          disabled={isFieldDisabled}
                          className={`w-full p-2 text-[11px] rounded-lg transition-colors focus:outline-none resize-none ${
                            isFieldDisabled
                              ? 'bg-gray-100/70 border-gray-200 text-gray-500 cursor-not-allowed border'
                              : hasError
                              ? 'bg-red-50/20 border-red-500 ring-1 ring-red-400 text-red-900 border'
                              : 'bg-white border border-gray-200 text-gray-800 focus:border-[#9B0F06]'
                          }`}
                          placeholder={`Ingrese ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <div className="relative">
                          <input
                            type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                            value={formData[field.name] !== undefined && formData[field.name] !== null ? formData[field.name] : ''}
                            onChange={e => handleInputChange(field, e.target.value)}
                            onBlur={() => handleBlur(field)}
                            disabled={isFieldDisabled}
                            className={inputClass}
                            placeholder={
                              field.type === 'integer'
                                ? '0'
                                : field.type === 'decimal'
                                ? '0.00'
                                : field.type === 'email'
                                ? 'correo@ejemplo.com'
                                : `Ingrese ${field.label.toLowerCase()}`
                            }
                          />
                          {isValid && (
                            <div className="absolute right-2 top-2 pointer-events-none text-emerald-600">
                              <CheckCircle2 size={12} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mensaje de error en vivo debajo del campo */}
                      {hasError && (
                        <div className="flex items-center gap-1 text-[9.5px] text-red-600 font-medium mt-0.5">
                          <AlertCircle size={10} className="flex-shrink-0" />
                          <span>{fieldErrors[field.name]}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer con Botones Institucionales */}
        <div className="flex-shrink-0 px-6 py-3.5 border-t border-gray-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold h-8 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              form="mantenimiento-form"
              disabled={isSaving}
              className="flex-1 bg-[#9B0F06] hover:bg-[#7a0c05] text-white text-xs font-semibold h-8 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : mode === 'create' ? (
                <span>Crear Registro</span>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
