import { ProjectRepository } from '../../../domain/repositories/project-repository'
import { CreateProjectInput, Project } from '../../../domain/entities/project'

export class CreateProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    return this.projectRepository.create(input)
  }
}