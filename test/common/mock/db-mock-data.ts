import { DataSource } from 'typeorm'
import { UserDBEntity } from '../../../src/common/database/entities/user.entity.js'
import { TestingModule } from '@nestjs/testing'
import { PasswordHasher } from '@nestjs/authentication'
import { UserCredentialDBEntity } from '../../../src/common/database/entities/user-credential.entity.js'
import { UserRoleDBEntity } from '../../../src/common/database/entities/user-role.entity.js'
import { Role } from '../../../src/authz/entities/role.entity.js'
import { AuthzUser } from '../../../src/authz/entities/authz-user.js'

export const USER_EMAIL = 'email@email.com'
export const USER_PASSWORD = 'password'

/**
 * Create user with admin role
 */
export async function createUserMock(
  moduleRef: TestingModule,
): Promise<AuthzUser> {
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

  await dataSource.manager.save(UserRoleDBEntity, {
    id: 'so-unique-id',
    userId: userDb.id,
    role: Role.admin,
  })

  return new AuthzUser({
    id: userDb.id,
    name: userDb.name,
    email: userDb.email,
    roles: [Role.admin],
  })
}
