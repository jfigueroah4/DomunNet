import { ProyectoDetalleView } from '@/components/modules/proyectos/ProyectoDetalleView'
import { proyectoService } from '@/services/proyectos/proyecto.service'

export default async function ProyectosDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const proyecto = await proyectoService.getProyectoBySlug(id)

  return <ProyectoDetalleView proyecto={proyecto} />
}
