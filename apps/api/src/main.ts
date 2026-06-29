import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { env } from './config/env.js'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
})

await app.register(cors, { origin: true })
await app.register(helmet)

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

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
    process.exit(0)
  })
}