import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import { ProgramDBEntity } from '../../common/database/entities/program.entity.js'
import { RankDBEntity } from '../../common/database/entities/rank.entity.js'
import { FunctionalRankDBEntity } from '../../common/database/entities/functional-rank.entity.js'
import { LecturerDBEntity } from '../../common/database/entities/lecturer.entity.js'
import { ProgramDegreeLevel } from '../../organization/entities/program.entity.js'
import { RankType } from '../entities/rank.entity.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../entities/lecturer.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { LecturerRepository } from './lecturer.repository.js'
import { CreateLecturerParams } from '../use-cases/create-lecturer.use-case.js'
import { GetLecturersParams } from '../use-cases/get-lecturers.use-case.js'
import { UpdateLecturerParams } from '../use-cases/update-lecturer.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { NotFoundException } from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('LecturerRepository', () => {
  let userDb: UserDBEntity
  let facultyDb: FacultyDBEntity
  let programDb: ProgramDBEntity
  let otherProgramDb: ProgramDBEntity
  let asnRankDb: RankDBEntity
  let militaryRankDb: RankDBEntity
  let functionalRankDb: FunctionalRankDBEntity
  let dataSource: DataSource
  let lecturerRepository: LecturerRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        LecturerRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)

    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'Admin'
    insertUserDb.email = 'admin@example.com'
    userDb = await dataSource.manager.save(insertUserDb)

    const insertFacultyDb = new FacultyDBEntity()
    insertFacultyDb.name = 'Engineering'
    insertFacultyDb.createdBy = userDb.id
    facultyDb = await dataSource.manager.save(insertFacultyDb)

    programDb = await dataSource.manager.save(
      new ProgramDBEntity({
        name: 'Informatics',
        degreeLevel: ProgramDegreeLevel.bachelor,
        facultyId: facultyDb.id,
        createdBy: userDb.id,
      }),
    )

    otherProgramDb = await dataSource.manager.save(
      new ProgramDBEntity({
        name: 'Electrical Engineering',
        degreeLevel: ProgramDegreeLevel.master,
        facultyId: facultyDb.id,
        createdBy: userDb.id,
      }),
    )

    asnRankDb = await dataSource.manager.save(
      new RankDBEntity({
        name: 'Penata Muda (III/a)',
        type: RankType.asn,
        createdBy: userDb.id,
      }),
    )

    militaryRankDb = await dataSource.manager.save(
      new RankDBEntity({
        name: 'Mayor',
        type: RankType.military,
        createdBy: userDb.id,
      }),
    )

    functionalRankDb = await dataSource.manager.save(
      new FunctionalRankDBEntity({
        name: 'Lektor',
        createdBy: userDb.id,
      }),
    )

    lecturerRepository = moduleRef.get(LecturerRepository)
  })

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "lecturers" RESTART IDENTITY CASCADE`,
    )
  })

  describe('save', () => {
    it('should save and return lecturer with all fields', async () => {
      const params = new CreateLecturerParams({
        name: 'Budi Santoso',
        displayName: 'Dr. Budi Santoso, S.T., M.T.',
        programId: programDb.id,
        employmentStatus: EmploymentStatus.asn,
        rankId: asnRankDb.id,
        functionalRankId: functionalRankDb.id,
        academicDegree: AcademicDegree.doctorate,
        createdBy: userDb.id,
      })

      const result = await lecturerRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        name: params.name,
        displayName: params.displayName,
        programId: params.programId,
        employmentStatus: params.employmentStatus,
        rankId: params.rankId,
        functionalRankId: params.functionalRankId,
        academicDegree: params.academicDegree,
      })

      const row = await dataSource.manager.findOneBy(LecturerDBEntity, {
        id: result.data!.id,
      })
      expect(row?.name).toBe(params.name)
      expect(row?.displayName).toBe(params.displayName)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should save and return lecturer with nullable rankId and functionalRankId', async () => {
      const params = new CreateLecturerParams({
        name: 'Siti Aminah',
        displayName: 'Siti Aminah, S.Kom., M.Kom.',
        programId: programDb.id,
        employmentStatus: EmploymentStatus.contract,
        rankId: null,
        functionalRankId: null,
        academicDegree: AcademicDegree.master,
        createdBy: userDb.id,
      })

      const result = await lecturerRepository.save(params)

      expect(result.data).toMatchObject({
        name: params.name,
        displayName: params.displayName,
        programId: params.programId,
        employmentStatus: EmploymentStatus.contract,
        rankId: null,
        functionalRankId: null,
        academicDegree: AcademicDegree.master,
      })
    })

    it('should return NotFoundException when programId is not found', async () => {
      const params = new CreateLecturerParams({
        name: 'Budi Santoso',
        displayName: 'Dr. Budi Santoso',
        programId: 'not-found',
        employmentStatus: EmploymentStatus.asn,
        rankId: asnRankDb.id,
        functionalRankId: null,
        academicDegree: AcademicDegree.doctorate,
        createdBy: userDb.id,
      })

      const result = await lecturerRepository.save(params)

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `program with ID ${params.programId}, rank with ID ${params.rankId}, functional rank with ID ${params.functionalRankId}, or user with ID ${params.createdBy} is not found`,
          ),
        ),
      )
    })

    it('should return NotFoundException when createdBy user is not found', async () => {
      const params = new CreateLecturerParams({
        name: 'Budi Santoso',
        displayName: 'Budi Santoso, S.T.',
        programId: programDb.id,
        employmentStatus: EmploymentStatus.contract,
        rankId: null,
        functionalRankId: null,
        academicDegree: AcademicDegree.bachelor,
        createdBy: 'not-found',
      })

      const result = await lecturerRepository.save(params)

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `program with ID ${params.programId}, rank with ID ${params.rankId}, functional rank with ID ${params.functionalRankId}, or user with ID ${params.createdBy} is not found`,
          ),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: Lecturer[] = []

    beforeEach(async () => {
      const rows: Lecturer[] = []
      const configs = [
        {
          name: 'Lecturer 0',
          displayName: 'Dr. Lecturer 0, S.T., M.T.',
          programId: programDb.id,
          employmentStatus: EmploymentStatus.asn,
          rankId: asnRankDb.id,
          functionalRankId: functionalRankDb.id,
          academicDegree: AcademicDegree.doctorate,
        },
        {
          name: 'Lecturer 1',
          displayName: 'Mayor Lecturer 1, M.T.',
          programId: otherProgramDb.id,
          employmentStatus: EmploymentStatus.military,
          rankId: militaryRankDb.id,
          functionalRankId: null,
          academicDegree: AcademicDegree.master,
        },
        {
          name: 'Lecturer 2',
          displayName: 'Lecturer 2, S.Kom.',
          programId: programDb.id,
          employmentStatus: EmploymentStatus.contract,
          rankId: null,
          functionalRankId: null,
          academicDegree: AcademicDegree.bachelor,
        },
      ]
      for (let i = 0; i < configs.length; i++) {
        const cfg = configs[i]
        const entity = new LecturerDBEntity({
          ...cfg,
          createdBy: userDb.id,
          createdAt: new Date(2026, 10, 1 + i),
        })
        const saved = await dataSource.manager.save(entity)
        rows.unshift(saved.toDomain())
      }
      expected = rows
    })

    it('should return all lecturers ordered by createdAt DESC', async () => {
      const result = await lecturerRepository.getAll()

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

    it('should return paginated lecturers', async () => {
      const result = await lecturerRepository.getAll(
        new Pagination({ page: 2, pageSize: 1 }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [expected[1]],
            pagination: new PaginationResult({
              page: 2,
              pageSize: 1,
              total: 3,
            }),
          }),
        ),
      )
    })

    it('should filter lecturers by programId', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({ programId: otherProgramDb.id }),
      )

      expect(result.data?.data).toStrictEqual([expected[1]])
    })

    it('should filter lecturers by employmentStatus', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({
          employmentStatus: EmploymentStatus.contract,
        }),
      )

      expect(result.data?.data).toStrictEqual([expected[0]])
    })

    it('should filter lecturers by rankId', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({ rankId: militaryRankDb.id }),
      )

      expect(result.data?.data).toStrictEqual([expected[1]])
    })

    it('should filter lecturers by functionalRankId', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({ functionalRankId: functionalRankDb.id }),
      )

      expect(result.data?.data).toStrictEqual([expected[2]])
    })

    it('should filter lecturers by academicDegree', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({ academicDegree: AcademicDegree.bachelor }),
      )

      expect(result.data?.data).toStrictEqual([expected[0]])
    })

    it('should filter lecturers by search matching name', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({ search: 'Lecturer 0' }),
      )

      expect(result.data?.data).toStrictEqual([expected[2]])
    })

    it('should filter lecturers by search matching displayName', async () => {
      const result = await lecturerRepository.getAll(
        new GetLecturersParams({ search: 'Mayor' }),
      )

      expect(result.data?.data).toStrictEqual([expected[1]])
    })
  })

  describe('getById', () => {
    let savedLecturer: LecturerDBEntity

    beforeEach(async () => {
      savedLecturer = await dataSource.manager.save(
        new LecturerDBEntity({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: programDb.id,
          employmentStatus: EmploymentStatus.asn,
          rankId: asnRankDb.id,
          functionalRankId: functionalRankDb.id,
          academicDegree: AcademicDegree.doctorate,
          createdBy: userDb.id,
        }),
      )
    })

    it('should return lecturer when found', async () => {
      const result = await lecturerRepository.getById(savedLecturer.id)

      expect(result).toStrictEqual(AppResult.success(savedLecturer.toDomain()))
    })

    it('should return NotFoundException when lecturer is not found', async () => {
      const result = await lecturerRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('lecturer with ID not-found is not found'),
        ),
      )
    })
  })

  describe('update', () => {
    let savedLecturer: LecturerDBEntity

    beforeEach(async () => {
      savedLecturer = await dataSource.manager.save(
        new LecturerDBEntity({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: programDb.id,
          employmentStatus: EmploymentStatus.asn,
          rankId: asnRankDb.id,
          functionalRankId: functionalRankDb.id,
          academicDegree: AcademicDegree.doctorate,
          createdBy: userDb.id,
        }),
      )
    })

    it('should update lecturer and allow clearing nullable fields', async () => {
      const result = await lecturerRepository.update(
        new UpdateLecturerParams({
          id: savedLecturer.id,
          name: 'Budi Santoso Updated',
          displayName: 'Budi Santoso, M.T.',
          programId: otherProgramDb.id,
          employmentStatus: EmploymentStatus.contract,
          rankId: null,
          functionalRankId: null,
          academicDegree: AcademicDegree.master,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new Lecturer({
            id: savedLecturer.id,
            name: 'Budi Santoso Updated',
            displayName: 'Budi Santoso, M.T.',
            programId: otherProgramDb.id,
            employmentStatus: EmploymentStatus.contract,
            rankId: null,
            functionalRankId: null,
            academicDegree: AcademicDegree.master,
          }),
        ),
      )

      const row = await dataSource.manager.findOneBy(LecturerDBEntity, {
        id: savedLecturer.id,
      })
      expect(row?.displayName).toBe('Budi Santoso, M.T.')
      expect(row?.rankId).toBeNull()
      expect(row?.functionalRankId).toBeNull()
      expect(row?.employmentStatus).toBe(EmploymentStatus.contract)
    })

    it('should return NotFoundException when programId is not found on update', async () => {
      const result = await lecturerRepository.update(
        new UpdateLecturerParams({
          id: savedLecturer.id,
          name: 'Budi',
          displayName: 'Budi, M.T.',
          programId: 'not-found',
          employmentStatus: EmploymentStatus.contract,
          rankId: null,
          functionalRankId: null,
          academicDegree: AcademicDegree.master,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            'program with ID not-found, rank with ID null, or functional rank with ID null is not found',
          ),
        ),
      )
    })

    it('should return NotFoundException when lecturer is not found', async () => {
      const result = await lecturerRepository.update(
        new UpdateLecturerParams({
          id: 'not-found',
          name: 'Budi',
          displayName: 'Budi, M.T.',
          programId: programDb.id,
          employmentStatus: EmploymentStatus.contract,
          rankId: null,
          functionalRankId: null,
          academicDegree: AcademicDegree.master,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('lecturer with ID not-found is not found'),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: LecturerDBEntity

    beforeEach(async () => {
      toBeDeleted = await dataSource.manager.save(
        new LecturerDBEntity({
          name: 'Budi Santoso',
          displayName: 'Dr. Budi Santoso',
          programId: programDb.id,
          employmentStatus: EmploymentStatus.asn,
          rankId: asnRankDb.id,
          functionalRankId: null,
          academicDegree: AcademicDegree.doctorate,
          createdBy: userDb.id,
        }),
      )
    })

    it('should soft remove lecturer', async () => {
      const result = await lecturerRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(LecturerDBEntity, {
        id: toBeDeleted.id,
      })
      expect(activeRow).toBeNull()

      const rows = await dataSource.manager.find(LecturerDBEntity, {
        withDeleted: true,
      })
      expect(rows.map((it) => it.id).includes(toBeDeleted.id)).toBeTruthy()
    })

    it('should return success when deleting non-existing lecturer', async () => {
      const result = await lecturerRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
