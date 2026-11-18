import { DataSource } from 'typeorm'
import { PGliteDriver } from 'typeorm-pglite'
import { typeOrmConfig } from '../../../src/common/database/config.js'
import { Global, Module } from '@nestjs/common'

export const createTestDataSource = () => {
  const dataSource = new DataSource({
    type: 'postgres',
    driver: new PGliteDriver().driver,
    entities: typeOrmConfig.entities,
    synchronize: true,
    dropSchema: true,
    logging: false,
  })

  return dataSource.initialize()
}

@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: createTestDataSource,
    },
  ],
  exports: [DataSource],
})
export class TestDatabaseModule {}
