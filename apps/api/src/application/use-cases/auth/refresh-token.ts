import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../../../config/env'
import { redis } from '../../../infra/cache/redis'

interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export class RefreshTokenUseCase {
  async execute(token: string): Promise<RefreshTokenResponse> {
    let payload: { sub: string; email?: string }

    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; email?: string }
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN')
    }

    const storedToken = await redis.get(`refresh:${payload.sub}`)

    if (!storedToken || storedToken !== token) {
      throw new Error('INVALID_REFRESH_TOKEN')
    }

    const accessToken = jwt.sign(
      { sub: payload.sub },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
    )

    const refreshToken = jwt.sign(
      { sub: payload.sub },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }
    )

    await redis.set(`refresh:${payload.sub}`, refreshToken, 'EX', 60 * 60 * 24 * 7)

    return { accessToken, refreshToken }
  }
}