import { DataSource } from 'typeorm'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { UserRoleRepository } from './user-role.repository.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { Test } from '@nestjs/testing'
import { Role, UserRoles } from '../entities/role.entity.js'
import { AppResult } from '../../common/app-result.js'
import { UserRoleDBEntity } from '../../common/database/entities/user-role.entity.js'
import { NotFoundException } from '../../common/app-exception.js'

describe('UserRoleRepository', () => {
  let userDb: UserDBEntity
  let dataSource: DataSource
  let userRoleRepository: UserRoleRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        UserRoleRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    userRoleRepository = moduleRef.get(UserRoleRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      if (entity.tableName === 'users') continue
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('save', () => {
    it('should return and save correct user role', async () => {
      const result = await userRoleRepository.save(userDb.id, Role.admin)

      expect(result).toStrictEqual(
        AppResult.success(
          new UserRoles({ userId: userDb.id, roles: [Role.admin] }),
        ),
      )

      const row = await dataSource.manager.findOneBy(UserRoleDBEntity, {
        userId: userDb.id,
      })
      expect(row?.userId).toBe(userDb.id)
      expect(row?.role).toBe(Role.admin)
    })

    it('should return failed with NotFoundException when user is not found', async () => {
      const result = await userRoleRepository.save('not-found', Role.admin)

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(`user with ID not-found is not found`),
        ),
      )
    })
  })
})
