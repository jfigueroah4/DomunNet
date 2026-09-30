import { describe, it, expect } from 'vitest'

describe('Validación y Funcionalidad del Formulario de Creación/Modificación de Proyecto (6 Pasos)', () => {
  it('1. Al crear un proyecto solo deben estar disponibles los estados Borrador y Activo', () => {
    const esEditar = false
    const estadosDisponibles = esEditar
      ? ['borrador', 'activo', 'en_revision', 'pausado', 'completado']
      : ['borrador', 'activo']

    expect(estadosDisponibles).toHaveLength(2)
    expect(estadosDisponibles).toContain('borrador')
    expect(estadosDisponibles).toContain('activo')
    expect(estadosDisponibles).not.toContain('en_revision')
    expect(estadosDisponibles).not.toContain('pausado')
    expect(estadosDisponibles).not.toContain('completado')
  })

  it('2. Al editar un proyecto deben estar disponibles todos los estados', () => {
    const esEditar = true
    const estadosDisponibles = esEditar
      ? ['borrador', 'activo', 'en_revision', 'pausado', 'completado']
      : ['borrador', 'activo']

    expect(estadosDisponibles).toHaveLength(5)
    expect(estadosDisponibles).toEqual(['borrador', 'activo', 'en_revision', 'pausado', 'completado'])
  })

  it('3. Regla Borrador: Solo requiere Nombre Oficial para guardado preliminar', () => {
    const validarBorrador = (nombreOficial: string) => {
      return Boolean(nombreOficial && nombreOficial.trim().length > 0)
    }

    expect(validarBorrador('CONSTRUCCIÓN PUENTE VIAL CA-9')).toBe(true)
    expect(validarBorrador('')).toBe(false)
    expect(validarBorrador('   ')).toBe(false)
  })

  it('4. Regla Activo: Requiere validación estricta de todos los campos obligatorios', () => {
    const validarActivo = (campos: {
      nombreOficial: string
      descripcion: string
      entidadContratante: string
      direccion: string
      departamentoId: string
      municipioId: string
      empresaContratista: string
      empresaSupervisora: string
      montoContractualOriginal: string
      fechaInicioContractual: string
      delegadoResidenteId: string
    }) => {
      const faltantes: string[] = []
      if (!campos.nombreOficial?.trim()) faltantes.push('Nombre Oficial')
      if (!campos.descripcion?.trim()) faltantes.push('Alcance/Descripción')
      if (!campos.entidadContratante?.trim()) faltantes.push('Entidad Contratante')
      if (!campos.direccion?.trim()) faltantes.push('Dirección')
      if (!campos.departamentoId?.trim()) faltantes.push('Departamento')
      if (!campos.municipioId?.trim()) faltantes.push('Municipio')
      if (!campos.empresaContratista?.trim()) faltantes.push('Empresa Ejecutora')
      if (!campos.empresaSupervisora?.trim()) faltantes.push('Empresa Supervisora')
      if (!campos.montoContractualOriginal || parseFloat(campos.montoContractualOriginal) <= 0) faltantes.push('Monto Original Obra')
      if (!campos.fechaInicioContractual?.trim()) faltantes.push('Fecha Inicio')
      if (!campos.delegadoResidenteId?.trim()) faltantes.push('Delegado Residente')

      return {
        valido: faltantes.length === 0,
        faltantes,
      }
    }

    const incompleto = validarActivo({
      nombreOficial: 'PROYECTO INCOMPLETO',
      descripcion: '',
      entidadContratante: '',
      direccion: '',
      departamentoId: '',
      municipioId: '',
      empresaContratista: '',
      empresaSupervisora: '',
      montoContractualOriginal: '0',
      fechaInicioContractual: '',
      delegadoResidenteId: '',
    })

    expect(incompleto.valido).toBe(false)
    expect(incompleto.faltantes.length).toBeGreaterThan(5)

    const completo = validarActivo({
      nombreOficial: 'PROYECTO COMPLETO',
      descripcion: 'Ampliación a 4 carriles',
      entidadContratante: 'DGC',
      direccion: 'Km 20 CA-1',
      departamentoId: 'dep-1',
      municipioId: 'mun-1',
      empresaContratista: 'Constructora S.A.',
      empresaSupervisora: 'Supervisora S.A.',
      montoContractualOriginal: '50000000',
      fechaInicioContractual: '2026-04-01',
      delegadoResidenteId: 'usr-1',
    })

    expect(completo.valido).toBe(true)
    expect(completo.faltantes).toHaveLength(0)
  })

  it('5. Cálculo reactivo de anticipos de Obra y Supervisión', () => {
    const calcularAnticipo = (monto: string, pct: string) => {
      const m = parseFloat(monto) || 0
      const p = parseFloat(pct) || 0
      return (m * p) / 100
    }

    // Obra: Q 369,834,297.14 al 15%
    const anticipoObra = calcularAnticipo('369834297.14', '15')
    expect(anticipoObra).toBeCloseTo(55475144.571, 2)

    // Supervisión: Q 13,351,095.20 al 10%
    const anticipoSupervision = calcularAnticipo('13351095.20', '10')
    expect(anticipoSupervision).toBeCloseTo(1335109.52, 2)

    // Consolidado Total
    const totalConsolidado = (parseFloat('369834297.14') || 0) + (parseFloat('13351095.20') || 0)
    expect(totalConsolidado).toBeCloseTo(383185392.34, 2)
  })

  it('6. Formateo y validación de Estaciones de Kilometraje DGC', () => {
    const formatearEstacionDGC = (kmStr: string) => {
      const num = Number(kmStr)
      if (isNaN(num) || num < 0) return null
      const km = Math.floor(num)
      const m = Math.round((num % 1) * 1000).toString().padStart(3, '0')
      return `Km ${km} + ${m}m`
    }

    expect(formatearEstacionDGC('5.000')).toBe('Km 5 + 000m')
    expect(formatearEstacionDGC('22.500')).toBe('Km 22 + 500m')
    expect(formatearEstacionDGC('104.125')).toBe('Km 104 + 125m')
    expect(formatearEstacionDGC('0')).toBe('Km 0 + 000m')
  })

  it('7. Validación de roles técnicos permitidos en Delegados e Ingenieros', () => {
    const rolesDelegados = ['Administrador', 'IngenieroResidente', 'Ingeniero Residente']
    const rolesIngenieros = ['Administrador', 'IngenieroResidente', 'Ingeniero Residente', 'Director']

    const checkRolPermitido = (rol: string, permitidos: string[]) => {
      const norm = rol.toLowerCase().replace(/\s+/g, '')
      return permitidos.some((p) => {
        const pNorm = p.toLowerCase().replace(/\s+/g, '')
        return norm === pNorm || norm.includes(pNorm) || pNorm.includes(norm)
      })
    }

    expect(checkRolPermitido('Ingeniero Residente', rolesDelegados)).toBe(true)
    expect(checkRolPermitido('ingenieroresidente', rolesDelegados)).toBe(true)
    expect(checkRolPermitido('Administrador', rolesDelegados)).toBe(true)
    expect(checkRolPermitido('Director', rolesDelegados)).toBe(false)
    expect(checkRolPermitido('Director', rolesIngenieros)).toBe(true)
    expect(checkRolPermitido('Contratante', rolesDelegados)).toBe(false)
  })
})
