import { CommandHandler, CommandContext } from '../command-bus'
import { CreateTaskCommand } from '../commands/task-commands'
import { Permission } from '../../../infra/http/middlewares/rbac'
import { prisma } from '../../../infra/database/prisma'

export class CreateTaskHandler implements CommandHandler<CreateTaskCommand, object> {
  requiredPermission = Permission.CREATE

  async handle(command: CreateTaskCommand, context: CommandContext) {
    const { title, description, priority, dueDate, columnId, assigneeId } = command.payload

    const column = await prisma.column.findFirst({
      where: { id: columnId, project: { organizationId: context.organizationId } },
    })

    if (!column) {
      throw new Error('COLUMN_NOT_FOUND')
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority ?? 0,
        dueDate,
        columnId,
        assigneeId,
      },
    })

    return task
  }
}