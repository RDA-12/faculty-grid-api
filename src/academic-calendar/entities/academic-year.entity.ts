export enum AcademicYearStatus {
  planned = 'planned',
  active = 'active',
  archived = 'archived',
}

type AcademicYearConstructor = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
}

/**
 * Representing an academic year period
 */
export class AcademicYear {
  constructor({
    id,
    name,
    startDate,
    endDate,
    status,
  }: AcademicYearConstructor) {
    this.id = id
    this.name = name
    this.startDate = startDate
    this.endDate = endDate
    this.status = status
  }

  readonly id: string
  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly status: AcademicYearStatus
}
