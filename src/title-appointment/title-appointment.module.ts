import { Module } from '@nestjs/common'
import { LecturerModule } from '../lecturer/lecturer.module.js'
import { OrganizationModule } from '../organization/organization.module.js'
import { LecturerTitleController } from './controllers/lecturer-title.controller.js'
import { LecturerTitleRepository } from './repositories/lecturer-title.repository.js'
import { CreateLecturerTitleUseCase } from './use-cases/create-lecturer-title.use-case.js'
import { GetLecturerTitlesUseCase } from './use-cases/get-lecturer-titles.use-case.js'
import { GetLecturerTitleByIdUseCase } from './use-cases/get-lecturer-title-by-id.use-case.js'
import { UpdateLecturerTitleUseCase } from './use-cases/update-lecturer-title.use-case.js'
import { DeleteLecturerTitleUseCase } from './use-cases/delete-lecturer-title.use-case.js'

/**
 * Handle rotatable structural title appointments for lecturers
 */
@Module({
  imports: [LecturerModule, OrganizationModule],
  controllers: [LecturerTitleController],
  providers: [
    LecturerTitleRepository,
    CreateLecturerTitleUseCase,
    GetLecturerTitlesUseCase,
    GetLecturerTitleByIdUseCase,
    UpdateLecturerTitleUseCase,
    DeleteLecturerTitleUseCase,
  ],
})
export class TitleAppointmentModule {}
