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
} from '../../lecturer/entities/lecturer.entity.js'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { GetLecturerByIdUseCase } from '../../lecturer/use-cases/get-lecturer-by-id.use-case.js'
import { LecturerTitleRepository } from '../repositories/lecturer-title.repository.js'
import {
  CreateLecturerTitleParams,
  CreateLecturerTitleUseCase,
} from './create-lecturer-title.use-case.js'

describe('CreateLecturerTitleUseCase', () => {
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
  const facultyTitle = new Title({
    id: 'faculty-title-id',
    name: 'Dean',
    scope: TitleScope.faculty,
  })
  const programTitle = new Title({
    id: 'program-title-id',
    name: 'Head of Program',
    scope: TitleScope.program,
  })
  const assignment = new LecturerTitle({
    id: 'assignment-id',
    lecturerId: lecturer.id,
    titleId: facultyTitle.id,
    facultyId: 'faculty-id',
    programId: null,
    startDate: '2026-01-01',
    endDate: null,
  })

  let lecturerTitleRepository: { save: ReturnType<typeof vi.fn> }
  let getLecturerByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let getTitleByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let createLecturerTitleUseCase: CreateLecturerTitleUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: LecturerTitleRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(assignment)),
          },
        },
        {
          provide: GetLecturerByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(lecturer)),
          },
        },
        {
          provide: GetTitleByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(facultyTitle)),
          },
        },
        CreateLecturerTitleUseCase,
      ],
    }).compile()

    lecturerTitleRepository = moduleRef.get(LecturerTitleRepository)
    getLecturerByIdUseCase = moduleRef.get(GetLecturerByIdUseCase)
    getTitleByIdUseCase = moduleRef.get(GetTitleByIdUseCase)
    createLecturerTitleUseCase = moduleRef.get(CreateLecturerTitleUseCase)
  })

  it('should create faculty-scoped assignment when valid', async () => {
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: facultyTitle.id,
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(getLecturerByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      lecturer.id,
    )
    expect(getTitleByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
      facultyTitle.id,
    )
    expect(lecturerTitleRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(assignment))
  })

  it('should allow same-day startDate and endDate (non-strict)', async () => {
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: facultyTitle.id,
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
      endDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.save).toHaveBeenCalledExactlyOnceWith(params)
    expect(result).toStrictEqual(AppResult.success(assignment))
  })

  it('should fail with InvalidRequestException when endDate is earlier than startDate', async () => {
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: facultyTitle.id,
      facultyId: 'faculty-id',
      startDate: '2026-06-01',
      endDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.save).not.toHaveBeenCalled()
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

  it('should propagate NotFoundException when lecturerId does not exist', async () => {
    const notFound = new NotFoundException('lecturer not found')
    vi.spyOn(getLecturerByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    const params = new CreateLecturerTitleParams({
      lecturerId: 'missing',
      titleId: facultyTitle.id,
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(AppResult.failed(notFound))
  })

  it('should propagate NotFoundException when titleId does not exist', async () => {
    const notFound = new NotFoundException('title not found')
    vi.spyOn(getTitleByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.failed(notFound),
    )
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: 'missing',
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(AppResult.failed(notFound))
  })

  it('should fail with InvalidRequestException when faculty-scoped title misses facultyId or includes programId', async () => {
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: facultyTitle.id,
      facultyId: null,
      programId: 'program-id',
      startDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'facultyId',
            value: null,
            constraints: ['facultyId is required for faculty-scoped title'],
          }),
          new InvalidRequestError({
            property: 'programId',
            value: 'program-id',
            constraints: ['programId must be null for faculty-scoped title'],
          }),
        ]),
      ),
    )
  })

  it('should fail with InvalidRequestException when program-scoped title misses programId or includes facultyId', async () => {
    vi.spyOn(getTitleByIdUseCase, 'execute').mockResolvedValueOnce(
      AppResult.success(programTitle),
    )
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: programTitle.id,
      facultyId: 'faculty-id',
      programId: null,
      startDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(lecturerTitleRepository.save).not.toHaveBeenCalled()
    expect(result).toStrictEqual(
      AppResult.failed(
        new InvalidRequestException([
          new InvalidRequestError({
            property: 'programId',
            value: null,
            constraints: ['programId is required for program-scoped title'],
          }),
          new InvalidRequestError({
            property: 'facultyId',
            value: 'faculty-id',
            constraints: ['facultyId must be null for program-scoped title'],
          }),
        ]),
      ),
    )
  })

  it('should propagate repository failure', async () => {
    const e = AppException.test()
    vi.spyOn(lecturerTitleRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const params = new CreateLecturerTitleParams({
      lecturerId: lecturer.id,
      titleId: facultyTitle.id,
      facultyId: 'faculty-id',
      startDate: '2026-01-01',
      createdBy: 'user-id',
    })

    const result = await createLecturerTitleUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
