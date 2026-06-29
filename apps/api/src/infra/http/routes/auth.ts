import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaUserRepository } from '../../database/repositories/prisma-user-repository'
import { RegisterUseCase } from '../../../application/use-cases/auth/register'
import { LoginUseCase } from '../../../application/use-cases/auth/login'
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token'

export async function authRoutes(app: FastifyInstance) {
  const userRepository = new PrismaUserRepository()

  app.post('/auth/register', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    })

    const body = bodySchema.safeParse(request.body)

    if (!body.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: body.error.flatten().fieldErrors,
      })
    }

    const registerUseCase = new RegisterUseCase(userRepository)

    try {
      const { user } = await registerUseCase.execute(body.data)
      return reply.status(201).send({ user })
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_ALREADY_IN_USE') {
        return reply.status(409).send({ error: 'EMAIL_ALREADY_IN_USE' })
      }
      throw err
    }
  })

  app.post('/auth/login', async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const body = bodySchema.safeParse(request.body)

    if (!body.success) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        details: body.error.flatten().fieldErrors,
      })
    }

    const loginUseCase = new LoginUseCase(userRepository)

    try {
      const { accessToken, refreshToken } = await loginUseCase.execute(body.data)
      return reply.send({ accessToken, refreshToken })
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
      }
      throw err
    }
  })

  app.post('/auth/refresh', async (request, reply) => {
  const bodySchema = z.object({
    refreshToken: z.string(),
  })

  const body = bodySchema.safeParse(request.body)

  if (!body.success) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      details: body.error.flatten().fieldErrors,
    })
  }

  const refreshTokenUseCase = new RefreshTokenUseCase()

  try {
    const { accessToken, refreshToken } = await refreshTokenUseCase.execute(body.data.refreshToken)
    return reply.send({ accessToken, refreshToken })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_REFRESH_TOKEN') {
      return reply.status(401).send({ error: 'INVALID_REFRESH_TOKEN' })
    }
    throw err
  }
})
}