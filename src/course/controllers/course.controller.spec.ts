import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { User } from '../../user/entities/user.entity.js'
import { Course, CourseType } from '../entities/course.entity.js'
import { CourseController } from './course.controller.js'
import {
  CourseOut,
  CoursesQuery,
  CreateCourseDTO,
  UpdateCourseDTO,
} from './course.dto.js'
import {
  CreateCourseParams,
  CreateCourseUseCase,
} from '../use-cases/create-course.use-case.js'
import {
  GetCoursesParams,
  GetCoursesUseCase,
} from '../use-cases/get-courses.use-case.js'
import { GetCourseByIdUseCase } from '../use-cases/get-course-by-id.use-case.js'
import {
  UpdateCourseParams,
  UpdateCourseUseCase,
} from '../use-cases/update-course.use-case.js'
import { DeleteCourseUseCase } from '../use-cases/delete-course.use-case.js'
import { AppResult } from '../../common/app-result.js'
import { AppException } from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('CourseController', () => {
  const user = new User({
    id: 'user-id',
    name: 'name',
    email: 'email',
  })
  const course = new Course({
    id: 'course-id',
    code: 'CS101',
    name: 'Data Structures',
    credits: 3,
    semester: 1,
    courseType: CourseType.mandatory,
    programId: 'program-id',
  })
  const paginatedResult = new PaginatedResult({
    data: [course],
    pagination: new PaginationResult({
      total: 10,
      page: 1,
      pageSize: 10,
    }),
  })
  const courseOut = CourseOut.fromCourse(course)
  let createCourseUseCase: { execute: ReturnType<typeof vi.fn> }
  let getCoursesUseCase: { execute: ReturnType<typeof vi.fn> }
  let getCourseByIdUseCase: { execute: ReturnType<typeof vi.fn> }
  let updateCourseUseCase: { execute: ReturnType<typeof vi.fn> }
  let deleteCourseUseCase: { execute: ReturnType<typeof vi.fn> }
  let courseController: CourseController

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        {
          provide: CreateCourseUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(course)),
          },
        },
        {
          provide: GetCoursesUseCase,
          useValue: {
            execute: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        {
          provide: GetCourseByIdUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(course)),
          },
        },
        {
          provide: UpdateCourseUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(course)),
          },
        },
        {
          provide: DeleteCourseUseCase,
          useValue: {
            execute: vi.fn().mockResolvedValue(AppResult.success(null)),
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile()

    createCourseUseCase = moduleRef.get(CreateCourseUseCase)
    getCoursesUseCase = moduleRef.get(GetCoursesUseCase)
    getCourseByIdUseCase = moduleRef.get(GetCourseByIdUseCase)
    updateCourseUseCase = moduleRef.get(UpdateCourseUseCase)
    deleteCourseUseCase = moduleRef.get(DeleteCourseUseCase)

    courseController = moduleRef.get(CourseController)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createCourse', () => {
    const createCourseRequest = new CreateCourseDTO({
      code: 'CS101',
      name: 'Data Structures',
      credits: 3,
      semester: 1,
      courseType: CourseType.mandatory,
      programId: 'program-id',
    })
    const params = new CreateCourseParams({
      code: createCourseRequest.code,
      name: createCourseRequest.name,
      credits: createCourseRequest.credits,
      semester: createCourseRequest.semester,
      courseType: createCourseRequest.courseType,
      programId: createCourseRequest.programId,
      createdBy: user.id,
    })

    it('calls CreateCourseUseCase once', async () => {
      await courseController.createCourse(user, createCourseRequest)

      expect(createCourseUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return CourseOut when CreateCourseUseCase succeeds', async () => {
      const result = await courseController.createCourse(
        user,
        createCourseRequest,
      )

      expect(result).toStrictEqual(AppResult.success(courseOut))
    })

    it('should return failed when CreateCourseUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(createCourseUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await courseController.createCourse(
        user,
        createCourseRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getCourses', () => {
    it('calls GetCoursesUseCase once with defaults', async () => {
      await courseController.getCourses(user)

      expect(getCoursesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetCoursesParams({}),
      )
    })

    it('calls GetCoursesUseCase once with pagination', async () => {
      const query = new CoursesQuery({ page: 2, pageSize: 5 })

      await courseController.getCourses(user, query)

      expect(getCoursesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetCoursesParams({ page: 2, pageSize: 5 }),
      )
    })

    it('calls GetCoursesUseCase once with filters', async () => {
      const query = new CoursesQuery({
        programId: 'program-id',
        semester: 2,
        courseType: CourseType.elective,
        search: 'Algo',
      })

      await courseController.getCourses(user, query)

      expect(getCoursesUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        new GetCoursesParams({
          programId: query.programId,
          semester: query.semester,
          courseType: query.courseType,
          search: query.search,
        }),
      )
    })

    it('should return paginated CourseOut when GetCoursesUseCase succeeds', async () => {
      const result = await courseController.getCourses(user)

      expect(result).toStrictEqual(
        AppResult.success(
          paginatedResult.mapData((it) => CourseOut.fromCourse(it)),
        ),
      )
    })

    it('should return failed when GetCoursesUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getCoursesUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await courseController.getCourses(user)

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('getCourseById', () => {
    it('calls GetCourseByIdUseCase once', async () => {
      await courseController.getCourseById(user, 'course-id')

      expect(getCourseByIdUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'course-id',
      )
    })

    it('should return CourseOut when GetCourseByIdUseCase succeeds', async () => {
      const result = await courseController.getCourseById(user, 'course-id')

      expect(result).toStrictEqual(AppResult.success(courseOut))
    })

    it('should return failed when GetCourseByIdUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(getCourseByIdUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await courseController.getCourseById(user, 'course-id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('updateCourse', () => {
    const updateCourseRequest = new UpdateCourseDTO({
      code: 'CS102',
      name: 'Algorithms',
      credits: 4,
      semester: 2,
      courseType: CourseType.elective,
      programId: 'program-id',
    })
    const params = new UpdateCourseParams({
      id: 'course-id',
      code: updateCourseRequest.code,
      name: updateCourseRequest.name,
      credits: updateCourseRequest.credits,
      semester: updateCourseRequest.semester,
      courseType: updateCourseRequest.courseType,
      programId: updateCourseRequest.programId,
    })

    it('calls UpdateCourseUseCase once', async () => {
      await courseController.updateCourse(
        user,
        'course-id',
        updateCourseRequest,
      )

      expect(updateCourseUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        params,
      )
    })

    it('should return CourseOut when UpdateCourseUseCase succeeds', async () => {
      const result = await courseController.updateCourse(
        user,
        'course-id',
        updateCourseRequest,
      )

      expect(result).toStrictEqual(AppResult.success(courseOut))
    })

    it('should return failed when UpdateCourseUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(updateCourseUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await courseController.updateCourse(
        user,
        'course-id',
        updateCourseRequest,
      )

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })

  describe('deleteCourse', () => {
    it('calls DeleteCourseUseCase once', async () => {
      await courseController.deleteCourse(user, 'course-id')

      expect(deleteCourseUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        'course-id',
      )
    })

    it('should return undefined when DeleteCourseUseCase succeeds', async () => {
      const result = await courseController.deleteCourse(user, 'course-id')

      expect(result).toBeUndefined()
    })

    it('should return failed when DeleteCourseUseCase fails', async () => {
      const e = AppException.test()
      vi.spyOn(deleteCourseUseCase, 'execute').mockResolvedValueOnce(
        AppResult.failed(e),
      )

      const result = await courseController.deleteCourse(user, 'course-id')

      expect(result).toStrictEqual(AppResult.failed(e))
    })
  })
})
