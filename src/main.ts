import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { ResponseTransformerIntereceptor } from './common/interceptors/response-transformer.interceptor.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      errorFormat: 'grouped',
    }),
  )
  app.useGlobalInterceptors(new ResponseTransformerIntereceptor())
  await app.listen(process.env.PORT ?? 8000)
}
await bootstrap()
