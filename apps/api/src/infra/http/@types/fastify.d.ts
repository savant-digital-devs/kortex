import { JwtPayload } from '../middlewares/authenticate'
import { MemberRole, Plan } from '../../../generated/prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
    tenant: {
      organizationId: string
      memberId: string
      role: MemberRole
      permissions: number
      plan: Plan
    }
  }
}