import { Permission } from '../../infra/http/middlewares/rbac'

export interface Command {
  type: string
  payload: unknown
}

export interface CommandHandler<T extends Command, R> {
  requiredPermission: Permission | null
  handle(command: T, context: CommandContext): Promise<R>
}

export interface CommandContext {
  userId: string
  organizationId: string
  memberId: string
  permissions: number
  role: string
}

export class CommandBus {
  private handlers = new Map<string, CommandHandler<Command, unknown>>()

  register<T extends Command, R>(type: string, handler: CommandHandler<T, R>) {
    this.handlers.set(type, handler as CommandHandler<Command, unknown>)
  }

  async dispatch<R>(command: Command, context: CommandContext): Promise<R> {
    const handler = this.handlers.get(command.type)

    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`)
    }

    // verifica permissão RBAC se necessário
    if (handler.requiredPermission !== null) {
      const isOwnerOrAdmin = context.role === 'OWNER' || context.role === 'ADMIN'

      if (!isOwnerOrAdmin) {
        const hasPermission = (context.permissions & handler.requiredPermission) !== 0

        if (!hasPermission) {
          throw new Error('FORBIDDEN')
        }
      }
    }

    return handler.handle(command, context) as Promise<R>
  }
}

export const commandBus = new CommandBus()