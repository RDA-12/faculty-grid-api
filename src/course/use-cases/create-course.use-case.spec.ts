import { Test } from '@nestjs/testing'
import { AppResult } from '../../common/app-result.js'
import { Course, CourseType } from '../entities/course.entity.js'
import { CourseRepository } from '../repositories/course.repository.js'
import {
  CreateCourseParams,
  CreateCourseUseCase,
} from './create-course.use-case.js'
import { AppException } from '../../common/app-exception.js'

describe('CreateCourseUseCase', () => {
  const params = new CreateCourseParams({
    code: 'CS101',
    name: 'Data Structures',
    credits: 3,
    semester: 1,
    courseType: CourseType.mandatory,
    programId: 'program-id',
    createdBy: 'createdBy',
  })
  const course = new Course({
    id: 'id',
    code: params.code,
    name: params.name,
    credits: params.credits,
    semester: params.semester,
    courseType: params.courseType,
    programId: params.programId,
  })
  let courseRepository: {
    save: ReturnType<typeof vi.fn>
  }
  let createCourseUseCase: CreateCourseUseCase

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CourseRepository,
          useValue: {
            save: vi.fn().mockResolvedValue(AppResult.success(course)),
          },
        },
        CreateCourseUseCase,
      ],
    }).compile()

    courseRepository = moduleRef.get(CourseRepository)
    createCourseUseCase = moduleRef.get(CreateCourseUseCase)
  })

  it('should call CourseRepository.save once', async () => {
    await createCourseUseCase.execute(params)

    expect(courseRepository.save).toHaveBeenCalledExactlyOnceWith(params)
  })

  it('should return success with course when CourseRepository.save succeeds', async () => {
    const result = await createCourseUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.success(course))
  })

  it('should return failed with exception when CourseRepository.save fails', async () => {
    const e = AppException.test()
    vi.spyOn(courseRepository, 'save').mockResolvedValueOnce(
      AppResult.failed(e),
    )
    const result = await createCourseUseCase.execute(params)

    expect(result).toStrictEqual(AppResult.failed(e))
  })
})
