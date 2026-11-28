import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AppModule } from '../../src/app.module.js'
import { DatabaseModule } from '../../src/common/database/database.module.js'
import { TestDatabaseModule } from './database/test-database.js'
import { TestConfig } from './test-config.js'
import { createTestingApp } from '../helper.js'

describe('ExceptionFilter', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .overrideProvider(ConfigService)
      .useClass(TestConfig)
      .compile()

    app = createTestingApp(moduleRef)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return 404 FailedResponse when GET to unknown path', async () => {
    const response = await request(app.getHttpServer()).get('/unknown-path')

    expect(response.statusCode).toBe(404)
    expect(response.body).toStrictEqual({
      status: 404,
      title: 'Not Found',
      detail: 'Cannot GET /unknown-path',
    })
  })

  it('should return 404 FailedResponse when POST to unknown path', async () => {
    const response = await request(app.getHttpServer()).post('/unknown-path')

    expect(response.statusCode).toBe(404)
    expect(response.body).toStrictEqual({
      status: 404,
      title: 'Not Found',
      detail: 'Cannot POST /unknown-path',
    })
  })
})
