type LecturerTitleConstructor = {
  id: string
  lecturerId: string
  titleId: string
  facultyId: string | null
  programId: string | null
  startDate: string
  endDate: string | null
}

/**
 * Representing a lecturer's structural title assignment in an organization unit
 */
export class LecturerTitle {
  constructor({
    id,
    lecturerId,
    titleId,
    facultyId,
    programId,
    startDate,
    endDate,
  }: LecturerTitleConstructor) {
    this.id = id
    this.lecturerId = lecturerId
    this.titleId = titleId
    this.facultyId = facultyId
    this.programId = programId
    this.startDate = startDate
    this.endDate = endDate
  }

  readonly id: string
  readonly lecturerId: string
  readonly titleId: string
  readonly facultyId: string | null
  readonly programId: string | null
  readonly startDate: string
  readonly endDate: string | null
}
