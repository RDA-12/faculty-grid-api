import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { TermRepository } from '../repositories/term.repository.js'
import { DeleteTermUseCase } from './delete-term.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('DeleteTermUseCase', () => {
  let termRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteTermUseCase: DeleteTermUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TermRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteTermUseCase,
      ],
    }).compile()

    termRepository = moduleRef.get(TermRepository)
    deleteTermUseCase = moduleRef.get(DeleteTermUseCase)
  })

  it('should call TermRepository.deleteById once', async () => {
    await deleteTermUseCase.execute('term-id')

    expect(termRepository.deleteById).toHaveBeenCalledExactlyOnceWith('term-id')
  })

  it('should return success with null when TermRepository.deleteById succeeds', async () => {
    const result = await deleteTermUseCase.execute('term-id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when TermRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(termRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )

    const result = await deleteTermUseCase.execute('term-id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
