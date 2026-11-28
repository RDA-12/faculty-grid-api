import { randomUUIDv7 } from 'node:crypto'
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm'
import { UserDBEntity } from './user.entity.js'

export abstract class AutoIdTimestamp {
  @PrimaryColumn()
  id: string

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUIDv7()
    }
  }

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null
}

export abstract class AutoIdTimestampCreatedBy extends AutoIdTimestamp {
  @ManyToOne('users')
  @JoinColumn({ name: 'created_by' })
  createdUser: Relation<UserDBEntity>

  @Column({ name: 'created_by' })
  createdBy: string
}

export function formatDateOnly(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
