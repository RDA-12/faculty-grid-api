export type DatabaseConfig = {
  port: number
  host: string
  username: string
  password: string
}

const dbConfig: DatabaseConfig = {
  port: parseInt(process.env.DB_PORT ?? '', 10) || 5432,
  host: process.env.DB_HOST ?? 'localhost',
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'test1234',
}

export type SecretConfig = {
  jwt: string
}

const secretConfig: SecretConfig = {
  jwt:
    process.env.JWT_SECRET ??
    '3cc4238a01a83902c646ac6e4c288971dcaffc491d7477b8843504838e76d6ab',
}

type AppConfig = {
  database: DatabaseConfig
  secret: SecretConfig
}

export function appConfig(): AppConfig {
  return {
    database: dbConfig,
    secret: secretConfig,
  }
}
