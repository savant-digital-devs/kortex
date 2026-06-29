import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { tenant } from '../middlewares/tenant'
import { PrismaProjectRepository } from '../../database/repositories/prisma-project-repository'
import { CreateProjectUseCase } from '../../../application/use-cases/projects/create-project'
import { ListProjectsUseCase } from '../../../application/use-cases/projects/list-projects'
import { GetProjectUseCase } from '../../../application/use-cases/projects/get-project'

export async function projectRoutes(app: FastifyInstance) {
  const projectRepository = new PrismaProjectRepository()

  app.post(
    '/projects',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const bodySchema = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        type: z.enum(['SOFTWARE', 'SUPPORT', 'TIMELINE']),
      })

      const body = bodySchema.safeParse(request.body)

      if (!body.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: body.error.flatten().fieldErrors,
        })
      }

      const useCase = new CreateProjectUseCase(projectRepository)
      const project = await useCase.execute({
        ...body.data,
        organizationId: request.tenant.organizationId,
      })

      return reply.status(201).send({ project })
    }
  )

  app.get(
    '/projects',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const useCase = new ListProjectsUseCase(projectRepository)
      const projects = await useCase.execute(request.tenant.organizationId)
      return reply.send({ projects })
    }
  )

  app.get(
    '/projects/:id',
    { preHandler: [authenticate, tenant] },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const useCase = new GetProjectUseCase(projectRepository)

      try {
        const project = await useCase.execute(id, request.tenant.organizationId)
        return reply.send({ project })
      } catch (err) {
        if (err instanceof Error && err.message === 'PROJECT_NOT_FOUND') {
          return reply.status(404).send({ error: 'PROJECT_NOT_FOUND' })
        }
        throw err
      }
    }
  )
}