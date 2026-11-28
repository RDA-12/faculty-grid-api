import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import {
  AcademicDegree,
  EmploymentStatus,
  Lecturer,
} from '../../../lecturer/entities/lecturer.entity.js'
import { ProgramDBEntity } from './program.entity.js'
import { RankDBEntity } from './rank.entity.js'
import { FunctionalRankDBEntity } from './functional-rank.entity.js'
import type { CreateLecturerParams } from '../../../lecturer/use-cases/create-lecturer.use-case.js'

@Entity('lecturers')
export class LecturerDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<LecturerDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  name: string

  @Column({ name: 'display_name' })
  displayName: string

  @Column({ name: 'program_id' })
  programId: string

  @ManyToOne(() => ProgramDBEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'program_id' })
  program: Relation<ProgramDBEntity>

  @Column({ name: 'employment_status', type: 'text', enum: EmploymentStatus })
  employmentStatus: EmploymentStatus

  @Column({ name: 'rank_id', type: 'varchar', nullable: true })
  rankId: string | null

  @ManyToOne(() => RankDBEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'rank_id' })
  rank: Relation<RankDBEntity | null>

  @Column({ name: 'functional_rank_id', type: 'varchar', nullable: true })
  functionalRankId: string | null

  @ManyToOne(() => FunctionalRankDBEntity, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'functional_rank_id' })
  functionalRank: Relation<FunctionalRankDBEntity | null>

  @Column({ name: 'academic_degree', type: 'text', enum: AcademicDegree })
  academicDegree: AcademicDegree

  toDomain(): Lecturer {
    return new Lecturer({
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      programId: this.programId,
      employmentStatus: this.employmentStatus,
      rankId: this.rankId ?? null,
      functionalRankId: this.functionalRankId ?? null,
      academicDegree: this.academicDegree,
    })
  }

  static fromParams(params: CreateLecturerParams) {
    return new LecturerDBEntity({
      name: params.name,
      displayName: params.displayName,
      programId: params.programId,
      employmentStatus: params.employmentStatus,
      rankId: params.rankId,
      functionalRankId: params.functionalRankId,
      academicDegree: params.academicDegree,
      createdBy: params.createdBy,
    })
  }
}
