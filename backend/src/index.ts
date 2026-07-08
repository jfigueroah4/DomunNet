import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { responseError, responseNotFound } from '@/shared/response'
import { publicRouter } from '@/modules/public/public.routes'
import { authRouter } from '@/modules/auth/auth.routes'
import { usuariosRouter } from '@/modules/usuarios/usuarios.routes'
import { rolesRouter } from '@/modules/roles/roles.routes'
import { configuracionRouter } from '@/modules/configuracion/configuracion.routes'
import { catalogosRouter } from '@/modules/catalogos/catalogos.routes'
import { backupRouter } from '@/modules/backup/backup.routes'

const app = express()
const PORT = Number(process.env.PORT || 3001)
const NODE_ENV = process.env.NODE_ENV || 'development'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
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
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
    },
    message: 'API operativa',
    errors: null,
  })
})

app.use('/api/v1', publicRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/usuarios', usuariosRouter)
app.use('/api/v1/roles', rolesRouter)
app.use('/api/v1/configuracion', configuracionRouter)
app.use('/api/v1/catalogos', catalogosRouter)
app.use('/api/v1/backup', backupRouter)

app.use((_req, res) => responseNotFound(res, 'Endpoint no encontrado'))
app.use((error: Error, _req: express.Request, res: express.Response) => {
  responseError(res, 500, 'Error interno del servidor', error.message)
})

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
})
