import { prisma } from '../prisma.js'
import { CreateUserInput, User } from '../../../domain/entities/user.js'
import { UserRepository } from '../../../domain/repositories/user-repository.js'
import bcrypt from 'bcryptjs'

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, 10)

    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    })
  }
}