export enum EmploymentStatus {
  asn = 'asn',
  military = 'military',
  contract = 'contract',
}

export enum AcademicDegree {
  bachelor = 'bachelor',
  master = 'master',
  doctorate = 'doctorate',
}

type LecturerConstructor = {
  id: string
  name: string
  displayName: string
  programId: string
  employmentStatus: EmploymentStatus
  rankId: string | null
  functionalRankId: string | null
  academicDegree: AcademicDegree
}

/**
 * Representing a lecturer profile
 */
export class Lecturer {
  constructor({
    id,
    name,
    displayName,
    programId,
    employmentStatus,
    rankId,
    functionalRankId,
    academicDegree,
  }: LecturerConstructor) {
    this.id = id
    this.name = name
    this.displayName = displayName
    this.programId = programId
    this.employmentStatus = employmentStatus
    this.rankId = rankId
    this.functionalRankId = functionalRankId
    this.academicDegree = academicDegree
  }

  readonly id: string
  readonly name: string
  readonly displayName: string
  readonly programId: string
  readonly employmentStatus: EmploymentStatus
  readonly rankId: string | null
  readonly functionalRankId: string | null
  readonly academicDegree: AcademicDegree
}
