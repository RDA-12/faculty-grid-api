type FunctionalRankConstructor = {
  id: string
  name: string
}

/**
 * Representing a lecturer functional rank (Jabatan Fungsional)
 */
export class FunctionalRank {
  constructor({ id, name }: FunctionalRankConstructor) {
    this.id = id
    this.name = name
  }

  readonly id: string
  readonly name: string
}
