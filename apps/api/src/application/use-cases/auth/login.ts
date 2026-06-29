import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { UserRepository } from '../../../domain/repositories/user-repository'
import { env } from '../../../config/env'
import { redis } from '../../../infra/cache/redis'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export class LoginUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: LoginRequest): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)

    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
    )

    const refreshToken = jwt.sign(
      { sub: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }
    )

    // salva o refresh token no Redis com expiração de 7 dias (em segundos)
    await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 7)

    return { accessToken, refreshToken }
  }
}