import { UserRepository } from '../../../domain/repositories/user-repository.js'
import {  User } from '../../../domain/entities/user.js'

interface RegisterRequest {
  name: string
  email: string
  password: string
}

interface RegisterResponse {
  user: Omit<User, 'passwordHash'>
}

export class RegisterUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: RegisterRequest): Promise<RegisterResponse> {
    const existingUser = await this.userRepository.findByEmail(input.email)

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_IN_USE')
    }

    const user = await this.userRepository.create(input)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  }
}