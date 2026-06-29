import { Command } from '../command-bus'

export interface CreateTaskCommand extends Command {
  type: 'CREATE_TASK'
  payload: {
    title: string
    description?: string
    priority?: number
    dueDate?: Date
    columnId: string
    assigneeId?: string
  }
}

export interface EditTaskCommand extends Command {
  type: 'EDIT_TASK'
  payload: {
    taskId: string
    title?: string
    description?: string
    priority?: number
    dueDate?: Date
    columnId?: string
    assigneeId?: string
  }
}

export interface DeleteTaskCommand extends Command {
  type: 'DELETE_TASK'
  payload: {
    taskId: string
    organizationId: string
  }
}