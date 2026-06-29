import { CommandHandler, CommandContext } from '../command-bus'
import { EditTaskCommand } from '../commands/task-commands'
import { Permission } from '../../../infra/http/middlewares/rbac'
import { prisma } from '../../../infra/database/prisma'

export class EditTaskHandler implements CommandHandler<EditTaskCommand, object> {
  requiredPermission = Permission.EDIT

  async handle(command: EditTaskCommand, context: CommandContext) {
    const { taskId, ...data } = command.payload

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

    return prisma.task.update({
      where: { id: taskId },
      data,
    })
  }
}