import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Title, TitleScope } from '../entities/title.entity.js'
import { TitleRepository } from '../repositories/title.repository.js'
import { GetTitleByIdUseCase } from './get-title-by-id.use-case.js'

describe('GetTitleByIdUseCase', () => {
  const title = new Title({
    id: 'id',
    name: 'Dean',
    scope: TitleScope.faculty,
  })
  let titleRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getTitleByIdUseCase: GetTitleByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TitleRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(title)),
          },
        },
        GetTitleByIdUseCase,
      ],
    }).compile()

    titleRepository = moduleRef.get(TitleRepository)
    getTitleByIdUseCase = moduleRef.get(GetTitleByIdUseCase)
  })

  it('should call TitleRepository.getById once', async () => {
    await getTitleByIdUseCase.execute('id')

    expect(titleRepository.getById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with title when TitleRepository.getById succeeds', async () => {
    const result = await getTitleByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(title))
  })

  it('should return failed with exception when TitleRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(titleRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getTitleByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
