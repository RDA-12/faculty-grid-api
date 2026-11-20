import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'
import {
  CreateProgramParams,
  CreateProgramUseCase,
} from './create-program.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('CreateProgramUseCase', () => {
  const params = new CreateProgramParams({
    name: 'program',
    degreeLevel: ProgramDegreeLevel.bachelor,
    facultyId: 'facultyId',
    createdBy: 'createdBy',
  })
  const program = new Program({
    id: 'id',
    name: params.name,
    degreeLevel: ProgramDegreeLevel.bachelor,
    facultyId: 'facultyId',
  })
  let programRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createProgramUseCase: CreateProgramUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ProgramRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(program)),
          },
        },
        CreateProgramUseCase,
      ],
    }).compile()

    programRepository = moduleRef.get(ProgramRepository)
    createProgramUseCase = moduleRef.get(CreateProgramUseCase)
  })

  it('should calls ProgramRepository.save once', async () => {
    await createProgramUseCase.execute(params)

    expect(programRepository.save).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with correct program when ProgramRepository.save success', async () => {
    const result = await createProgramUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(program))
  })

  it('should return failed with correct exception when ProgramRepository.save failed', async () => {
    const e = AppException.test()
    vi.spyOn(programRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await createProgramUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
