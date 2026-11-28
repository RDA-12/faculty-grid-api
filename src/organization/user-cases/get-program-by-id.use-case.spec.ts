import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'
import { GetProgramByIdUseCase } from './get-program-by-id.use-case.js'

describe('GetProgramByIdUseCase', () => {
  const program = new Program({
    id: 'id',
    name: 'Informatics',
    degreeLevel: ProgramDegreeLevel.bachelor,
    facultyId: 'faculty-id',
  })
  let programRepository: {
    getById: ReturnType<typeof vi.fn>
  }
  let getProgramByIdUseCase: GetProgramByIdUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ProgramRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(program)),
          },
        },
        GetProgramByIdUseCase,
      ],
    }).compile()

    programRepository = moduleRef.get(ProgramRepository)
    getProgramByIdUseCase = moduleRef.get(GetProgramByIdUseCase)
  })

  it('should call ProgramRepository.getById once', async () => {
    await getProgramByIdUseCase.execute('id')

    expect(programRepository.getById).toHaveBeenCalledExactlyOnceWith('id')
  })

  it('should return success with program when ProgramRepository.getById succeeds', async () => {
    const result = await getProgramByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.success(program))
  })

  it('should return failed with exception when ProgramRepository.getById fails', async () => {
    const e = AppException.test()
    vi.spyOn(programRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getProgramByIdUseCase.execute('id')

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
