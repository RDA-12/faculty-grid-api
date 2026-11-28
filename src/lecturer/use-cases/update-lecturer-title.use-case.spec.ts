import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import {
  AppException,
  InvalidRequestError,
  InvalidRequestException,
  NotFoundException,
} from '../../common/app-exception.js'
import { Title, TitleScope } from '../../organization/entities/title.entity.js'
import { GetTitleByIdUseCase } from '../../organization/user-cases/get-title-by-id.use-case.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { LecturerRepository } from '../repositories/lecturer.repository.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import {
  UpdateLecturerTitleParams,
  UpdateLecturerTitleUseCase,
} from './update-lecturer-title.use-case.js'

describe('UpdateLecturerTitleUseCase', () => {
  const lecturer = new Lecturer({
    id: 'lecturer-id',
    name: 'Budi Santoso',
    displayName: 'Dr. Budi Santoso',
    programId: 'program-id',
    employmentStatus: EmploymentStatus.contract,
    rankId: null,
    functionalRankId: null,
    academicDegree: AcademicDegree.doctorate,
  })
  const programTitle = new Title({
    id: 'program-title-id',
    name: 'Head of Program',
    scope: TitleScope.program,
  })
  const assignment = new LecturerTitle({
    id: 'assignment-id',
    lecturerId: lecturer.id,
    titleId: programTitle.id,
    facultyId: null,
    programId: 'program-id',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
  })

  let lecturerTitleRepository: { update: ReturnType<typeof vi.fn> }
  let lecturerRepository: { getById: ReturnType<typeof vi.fn> }
  let getTitleByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateLecturerTitleUseCase: UpdateLecturerTitleUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerTitleRepository,
          useValue: {
            update: vi.fn().mockResolvedValue(AppResult.success(assignment)),
          },
        },
        {
          provide: LecturerRepository,
          useValue: {
            getById: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        {
          provide: GetTitleByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(programTitle)),
          },
        },
        UpdateLecturerTitleUseCase,
      ],
    }).compile()

    lecturerTitleRepository = moduleRef.get(LecturerTitleRepository)
    lecturerRepository = moduleRef.get(LecturerRepository)
    getTitleByIdUseCase = moduleRef.get(GetTitleByIdUseCase)
    updateLecturerTitleUseCase = moduleRef.get(UpdateLecturerTitleUseCase)
  })

  it('should update program-scoped assignment when valid', async () => {
    const params = new UpdateLecturerTitleParams({
      id: assignment.id,
      lecturerId: lecturer.id,
      titleId: programTitle.id,
      programId: 'program-id',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
    })

    const result = await updateLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.update).toHaveBeenCalledExactlyOnceWith(
      params,
    )
    expect(result).toStrictEqual(AppResult.success(assignment))
  })

  it('should fail with InvalidRequestException when endDate is earlier than startDate', async () => {
    const params = new UpdateLecturerTitleParams({
      id: assignment.id,
      lecturerId: lecturer.id,
      titleId: programTitle.id,
      programId: 'program-id',
      startDate: '2026-06-01',
      endDate: '2026-01-01',
    })

    const result = await updateLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.update).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'endDate',
            value: '2026-01-01',
            constraints: ['endDate must not be earlier than startDate'],
          }),
        ]),
      ),
    )
  })

  it('should fail with InvalidRequestException when program-scoped title receives facultyId', async () => {
    const params = new UpdateLecturerTitleParams({
      id: assignment.id,
      lecturerId: lecturer.id,
      titleId: programTitle.id,
      facultyId: 'faculty-id',
      programId: 'program-id',
      startDate: '2026-01-01',
    })

    const result = await updateLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.update).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'facultyId',
            value: 'faculty-id',
            constraints: ['facultyId must be null for program-scoped title'],
          }),
        ]),
      ),
    )
  })

  it('should propagate NotFoundException when lecturer or title is missing', async () => {
    const notFound = new NotFoundException('missing')
    vi.spyOn(lecturerRepository, 'getById').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    const params = new UpdateLecturerTitleParams({
      id: assignment.id,
      lecturerId: 'missing',
      titleId: programTitle.id,
      programId: 'program-id',
      startDate: '2026-01-01',
    })

    expect(await updateLecturerTitleUseCase.execute(params)).toStrictEqual(
      AppResult.failed(notFound),
    )

    vi.spyOn(getTitleByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    expect(await updateLecturerTitleUseCase.execute(params)).toStrictEqual(
      AppResult.failed(notFound),
    )
  })

  it('should propagate repository failure', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerTitleRepository, 'update').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const params = new UpdateLecturerTitleParams({
      id: assignment.id,
      lecturerId: lecturer.id,
      titleId: programTitle.id,
      programId: 'program-id',
      startDate: '2026-01-01',
    })

    const result = await updateLecturerTitleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
