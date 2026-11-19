import { AppConfig } from '../../src/common/config.js'

export class TestConfig {
  get<T>(property: keyof AppConfig): T | undefined {
    const config: AppConfig = {
      database: {
        port: 5432,
        host: 'localhost',
        username: 'postgres',
        password: 'test1234',
      },
      secret: {
        api: 'api-secret',
        jwt: '93f33e36299746f5e310ef226aa8ef1a110b243b4129bb5660e24ae64f04149d',
      },
    }
    return config[property] as T | undefined
  }
}
