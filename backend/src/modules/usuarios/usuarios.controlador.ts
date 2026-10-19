import { obtenerRolPorNombre } from '@/modules/roles/roles.servicio';
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware';
import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  listarDelegadosResidente,
  obtenerUsuarioPorId,
  actualizarUsuario,
  verificarUsernameDisponible, verificarCorreoDisponible,
} from '@/modules/usuarios/usuarios.servicio'

export const esquemaUsuario = z.object({
  primer_nombre: z.string().min(1),
  segundo_nombre: z.string().optional().nullable(),
  primer_apellido: z.string().min(1),
  segundo_apellido: z.string().optional().nullable(),
  correo: z.string().email(),
  telefono: z.string().min(4),
  rol: z.string().min(2),
  estado: z.enum(['Activo', 'Inactivo', 'Suspendido']),
  contrasena: z.string().min(6).optional(),
  proyectosAsignados: z.array(z.string()).optional(),
  username: z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Nombre de usuario inválido (sin espacios ni @)').min(3).max(30).optional().nullable().or(z.literal('')),
  fecha_nacimiento: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        const parts = val.split('T')[0].split('-')
        if (parts.length !== 3) return false
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        const d = parseInt(parts[2], 10)
        if (isNaN(y) || isNaN(m) || isNaN(d)) return false
        const dateObj = new Date(y, m - 1, d)
        if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) return false
        const hoy = new Date()
        let edad = hoy.getFullYear() - y
        const mesActual = hoy.getMonth() + 1
        if (mesActual < m || (mesActual === m && hoy.getDate() < d)) {
          edad--
        }
        return edad >= 18 && edad <= 100
      },
      {
        message: 'La edad no puede ser menor a 18 años ni exceder los 100 años',
      }
    ),
  direccion: z.string().optional().nullable(),
})

export async function listarUsuariosControlador(req: Request, res: Response) {
  const usuarios = await listarUsuarios({
    busqueda: typeof req.query.busqueda === 'string' ? req.query.busqueda : undefined,
    rol: typeof req.query.rol === 'string' ? req.query.rol : undefined,
    estado:
      req.query.estado === 'Activo' || req.query.estado === 'Inactivo' || req.query.estado === 'Suspendido' || req.query.estado === 'Todos'
        ? (req.query.estado as 'Activo' | 'Inactivo' | 'Suspendido' | 'Todos')
        : undefined,
  })

  return sendResponse(res, 200, usuarios, 'Usuarios obtenidos correctamente')
}

export async function listarDelegadosResidenteControlador(req: Request, res: Response) {
  const busqueda = typeof req.query.busqueda === 'string' ? req.query.busqueda : (typeof req.query.q === 'string' ? req.query.q : undefined)
  const delegados = await listarDelegadosResidente(busqueda)
  return sendResponse(res, 200, delegados, 'Delegados residentes obtenidos correctamente')
}

export async function obtenerUsuarioControlador(req: Request, res: Response) {
  const usuario = await obtenerUsuarioPorId(req.params.id)
  if (!usuario) {
    return sendError(res, 404, 'Usuario no encontrado')
  }

  return sendResponse(res, 200, usuario, 'Usuario obtenido correctamente')
}

export async function crearUsuarioControlador(req: Request, res: Response) {
  const resultado = esquemaUsuario.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de usuario inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const usuario = await crearUsuario(resultado.data)
    return sendResponse(res, 201, usuario, 'Usuario creado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo crear el usuario', error instanceof Error ? error.message : error)
  }
}

export async function actualizarUsuarioControlador(req: SolicitudAutenticada, res: Response) {
  const resultado = esquemaUsuario.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de usuario inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    
  try {
    const targetUser = await obtenerUsuarioPorId(req.params.id);
    if (targetUser) {
      const isMyRoleAdmin = (req.usuario?.rol || '').toLowerCase().trim() === 'administrador' || (req.usuario?.rol || '').toLowerCase().trim() === 'admin';
      if (!isMyRoleAdmin) {
        const targetRole = await obtenerRolPorNombre(targetUser.rol);
        const targetNivel = targetRole ? targetRole.nivel_permisos : 0;
        const myNivel = req.usuario?.nivel_permisos || 0;
        if (targetNivel > myNivel) {
          return sendError(res, 403, 'No tienes jerarquía suficiente para modificar este usuario');
        }
      }
    }
  } catch (err) {
    return sendError(res, 500, 'Error verificando jerarquía');
  }

    const usuario = await actualizarUsuario(req.params.id, resultado.data)
    return sendResponse(res, 200, usuario, 'Usuario actualizado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo actualizar el usuario', error instanceof Error ? error.message : error)
  }
}

export async function eliminarUsuarioControlador(req: SolicitudAutenticada, res: Response) {
  try {
    
  try {
    if (req.usuario?.sub === req.params.id) {
      return sendError(res, 400, 'No puedes eliminar tu propia cuenta de usuario');
    }
    const targetUser = await obtenerUsuarioPorId(req.params.id);
    if (targetUser) {
      const isTargetOwner = (targetUser as any).correo?.toLowerCase().trim() === 'daniel.figueroa@domunnet.test' || (targetUser as any).username?.toLowerCase().trim() === 'dani';
      if (isTargetOwner) {
        return sendError(res, 403, 'No se puede eliminar la cuenta de administración principal');
      }

      const isMyRoleAdmin = (req.usuario?.rol || '').toLowerCase().trim() === 'administrador' || (req.usuario?.rol || '').toLowerCase().trim() === 'admin';
      if (!isMyRoleAdmin) {
        const targetRole = await obtenerRolPorNombre(targetUser.rol);
        const targetNivel = targetRole ? targetRole.nivel_permisos : 0;
        const myNivel = req.usuario?.nivel_permisos || 0;
        if (targetNivel > myNivel) {
          return sendError(res, 403, 'No tienes jerarquía suficiente para eliminar este usuario');
        }
      }
    }
  } catch (err) {
    return sendError(res, 500, 'Error verificando jerarquía');
  }

      const usuario = await eliminarUsuario(req.params.id)
    return sendResponse(res, 200, usuario, 'Usuario eliminado correctamente')
  } catch (error) {
    return sendError(res, 404, 'No se pudo eliminar el usuario', error instanceof Error ? error.message : error)
  }
}


export async function validarCorreoControlador(req: Request, res: Response) {
  const correo = req.query.correo
  const excluirId = req.query.excluir_id as string | undefined

  if (typeof correo !== 'string' || !correo) {
    return sendError(res, 400, 'El parámetro correo es requerido')
  }

  const correoNormalizado = correo.trim().toLowerCase()
  const disponible = await verificarCorreoDisponible(correoNormalizado, excluirId)
  return sendResponse(res, 200, { disponible }, 'Verificación de correo realizada')
}

export async function validarUsernameControlador(req: Request, res: Response) {
  const username = req.query.username
  const excluirId = req.query.excluir_id as string | undefined

  if (typeof username !== 'string' || !username) {
    return sendError(res, 400, 'El parámetro username es requerido')
  }

  const usernameNormalizado = username.trim().toLowerCase()
  const disponible = await verificarUsernameDisponible(usernameNormalizado, excluirId)
  return sendResponse(res, 200, { disponible }, 'Verificación de username realizada')
}
