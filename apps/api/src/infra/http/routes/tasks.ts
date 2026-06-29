import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { tenant } from '../middlewares/tenant'
import { commandBus } from '../../../application/command-bus/command-bus'

export async function taskRoutes(app: FastifyInstance) {
  app.post(
    '/projects/:projectId/tasks',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const bodySchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.number().int().min(0).max(3).optional(),
        dueDate: z.string().datetime().optional(),
        columnId: z.string().uuid(),
        assigneeId: z.string().uuid().optional(),
      })

      const body = bodySchema.safeParse(request.body)

      if (!body.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: body.error.flatten().fieldErrors,
        })
      }

      try {
        const task = await commandBus.dispatch(
          {
            type: 'CREATE_TASK',
            payload: {
              ...body.data,
              dueDate: body.data.dueDate ? new Date(body.data.dueDate) : undefined,
            },
          },
          {
            userId: request.user.sub,
            organizationId: request.tenant.organizationId,
            memberId: request.tenant.memberId,
            permissions: request.tenant.permissions,
            role: request.tenant.role,
          }
        )

        return reply.status(201).send({ task })
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'FORBIDDEN') return reply.status(403).send({ error: 'FORBIDDEN' })
          if (err.message === 'COLUMN_NOT_FOUND') return reply.status(404).send({ error: 'COLUMN_NOT_FOUND' })
        }
        throw err
      }
    }
  )

  app.patch(
    '/tasks/:taskId',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string }

      const bodySchema = z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        priority: z.number().int().min(0).max(3).optional(),
        dueDate: z.string().datetime().optional(),
        columnId: z.string().uuid().optional(),
        assigneeId: z.string().uuid().optional(),
      })

      const body = bodySchema.safeParse(request.body)

      if (!body.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: body.error.flatten().fieldErrors,
        })
      }

      try {
        const task = await commandBus.dispatch(
          {
            type: 'EDIT_TASK',
            payload: { taskId, ...body.data },
          },
          {
            userId: request.user.sub,
            organizationId: request.tenant.organizationId,
            memberId: request.tenant.memberId,
            permissions: request.tenant.permissions,
            role: request.tenant.role,
          }
        )

        return reply.send({ task })
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'FORBIDDEN') return reply.status(403).send({ error: 'FORBIDDEN' })
          if (err.message === 'TASK_NOT_FOUND') return reply.status(404).send({ error: 'TASK_NOT_FOUND' })
        }
        throw err
      }
    }
  )

  app.delete(
    '/tasks/:taskId',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string }

      try {
        await commandBus.dispatch(
          {
            type: 'DELETE_TASK',
            payload: { taskId, organizationId: request.tenant.organizationId },
          },
          {
            userId: request.user.sub,
            organizationId: request.tenant.organizationId,
            memberId: request.tenant.memberId,
            permissions: request.tenant.permissions,
            role: request.tenant.role,
          }
        )

        return reply.status(204).send()
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'FORBIDDEN') return reply.status(403).send({ error: 'FORBIDDEN' })
          if (err.message === 'TASK_NOT_FOUND') return reply.status(404).send({ error: 'TASK_NOT_FOUND' })
        }
        throw err
      }
    }
  )
}