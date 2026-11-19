import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  type Relation,
} from 'typeorm'
import { AutoIdTimestamp } from './common.entity.js'
import { UserDBEntity } from './user.entity.js'
import { UserCredential } from '../../../auth/entities/user-credential.entity.js'

@Entity('user_credentials')
export class UserCredentialDBEntity extends AutoIdTimestamp {
  /** related user to this credential
   *
   * it may not be loaded yet
   */
  @Index()
  @OneToOne(() => UserDBEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserDBEntity>

  @Column({ name: 'user_id' })
  userId: string

  @Column({ name: 'hashed_password' })
  hashedPassword: string

  toDomain(): UserCredential {
    return new UserCredential({
      userId: this.userId,
      hashedPassword: this.hashedPassword,
    })
  }
}
