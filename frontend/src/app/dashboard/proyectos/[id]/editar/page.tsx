import dynamic from 'next/dynamic'
import { proyectoService } from '@/services/proyectos/proyecto.service'

const ProyectoEditorView = dynamic(
  () => import('@/components/modules/proyectos/ProyectoEditorView').then((mod) => mod.ProyectoEditorView),
  {
    loading: () => <div className="min-h-[50vh] animate-pulse rounded-xl bg-gray-100" />,
  }
)
export default async function EditarProyectoPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const proyecto = await proyectoService.getProyectoBySlug(id)

  return <ProyectoEditorView modo="editar" proyectoInicial={proyecto} />
}
