export enum RankType {
  asn = 'asn',
  military = 'military',
}

type RankConstructor = {
  id: string
  name: string
  type: RankType
}

/**
 * Representing a lecturer rank (e.g. ASN Pangkat/Golongan or Military rank)
 */
export class Rank {
  constructor({ id, name, type }: RankConstructor) {
    this.id = id
    this.name = name
    this.type = type
  }

  readonly id: string
  readonly name: string
  readonly type: RankType
}
