import { DataSource } from 'typeorm'
import { User } from '../../../src/user/entities/user.entity.js'
import { UserDBEntity } from '../../../src/common/database/entities/user.entity.js'
import { TestingModule } from '@nestjs/testing'
import { PasswordHasher } from '@nestjs/authentication'
import { UserCredentialDBEntity } from '../../../src/common/database/entities/user-credential.entity.js'

export const USER_EMAIL = 'email@email.com'
export const USER_PASSWORD = 'password'

export async function createUserMock(moduleRef: TestingModule): Promise<User> {
  const dataSource = moduleRef.get(DataSource)
  const userInsertDb = new UserDBEntity()
  userInsertDb.name = 'user name'
  userInsertDb.email = USER_EMAIL
  const userDb = await dataSource.manager.save(userInsertDb)

  const passordHasher = moduleRef.get(PasswordHasher)
  const hashed = await passordHasher.hash(USER_PASSWORD)
  const userCredsDb = new UserCredentialDBEntity()
  userCredsDb.user = userDb
  userCredsDb.hashedPassword = hashed
  await dataSource.manager.save(userCredsDb)

  return userDb.toDomain()
}
