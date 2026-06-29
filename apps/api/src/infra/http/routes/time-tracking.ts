import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'
import { tenant } from '../middlewares/tenant'
import { prisma } from '../../database/prisma'

export async function timeTrackingRoutes(app: FastifyInstance) {
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (!body || body === '') return done(null, {})
    try {
      done(null, JSON.parse(body as string))
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  // play — inicia uma sessão
  app.post(
    '/tasks/:taskId/time/start',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string }

      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          deletedAt: null,
          column: { project: { organizationId: request.tenant.organizationId } },
        },
      })

      if (!task) {
        return reply.status(404).send({ error: 'TASK_NOT_FOUND' })
      }

      const openSession = await prisma.timeSession.findFirst({
        where: { taskId, userId: request.user.sub, endedAt: null },
      })

      if (openSession) {
        return reply.status(409).send({ error: 'SESSION_ALREADY_RUNNING' })
      }

      const session = await prisma.timeSession.create({
        data: {
          taskId,
          userId: request.user.sub,
          source: 'manual',
        },
      })

      return reply.status(201).send({ session })
    }
  )

  // pause — encerra a sessão ativa
  app.patch(
    '/tasks/:taskId/time/stop',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string }

      const openSession = await prisma.timeSession.findFirst({
        where: { taskId, userId: request.user.sub, endedAt: null },
      })

      if (!openSession) {
        return reply.status(404).send({ error: 'NO_ACTIVE_SESSION' })
      }

      const session = await prisma.timeSession.update({
        where: { id: openSession.id },
        data: { endedAt: new Date() },
      })

      const durationMs = session.endedAt!.getTime() - session.startedAt.getTime()

      return reply.send({ session, durationMs })
    }
  )

  // histórico de sessões de uma task
  app.get(
    '/tasks/:taskId/time',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string }

      const sessions = await prisma.timeSession.findMany({
        where: { taskId, userId: request.user.sub },
        orderBy: { startedAt: 'desc' },
      })

      const totalMs = sessions
        .filter((s) => s.endedAt)
        .reduce((acc, s) => acc + (s.endedAt!.getTime() - s.startedAt.getTime()), 0)

      return reply.send({ sessions, totalMs })
    }
  )
}