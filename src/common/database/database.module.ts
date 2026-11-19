import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeOrmConfig } from './config.js'
import { ConfigService } from '@nestjs/config'
import { DatabaseConfig } from '../config.js'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database')!

        return {
          ...typeOrmConfig,
          port: dbConfig.port,
          host: dbConfig.host,
          username: dbConfig.username,
          password: dbConfig.password,
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
