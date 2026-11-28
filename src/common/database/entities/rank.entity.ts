import { Column, Entity, Index } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import { Rank, RankType } from '../../../lecturer/entities/rank.entity.js'
import type { CreateRankParams } from '../../../lecturer/use-cases/create-rank.use-case.js'

@Entity('ranks')
@Index('UQ_ranks_name_type_active', ['name', 'type'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class RankDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<RankDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  name: string

  @Column({ type: 'text', enum: RankType })
  type: RankType

  toDomain(): Rank {
    return new Rank({
      id: this.id,
      name: this.name,
      type: this.type,
    })
  }

  static fromParams(params: CreateRankParams) {
    return new RankDBEntity({
      name: params.name,
      type: params.type,
      createdBy: params.createdBy,
    })
  }
}
