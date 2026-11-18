import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AuthModule } from '../../src/auth/auth.module.js'
import {
  LoginParams,
  LoginUseCase,
} from '../../src/auth/use-cases/login.use-case.js'
import { AppResult } from '../../src/common/app-result.js'
import { UserToken } from '../../src/auth/entities/user-credential.entity.js'
import { createTestingApp } from '../helper.js'
import {
  AppException,
  InvalidCredentialException,
} from '../../src/common/app-exception.js'

describe('Auth', () => {
  const userToken = new UserToken({
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 10,
  })
  let app: INestApplication
  let loginUseCase = {
    execute: vi.fn().mockResolvedValue(AppResult.success(userToken)),
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(LoginUseCase)
      .useValue(loginUseCase)
      .compile()

    app = createTestingApp(moduleRef)
    await app.init()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/POST login', () => {
    const payload = {
      email: 'email@email.com',
      password: 'password',
    }

    it('should calls LoginUseCase once', async () => {
      await request(app.getHttpServer()).post('/auth/login').send(payload)

      expect(loginUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new LoginParams(payload),
      )
    })

    it('should return 422 when request body is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'lol', password: 'password' })

      expect(response.statusCode).toBe(422)
    })

    it('should return 200 with token when LoginUseCase success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)

      expect(response.statusCode).toBe(200)
      expect(response.body).toStrictEqual({
        status: 200,
        data: {
          accessToken: userToken.accessToken,
          refreshToken: userToken.refreshToken,
          expiresIn: userToken.expiresIn,
        },
      })
    })

    it('should return 401 when LoginUseCase failed with InvalidCredentialException', async () => {
      const e = new InvalidCredentialException()
      loginUseCase.execute.mockResolvedValueOnce(AppResult.failed(e))
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)

      expect(response.statusCode).toBe(401)
      expect(response.body).toStrictEqual({
        status: 401,
        title: e.title,
        detail: e.detail,
      })
    })

    it('should return failed with correct failure when LoginUseCase failed', async () => {
      const e = new AppException({
        status: 500,
        title: 'title',
        detail: 'detail',
      })
      loginUseCase.execute.mockResolvedValueOnce(AppResult.failed(e))
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)

      expect(response.statusCode).toBe(500)
      expect(response.body).toStrictEqual({
        status: 500,
        title: 'title',
        detail: 'detail',
      })
    })
  })
})
