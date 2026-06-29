import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { tenant } from '../middlewares/tenant'
import { prisma } from '../../database/prisma'

export async function columnRoutes(app: FastifyInstance) {
  app.post(
    '/projects/:projectId/columns',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const paramsSchema = z.object({
        projectId: z.string().uuid(),
      })

      const bodySchema = z.object({
        name: z.string().min(1),
        order: z.number().int().min(0),
      })

      const params = paramsSchema.safeParse(request.params)
      const body = bodySchema.safeParse(request.body)

      if (!params.success || !body.success) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR' })
      }

      const project = await prisma.project.findFirst({
        where: { id: params.data.projectId, organizationId: request.tenant.organizationId },
      })

      if (!project) {
        return reply.status(404).send({ error: 'PROJECT_NOT_FOUND' })
      }

      const column = await prisma.column.create({
        data: {
          name: body.data.name,
          order: body.data.order,
          projectId: params.data.projectId,
        },
      })

      return reply.status(201).send({ column })
    }
  )

  app.get(
    '/projects/:projectId/columns',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }

      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: request.tenant.organizationId },
      })

      if (!project) {
        return reply.status(404).send({ error: 'PROJECT_NOT_FOUND' })
      }

      const columns = await prisma.column.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
          },
        },
      })

      return reply.send({ columns })
    }
  )
}