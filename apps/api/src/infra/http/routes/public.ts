import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { tenant } from '../middlewares/tenant'
import { prisma } from '../../database/prisma'
import { randomUUID } from 'crypto'

export async function publicRoutes(app: FastifyInstance) {
  // gera o token público para um projeto
  app.post(
    '/projects/:projectId/public-token',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }

      const bodySchema = z.object({
        expiresInDays: z.number().int().min(1).max(365).optional(),
      })

      const body = bodySchema.safeParse(request.body)

      if (!body.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR' })
      }

      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: request.tenant.organizationId },
      })

      if (!project) {
        return reply.status(404).send({ error: 'PROJECT_NOT_FOUND' })
      }

      const token = randomUUID()
      const expiresAt = body.data.expiresInDays
        ? new Date(Date.now() + body.data.expiresInDays * 24 * 60 * 60 * 1000)
        : null

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          publicToken: token,
          publicTokenExpiresAt: expiresAt,
        },
      })

      return reply.send({
        token,
        expiresAt: updated.publicTokenExpiresAt,
        url: `/public/${token}`,
      })
    }
  )

  // view pública — sem autenticação
  app.get('/public/:token', async (request, reply) => {
    const { token } = request.params as { token: string }

    const project = await prisma.project.findUnique({
      where: { publicToken: token },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!project) {
      return reply.status(404).send({ error: 'PROJECT_NOT_FOUND' })
    }

    if (project.publicTokenExpiresAt && project.publicTokenExpiresAt < new Date()) {
      return reply.status(410).send({ error: 'TOKEN_EXPIRED' })
    }

    const totalTasks = project.columns.flatMap((c) => c.tasks).length
    const doneTasks = project.columns.at(-1)?.tasks.length ?? 0
    const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    return reply.send({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
      },
      completionPercent,
      totalTasks,
      doneTasks,
      columns: project.columns.map((col) => ({
        id: col.id,
        name: col.name,
        order: col.order,
        taskCount: col.tasks.length,
        tasks: col.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
      })),
    })
  })
}