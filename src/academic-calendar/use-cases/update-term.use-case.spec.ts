import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { Term, TermStatus } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import { GetAcademicYearByIdUseCase } from './get-academic-year-by-id.use-case.js'
import { UpdateTermParams, UpdateTermUseCase } from './update-term.use-case.js'
import {
  AppException,
  ConflictException,
  InvalidRequestException,
  NotFoundException,
} from '../../common/app-exception.js'

describe('UpdateTermUseCase', () => {
  const academicYear = new AcademicYear({
    id: 'year-id',
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    status: AcademicYearStatus.active,
  })
  const params = new UpdateTermParams({
    id: 'term-id',
    academicYearId: 'year-id',
    name: '2026/2027 Odd',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    status: TermStatus.active,
  })
  const term = new Term({
    id: params.id,
    academicYearId: params.academicYearId,
    name: params.name,
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
  })
  let termRepository: {
    update: ReturnType<typeof vi.fn>
  }
  let getAcademicYearByIdUseCase: {
    execute: ReturnType<typeof vi.fn>
  }
  let updateTermUseCase: UpdateTermUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TermRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(term)),
          },
        },
        {
          provide: GetAcademicYearByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        UpdateTermUseCase,
      ],
    }).compile()

    termRepository = moduleRef.get(TermRepository)
    getAcademicYearByIdUseCase = moduleRef.get(GetAcademicYearByIdUseCase)
    updateTermUseCase = moduleRef.get(UpdateTermUseCase)
  })

  it('should validate academic year and call TermRepository.update once when valid', async () => {
    const result = await updateTermUseCase.execute(params)

    expect(getAcademicYearByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      params.academicYearId,
    )
    expect(termRepository.update).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(term))
  })

  it('should fail and not call TermRepository.update when academic year is not found', async () => {
    const notFound = new NotFoundException(
      'academic year with ID year-id is not found',
    )
    vi.spyOn(getAcademicYearByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )

    const result = await updateTermUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(notFound))
    expect(termRepository.update).not.toHaveBeenCalled()
  })

  it('should fail with InvalidRequestException when dates fall outside academic year range', async () => {
    const outOfRange = new UpdateTermParams({
      id: 'term-id',
      academicYearId: 'year-id',
      name: '2026/2027 Odd',
      startDate: '2026-07-01',
      endDate: '2027-01-31',
      status: TermStatus.planned,
    })

    const result = await updateTermUseCase.execute(outOfRange)

    expect(result.exception).toBeInstanceOf(InvalidRequestException)
    expect(termRepository.update).not.toHaveBeenCalled()
  })

  it('should fail with ConflictException when setting status active under archived academic year', async () => {
    vi.spyOn(getAcademicYearByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.success(
        new AcademicYear({
          id: 'year-id',
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.archived,
        }),
      ),
    )

    const result = await updateTermUseCase.execute(params)

    expect(result).toStrictEqual(
      AppResult.failed(
        new ConflictException(
          'cannot set term to active because its academic year is not active',
        ),
      ),
    )
    expect(termRepository.update).not.toHaveBeenCalled()
  })

  it('should return failed with exception when TermRepository.update fails', async () => {
    const e = AppException.test()
    vi.spyOn(termRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )

    const result = await updateTermUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
