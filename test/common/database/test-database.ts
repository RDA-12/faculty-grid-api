import { DataSource } from 'typeorm'
import { PGliteDriver } from 'typeorm-pglite'
import { UserDBEntity } from '../../../src/common/database/entities/user.entity.js'
import { RefreshTokenDBEntity } from '../../../src/common/database/entities/refresh-token.entity.js'

export const createTestDataSource = () => {
  const dataSource = new DataSource({
    type: 'postgres',
    driver: new PGliteDriver().driver,
    entities: [UserDBEntity, RefreshTokenDBEntity],
    synchronize: true,
    dropSchema: true,
    logging: false,
  })

  return dataSource.initialize()
}
