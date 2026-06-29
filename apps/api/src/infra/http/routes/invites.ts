import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { tenant } from '../middlewares/tenant'
import { planGuard } from '../middlewares/plan-guard'
import { prisma } from '../../database/prisma'
import { sendInviteEmail } from '../../mail/mailer'
import { randomUUID } from 'crypto'

export async function inviteRoutes(app: FastifyInstance) {
  // enviar convite
  app.post(
    '/invites',
    { preHandler: [authenticate, tenant, planGuard] },
    async (request, reply) => {
      const bodySchema = z.object({
        email: z.string().email(),
        role: z.enum(['MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
      })

      const body = bodySchema.safeParse(request.body)

      if (!body.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: body.error.flatten().fieldErrors,
        })
      }

      const { organizationId } = request.tenant

      // verifica se já é membro
      const existingUser = await prisma.user.findUnique({
        where: { email: body.data.email },
        include: {
          members: { where: { organizationId } },
        },
      })

      if (existingUser?.members.length) {
        return reply.status(409).send({ error: 'ALREADY_A_MEMBER' })
      }

      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // salva o invite no Redis com expiração de 7 dias
      const { redis } = await import('../../cache/redis')
      await redis.set(
        `invite:${token}`,
        JSON.stringify({
          email: body.data.email,
          role: body.data.role,
          organizationId,
        }),
        'EX',
        60 * 60 * 24 * 7
      )

      const org = await prisma.organization.findUnique({ where: { id: organizationId } })

      await sendInviteEmail(body.data.email, org!.name, token)

      return reply.status(201).send({
        message: 'Convite enviado com sucesso.',
        expiresAt,
      })
    }
  )

  // aceitar convite
  app.post('/invites/:token/accept', async (request, reply) => {
    const { token } = request.params as { token: string }

    const bodySchema = z.object({
      name: z.string().min(2),
      password: z.string().min(6),
    })

    const body = bodySchema.safeParse(request.body)

    if (!body.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: body.error.flatten().fieldErrors,
      })
    }

    const { redis } = await import('../../cache/redis')
    const raw = await redis.get(`invite:${token}`)

    if (!raw) {
      return reply.status(410).send({ error: 'INVITE_EXPIRED_OR_INVALID' })
    }

    const invite = JSON.parse(raw) as {
      email: string
      role: 'MANAGER' | 'EMPLOYEE'
      organizationId: string
    }

    // verifica se já tem conta
    let user = await prisma.user.findUnique({ where: { email: invite.email } })

    if (!user) {
      const bcrypt = await import('bcryptjs')
      const passwordHash = await bcrypt.hash(body.data.password, 10)

      user = await prisma.user.create({
        data: {
          name: body.data.name,
          email: invite.email,
          passwordHash,
        },
      })
    }

    await prisma.member.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        role: invite.role,
        permissions: invite.role === 'MANAGER' ? 7 : 3, // MANAGER: total, EMPLOYEE: CREATE+EDIT
      },
    })

    await redis.del(`invite:${token}`)

    return reply.send({ message: 'Convite aceito com sucesso.' })
  })
}