import { clienteSupabase } from '@/configuracion/cliente-supabase';
import type { WizardEmpresaType } from './empresas.schemas';
import { crearUsuario, eliminarUsuario } from '../usuarios/usuarios.servicio';

export async function listarEmpresas() {
  const { data, error } = await clienteSupabase
    .from('empresa_externa')
    .select(`
      *, 
      contactos: contacto_empresa_externa(*, usuario(*, dato_usuario(*))),
      como_contratante: proyecto_detalle!proyecto_detalle_empresa_contratante_id_fkey(id),
      como_contratista: proyecto_detalle!proyecto_detalle_empresa_contratista_id_fkey(id)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al listar empresas: ${error.message}`);
  
  return data.map((emp: any) => {
    const proyectosVinculados = (emp.como_contratante?.length || 0) + (emp.como_contratista?.length || 0);
    delete emp.como_contratante;
    delete emp.como_contratista;
    return {
      ...emp,
      proyectos_vinculados: proyectosVinculados
    };
  });
}

export async function obtenerEmpresa(id: string) {
  const { data, error } = await clienteSupabase
    .from('empresa_externa')
    .select(`
      *, 
      contactos: contacto_empresa_externa(*),
      como_contratante: proyecto_detalle!proyecto_detalle_empresa_contratante_id_fkey(id),
      como_contratista: proyecto_detalle!proyecto_detalle_empresa_contratista_id_fkey(id)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(`Error al obtener empresa: ${error.message}`);
  
  const proyectosVinculados = (data.como_contratante?.length || 0) + (data.como_contratista?.length || 0);
  delete data.como_contratante;
  delete data.como_contratista;
  
  return {
    ...data,
    proyectos_vinculados: proyectosVinculados
  };
}

export async function crearEmpresaWizard(payload: WizardEmpresaType) {
  let createdUserId = payload.usuario_id;

  // 1. Crear el usuario si an no existe (manejo de reintento)
  if (!createdUserId) {
    try {
      // Fecha de nacimiento a YYYY-MM-DD
      const diaStr = payload.diaNacimiento.padStart(2, '0');
      const mesStr = payload.mesNacimiento.padStart(2, '0');
      const fechaNacimiento = `${payload.anoNacimiento}-${mesStr}-${diaStr}`;

      const nuevoUser = await crearUsuario({
        primer_nombre: payload.primer_nombre,
        segundo_nombre: payload.segundo_nombre || '',
        primer_apellido: payload.primer_apellido,
        segundo_apellido: payload.segundo_apellido || '',
        correo: payload.correo_contacto,
        telefono: payload.telefono_contacto,
        rol: 'Contratante', // Enviamos el nombre del rol porque crearUsuario usa validarRolExiste que busca por nombre_rol
        estado: 'Activo',
        username: payload.username,
        contrasena: payload.password,
        fecha_nacimiento: fechaNacimiento,
        direccion: payload.direccion_contacto
      });

      if (!nuevoUser) {
        throw new Error('No se recibi informacin del usuario creado');
      }
      createdUserId = nuevoUser.id;
    } catch (error: any) {
      // Fallo al crear usuario (ej. duplicado, email invlido). No hay nada que deshacer aqu.
      throw new Error(error.message);
    }
  }

  // 2. Crear la Empresa y el Contacto
  try {
    const { data: empresaResult, error: empresaError } = await clienteSupabase
      .from('empresa_externa')
      .insert({
        nombre: payload.nombre_empresa,
        nit: payload.nit,
        direccion: payload.direccion_empresa,
        telefono: payload.telefono_empresa,
        correo_institucional: payload.correo_institucional,
        activo: payload.activo,
      })
      .select('id')
      .single();

    if (empresaError) throw new Error(`Error BD empresa: ${empresaError.message}`);

    const nombreCompleto = [payload.primer_nombre, payload.segundo_nombre, payload.primer_apellido, payload.segundo_apellido]
      .filter(Boolean).join(' ');

    const { error: contactoError } = await clienteSupabase
      .from('contacto_empresa_externa')
      .insert({
        empresa_externa_id: empresaResult.id,
        usuario_id: createdUserId,
        nombre: nombreCompleto,
        cargo: payload.cargo,
        telefono: payload.telefono_contacto,
        correo: payload.correo_contacto
      });

    if (contactoError) throw new Error(`Error BD contacto: ${contactoError.message}`);

    return await obtenerEmpresa(empresaResult.id);

  } catch (error: any) {
    // 3. Rollback Manual si falla Empresa/Contacto
    if (createdUserId) {
      try {
        await eliminarUsuario(createdUserId);
      } catch (rollbackError: any) {
        // Fallo el rollback! (Doble falla)
        throw new Error(`ORPHAN_USER_ERROR: Fall la creacin de la empresa (${error.message}), y el rollback del usuario tambin fall. El usuario se cre exitosamente con el ID [${createdUserId}], pero la empresa no. Por favor, utilice el botn "Reintentar guardar empresa" para continuar.`);
      }
    }
    throw new Error(`Error al guardar empresa/contacto: ${error.message}`);
  }
}

export async function eliminarEmpresa(id: string) {
  // 1. Obtener contactos vinculados para eliminar sus usuarios
  const { data: contactos } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select('usuario_id')
    .eq('empresa_id', id);

  // 2. Eliminar la empresa (esto eliminar en cascada el registro de contacto en DB)
  const { error } = await clienteSupabase
    .from('empresa_externa')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error al eliminar empresa: ${error.message}`);

  // 3. Eliminar los usuarios reales de la plataforma
  if (contactos && contactos.length > 0) {
    for (const contacto of contactos) {
      if (contacto.usuario_id) {
        try {
          await eliminarUsuario(contacto.usuario_id);
        } catch(e) {
          console.error('Error limpiando usuario al eliminar empresa', e);
        }
      }
    }
  }
}


export async function actualizarEmpresa(id: string, payload: any) {
  // 1. Actualizar empresa
  const { data, error } = await clienteSupabase
    .from('empresa_externa')
    .update({
      nombre: payload.nombre_empresa,
      nit: payload.nit,
      direccion: payload.direccion_empresa,
      telefono: payload.telefono_empresa,
      correo_institucional: payload.correo_institucional,
      activo: payload.activo,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 2. Actualizar contacto si existe
  const { data: contactos } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select('id, usuario_id')
    .eq('empresa_id', id)
    .limit(1);
  const contacto = contactos && contactos.length > 0 ? contactos[0] : null;

  if (contacto) {
    // Actualizar tabla contacto_empresa_externa
    await clienteSupabase
      .from('contacto_empresa_externa')
      .update({
        cargo: payload.cargo,
        telefono: payload.telefono_contacto,
        correo: payload.correo_contacto,
        updated_at: new Date().toISOString()
      })
      .eq('id', contacto.id);

    // Actualizar tabla usuario (nombres, username)
    if (contacto.usuario_id) {
      await clienteSupabase
        .from('dato_usuario')
        .update({
          primer_nombre: payload.primer_nombre,
          segundo_nombre: payload.segundo_nombre,
          primer_apellido: payload.primer_apellido,
          segundo_apellido: payload.segundo_apellido,
          username: payload.username,
          fecha_nacimiento: payload.anoNacimiento ? `${payload.anoNacimiento}-${payload.mesNacimiento}-${payload.diaNacimiento}` : null,
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', contacto.usuario_id);
    }
  }

  return data;
}
