import { ProyectoEditorView } from '@/components/modules/proyectos/ProyectoEditorView'
import { proyectoService } from '@/services/proyectos/proyecto.service'

export default async function EditarProyectoPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const proyecto = await proyectoService.getProyectoBySlug(id)

  return <ProyectoEditorView modo="editar" proyectoInicial={proyecto} />
}
