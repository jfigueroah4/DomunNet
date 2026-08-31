import HojaSabanaView from '@/components/modules/proyectos/HojaSabanaView'

export default function HojaSabanaPage({
  params,
}: {
  params: { id: string }
}) {
  return <HojaSabanaView id={params.id} />
}
