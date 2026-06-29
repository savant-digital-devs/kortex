export type ProjectType = 'SOFTWARE' | 'SUPPORT' | 'TIMELINE'

export interface Project {
  id: string
  name: string
  description: string | null
  type: ProjectType
  githubRepoUrl: string | null
  githubRepoId: string | null
  publicToken: string | null
  publicTokenExpiresAt: Date | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectInput {
  name: string
  description?: string
  type: ProjectType
  organizationId: string
}