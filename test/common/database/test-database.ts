import { DataSource } from 'typeorm'
import { PGliteDriver } from 'typeorm-pglite'
import { typeOrmConfig } from '../../../src/common/database/config.js'

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
