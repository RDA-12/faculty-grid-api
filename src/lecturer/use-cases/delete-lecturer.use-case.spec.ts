import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import { DeleteLecturerUseCase } from './delete-lecturer.use-case.js'

describe('DeleteLecturerUseCase', () => {
  let lecturerRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteLecturerUseCase: DeleteLecturerUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteLecturerUseCase,
      ],
    }).compile()

    lecturerRepository = moduleRef.get(LecturerRepository)
    deleteLecturerUseCase = moduleRef.get(DeleteLecturerUseCase)
  })

  it('should call LecturerRepository.deleteById once', async () => {
    await deleteLecturerUseCase.execute('id')

    expect(lecturerRepository.deleteById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success when LecturerRepository.deleteById succeeds', async () => {
    const result = await deleteLecturerUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with exception when LecturerRepository.deleteById fails', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteLecturerUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
