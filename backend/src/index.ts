import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { entorno } from '@/configuracion/entorno'
import { sendError, sendResponse } from '@/shared/response'
import { publicoRutas } from '@/modules/publico/publico.rutas'
import { autenticacionRutas } from '@/modules/autenticacion/autenticacion.rutas'
import { usuariosRutas } from '@/modules/usuarios/usuarios.rutas'
import { rolesRutas } from '@/modules/roles/roles.rutas'
import { configuracionRutas } from '@/modules/configuracion/configuracion.rutas'
import { catalogosRutas } from '@/modules/catalogos/catalogos.rutas'
import { respaldoRutas } from '@/modules/respaldo/respaldo.rutas'
import { mantenimientoRutas } from '@/modules/mantenimiento/mantenimiento.rutas'
import { auditoriaRutas } from '@/modules/auditoria/auditoria.rutas'

const app = express()
const PORT = entorno.puerto
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: entorno.origenCors, credentials: true }))
app.use(morgan('combined'))
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
  sendResponse(
    res,
    200,
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: entorno.modo,
    },
    'API operativa'
  )
})

app.use('/api/v1/publico', publicoRutas)
app.use('/api/v1/autenticacion', autenticacionRutas)
app.use('/api/v1/auth', autenticacionRutas)
app.use('/api/v1/usuarios', usuariosRutas)
app.use('/api/v1/roles', rolesRutas)
app.use('/api/v1/configuracion', configuracionRutas)
app.use('/api/v1/catalogos', catalogosRutas)
app.use('/api/v1/respaldo', respaldoRutas)
app.use('/api/v1/backup', respaldoRutas)
app.use('/api/v1/mantenimiento', mantenimientoRutas)
app.use('/api/v1/auditoria', auditoriaRutas)

app.use((_req, res) => sendError(res, 404, 'Endpoint no encontrado'))
app.use((error: Error, _req: express.Request, res: express.Response) => {
  sendError(res, 500, 'Error interno del servidor', error.message)
})

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
  console.log(`Environment: ${entorno.modo}`)
})
