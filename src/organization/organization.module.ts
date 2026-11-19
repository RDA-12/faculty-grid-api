import { Module } from '@nestjs/common'
import { FacultyRepository } from './repositories/faculty.repository.js'
import { CreateFacultyUseCase } from './user-cases/create-faculty.use-case.js'
import { FacultyController } from './controllers/faculty.controller.js'

/**
 * Handle organization master data, e.g. faculty & program
 */
@Module({
  controllers: [FacultyController],
  providers: [FacultyRepository, CreateFacultyUseCase],
})
export class OrganizationModule {}
