import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { ResponseTransformerIntereceptor } from './common/interceptors/response-transformer.interceptor.js'
import { DocumentBuilder, getSchemaPath, SwaggerModule } from '@nestjs/swagger'
import { FailedResponse, SuccessResponse } from './common/app-response.js'
import { InvalidRequestException } from './common/app-exception.js'
import { InvalidRequestExceptionFilter } from './common/exception-filter/invalid-request.exception-filter.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      exceptionFactory: (errors) =>
        InvalidRequestException.fromValidationPipe(errors),
    }),
  )
  app.useGlobalInterceptors(new ResponseTransformerIntereceptor())
  app.useGlobalFilters(
    new InvalidRequestExceptionFilter(app.get(HttpAdapterHost)),
  )

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
