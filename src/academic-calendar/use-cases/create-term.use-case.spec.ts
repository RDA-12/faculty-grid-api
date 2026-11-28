import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../entities/academic-year.entity.js'
import { Term, TermStatus } from '../entities/term.entity.js'
import { TermRepository } from '../repositories/term.repository.js'
import { GetAcademicYearByIdUseCase } from './get-academic-year-by-id.use-case.js'
import { CreateTermParams, CreateTermUseCase } from './create-term.use-case.js'
import {
  AppException,
  ConflictException,
  InvalidRequestError,
  InvalidRequestException,
  NotFoundException,
} from '../../common/app-exception.js'

describe('CreateTermUseCase', () => {
  const academicYear = new AcademicYear({
    id: 'year-id',
    name: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    status: AcademicYearStatus.active,
  })
  const params = new CreateTermParams({
    academicYearId: 'year-id',
    name: '2026/2027 Odd',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    createdBy: 'createdBy',
  })
  const term = new Term({
    id: 'term-id',
    academicYearId: params.academicYearId,
    name: params.name,
    startDate: params.startDate,
    endDate: params.endDate,
    status: TermStatus.planned,
  })
  let termRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let getAcademicYearByIdUseCase: {
    execute: ReturnType<typeof vi.fn>
  }
  let createTermUseCase: CreateTermUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: TermRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(term)),
          },
        },
        {
          provide: GetAcademicYearByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(academicYear)),
          },
        },
        CreateTermUseCase,
      ],
    }).compile()

    termRepository = moduleRef.get(TermRepository)
    getAcademicYearByIdUseCase = moduleRef.get(GetAcademicYearByIdUseCase)
    createTermUseCase = moduleRef.get(CreateTermUseCase)
  })

  it('should default status to planned when omitted', () => {
    expect(params.status).toBe(TermStatus.planned)
  })

  it('should validate academic year and call TermRepository.save once when valid', async () => {
    const result = await createTermUseCase.execute(params)

    expect(getAcademicYearByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      params.academicYearId,
    )
    expect(termRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(term))
  })

  it('should fail and not call TermRepository.save when academic year is not found', async () => {
    const notFound = new NotFoundException(
      'academic year with ID year-id is not found',
    )
    vi.spyOn(getAcademicYearByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )

    const result = await createTermUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(notFound))
    expect(termRepository.save).not.toHaveBeenCalled()
  })

  it('should fail with InvalidRequestException when startDate or endDate is outside academic year range', async () => {
    const outOfRangeParams = new CreateTermParams({
      academicYearId: 'year-id',
      name: '2026/2027 Extended',
      startDate: '2026-07-15',
      endDate: '2027-08-15',
      createdBy: 'createdBy',
    })

    const result = await createTermUseCase.execute(outOfRangeParams)

    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'startDate',
            value: '2026-07-15',
            constraints: [
              'startDate must be within academic year range (2026-08-01 to 2027-07-31)',
            ],
          }),
          new InvalidRequestError({
            property: 'endDate',
            value: '2027-08-15',
            constraints: [
              'endDate must be within academic year range (2026-08-01 to 2027-07-31)',
            ],
          }),
        ]),
      ),
    )
    expect(termRepository.save).not.toHaveBeenCalled()
  })

  it('should fail with ConflictException when activating a term whose academic year is not active', async () => {
    vi.spyOn(getAcademicYearByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.success(
        new AcademicYear({
          id: 'year-id',
          name: '2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-07-31',
          status: AcademicYearStatus.planned,
        }),
      ),
    )
    const activeTermParams = new CreateTermParams({
      academicYearId: 'year-id',
      name: '2026/2027 Odd',
      startDate: '2026-08-01',
      endDate: '2027-01-31',
      status: TermStatus.active,
      createdBy: 'createdBy',
    })

    const result = await createTermUseCase.execute(activeTermParams)

    expect(result).toStrictEqual(
      AppResult.failed(
        new ConflictException(
          'cannot set term to active because its academic year is not active',
        ),
      ),
    )
    expect(termRepository.save).not.toHaveBeenCalled()
  })

  it('should return failed with exception when TermRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(termRepository, 'save').mockResolvedValueOnce(AppResult.failed(e))

    const result = await createTermUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
