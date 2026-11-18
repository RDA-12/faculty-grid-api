import { Test } from '@nestjs/testing'
import { UserRepository } from './user.repository.js'
import { DataSource } from 'typeorm'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { CreateUserParams } from '../use-cases/create-user.use-case.js'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { User } from '../entities/user.entity.js'
import { AppResult } from '../../common/app-result.js'
import {
  AlreadyExistsException,
  NotFoundException,
} from '../../common/app-exception.js'

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
      expect(result2.exception).toStrictEqual(
        new AlreadyExistsException(
          `user with email ${params.email} already exists`,
        ),
      )
    })
  })

  describe('getByEmail', () => {
    let user: User

    beforeEach(async () => {
      const db = new UserDBEntity()
      db.name = 'name'
      db.email = 'email'
      const result = await dataSource.manager.save(db)
      user = result.toDomain()
    })

    it('should return correct user', async () => {
      const result = await userRespository.getByEmail(user.email)

      expect(result).toStrictEqual(AppResult.success(user))
    })

    it('should return failed with NotFoundException when user not found', async () => {
      const result = await userRespository.getByEmail('not-exists')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('user with email not-exists not found'),
        ),
      )
    })
  })
})
