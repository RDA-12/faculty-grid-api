import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import { DeleteLecturerTitleUseCase } from './delete-lecturer-title.use-case.js'

describe('DeleteLecturerTitleUseCase', () => {
  let lecturerTitleRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteLecturerTitleUseCase: DeleteLecturerTitleUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerTitleRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteLecturerTitleUseCase,
      ],
    }).compile()

    lecturerTitleRepository = moduleRef.get(LecturerTitleRepository)
    deleteLecturerTitleUseCase = moduleRef.get(DeleteLecturerTitleUseCase)
  })

  it('should call LecturerTitleRepository.deleteById once', async () => {
    await deleteLecturerTitleUseCase.execute('id')

    expect(lecturerTitleRepository.deleteById).toHaveBeenCalledExactlyOnceWith(
      'id',
    )
  })

  it('should return success when LecturerTitleRepository.deleteById succeeds', async () => {
    const result = await deleteLecturerTitleUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed when LecturerTitleRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerTitleRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteLecturerTitleUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
