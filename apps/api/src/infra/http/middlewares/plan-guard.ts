import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../database/prisma'

const PLAN_LIMITS = {
  STANDARD: 1,
  AUTONOMOUS: null, // ilimitado via seats pagos
  ENTERPRISE: 7,
}

export async function planGuard(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId, plan } = request.tenant

  // Standard nunca pode adicionar membros
  if (plan === 'STANDARD') {
    return reply.status(403).send({
      error: 'PLAN_LIMIT_REACHED',
      message: 'O plano Standard não permite adicionar membros.',
    })
  }

  // Empresarial tem limite de 7 membros
  if (plan === 'ENTERPRISE') {
    const memberCount = await prisma.member.count({ where: { organizationId } })

    if (memberCount >= PLAN_LIMITS.ENTERPRISE!) {
      return reply.status(403).send({
        error: 'PLAN_LIMIT_REACHED',
        message: 'O plano Empresarial permite no máximo 7 membros.',
      })
    }
  }

  // Autônomo verifica os seats disponíveis
  if (plan === 'AUTONOMOUS') {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    const memberCount = await prisma.member.count({ where: { organizationId } })

    if (memberCount >= (org?.seats ?? 1)) {
      return reply.status(403).send({
        error: 'PLAN_LIMIT_REACHED',
        message: 'Limite de seats atingido. Adquira mais seats para continuar.',
      })
    }
  }
}