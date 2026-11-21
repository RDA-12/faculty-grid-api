import { Module } from '@nestjs/common'
import { FacultyRepository } from './repositories/faculty.repository.js'
import { CreateFacultyUseCase } from './user-cases/create-faculty.use-case.js'
import { FacultyController } from './controllers/faculty.controller.js'
import { GetFacultiesUseCase } from './user-cases/get-faculties.use-case.js'
import { DeleteFacultyUseCase } from './user-cases/delete-faculty.use-case.js'
import { ProgramController } from './controllers/program.controller.js'
import { ProgramRepository } from './repositories/program.repository.js'
import { CreateProgramUseCase } from './user-cases/create-program.use-case.js'
import { GetProgramsUseCase } from './user-cases/get-programs.use-case.js'

/**
 * Handle organization master data, e.g. faculty & program
 */
@Module({
  controllers: [FacultyController, ProgramController],
  providers: [
    FacultyRepository,
    ProgramRepository,
    CreateFacultyUseCase,
    GetFacultiesUseCase,
    DeleteFacultyUseCase,
    CreateProgramUseCase,
    GetProgramsUseCase,
  ],
})
export class OrganizationModule {}
