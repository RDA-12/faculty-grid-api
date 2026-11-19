import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm'
import { AutoIdTimestamp } from './common.entity.js'
import { UserDBEntity } from './user.entity.js'
import { Role } from '../../../authz/entities/role.entity.js'

/**
 * Representing single role a user have in database
 */
@Unique(['userId', 'role'])
@Entity('user_roles')
export class UserRoleDBEntity extends AutoIdTimestamp {
  @Index()
  @ManyToOne(() => UserDBEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserDBEntity>

  @Column({ name: 'user_id' })
  userId: string

  @Column({ type: 'text', enum: Role })
  role: Role
}
