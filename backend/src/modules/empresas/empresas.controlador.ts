import { Request, Response } from 'express';
import {
  listarEmpresas,
  obtenerEmpresa,
  crearEmpresaWizard,
  crearEmpresaEstandar,
  eliminarEmpresa,
  actualizarEmpresa,
  crearContactoDeEmpresaExterna,
  listarContactosDeSupervisora,
  actualizarContactoDeSupervisora,
  eliminarContactoDeSupervisora,
  obtenerProyectosDeSupervisora
} from './empresas.servicio';
import { wizardEmpresaSchema } from './empresas.schemas';

export async function getEmpresasControlador(req: Request, res: Response) {
  try {
    const empresas = await listarEmpresas();
    res.json({ data: empresas });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getEmpresaControlador(req: Request, res: Response) {
  try {
    const empresa = await obtenerEmpresa(req.params.id);
    res.json({ data: empresa });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function createEmpresaControlador(req: Request, res: Response) {
  try {
    if (req.body.nombre && !req.body.nombre_empresa) {
      const empresa = await crearEmpresaEstandar(req.body);
      return res.status(201).json({ data: empresa });
    }

    const payload = wizardEmpresaSchema.parse(req.body);
    const empresa = await crearEmpresaWizard(payload);
    res.status(201).json({ data: empresa });
  } catch (error: any) {
    if (error.message?.includes('ORPHAN_USER_ERROR')) {
      const match = error.message.match(/ID \[([a-f0-9-]+)\]/);
      const userId = match ? match[1] : null;
      res.status(500).json({ 
        error: error.message, 
        isOrphanUserError: true,
        usuario_id: userId
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
}

export async function deleteEmpresaControlador(req: Request, res: Response) {
  try {
    await eliminarEmpresa(req.params.id);
    res.json({ success: true, message: 'Empresa eliminada correctamente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateEmpresaControlador(req: Request, res: Response) {
  try {
    const data = await actualizarEmpresa(req.params.id, req.body);
    res.json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function listarContactosEmpresaControlador(req: Request, res: Response) {
  try {
    const data = await listarContactosDeSupervisora(req.params.id);
    res.json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function crearContactoEmpresaControlador(req: Request, res: Response) {
  try {
    const contacto = await crearContactoDeEmpresaExterna(req.params.id, req.body);
    res.status(201).json({ data: contacto });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function actualizarContactoEmpresaControlador(req: Request, res: Response) {
  try {
    const data = await actualizarContactoDeSupervisora(req.params.id, req.params.contactoId, req.body);
    res.json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function eliminarContactoEmpresaControlador(req: Request, res: Response) {
  try {
    await eliminarContactoDeSupervisora(req.params.id, req.params.contactoId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function listarProyectosEmpresaControlador(req: Request, res: Response) {
  try {
    const data = await obtenerProyectosDeSupervisora(req.params.id);
    res.json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
