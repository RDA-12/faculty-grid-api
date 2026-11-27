import { Column, Entity } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import {
  Title,
  TitleScope,
} from '../../../organization/entities/title.entity.js'
import type { CreateTitleParams } from '../../../organization/user-cases/create-title.use-case.js'

@Entity('titles')
export class TitleDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<TitleDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  name: string

  @Column({ type: 'text', enum: TitleScope })
  scope: TitleScope

  toDomain(): Title {
    return new Title({
      id: this.id,
      name: this.name,
      scope: this.scope,
    })
  }

  static fromParams(params: CreateTitleParams) {
    return new TitleDBEntity({
      name: params.name,
      scope: params.scope,
      createdBy: params.createdBy,
    })
  }
}
