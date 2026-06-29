import { CommandHandler, CommandContext } from '../command-bus'
import { DeleteTaskCommand } from '../commands/task-commands'
import { Permission } from '../../../infra/http/middlewares/rbac'
import { prisma } from '../../../infra/database/prisma'

export class DeleteTaskHandler implements CommandHandler<DeleteTaskCommand, object> {
  requiredPermission = Permission.DELETE

  async handle(command: DeleteTaskCommand, context: CommandContext) {
    const { taskId } = command.payload

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        column: { project: { organizationId: context.organizationId } },
      },
    })

    if (!task) {
      throw new Error('TASK_NOT_FOUND')
    }

    // soft delete — não apaga do banco, apenas marca como deletado
    return prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    })
  }
}