import { ProyectoDetalleView } from '@/components/modules/proyectos/ProyectoDetalleView'
import { proyectoService } from '@/services/proyectos/proyecto.service'
import { redirect } from 'next/navigation'

export default async function ProyectoDetallesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const slug = searchParams.slug

  if (!slug || typeof slug !== 'string') {
    redirect('/dashboard/proyectos')
  }

  const proyecto = await proyectoService.getProyectoBySlug(slug)

  return <ProyectoDetalleView proyecto={proyecto} />
}
