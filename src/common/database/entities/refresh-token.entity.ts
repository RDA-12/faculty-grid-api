import { Entity, Column, PrimaryColumn, Index } from 'typeorm'

/**
 * Representing single refresh token from database
 *
 * Required by AuthenticationModule from nestjs
 *
 */
@Entity('refresh_tokens')
@Index('refresh_tokens_family_id_idx', ['familyId'])
@Index('refresh_tokens_user_id_idx', ['userId'])
@Index('refresh_tokens_family_expires_at_idx', ['familyExpiresAt'])
export class RefreshTokenDBEntity {
  @PrimaryColumn('text')
  id!: string

  @Column({ type: 'text', name: 'family_id', nullable: false })
  familyId!: string

  @Column({ type: 'text', name: 'user_id', nullable: false })
  userId!: string

  @Column({ type: 'timestamptz', name: 'created_at', nullable: false })
  createdAt!: Date

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: false })
  expiresAt!: Date

  @Column({ type: 'timestamptz', name: 'family_expires_at', nullable: false })
  familyExpiresAt!: Date

  @Column({ type: 'timestamptz', name: 'used_at', nullable: true })
  usedAt?: Date | null

  // A family is revoked when any of its tokens is: that covers a successor saved after the revocation.
  @Column({ type: 'boolean', default: false, nullable: false })
  revoked!: boolean

  @Column({ type: 'jsonb', nullable: true })
  claims?: Record<string, unknown> | null
}
