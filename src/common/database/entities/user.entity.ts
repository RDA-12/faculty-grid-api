import { Entity, Column } from 'typeorm'
import { AutoIdTimestamp } from './common.entity.js'
import { User } from '../../../user/entities/user.entity.js'

export const emailUniqueConstraintName = 'UQ_users_email'

/** Representing single User from database */
@Entity('users')
export class UserDBEntity extends AutoIdTimestamp {
  @Column()
  name: string

  @Column({ unique: true })
  email: string

  toDomain(): User {
    return new User({
      id: this.id,
      name: this.name,
      email: this.email,
    })
  }
}
