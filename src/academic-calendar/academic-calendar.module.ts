import { Module } from '@nestjs/common'
import { AcademicYearController } from './controllers/academic-year.controller.js'
import { AcademicYearRepository } from './repositories/academic-year.repository.js'
import { CreateAcademicYearUseCase } from './use-cases/create-academic-year.use-case.js'
import { GetAcademicYearsUseCase } from './use-cases/get-academic-years.use-case.js'
import { GetAcademicYearByIdUseCase } from './use-cases/get-academic-year-by-id.use-case.js'
import { UpdateAcademicYearUseCase } from './use-cases/update-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from './use-cases/delete-academic-year.use-case.js'

/**
 * Handle academic calendar data (academic years and terms)
 */
@Module({
  controllers: [AcademicYearController],
  providers: [
    AcademicYearRepository,
    CreateAcademicYearUseCase,
    GetAcademicYearsUseCase,
    GetAcademicYearByIdUseCase,
    UpdateAcademicYearUseCase,
    DeleteAcademicYearUseCase,
  ],
  exports: [GetAcademicYearByIdUseCase],
})
export class AcademicCalendarModule {}
