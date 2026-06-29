import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../database/prisma'

export async function tenant(request: FastifyRequest, reply: FastifyReply) {
  const organizationId = request.headers['x-organization-id']

  if (!organizationId || typeof organizationId !== 'string') {
    return reply.status(400).send({ error: 'MISSING_ORGANIZATION_ID' })
  }

  const member = await prisma.member.findUnique({
    where: {
      userId_organizationId: {
        userId: request.user.sub,
        organizationId,
      },
    },
    include: {
      organization: true,
    },
  })

  if (!member) {
    return reply.status(403).send({ error: 'NOT_A_MEMBER' })
  }

  request.tenant = {
    organizationId,
    memberId: member.id,
    role: member.role,
    permissions: member.permissions,
    plan: member.organization.plan,
  }
}