import { Test } from '@nestjs/testing'
import { UserRepository } from './user.repository.js'
import { DataSource } from 'typeorm'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { CreateUserParams } from '../use-cases/create-user.use-case.js'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'

describe('UserRepository', () => {
  let dataSource: DataSource
  let userRespository: UserRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        UserRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    userRespository = moduleRef.get(UserRepository)
  })

  beforeEach(async () => {
    for (const entity of dataSource.entityMetadatas) {
      await dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      )
    }
  })

  describe('save', () => {
    const params = new CreateUserParams({
      name: 'name',
      email: 'email@email.com',
    })

    it('should save return and correct user when success', async () => {
      const result = await userRespository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
        email: params.email,
      })

      const row = await dataSource
        .getRepository(UserDBEntity)
        .findOneBy({ id: result.data!.id })

      expect(row).not.toBeNull()
      expect(row).toMatchObject({
        name: params.name,
        email: params.email,
      })
    })

    it('should return failed with AlreadyExistException when saving same email', async () => {
      const result = await userRespository.save(params)
      expect(result.data).not.toBeNull()

      const result2 = await userRespository.save(params)
      expect(result2.data).toBeNull()
    })

    it('should return failed with AlreadyExistException when saving same email', async () => {
      const result = await userRespository.save(params)
      expect(result.data).not.toBeNull()

      const result2 = await userRespository.save(params)
      expect(result2.data).toBeNull()
    })
  })
})
