import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm'
import { AutoIdTimestampCreatedBy, formatDateOnly } from './common.entity.js'
import {
  Term,
  TermStatus,
} from '../../../academic-calendar/entities/term.entity.js'
import { AcademicYearDBEntity } from './academic-year.entity.js'
import type { CreateTermParams } from '../../../academic-calendar/use-cases/create-term.use-case.js'

@Entity('terms')
@Index('UQ_terms_academic_year_name_active', ['academicYearId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('UQ_terms_single_active', ['status'], {
  unique: true,
  where: `"status" = 'active' AND "deleted_at" IS NULL`,
})
export class TermDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<TermDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column({ name: 'academic_year_id' })
  academicYearId: string

  @ManyToOne(() => AcademicYearDBEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: Relation<AcademicYearDBEntity>

  @Column()
  name: string

  @Column({ name: 'start_date', type: 'date' })
  startDate: string

  @Column({ name: 'end_date', type: 'date' })
  endDate: string

  @Column({
    type: 'text',
    enum: TermStatus,
    default: TermStatus.planned,
  })
  status: TermStatus

  toDomain(): Term {
    return new Term({
      id: this.id,
      academicYearId: this.academicYearId,
      name: this.name,
      startDate: formatDateOnly(this.startDate),
      endDate: formatDateOnly(this.endDate),
      status: this.status,
    })
  }

  static fromParams(params: CreateTermParams) {
    return new TermDBEntity({
      academicYearId: params.academicYearId,
      name: params.name,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
      createdBy: params.createdBy,
    })
  }
}
