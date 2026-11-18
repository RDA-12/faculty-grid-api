import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { createTestingApp } from '../helper.js'
import { User } from '../../src/user/entities/user.entity.js'
import { JWT } from '../../src/auth/utils/jwt.util.js'
import { UserModule } from '../../src/user/user.module.js'

// TODO(R-12): migrate test to real e2e (doesn't use any mock)
describe('User', () => {
  const user = new User({
    id: 'id',
    name: 'name',
    email: 'email@email.com',
  })
  let app: INestApplication
  let jwt = {
    validate: vi.fn().mockResolvedValue(user),
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(JWT)
      .useValue(jwt)
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

  describe('/GET users/me', () => {
    it('should return 401 when auth header is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .send()

      expect(response.statusCode).toBe(401)
      expect(response.body).toMatchObject({
        status: 401,
        title: 'Missing Authentication header',
        detail:
          'This endpoint is protected, authenticated request is required. Please provide valid Authentication header',
      })
    })

    it('should return 200 with correct user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authentication', 'Bearer token')
        .send()

      expect(response.statusCode).toBe(200)
      expect(response.body).toStrictEqual({
        status: 200,
        data: {
          id: user.id,
          name: user.name,
          email: user.name,
        },
      })
    })
  })
})
