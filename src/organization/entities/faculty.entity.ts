type FacultyConstructor = {
  id: string
  name: string
}

/**
 * Representing single faculty data
 */
export class Faculty {
  constructor({ id, name }: FacultyConstructor) {
    this.id = id
    this.name = name
  }

  readonly id: string
  readonly name: string
}
