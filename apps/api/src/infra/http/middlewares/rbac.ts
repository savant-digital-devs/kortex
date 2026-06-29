import { FastifyRequest, FastifyReply } from 'fastify'

export enum Permission {
  CREATE = 1,
  EDIT = 2,
  DELETE = 4,
}

export function rbac(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { permissions, role } = request.tenant

    // OWNER e ADMIN têm acesso total
    if (role === 'OWNER' || role === 'ADMIN') return

    // verifica se o bitmask contém a permissão necessária
    const hasPermission = (permissions & permission) !== 0

    if (!hasPermission) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
  }
}