import { Column, Entity, Index } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import { FunctionalRank } from '../../../lecturer/entities/functional-rank.entity.js'
import type { CreateFunctionalRankParams } from '../../../lecturer/use-cases/create-functional-rank.use-case.js'

@Entity('functional_ranks')
@Index('UQ_functional_ranks_name_active', ['name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class FunctionalRankDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<FunctionalRankDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  name: string

  toDomain(): FunctionalRank {
    return new FunctionalRank({
      id: this.id,
      name: this.name,
    })
  }

  static fromParams(params: CreateFunctionalRankParams) {
    return new FunctionalRankDBEntity({
      name: params.name,
      createdBy: params.createdBy,
    })
  }
}
