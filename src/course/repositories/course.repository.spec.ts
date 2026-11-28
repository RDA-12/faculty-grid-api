import { DataSource } from 'typeorm'
import { Test } from '@nestjs/testing'
import { UserDBEntity } from '../../common/database/entities/user.entity.js'
import { FacultyDBEntity } from '../../common/database/entities/faculty.entity.js'
import { ProgramDBEntity } from '../../common/database/entities/program.entity.js'
import { CourseDBEntity } from '../../common/database/entities/course.entity.js'
import { ProgramDegreeLevel } from '../../organization/entities/program.entity.js'
import { createTestDataSource } from '../../../test/common/database/test-database.js'
import { CourseRepository } from './course.repository.js'
import { Course, CourseType } from '../entities/course.entity.js'
import { CreateCourseParams } from '../use-cases/create-course.use-case.js'
import { GetCoursesParams } from '../use-cases/get-courses.use-case.js'
import { UpdateCourseParams } from '../use-cases/update-course.use-case.js'
import { AppResult } from '../../common/app-result.js'
import {
  AlreadyExistsException,
  NotFoundException,
} from '../../common/app-exception.js'
import {
  PaginatedResult,
  Pagination,
  PaginationResult,
} from '../../common/pagination.js'

describe('CourseRepository', () => {
  let params: CreateCourseParams
  let userDb: UserDBEntity
  let programDb: ProgramDBEntity
  let otherProgramDb: ProgramDBEntity
  let dataSource: DataSource
  let courseRepository: CourseRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useFactory: createTestDataSource,
        },
        CourseRepository,
      ],
    }).compile()

    dataSource = moduleRef.get(DataSource)
    const insertUserDb = new UserDBEntity()
    insertUserDb.name = 'Admin User'
    insertUserDb.email = 'admin@example.com'
    userDb = await dataSource.manager.save(insertUserDb)

    const insertFacultyDb = new FacultyDBEntity()
    insertFacultyDb.name = 'Engineering'
    insertFacultyDb.createdBy = userDb.id
    const facultyDb = await dataSource.manager.save(insertFacultyDb)
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
        name: 'Information Systems',
        degreeLevel: ProgramDegreeLevel.bachelor,
        facultyId: facultyDb.id,
        createdBy: userDb.id,
      }),
    )

    courseRepository = moduleRef.get(CourseRepository)
  })

  beforeEach(async () => {
    await dataSource.query(`TRUNCATE TABLE "courses" RESTART IDENTITY CASCADE`)
  })

  describe('save', () => {
    beforeEach(() => {
      params = new CreateCourseParams({
        code: 'CS101',
        name: 'Data Structures',
        credits: 3,
        semester: 1,
        courseType: CourseType.mandatory,
        programId: programDb.id,
        createdBy: userDb.id,
      })
    })

    it('should return and save correct course', async () => {
      const result = await courseRepository.save(params)

      expect(result.data).not.toBeNull()
      expect(result.data).toMatchObject({
        code: params.code,
        name: params.name,
        credits: params.credits,
        semester: params.semester,
        courseType: params.courseType,
        programId: params.programId,
      })

      const row = await dataSource.manager.findOneBy(CourseDBEntity, {
        id: result.data!.id,
      })
      expect(row?.code).toBe(params.code)
      expect(row?.name).toBe(params.name)
      expect(row?.credits).toBe(params.credits)
      expect(row?.semester).toBe(params.semester)
      expect(row?.courseType).toBe(params.courseType)
      expect(row?.programId).toBe(params.programId)
      expect(row?.createdBy).toBe(userDb.id)
    })

    it('should return AlreadyExistsException when saving duplicate code in same program', async () => {
      await courseRepository.save(params)

      const duplicateResult = await courseRepository.save(params)

      expect(duplicateResult).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `course with code ${params.code} already exists in program ${params.programId}`,
          ),
        ),
      )
    })

    it('should allow saving same code in a different program', async () => {
      await courseRepository.save(params)

      const otherProgramCourse = await courseRepository.save(
        new CreateCourseParams({
          code: params.code,
          name: params.name,
          credits: params.credits,
          semester: params.semester,
          courseType: params.courseType,
          programId: otherProgramDb.id,
          createdBy: params.createdBy,
        }),
      )

      expect(otherProgramCourse.data).not.toBeNull()
      expect(otherProgramCourse.data?.code).toBe(params.code)
      expect(otherProgramCourse.data?.programId).toBe(otherProgramDb.id)
    })

    it('should allow reusing code in same program after soft-deleting previous course', async () => {
      const first = await courseRepository.save(params)
      await courseRepository.deleteById(first.data!.id)

      const second = await courseRepository.save(params)

      expect(second.data).not.toBeNull()
      expect(second.data?.id).not.toBe(first.data!.id)
      expect(second.data?.code).toBe(params.code)
    })

    it('should return NotFoundException when programId does not exist', async () => {
      const result = await courseRepository.save(
        new CreateCourseParams({
          code: params.code,
          name: params.name,
          credits: params.credits,
          semester: params.semester,
          courseType: params.courseType,
          programId: 'not-found',
          createdBy: params.createdBy,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `program with ID not-found or user with ID ${userDb.id} is not found`,
          ),
        ),
      )
    })

    it('should return NotFoundException when createdBy does not exist', async () => {
      const result = await courseRepository.save(
        new CreateCourseParams({
          code: params.code,
          name: params.name,
          credits: params.credits,
          semester: params.semester,
          courseType: params.courseType,
          programId: params.programId,
          createdBy: 'not-found',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException(
            `program with ID ${programDb.id} or user with ID not-found is not found`,
          ),
        ),
      )
    })
  })

  describe('getAll', () => {
    let expected: Course[] = []

    beforeEach(async () => {
      const newData: Course[] = []
      const specs = [
        {
          code: 'CS101',
          name: 'Programming Fundamentals',
          credits: 3,
          semester: 1,
          courseType: CourseType.mandatory,
          programId: programDb.id,
        },
        {
          code: 'CS102',
          name: 'Data Structures',
          credits: 4,
          semester: 2,
          courseType: CourseType.mandatory,
          programId: programDb.id,
        },
        {
          code: 'CS301',
          name: 'Cloud Computing',
          credits: 3,
          semester: 5,
          courseType: CourseType.elective,
          programId: programDb.id,
        },
        {
          code: 'IS101',
          name: 'Enterprise Systems',
          credits: 3,
          semester: 1,
          courseType: CourseType.mandatory,
          programId: otherProgramDb.id,
        },
        {
          code: 'IS201',
          name: 'Business Intelligence',
          credits: 2,
          semester: 2,
          courseType: CourseType.elective,
          programId: otherProgramDb.id,
        },
      ]
      for (let i = 0; i < specs.length; i++) {
        const courseInsertDb = new CourseDBEntity({
          ...specs[i],
          createdBy: userDb.id,
          createdAt: new Date(2026, 11, 1 + i),
        })
        const courseDb = await dataSource.manager.save(courseInsertDb)
        newData.unshift(courseDb.toDomain())
      }
      expected = newData
    })

    it('should return all courses ordered by created_at DESC', async () => {
      const result = await courseRepository.getAll()

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 5,
            }),
          }),
        ),
      )
    })

    it('should return correct paginated courses', async () => {
      const result = await courseRepository.getAll(
        new Pagination({ page: 2, pageSize: 2 }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: [expected[2], expected[3]],
            pagination: new PaginationResult({
              page: 2,
              pageSize: 2,
              total: 5,
            }),
          }),
        ),
      )
    })

    it('should filter courses by programId', async () => {
      const filtered = expected.filter(
        (it) => it.programId === otherProgramDb.id,
      )
      const result = await courseRepository.getAll(
        new GetCoursesParams({ programId: otherProgramDb.id }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: filtered,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: filtered.length,
            }),
          }),
        ),
      )
    })

    it('should filter courses by semester', async () => {
      const filtered = expected.filter((it) => it.semester === 2)
      const result = await courseRepository.getAll(
        new GetCoursesParams({ semester: 2 }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: filtered,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: filtered.length,
            }),
          }),
        ),
      )
    })

    it('should filter courses by courseType', async () => {
      const filtered = expected.filter(
        (it) => it.courseType === CourseType.elective,
      )
      const result = await courseRepository.getAll(
        new GetCoursesParams({ courseType: CourseType.elective }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: filtered,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: filtered.length,
            }),
          }),
        ),
      )
    })

    it('should filter courses by search matching code or name', async () => {
      const byCode = await courseRepository.getAll(
        new GetCoursesParams({ search: 'CS301' }),
      )
      expect(byCode).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.code === 'CS301'),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 1,
            }),
          }),
        ),
      )

      const byName = await courseRepository.getAll(
        new GetCoursesParams({ search: 'Data Structures' }),
      )
      expect(byName).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: expected.filter((it) => it.name === 'Data Structures'),
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: 1,
            }),
          }),
        ),
      )
    })

    it('should combine multiple filters', async () => {
      const filtered = expected.filter(
        (it) =>
          it.programId === programDb.id &&
          it.semester === 2 &&
          it.courseType === CourseType.mandatory,
      )
      const result = await courseRepository.getAll(
        new GetCoursesParams({
          programId: programDb.id,
          semester: 2,
          courseType: CourseType.mandatory,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new PaginatedResult({
            data: filtered,
            pagination: new PaginationResult({
              page: 1,
              pageSize: 10,
              total: filtered.length,
            }),
          }),
        ),
      )
    })
  })

  describe('getById', () => {
    let savedCourse: CourseDBEntity

    beforeEach(async () => {
      savedCourse = await dataSource.manager.save(
        new CourseDBEntity({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: CourseType.mandatory,
          programId: programDb.id,
          createdBy: userDb.id,
        }),
      )
    })

    it('should return course when found', async () => {
      const result = await courseRepository.getById(savedCourse.id)

      expect(result).toStrictEqual(AppResult.success(savedCourse.toDomain()))
    })

    it('should return NotFoundException when course is not found', async () => {
      const result = await courseRepository.getById('not-found')

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('course with ID not-found is not found'),
        ),
      )
    })
  })

  describe('update', () => {
    let savedCourse: CourseDBEntity
    let otherCourse: CourseDBEntity

    beforeEach(async () => {
      savedCourse = await dataSource.manager.save(
        new CourseDBEntity({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: CourseType.mandatory,
          programId: programDb.id,
          createdBy: userDb.id,
        }),
      )
      otherCourse = await dataSource.manager.save(
        new CourseDBEntity({
          code: 'CS102',
          name: 'Algorithms',
          credits: 4,
          semester: 2,
          courseType: CourseType.mandatory,
          programId: programDb.id,
          createdBy: userDb.id,
        }),
      )
    })

    it('should update and return updated course', async () => {
      const result = await courseRepository.update(
        new UpdateCourseParams({
          id: savedCourse.id,
          code: 'IS301',
          name: 'Enterprise Architecture',
          credits: 4,
          semester: 5,
          courseType: CourseType.elective,
          programId: otherProgramDb.id,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.success(
          new Course({
            id: savedCourse.id,
            code: 'IS301',
            name: 'Enterprise Architecture',
            credits: 4,
            semester: 5,
            courseType: CourseType.elective,
            programId: otherProgramDb.id,
          }),
        ),
      )

      const row = await dataSource.manager.findOneBy(CourseDBEntity, {
        id: savedCourse.id,
      })
      expect(row?.code).toBe('IS301')
      expect(row?.name).toBe('Enterprise Architecture')
      expect(row?.credits).toBe(4)
      expect(row?.semester).toBe(5)
      expect(row?.courseType).toBe(CourseType.elective)
      expect(row?.programId).toBe(otherProgramDb.id)
    })

    it('should allow updating own record with same code and programId', async () => {
      const result = await courseRepository.update(
        new UpdateCourseParams({
          id: savedCourse.id,
          code: savedCourse.code,
          name: 'Data Structures Updated',
          credits: 4,
          semester: 2,
          courseType: CourseType.elective,
          programId: savedCourse.programId,
        }),
      )

      expect(result.data).toMatchObject({
        id: savedCourse.id,
        code: savedCourse.code,
        name: 'Data Structures Updated',
        credits: 4,
        semester: 2,
        courseType: CourseType.elective,
        programId: savedCourse.programId,
      })
    })

    it('should return AlreadyExistsException when updating to duplicate code in target program', async () => {
      const result = await courseRepository.update(
        new UpdateCourseParams({
          id: savedCourse.id,
          code: otherCourse.code,
          name: savedCourse.name,
          credits: savedCourse.credits,
          semester: savedCourse.semester,
          courseType: savedCourse.courseType,
          programId: otherCourse.programId,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new AlreadyExistsException(
            `course with code ${otherCourse.code} already exists in program ${otherCourse.programId}`,
          ),
        ),
      )
    })

    it('should return NotFoundException when course is not found', async () => {
      const result = await courseRepository.update(
        new UpdateCourseParams({
          id: 'not-found',
          code: 'CS999',
          name: 'Missing Course',
          credits: 3,
          semester: 1,
          courseType: CourseType.mandatory,
          programId: programDb.id,
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('course with ID not-found is not found'),
        ),
      )
    })

    it('should return NotFoundException when target programId is not found', async () => {
      const result = await courseRepository.update(
        new UpdateCourseParams({
          id: savedCourse.id,
          code: savedCourse.code,
          name: savedCourse.name,
          credits: savedCourse.credits,
          semester: savedCourse.semester,
          courseType: savedCourse.courseType,
          programId: 'not-found',
        }),
      )

      expect(result).toStrictEqual(
        AppResult.failed(
          new NotFoundException('program with ID not-found is not found'),
        ),
      )
    })
  })

  describe('deleteById', () => {
    let toBeDeleted: CourseDBEntity

    beforeEach(async () => {
      toBeDeleted = await dataSource.manager.save(
        new CourseDBEntity({
          code: 'CS101',
          name: 'Data Structures',
          credits: 3,
          semester: 1,
          courseType: CourseType.mandatory,
          programId: programDb.id,
          createdBy: userDb.id,
        }),
      )
    })

    it('should soft remove correct course', async () => {
      const result = await courseRepository.deleteById(toBeDeleted.id)

      expect(result).toStrictEqual(AppResult.success(null))

      const activeRow = await dataSource.manager.findOneBy(CourseDBEntity, {
        id: toBeDeleted.id,
      })
      expect(activeRow).toBeNull()

      const deletedRow = await dataSource.manager.findOne(CourseDBEntity, {
        where: { id: toBeDeleted.id },
        withDeleted: true,
      })
      expect(deletedRow?.deletedAt).not.toBeNull()
    })

    it('should return success when deleting non-existing course', async () => {
      const result = await courseRepository.deleteById('not-found')

      expect(result).toStrictEqual(AppResult.success(null))
    })
  })
})
