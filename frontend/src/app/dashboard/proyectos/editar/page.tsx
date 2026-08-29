import { ProyectoEditorView } from '@/components/modules/proyectos/ProyectoEditorView'
import { proyectoService } from '@/services/proyectos/proyecto.service'
import { redirect } from 'next/navigation'

export default async function ProyectoEditarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const slug = searchParams.slug

  if (!slug || typeof slug !== 'string') {
    redirect('/dashboard/proyectos')
  }

  const proyecto = await proyectoService.getProyectoBySlug(slug)

  return <ProyectoEditorView modo="editar" proyectoInicial={proyecto} />
}
