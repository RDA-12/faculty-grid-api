import {
  InvalidRequestError,
  InvalidRequestException,
} from '../../common/app-exception.js'
import { AppResult } from '../../common/app-result.js'
import { TitleScope } from '../../organization/entities/title.entity.js'
import type { GetTitleByIdUseCase } from '../../organization/user-cases/get-title-by-id.use-case.js'
import type { GetLecturerByIdUseCase } from '../../lecturer/use-cases/get-lecturer-by-id.use-case.js'

type LecturerTitleAssignmentParams = {
  lecturerId: string
  titleId: string
  facultyId: string | null
  programId: string | null
  startDate: string
  endDate: string | null
}

/**
 * Validates lecturer existence, title existence, date ordering, and org-unit scope match
 */
export async function validateLecturerTitleAssignment(
  params: LecturerTitleAssignmentParams,
  getLecturerByIdUseCase: GetLecturerByIdUseCase,
  getTitleByIdUseCase: GetTitleByIdUseCase,
): Promise<AppResult<null>> {
  if (params.endDate !== null && params.endDate < params.startDate) {
    return AppResult.failed(
      new InvalidRequestException([
        new InvalidRequestError({
          property: 'endDate',
          value: params.endDate,
          constraints: ['endDate must not be earlier than startDate'],
        }),
      ]),
    )
  }

  const lecturerResult = await getLecturerByIdUseCase.execute(params.lecturerId)
  if (lecturerResult.exception) {
    return AppResult.failed(lecturerResult.exception)
  }

  const titleResult = await getTitleByIdUseCase.execute(params.titleId)
  if (titleResult.exception) {
    return AppResult.failed(titleResult.exception)
  }

  const title = titleResult.data!
  const errors: InvalidRequestError[] = []

  if (title.scope === TitleScope.faculty) {
    if (!params.facultyId) {
      errors.push(
        new InvalidRequestError({
          property: 'facultyId',
          value: params.facultyId,
          constraints: ['facultyId is required for faculty-scoped title'],
        }),
      )
    }
    if (params.programId !== null) {
      errors.push(
        new InvalidRequestError({
          property: 'programId',
          value: params.programId,
          constraints: ['programId must be null for faculty-scoped title'],
        }),
      )
    }
  } else if (title.scope === TitleScope.program) {
    if (!params.programId) {
      errors.push(
        new InvalidRequestError({
          property: 'programId',
          value: params.programId,
          constraints: ['programId is required for program-scoped title'],
        }),
      )
    }
    if (params.facultyId !== null) {
      errors.push(
        new InvalidRequestError({
          property: 'facultyId',
          value: params.facultyId,
          constraints: ['facultyId must be null for program-scoped title'],
        }),
      )
    }
  }

  if (errors.length > 0) {
    return AppResult.failed(new InvalidRequestException(errors))
  }

  return AppResult.success(null)
}
