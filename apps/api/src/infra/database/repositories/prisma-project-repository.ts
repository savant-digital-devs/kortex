import { prisma } from '../prisma'
import { CreateProjectInput, Project } from '../../../domain/entities/project'
import { ProjectRepository } from '../../../domain/repositories/project-repository'

export class PrismaProjectRepository implements ProjectRepository {
  async findById(id: string, organizationId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id, organizationId },
    })
  }

  async findAllByOrganization(organizationId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(input: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        organizationId: input.organizationId,
      },
    })
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    })
  }
}