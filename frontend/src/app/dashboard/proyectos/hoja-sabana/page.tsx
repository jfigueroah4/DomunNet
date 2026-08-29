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

  return <HojaSabanaView slug={slug} />
}
