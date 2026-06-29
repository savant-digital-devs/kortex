import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { env } from './config/env'
import { prisma } from './infra/database/prisma'
import { redis } from './infra/cache/redis'
import { authRoutes } from './infra/http/routes/auth'
import { organizationRoutes } from './infra/http/routes/organizations'
import { projectRoutes } from './infra/http/routes/projects'
import { columnRoutes } from './infra/http/routes/columns'
import { taskRoutes } from './infra/http/routes/tasks'
import { timeTrackingRoutes } from './infra/http/routes/time-tracking'
import { bootstrapCommandBus } from './application/command-bus/bootstrap'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
})

bootstrapCommandBus()

async function registerPlugins() {
  await app.register(cors, { origin: true })
  await app.register(helmet)
}

async function registerRoutes() {
  await app.register(authRoutes, { prefix: '/api/v1' })
  await app.register(organizationRoutes, { prefix: '/api/v1' })
  await app.register(projectRoutes, { prefix: '/api/v1' })
  await app.register(columnRoutes, { prefix: '/api/v1' })
  await app.register(taskRoutes, { prefix: '/api/v1' })
  await app.register(timeTrackingRoutes, { prefix: '/api/v1' })
}

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error)
  reply.status(500).send({ error: 'INTERNAL_SERVER_ERROR' })
})

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

await registerPlugins()
await registerRoutes()

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

const signals = ['SIGINT', 'SIGTERM'] as const

for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Sinal ${signal} recebido, encerrando servidor...`)
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  })
}