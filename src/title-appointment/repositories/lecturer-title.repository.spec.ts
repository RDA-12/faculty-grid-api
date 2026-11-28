import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import { ProgramDBEntity } from '../../common/database/entities/program.entity.js'
import { TitleDBEntity } from '../../common/database/entities/title.entity.js'
import { LecturerDBEntity } from '../../common/database/entities/lecturer.entity.js'
import { LecturerTitleDBEntity } from '../../common/database/entities/lecturer-title.entity.js'
import { ProgramDegreeLevel } from '../../organization/entities/program.entity.js'
import { TitleScope } from '../../organization/entities/title.entity.js'
import {
  AcademicDegree,
  EmploymentStatus,
} from '../../lecturer/entities/lecturer.entity.js'
import { LecturerTitle } from '../entities/lecturer-title.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { LecturerTitleRepository } from './lecturer-title.repository.js'
import { CreateLecturerTitleParams } from '../use-cases/create-lecturer-title.use-case.js'
import { GetLecturerTitlesParams } from '../use-cases/get-lecturer-titles.use-case.js'
import { UpdateLecturerTitleParams } from '../use-cases/update-lecturer-title.use-case.js'
import { AppResult } from '../../common/app-result.js'
import {
  InvalidRequestError,
  InvalidRequestException,
  NotFoundException,
} from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('LecturerTitleRepository', () => {
  let userDb: UserDBEntity
  let facultyDb: FacultyDBEntity
  let otherFacultyDb: FacultyDBEntity
  let programDb: ProgramDBEntity
  let facultyTitleDb: TitleDBEntity
  let programTitleDb: TitleDBEntity
  let lecturerOneDb: LecturerDBEntity
  let lecturerTwoDb: LecturerDBEntity
  let dataSource: DataSource
  let lecturerTitleRepository: LecturerTitleRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        LecturerTitleRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)

    const insertUser = new UserDBEntity()
    insertUser.name = 'Admin'
    insertUser.email = 'admin@example.com'
    userDb = await dataSource.manager.save(insertUser)

    const insertFaculty = new FacultyDBEntity()
    insertFaculty.name = 'Engineering'
    insertFaculty.createdBy = userDb.id
    facultyDb = await dataSource.manager.save(insertFaculty)

    const insertOtherFaculty = new FacultyDBEntity()
    insertOtherFaculty.name = 'Science'
    insertOtherFaculty.createdBy = userDb.id
    otherFacultyDb = await dataSource.manager.save(insertOtherFaculty)

    programDb = await dataSource.manager.save(
      new ProgramDBEntity({
        name: 'Informatics',
        degreeLevel: ProgramDegreeLevel.bachelor,
        facultyId: facultyDb.id,
        createdBy: userDb.id,
      }),
    )

    facultyTitleDb = await dataSource.manager.save(
      new TitleDBEntity({
        name: 'Dean',
        scope: TitleScope.faculty,
        createdBy: userDb.id,
      }),
    )

    programTitleDb = await dataSource.manager.save(
      new TitleDBEntity({
        name: 'Head of Program',
        scope: TitleScope.program,
        createdBy: userDb.id,
      }),
    )

    lecturerOneDb = await dataSource.manager.save(
      new LecturerDBEntity({
        name: 'Budi Santoso',
        displayName: 'Dr. Budi Santoso',
        programId: programDb.id,
        employmentStatus: EmploymentStatus.contract,
        rankId: null,
        functionalRankId: null,
        academicDegree: AcademicDegree.doctorate,
        createdBy: userDb.id,
      }),
    )

    lecturerTwoDb = await dataSource.manager.save(
      new LecturerDBEntity({
        name: 'Siti Aminah',
        displayName: 'Dr. Siti Aminah',
        programId: programDb.id,
        employmentStatus: EmploymentStatus.contract,
        rankId: null,
        functionalRankId: null,
        academicDegree: AcademicDegree.doctorate,
        createdBy: userDb.id,
      }),
    )

    lecturerTitleRepository = moduleRef.get(LecturerTitleRepository)
  })

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "lecturer_titles" RESTART IDENTITY CASCADE`,
    )
  })

  describe('save', () => {
    it('should save faculty-scoped active assignment', async () => {
      const params = new CreateLecturerTitleParams({
        lecturerId: lecturerOneDb.id,
        titleId: facultyTitleDb.id,
        facultyId: facultyDb.id,
        programId: null,
        startDate: '2026-01-01',
        endDate: null,
        createdBy: userDb.id,
      })

      const result = await lecturerTitleRepository.save(params)

      expect(result.data).toStrictEqual(
        new LecturerTitle({
          id: result.data!.id,
          lecturerId: params.lecturerId,
          titleId: params.titleId,
          facultyId: params.facultyId,
          programId: null,
          startDate: '2026-01-01',
          endDate: null,
        }),
      )
    })

    it('should save program-scoped active assignment and allow 1 lecturer to hold multiple active titles', async () => {
      await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      const second = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: programTitleDb.id,
          programId: programDb.id,
          startDate: '2026-02-01',
          createdBy: userDb.id,
        }),
      )

      expect(second.exception).toBeNull()
      expect(second.data).toMatchObject({
        lecturerId: lecturerOneDb.id,
        titleId: programTitleDb.id,
        facultyId: null,
        programId: programDb.id,
        startDate: '2026-02-01',
        endDate: null,
      })
    })

    it('should auto-end previous active holder on faculty seat rotation', async () => {
      const first = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      const second = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-06-01',
          createdBy: userDb.id,
        }),
      )

      expect(second.exception).toBeNull()
      const previousUpdated = await lecturerTitleRepository.getById(
        first.data!.id,
      )
      expect(previousUpdated.data?.endDate).toBe('2026-06-01')
    })

    it('should auto-end previous active holder on program seat rotation including same-day rotation', async () => {
      const first = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: programTitleDb.id,
          programId: programDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      const second = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerTwoDb.id,
          titleId: programTitleDb.id,
          programId: programDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      expect(second.exception).toBeNull()
      const previousUpdated = await lecturerTitleRepository.getById(
        first.data!.id,
      )
      expect(previousUpdated.data?.endDate).toBe('2026-01-01')
    })

    it('should reject new active assignment when startDate is earlier than active holder startDate', async () => {
      await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-06-01',
          createdBy: userDb.id,
        }),
      )

      const result = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-05-01',
          createdBy: userDb.id,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new InvalidRequestException([
            new InvalidRequestError({
              property: 'startDate',
              value: '2026-05-01',
              constraints: [
                'startDate must not be earlier than the current active holder startDate (2026-06-01)',
              ],
            }),
          ]),
        ),
      )
    })

    it('should allow historical assignment with endDate without ending active holder', async () => {
      const active = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      const historical = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2024-01-01',
          endDate: '2025-12-31',
          createdBy: userDb.id,
        }),
      )

      expect(historical.exception).toBeNull()
      const stillActive = await lecturerTitleRepository.getById(active.data!.id)
      expect(stillActive.data?.endDate).toBeNull()
    })

    it('should return NotFoundException when referenced FK does not exist', async () => {
      const params = new CreateLecturerTitleParams({
        lecturerId: 'not-found',
        titleId: facultyTitleDb.id,
        facultyId: facultyDb.id,
        startDate: '2026-01-01',
        createdBy: userDb.id,
      })

      const result = await lecturerTitleRepository.save(params)

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `lecturer with ID ${params.lecturerId}, title with ID ${params.titleId}, faculty with ID ${params.facultyId}, program with ID ${params.programId}, or user with ID ${params.createdBy} is not found`,
          ),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: LecturerTitle[] = []

    beforeEach(async () => {
      const rows: LecturerTitle[] = []
      const configs = [
        {
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          programId: null,
          startDate: '2024-01-01',
          endDate: '2025-12-31',
        },
        {
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          programId: null,
          startDate: '2026-01-01',
          endDate: null,
        },
        {
          lecturerId: lecturerOneDb.id,
          titleId: programTitleDb.id,
          facultyId: null,
          programId: programDb.id,
          startDate: '2026-03-01',
          endDate: null,
        },
      ]
      for (const cfg of configs) {
        const saved = await dataSource.manager.save(
          new LecturerTitleDBEntity({
            ...cfg,
            createdBy: userDb.id,
          }),
        )
        rows.unshift(saved.toDomain())
      }
      expected = rows
    })

    it('should return all assignments ordered by startDate DESC', async () => {
      const result = await lecturerTitleRepository.getAll()

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 3,
            }),
          }),
        ),
      )
    })

    it('should paginate assignments', async () => {
      const result = await lecturerTitleRepository.getAll(
        new Pagination({ page: 2, pageSize: 1 }),
      )

      expect(result.data?.data).toStrictEqual([expected[1]])
    })

    it('should filter by lecturerId, titleId, facultyId, programId, and activeOnly', async () => {
      const byLecturer = await lecturerTitleRepository.getAll(
        new GetLecturerTitlesParams({ lecturerId: lecturerTwoDb.id }),
      )
      expect(byLecturer.data?.data).toStrictEqual([expected[1]])

      const byTitle = await lecturerTitleRepository.getAll(
        new GetLecturerTitlesParams({ titleId: programTitleDb.id }),
      )
      expect(byTitle.data?.data).toStrictEqual([expected[0]])

      const byFaculty = await lecturerTitleRepository.getAll(
        new GetLecturerTitlesParams({ facultyId: facultyDb.id }),
      )
      expect(byFaculty.data?.data).toStrictEqual([expected[1], expected[2]])

      const byProgram = await lecturerTitleRepository.getAll(
        new GetLecturerTitlesParams({ programId: programDb.id }),
      )
      expect(byProgram.data?.data).toStrictEqual([expected[0]])

      const activeOnly = await lecturerTitleRepository.getAll(
        new GetLecturerTitlesParams({ activeOnly: true }),
      )
      expect(activeOnly.data?.data).toStrictEqual([expected[0], expected[1]])
    })
  })

  describe('getById', () => {
    it('should return lecturer title when found and NotFoundException when missing', async () => {
      const saved = await dataSource.manager.save(
        new LecturerTitleDBEntity({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          programId: null,
          startDate: '2026-01-01',
          endDate: null,
          createdBy: userDb.id,
        }),
      )

      expect(await lecturerTitleRepository.getById(saved.id)).toStrictEqual(
        AppResult.success(saved.toDomain()),
      )
      expect(await lecturerTitleRepository.getById('not-found')).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            'lecturer title with ID not-found is not found',
          ),
        ),
      )
    })
  })

  describe('update', () => {
    it('should update dates and allow ending an active assignment', async () => {
      const saved = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      const updated = await lecturerTitleRepository.update(
        new UpdateLecturerTitleParams({
          id: saved.data!.id,
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        }),
      )

      expect(updated.data).toMatchObject({
        id: saved.data!.id,
        endDate: '2026-12-31',
      })
    })

    it('should auto-end target seat active holder when rotating via update', async () => {
      const activeOnOtherFaculty = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: otherFacultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )
      const toMove = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      const updated = await lecturerTitleRepository.update(
        new UpdateLecturerTitleParams({
          id: toMove.data!.id,
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: otherFacultyDb.id,
          startDate: '2026-05-01',
          endDate: null,
        }),
      )

      expect(updated.exception).toBeNull()
      const ended = await lecturerTitleRepository.getById(
        activeOnOtherFaculty.data!.id,
      )
      expect(ended.data?.endDate).toBe('2026-05-01')
    })

    it('should return NotFoundException when lecturer title is not found', async () => {
      const result = await lecturerTitleRepository.update(
        new UpdateLecturerTitleParams({
          id: 'not-found',
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            'lecturer title with ID not-found is not found',
          ),
        ),
      )
    })
  })

  describe('deleteById', () => {
    it('should soft remove assignment and allow assigning a new active holder to the same seat', async () => {
      const saved = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerOneDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2026-01-01',
          createdBy: userDb.id,
        }),
      )

      expect(
        await lecturerTitleRepository.deleteById(saved.data!.id),
      ).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(
        LecturerTitleDBEntity,
        { id: saved.data!.id },
      )
      expect(activeRow).toBeNull()

      const replacement = await lecturerTitleRepository.save(
        new CreateLecturerTitleParams({
          lecturerId: lecturerTwoDb.id,
          titleId: facultyTitleDb.id,
          facultyId: facultyDb.id,
          startDate: '2025-01-01',
          createdBy: userDb.id,
        }),
      )
      expect(replacement.exception).toBeNull()
    })

    it('should return success when deleting non-existing assignment', async () => {
      expect(
        await lecturerTitleRepository.deleteById('not-found'),
      ).toStrictEqual(AppResult.success(null))
    })
  })
})
