import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'
import {
  CreateTitleParams,
  CreateTitleUseCase,
} from './create-title.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('CreateTitleUseCase', () => {
  const params = new CreateTitleParams({
    name: 'Dean',
    scope: TitleScope.faculty,
    createdBy: 'createdBy',
  })
  const title = new Title({
    id: 'id',
    name: params.name,
    scope: params.scope,
  })
  let titleRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createTitleUseCase: CreateTitleUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TitleRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(title)),
          },
        },
        CreateTitleUseCase,
      ],
    }).compile()

    titleRepository = moduleRef.get(TitleRepository)
    createTitleUseCase = moduleRef.get(CreateTitleUseCase)
  })

  it('should call TitleRepository.save once', async () => {
    await createTitleUseCase.execute(params)

    expect(titleRepository.save).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with correct title when TitleRepository.save succeeds', async () => {
    const result = await createTitleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(title))
  })

  it('should return failed with correct exception when TitleRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(titleRepository, 'save').mockResolvedValueOnce(AppResult.failed(e))
    const result = await createTitleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
