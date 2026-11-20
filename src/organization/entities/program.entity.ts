export enum ProgramDegreeLevel {
  bachelor = 'bachelor',
  master = 'master',
  doctorate = 'doctorate',
}

type ProgramConstructor = {
  id: string
  name: string
  degreeLevel: ProgramDegreeLevel
  facultyId: string
}

/**
 * Representing single program within a faculty
 */
export class Program {
  constructor({ id, name, facultyId, degreeLevel }: ProgramConstructor) {
    this.id = id
    this.name = name
    this.facultyId = facultyId
    this.degreeLevel = degreeLevel
  }

  readonly id: string
  readonly name: string
  readonly facultyId: string
  readonly degreeLevel: ProgramDegreeLevel
}
