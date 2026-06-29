import { commandBus } from './command-bus'
import { CreateTaskHandler } from './handlers/create-task-handler'
import { EditTaskHandler } from './handlers/edit-task-handler'
import { DeleteTaskHandler } from './handlers/delete-task-handler'

export function bootstrapCommandBus() {
  commandBus.register('CREATE_TASK', new CreateTaskHandler())
  commandBus.register('EDIT_TASK', new EditTaskHandler())
  commandBus.register('DELETE_TASK', new DeleteTaskHandler())
}