import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Test } from '@nestjs/testing'
import { DeleteProgramUseCase } from './delete-program.use-case.js'
import { ProgramRepository } from '../repositories/program.repository.js'

describe('DeleteProgramUseCase', () => {
  let programRepository: {
    deleteById: ReturnType<typeof vi.fn>
  }
  let deleteProgramUseCase: DeleteProgramUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ProgramRepository,
          useValue: {
            deleteById: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        DeleteProgramUseCase,
      ],
    }).compile()

    programRepository = moduleRef.get(ProgramRepository)
    deleteProgramUseCase = moduleRef.get(DeleteProgramUseCase)
  })

  it('should calls ProgramRepository.deleteById once', async () => {
    await deleteProgramUseCase.execute('id')

    expect(programRepository.deleteById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with correct faculty when ProgramRepository.deleteById success', async () => {
    const result = await deleteProgramUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(null))
  })

  it('should return failed with correct exception when ProgramRepository.deleteById failed', async () => {
    const e = AppException.test()
    vi.spyOn(programRepository, 'deleteById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await deleteProgramUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
