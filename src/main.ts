import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { ResponseTransformerIntereceptor } from './common/interceptors/response-transformer.interceptor.js'
import { DocumentBuilder, getSchemaPath, SwaggerModule } from '@nestjs/swagger'
import { FailedResponse, SuccessResponse } from './common/app-response.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      errorFormat: 'grouped',
    }),
  )
  app.useGlobalInterceptors(new ResponseTransformerIntereceptor())

  const config = new DocumentBuilder()
    .addGlobalResponse({
      status: 500,
      description: 'Internal failure',
      schema: {
        allOf: [
          { $ref: getSchemaPath(FailedResponse) },
          {
            properties: {
              status: {
                example: 500,
              },
            },
          },
        ],
      },
    })
    .setTitle('Faculty Grid API')
    .setDescription('API to support faculty grid platform')
    .setVersion('1.0')
    .build()
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      extraModels: [FailedResponse, SuccessResponse],
    })
  SwaggerModule.setup('docs', app, documentFactory)

  await app.listen(process.env.PORT ?? 8000)
}
await bootstrap()
