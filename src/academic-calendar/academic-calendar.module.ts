import { Module } from '@nestjs/common'
import { AcademicYearController } from './controllers/academic-year.controller.js'
import { TermController } from './controllers/term.controller.js'
import { AcademicYearRepository } from './repositories/academic-year.repository.js'
import { TermRepository } from './repositories/term.repository.js'
import { CreateAcademicYearUseCase } from './use-cases/create-academic-year.use-case.js'
import { GetAcademicYearsUseCase } from './use-cases/get-academic-years.use-case.js'
import { GetAcademicYearByIdUseCase } from './use-cases/get-academic-year-by-id.use-case.js'
import { UpdateAcademicYearUseCase } from './use-cases/update-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from './use-cases/delete-academic-year.use-case.js'
import { CreateTermUseCase } from './use-cases/create-term.use-case.js'
import { GetTermsUseCase } from './use-cases/get-terms.use-case.js'
import { GetTermByIdUseCase } from './use-cases/get-term-by-id.use-case.js'
import { UpdateTermUseCase } from './use-cases/update-term.use-case.js'
import { DeleteTermUseCase } from './use-cases/delete-term.use-case.js'

/**
 * Handle academic calendar data (academic years and terms)
 */
@Module({
  controllers: [AcademicYearController, TermController],
  providers: [
    AcademicYearRepository,
    TermRepository,
    CreateAcademicYearUseCase,
    GetAcademicYearsUseCase,
    GetAcademicYearByIdUseCase,
    UpdateAcademicYearUseCase,
    DeleteAcademicYearUseCase,
    CreateTermUseCase,
    GetTermsUseCase,
    GetTermByIdUseCase,
    UpdateTermUseCase,
    DeleteTermUseCase,
  ],
  exports: [GetAcademicYearByIdUseCase, GetTermByIdUseCase],
})
export class AcademicCalendarModule {}
