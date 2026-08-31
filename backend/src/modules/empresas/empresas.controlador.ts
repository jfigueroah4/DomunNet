import { Request, Response } from 'express';
import { listarEmpresas, obtenerEmpresa, crearEmpresaWizard, eliminarEmpresa, actualizarEmpresa } from './empresas.servicio';
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
    const payload = wizardEmpresaSchema.parse(req.body);
    const empresa = await crearEmpresaWizard(payload);
    res.status(201).json({ data: empresa });
  } catch (error: any) {
    // Si el rollback falla mandamos un json estructurado o lo dejamos en message
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
