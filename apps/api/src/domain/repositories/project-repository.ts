import { CreateProjectInput, Project } from '../entities/project'

export interface ProjectRepository {
  findById(id: string, organizationId: string): Promise<Project | null>
  findAllByOrganization(organizationId: string): Promise<Project[]>
  create(input: CreateProjectInput): Promise<Project>
  update(id: string, data: Partial<Project>): Promise<Project>
  delete(id: string): Promise<void>
}