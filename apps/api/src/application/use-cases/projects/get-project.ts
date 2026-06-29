import { ProjectRepository } from '../../../domain/repositories/project-repository'
import { Project } from '../../../domain/entities/project'

export class GetProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(id: string, organizationId: string): Promise<Project> {
    const project = await this.projectRepository.findById(id, organizationId)

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND')
    }

    return project
  }
}