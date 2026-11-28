import { Module } from '@nestjs/common'
import { CourseController } from './controllers/course.controller.js'
import { CourseRepository } from './repositories/course.repository.js'
import { CreateCourseUseCase } from './use-cases/create-course.use-case.js'
import { GetCoursesUseCase } from './use-cases/get-courses.use-case.js'
import { GetCourseByIdUseCase } from './use-cases/get-course-by-id.use-case.js'
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js'
import { DeleteCourseUseCase } from './use-cases/delete-course.use-case.js'

/**
 * Handle courses offered by a program per semester
 */
@Module({
  controllers: [CourseController],
  providers: [
    CourseRepository,
    CreateCourseUseCase,
    GetCoursesUseCase,
    GetCourseByIdUseCase,
    UpdateCourseUseCase,
    DeleteCourseUseCase,
  ],
  exports: [GetCourseByIdUseCase],
})
export class CourseModule {}
