import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { CredentialRepository } from './credential.repository.js'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { UserCredential } from '../entities/user-credential.entity.js'
import { UserCredentialDBEntity } from '../../common/database/entities/user-credential.entity.js'
import { AppResult } from '../../common/app-result.js'
import { NotFoundException } from '../../common/app-exception.js'

describe('CredentialRepository', () => {
  let userDb: UserDBEntity
  let dataSource: DataSource
  let credentialRepository: CredentialRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        CredentialRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'name'
    insertUserDb.email = 'email'
    userDb = await dataSource.manager.save(insertUserDb)

    credentialRepository = moduleRef.get(CredentialRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      if (entity.tableName === 'users') continue
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('getByUserId', () => {
    let expected: UserCredential

    beforeEach(async () => {
      const credsDB = new UserCredentialDBEntity()
      credsDB.user = userDb
      credsDB.hashedPassword = 'hashed'
      expected = (await dataSource.manager.save(credsDB)).toDomain()
    })

    it('should return correct credential data', async () => {
      const result = await credentialRepository.getByUserId(userDb.id)

      expect(result).toStrictEqual(AppResult.success(expected))
    })

    it('should return failed with NotFoundException when not found', async () => {
      const result = await credentialRepository.getByUserId('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            'credential for user with ID not-found not found',
          ),
        ),
      )
    })
  })
})
