import nextDynamic from 'next/dynamic'
import { proyectoService } from '@/services/proyectos/proyecto.service'
import { redirect } from 'next/navigation'

const ProyectoEditorView = nextDynamic(
  () => import('@/components/modules/proyectos/ProyectoEditorView').then((mod) => mod.ProyectoEditorView),
  {
    loading: () => <div className="min-h-[50vh] animate-pulse rounded-xl bg-gray-100" />,
  }
)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
