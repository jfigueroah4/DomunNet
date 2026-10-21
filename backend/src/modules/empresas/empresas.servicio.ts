import { clienteSupabase } from '@/configuracion/cliente-supabase';
import type { WizardEmpresaType } from './empresas.schemas';
import { crearUsuario, eliminarUsuario } from '../usuarios/usuarios.servicio';
import type { DatosUsuario } from '../usuarios/usuarios.servicio';

const contactoSelect = '*, usuario(*, dato_usuario(*))';

export async function listarEmpresas() {
  const { data, error } = await clienteSupabase
    .from('empresa_externa')
    .select(`
      *, 
      contactos: contacto_empresa_externa(${contactoSelect})
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al listar empresas: ${error.message}`);
  
  return Promise.all((data || []).map(async (emp: any) => {
    let proyectosVinculados = 0;
    try {
      const { count } = await clienteSupabase
        .from('proyecto_detalle')
        .select('id', { count: 'exact', head: true })
        .ilike('empresa_supervisora', (emp.nombre || '').trim());
      proyectosVinculados = count || 0;
    } catch {
      // Ignorar error de conteo
    }
    return {
      ...emp,
      proyectos_vinculados: proyectosVinculados,
    };
  }));
}

export async function obtenerEmpresa(id: string) {
  const { data, error } = await clienteSupabase
    .from('empresa_externa')
    .select(`
      *,
      contactos: contacto_empresa_externa(${contactoSelect})
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(`Error al obtener empresa: ${error.message}`);
  
  let proyectosVinculados = 0;
  try {
    const { count } = await clienteSupabase
      .from('proyecto_detalle')
      .select('id', { count: 'exact', head: true })
      .ilike('empresa_supervisora', (data.nombre || '').trim());
    proyectosVinculados = count || 0;
  } catch {
    // Ignorar error de conteo
  }

  return {
    ...data,
    proyectos_vinculados: proyectosVinculados,
  };
}

export async function obtenerProyectosDeSupervisora(id: string) {
  const emp = await obtenerEmpresa(id);
  const nombre = emp?.nombre || '';
  const { data, error } = await clienteSupabase
    .from('proyecto_detalle')
    .select(`
      id,
      proyecto_id,
      nombre_oficial,
      tramo,
      direccion,
      monto_original,
      fecha_inicio_contractual,
      fecha_finalizacion_real,
      departamento:departamento_id(nombre),
      municipio:municipio_id(nombre),
      proyecto:proyecto_id(id, codigo, nombre, estado_id, fecha_inicio, fecha_fin_estimada)
    `)
    .ilike('empresa_supervisora', nombre.trim());

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => {
    const p = row.proyecto || {};
    return {
      id: p.id || row.proyecto_id || row.id,
      codigo: p.codigo || 'PROY',
      nombre: p.nombre || row.nombre_oficial || 'Proyecto sin nombre',
      nombreOficial: row.nombre_oficial || p.nombre || '',
      ubicacion: row.tramo || row.direccion || '',
      departamento: row.departamento?.nombre || '',
      municipio: row.municipio?.nombre || '',
      montoOriginal: Number(row.monto_original) || 0,
      presupuesto: Number(row.monto_original) || 0,
      fechaInicio: row.fecha_inicio_contractual || p.fecha_inicio || '',
      fechaFin: row.fecha_finalizacion_real || p.fecha_fin_estimada || '',
      estado: 'activo',
    };
  });
}

function datosUsuarioDesdeContacto(c: any): DatosUsuario {
  return {
    primer_nombre: c.primer_nombre || '',
    segundo_nombre: c.segundo_nombre || '',
    primer_apellido: c.primer_apellido || '',
    segundo_apellido: c.segundo_apellido || '',
    correo: c.correo || '',
    telefono: c.telefono || '',
    rol: 'Supervisor',
    estado: 'Activo',
    username: c.username || undefined,
    contrasena: c.password || undefined,
    fecha_nacimiento: c.fecha_nacimiento || undefined,
    direccion: c.direccion || undefined,
  };
}

export async function crearEmpresaEstandar(payload: any) {
  let usuarioId: string | null = null;
  if (payload.contacto && payload.contacto.primer_nombre && payload.contacto.correo) {
    const usuario = await crearUsuario(datosUsuarioDesdeContacto(payload.contacto));
    if (!usuario) throw new Error('No se pudo crear el usuario del contacto');
    usuarioId = usuario.id;
  }
  try {
    const { data, error } = await clienteSupabase.from('empresa_externa').insert({
      nombre: payload.nombre,
      nit: payload.nit,
      direccion: payload.direccion,
      telefono: payload.telefono,
      correo_institucional: payload.correo_institucional,
      activo: payload.activo ?? true,
    }).select('id').single();

    if (error) throw new Error(error.message);

    if (usuarioId && payload.contacto) {
      const nombreCompleto = [payload.contacto.primer_nombre, payload.contacto.primer_apellido].filter(Boolean).join(' ');
      const contacto = await clienteSupabase.from('contacto_empresa_externa').insert({
        empresa_externa_id: data.id,
        usuario_id: usuarioId,
        nombre: nombreCompleto,
        cargo: payload.contacto.cargo || 'Supervisor',
        telefono: payload.contacto.telefono,
        correo: payload.contacto.correo,
      }).select('id').single();

      if (contacto.error) throw new Error(contacto.error.message);
    }
    return obtenerEmpresa(data.id);
  } catch (error) {
    if (usuarioId) await eliminarUsuario(usuarioId);
    throw error;
  }
}

export async function crearEmpresaWizard(payload: WizardEmpresaType) {
  let createdUserId = payload.usuario_id;

  // 1. Crear el usuario si aún no existe (manejo de reintento)
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
        rol: 'Supervisor',
        estado: 'Activo',
        username: payload.username,
        contrasena: payload.password,
        fecha_nacimiento: fechaNacimiento,
        direccion: payload.direccion_contacto
      });

      if (!nuevoUser) {
        throw new Error('No se recibió información del usuario creado');
      }
      createdUserId = nuevoUser.id;
    } catch (error: any) {
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
        throw new Error(`ORPHAN_USER_ERROR: Falló la creación de la empresa (${error.message}), y el rollback del usuario también falló. El usuario se creó exitosamente con el ID [${createdUserId}], pero la empresa no.`);
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
    .or(`empresa_externa_id.eq.${id},empresa_id.eq.${id}`);

  // 2. Eliminar la empresa
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
  const nombre = payload.nombre || payload.nombre_empresa;
  const direccion = payload.direccion || payload.direccion_empresa;
  const telefono = payload.telefono || payload.telefono_empresa;

  // 1. Actualizar empresa
  const { data, error } = await clienteSupabase
    .from('empresa_externa')
    .update({
      nombre,
      nit: payload.nit,
      direccion,
      telefono,
      correo_institucional: payload.correo_institucional,
      activo: payload.activo,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 2. Actualizar contacto si viene especificado
  if (payload.contacto) {
    const { data: contactos } = await clienteSupabase
      .from('contacto_empresa_externa')
      .select('id, usuario_id')
      .or(`empresa_externa_id.eq.${id},empresa_id.eq.${id}`)
      .limit(1);

    const contacto = contactos && contactos.length > 0 ? contactos[0] : null;
    if (contacto) {
      await actualizarContactoDeSupervisora(id, contacto.id, payload.contacto);
    }
  }

  return obtenerEmpresa(id);
}

export async function listarContactosDeSupervisora(empresaId: string) {
  const { data, error } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select(contactoSelect)
    .or(`empresa_externa_id.eq.${empresaId},empresa_id.eq.${empresaId}`);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function crearContactoDeEmpresaExterna(empresaId: string, payload: any) {
  let usuarioId = payload.usuario_id;
  let nombreContacto = '';
  if (!usuarioId) {
    const usuario = await crearUsuario({
      primer_nombre: payload.primer_nombre,
      segundo_nombre: payload.segundo_nombre || '',
      primer_apellido: payload.primer_apellido,
      segundo_apellido: payload.segundo_apellido || '',
      correo: payload.correo,
      telefono: payload.telefono,
      rol: payload.rol || 'Supervisor',
      estado: 'Activo',
      username: payload.username,
      contrasena: payload.password,
      fecha_nacimiento: payload.fecha_nacimiento,
      direccion: payload.direccion,
    });
    if (!usuario) throw new Error('No se pudo crear el usuario del contacto');
    usuarioId = usuario.id;
    nombreContacto = `${payload.primer_nombre || ''} ${payload.primer_apellido || ''}`.trim();
  } else {
    const { data: u } = await clienteSupabase.from('usuario').select('*, dato_usuario(*)').eq('id', usuarioId).single();
    const du = Array.isArray(u?.dato_usuario) ? u.dato_usuario[0] : u?.dato_usuario || {};
    nombreContacto = `${du.primer_nombre || u?.primer_nombre || ''} ${du.primer_apellido || u?.primer_apellido || ''}`.trim() || u?.username || '';
  }

  const { data: existente } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select(contactoSelect)
    .or(`empresa_externa_id.eq.${empresaId},empresa_id.eq.${empresaId}`)
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  if (existente) return existente;

  const { data, error } = await clienteSupabase
    .from('contacto_empresa_externa')
    .insert({
      empresa_externa_id: empresaId,
      usuario_id: usuarioId,
      nombre: nombreContacto || null,
      cargo: payload.cargo || 'Supervisor',
      telefono: payload.telefono,
      correo: payload.correo,
    })
    .select(contactoSelect)
    .single();

  if (error) {
    if (!payload.usuario_id) await eliminarUsuario(usuarioId);
    throw new Error(error.message);
  }
  return data;
}

export async function actualizarContactoDeSupervisora(empresaId: string, contactoId: string, payload: any) {
  const { data: c, error } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select('id, usuario_id')
    .eq('id', contactoId)
    .single();

  if (error || !c) throw new Error('Contacto no encontrado');

  if (c.usuario_id) {
    await clienteSupabase.from('dato_usuario').update({
      primer_nombre: payload.primer_nombre,
      segundo_nombre: payload.segundo_nombre || null,
      primer_apellido: payload.primer_apellido,
      segundo_apellido: payload.segundo_apellido || null,
      telefono: payload.telefono,
      email: payload.correo,
      username: payload.username,
      fecha_nacimiento: payload.fecha_nacimiento || null,
      direccion: payload.direccion || null,
      updated_at: new Date().toISOString()
    }).eq('usuario_id', c.usuario_id);

    if (payload.correo) {
      await clienteSupabase.from('usuario').update({ correo: payload.correo, updated_at: new Date().toISOString() }).eq('id', c.usuario_id);
    }
  }

  const nombreCompleto = [payload.primer_nombre, payload.segundo_nombre, payload.primer_apellido, payload.segundo_apellido].filter(Boolean).join(' ');
  await clienteSupabase.from('contacto_empresa_externa').update({
    nombre: nombreCompleto || undefined,
    cargo: payload.cargo,
    telefono: payload.telefono,
    correo: payload.correo,
    updated_at: new Date().toISOString()
  }).eq('id', contactoId);

  const { data: contactoActualizado } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select(contactoSelect)
    .eq('id', contactoId)
    .single();

  return contactoActualizado;
}

export async function eliminarContactoDeSupervisora(empresaId: string, contactoId: string) {
  const { data: c, error } = await clienteSupabase
    .from('contacto_empresa_externa')
    .select('id, usuario_id')
    .eq('id', contactoId)
    .single();

  if (error || !c) throw new Error('Contacto no encontrado');

  const { error: delError } = await clienteSupabase
    .from('contacto_empresa_externa')
    .delete()
    .eq('id', contactoId);
  if (delError) throw new Error(delError.message);

  if (c.usuario_id) {
    try {
      await eliminarUsuario(c.usuario_id);
    } catch (e) {
      console.warn('Usuario no eliminado al borrar contacto:', e);
    }
  }

  return { ok: true };
}
