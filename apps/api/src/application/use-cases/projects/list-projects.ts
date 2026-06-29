import { ProjectRepository } from '../../../domain/repositories/project-repository'
import { Project } from '../../../domain/entities/project'

export class ListProjectsUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(organizationId: string): Promise<Project[]> {
    return this.projectRepository.findAllByOrganization(organizationId)
  }
}