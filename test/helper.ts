import { INestApplication, ValidationPipe } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { ResponseTransformerIntereceptor } from '../src/common/interceptors/response-transformer.interceptor.js'

export function createTestingApp(moduleRef: TestingModule): INestApplication {
  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ errorHttpStatusCode: 422 }))
  app.useGlobalInterceptors(new ResponseTransformerIntereceptor())
  return app
}
