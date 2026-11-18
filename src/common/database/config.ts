import { RefreshTokenDBEntity } from './entities/refresh-token.entity.js'
import { UserDBEntity } from './entities/user.entity.js'
import { DataSource, DataSourceOptions } from 'typeorm'

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'test1234',
  database: 'faculty-grid-db',
  entities: [UserDBEntity, RefreshTokenDBEntity],
  synchronize: false,
  migrations: [import.meta.dirname + '/migrations/**/*{.js,.ts}'],
  migrationsRun: false,
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
}

export const typeOrmDatasource = new DataSource(typeOrmConfig)
