import { Module } from '@nestjs/common'
import { FacultyRepository } from './repositories/faculty.repository.js'
import { CreateFacultyUseCase } from './user-cases/create-faculty.use-case.js'
import { FacultyController } from './controllers/faculty.controller.js'
import { GetFacultiesUseCase } from './user-cases/get-faculties.use-case.js'
import { DeleteFacultyUseCase } from './user-cases/delete-faculty.use-case.js'

/**
 * Handle organization master data, e.g. faculty & program
 */
@Module({
  controllers: [FacultyController],
  providers: [
    FacultyRepository,
    CreateFacultyUseCase,
    GetFacultiesUseCase,
    DeleteFacultyUseCase,
  ],
})
export class OrganizationModule {}
