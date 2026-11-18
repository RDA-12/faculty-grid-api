import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeOrmConfig } from './config.js'

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
})
export class DatabaseModule {}
