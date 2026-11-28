import { AppResult } from '../../common/app-result.js'
import {
  ConflictException,
  InvalidRequestError,
  InvalidRequestException,
} from '../../common/app-exception.js'
import { AcademicYearStatus } from '../entities/academic-year.entity.js'
import { TermStatus } from '../entities/term.entity.js'
import type { GetAcademicYearByIdUseCase } from './get-academic-year-by-id.use-case.js'

export async function validateTermAgainstAcademicYear(
  params: {
    academicYearId: string
    startDate: string
    endDate: string
    status: TermStatus
  },
  getAcademicYearByIdUseCase: GetAcademicYearByIdUseCase,
): Promise<AppResult<null>> {
  const yearResult = await getAcademicYearByIdUseCase.execute(
    params.academicYearId,
  )
  if (yearResult.exception) {
    return AppResult.failed(yearResult.exception)
  }

  const academicYear = yearResult.data!
  const errors: InvalidRequestError[] = []

  if (
    params.startDate < academicYear.startDate ||
    params.startDate > academicYear.endDate
  ) {
    errors.push(
      new InvalidRequestError({
        property: 'startDate',
        value: params.startDate,
        constraints: [
          `startDate must be within academic year range (${academicYear.startDate} to ${academicYear.endDate})`,
        ],
      }),
    )
  }

  if (
    params.endDate < academicYear.startDate ||
    params.endDate > academicYear.endDate
  ) {
    errors.push(
      new InvalidRequestError({
        property: 'endDate',
        value: params.endDate,
        constraints: [
          `endDate must be within academic year range (${academicYear.startDate} to ${academicYear.endDate})`,
        ],
      }),
    )
  }

  if (errors.length > 0) {
    return AppResult.failed(new InvalidRequestException(errors))
  }

  if (
    params.status === TermStatus.active &&
    academicYear.status !== AcademicYearStatus.active
  ) {
    return AppResult.failed(
      new ConflictException(
        'cannot set term to active because its academic year is not active',
      ),
    )
  }

  return AppResult.success(null)
}
