import { Test } from '@nestjs/testing'
import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'
import {
  UpdateProgramParams,
  UpdateProgramUseCase,
} from './update-program.use-case.js'

describe('UpdateProgramUseCase', () => {
  const params = new UpdateProgramParams({
    id: 'id',
    name: 'Computer Science',
    degreeLevel: ProgramDegreeLevel.master,
    facultyId: 'faculty-id',
  })
  const program = new Program({
    id: params.id,
    name: params.name,
    degreeLevel: params.degreeLevel,
    facultyId: params.facultyId,
  })
  let programRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let updateProgramUseCase: UpdateProgramUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ProgramRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(program)),
          },
        },
        UpdateProgramUseCase,
      ],
    }).compile()

    programRepository = moduleRef.get(ProgramRepository)
    updateProgramUseCase = moduleRef.get(UpdateProgramUseCase)
  })

  it('should call ProgramRepository.update once', async () => {
    await updateProgramUseCase.execute(params)

    expect(programRepository.update).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with updated program when ProgramRepository.update succeeds', async () => {
    const result = await updateProgramUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(program))
  })

  it('should return failed with exception when ProgramRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(programRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await updateProgramUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
