import { Entity, Column, Index } from 'typeorm'
import { AutoIdTimestamp } from './common.entity.js'

/** Representing single User from database */
@Entity('users')
export class UserDBEntity extends AutoIdTimestamp {
  @Column()
  name: string

  @Index({ unique: true })
  @Column()
  email: string
}
