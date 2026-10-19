import dynamic from 'next/dynamic'

export const runtime = 'edge'

const HojaSabanaView = dynamic(
  () => import('@/components/modules/proyectos/HojaSabanaView'),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
        Cargando Hoja Sábana Analítica...
      </div>
    ),
  }
)

export default function HojaSabanaPage({
  params,
}: {
  params: { id: string }
}) {
  return <HojaSabanaView id={params.id} />
}
