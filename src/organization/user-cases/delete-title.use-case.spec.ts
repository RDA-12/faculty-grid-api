import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { TitleRepository } from '../repositories/title.repository.js'
import { DeleteTitleUseCase } from './delete-title.use-case.js'

describe('DeleteTitleUseCase', () => {
  let titleRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteTitleUseCase: DeleteTitleUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TitleRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteTitleUseCase,
      ],
    }).compile()

    titleRepository = moduleRef.get(TitleRepository)
    deleteTitleUseCase = moduleRef.get(DeleteTitleUseCase)
  })

  it('should call TitleRepository.deleteById once', async () => {
    await deleteTitleUseCase.execute('id')

    expect(titleRepository.deleteById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success when TitleRepository.deleteById succeeds', async () => {
    const result = await deleteTitleUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when TitleRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(titleRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteTitleUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
