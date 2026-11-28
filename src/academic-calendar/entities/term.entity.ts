export enum TermStatus {
  planned = 'planned',
  active = 'active',
  archived = 'archived',
}

type TermConstructor = {
  id: string
  academicYearId: string
  name: string
  startDate: string
  endDate: string
  status: TermStatus
}

/**
 * Representing an academic term within an academic year
 */
export class Term {
  constructor({
    id,
    academicYearId,
    name,
    startDate,
    endDate,
    status,
  }: TermConstructor) {
    this.id = id
    this.academicYearId = academicYearId
    this.name = name
    this.startDate = startDate
    this.endDate = endDate
    this.status = status
  }

  readonly id: string
  readonly academicYearId: string
  readonly name: string
  readonly startDate: string
  readonly endDate: string
  readonly status: TermStatus
}
