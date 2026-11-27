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
import { DeleteProgramUseCase } from './user-cases/delete-program.use-case.js'
import { TitleController } from './controllers/title.controller.js'
import { TitleRepository } from './repositories/title.repository.js'
import { CreateTitleUseCase } from './user-cases/create-title.use-case.js'
import { GetTitlesUseCase } from './user-cases/get-titles.use-case.js'
import { GetTitleByIdUseCase } from './user-cases/get-title-by-id.use-case.js'
import { UpdateTitleUseCase } from './user-cases/update-title.use-case.js'
import { DeleteTitleUseCase } from './user-cases/delete-title.use-case.js'

/**
 * Handle organization master data, e.g. faculty, program & structural title
 */
@Module({
  controllers: [FacultyController, ProgramController, TitleController],
  providers: [
    FacultyRepository,
    ProgramRepository,
    TitleRepository,
    CreateFacultyUseCase,
    GetFacultiesUseCase,
    DeleteFacultyUseCase,
    CreateProgramUseCase,
    GetProgramsUseCase,
    DeleteProgramUseCase,
    CreateTitleUseCase,
    GetTitlesUseCase,
    GetTitleByIdUseCase,
    UpdateTitleUseCase,
    DeleteTitleUseCase,
  ],
  exports: [GetTitleByIdUseCase],
})
export class OrganizationModule {}
