import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import { LecturerTitle } from '../../../title-appointment/entities/lecturer-title.entity.js'
import { LecturerDBEntity } from './lecturer.entity.js'
import { TitleDBEntity } from './title.entity.js'
import { FacultyDBEntity } from './faculty.entity.js'
import { ProgramDBEntity } from './program.entity.js'
import type { CreateLecturerTitleParams } from '../../../title-appointment/use-cases/create-lecturer-title.use-case.js'

export function formatDateOnly(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

@Entity('lecturer_titles')
@Index('UQ_lecturer_titles_title_faculty_active', ['titleId', 'facultyId'], {
  unique: true,
  where:
    '"end_date" IS NULL AND "deleted_at" IS NULL AND "faculty_id" IS NOT NULL',
})
@Index('UQ_lecturer_titles_title_program_active', ['titleId', 'programId'], {
  unique: true,
  where:
    '"end_date" IS NULL AND "deleted_at" IS NULL AND "program_id" IS NOT NULL',
})
export class LecturerTitleDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<LecturerTitleDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column({ name: 'lecturer_id' })
  lecturerId: string

  @ManyToOne(() => LecturerDBEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lecturer_id' })
  lecturer: Relation<LecturerDBEntity>

  @Column({ name: 'title_id' })
  titleId: string

  @ManyToOne(() => TitleDBEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'title_id' })
  title: Relation<TitleDBEntity>

  @Column({ name: 'faculty_id', type: 'varchar', nullable: true })
  facultyId: string | null

  @ManyToOne(() => FacultyDBEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'faculty_id' })
  faculty: Relation<FacultyDBEntity | null>

  @Column({ name: 'program_id', type: 'varchar', nullable: true })
  programId: string | null

  @ManyToOne(() => ProgramDBEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'program_id' })
  program: Relation<ProgramDBEntity | null>

  @Column({ name: 'start_date', type: 'date' })
  startDate: string

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null

  toDomain(): LecturerTitle {
    return new LecturerTitle({
      id: this.id,
      lecturerId: this.lecturerId,
      titleId: this.titleId,
      facultyId: this.facultyId ?? null,
      programId: this.programId ?? null,
      startDate: formatDateOnly(this.startDate),
      endDate: this.endDate ? formatDateOnly(this.endDate) : null,
    })
  }

  static fromParams(params: CreateLecturerTitleParams) {
    return new LecturerTitleDBEntity({
      lecturerId: params.lecturerId,
      titleId: params.titleId,
      facultyId: params.facultyId,
      programId: params.programId,
      startDate: params.startDate,
      endDate: params.endDate,
      createdBy: params.createdBy,
    })
  }
}
