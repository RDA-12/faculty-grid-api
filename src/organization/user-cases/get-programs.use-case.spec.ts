import { AppException } from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { Test } from '@nestjs/testing'
import { GetProgramsUseCase } from './get-programs.use-case.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'
import { Program, ProgramDegreeLevel } from '../entities/program.entity.js'
import { ProgramRepository } from '../repositories/program.repository.js'

describe('GetProgramsUseCase', () => {
  const programs = Array.from({ length: 5 }, (_, index) => {
    return new Program({
      id: `${index}`,
      name: `Program ${index}`,
      facultyId: 'facultyId',
      degreeLevel: ProgramDegreeLevel.bachelor,
    })
  })
  const paginated = new PaginatedResult({
    data: programs,
    pagination: new PaginationResult({
      page: 1,
      pageSize: 10,
      total: 5,
    }),
  })
  let facultyRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getProgramsUseCase: GetProgramsUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ProgramRepository,
          useValue: {
            getAll: vi.fn().mockResolvedValue(AppResult.success(paginated)),
          },
        },
        GetProgramsUseCase,
      ],
    }).compile()

    facultyRepository = moduleRef.get(ProgramRepository)
    getProgramsUseCase = moduleRef.get(GetProgramsUseCase)
  })

  it('should calls ProgramRepository.getAll once', async () => {
    const params = new Pagination({})
    await getProgramsUseCase.execute(params)

    expect(facultyRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with correct faculty when ProgramRepository.getAll success', async () => {
    const result = await getProgramsUseCase.execute()

    expect(result).toStrictEqual(AppResult.success(paginated))
  })

  it('should return failed with correct exception when ProgramRepository.getAll failed', async () => {
    const e = AppException.test()
    vi.spyOn(facultyRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getProgramsUseCase.execute()

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
