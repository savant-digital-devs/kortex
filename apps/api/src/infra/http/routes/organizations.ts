import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../../database/prisma'

export async function organizationRoutes(app: FastifyInstance) {
  app.post(
    '/organizations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const bodySchema = z.object({
        name: z.string().min(2),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
      })

      const body = bodySchema.safeParse(request.body)

      if (!body.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: body.error.flatten().fieldErrors,
        })
      }

      const slugInUse = await prisma.organization.findUnique({
        where: { slug: body.data.slug },
      })

      if (slugInUse) {
        return reply.status(409).send({ error: 'SLUG_ALREADY_IN_USE' })
      }

      const organization = await prisma.organization.create({
        data: {
          name: body.data.name,
          slug: body.data.slug,
          members: {
            create: {
              userId: request.user.sub,
              role: 'OWNER',
              permissions: 7, 
            },
          },
        },
      })

      return reply.status(201).send({ organization })
    }
  )
}