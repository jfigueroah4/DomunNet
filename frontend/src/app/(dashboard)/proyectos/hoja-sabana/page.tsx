import { HojaSabanaView } from '@/components/modules/proyectos/HojaSabanaView'
import { redirect } from 'next/navigation'

export default async function HojaSabanaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const slug = searchParams.slug

  if (!slug || typeof slug !== 'string') {
    redirect('/dashboard/proyectos')
  }

  // Si quisiéramos inyectar data de Supabase aquí en el server component:
  // const data = await proyectoService.getHojaSabanaData(slug)
  // Pero como HojaSabanaView tiene estado y data quemada temporal, pasaremos el slug.

  return <HojaSabanaView slug={slug} />
}
