import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'
import { GetCoursesParams, GetCoursesUseCase } from './get-courses.use-case.js'
import { AppException } from '../../common/app-exception.js'
import { PaginatedResult, PaginationResult } from '../../common/pagination.js'

describe('GetCoursesUseCase', () => {
  const course = new Course({
    id: 'id',
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
      total: 1,
      page: 1,
      pageSize: 10,
    }),
  })
  let courseRepository: {
    getAll: ReturnType<typeof vi.fn>
  }
  let getCoursesUseCase: GetCoursesUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CourseRepository,
          useValue: {
            getAll: vi
              .fn()
              .mockResolvedValue(AppResult.success(paginatedResult)),
          },
        },
        GetCoursesUseCase,
      ],
    }).compile()

    courseRepository = moduleRef.get(CourseRepository)
    getCoursesUseCase = moduleRef.get(GetCoursesUseCase)
  })

  it('should call CourseRepository.getAll once with params', async () => {
    const params = new GetCoursesParams({
      page: 2,
      pageSize: 5,
      programId: 'program-id',
      semester: 1,
      courseType: CourseType.mandatory,
      search: 'CS101',
    })

    await getCoursesUseCase.execute(params)

    expect(courseRepository.getAll).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should call CourseRepository.getAll once with undefined when omitted', async () => {
    await getCoursesUseCase.execute()

    expect(courseRepository.getAll).toHaveBeenCalledExactlyOnceWith(undefined)
  })

  it('should return success with paginated courses when CourseRepository.getAll succeeds', async () => {
    const result = await getCoursesUseCase.execute(new GetCoursesParams({}))

    expect(result).toStrictEqual(AppResult.success(paginatedResult))
  })

  it('should return failed with exception when CourseRepository.getAll fails', async () => {
    const e = AppException.test()
    vi.spyOn(courseRepository, 'getAll').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await getCoursesUseCase.execute(new GetCoursesParams({}))

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
