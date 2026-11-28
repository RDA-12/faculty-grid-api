import { Column, Entity, Index } from 'typeorm'
import { AutoIdTimestampCreatedBy, formatDateOnly } from './common.entity.js'
import {
  AcademicYear,
  AcademicYearStatus,
} from '../../../academic-calendar/entities/academic-year.entity.js'
import type { CreateAcademicYearParams } from '../../../academic-calendar/use-cases/create-academic-year.use-case.js'

@Entity('academic_years')
@Index('UQ_academic_years_name_active', ['name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('UQ_academic_years_single_active', ['status'], {
  unique: true,
  where: `"status" = 'active' AND "deleted_at" IS NULL`,
})
export class AcademicYearDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<AcademicYearDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  name: string

  @Column({ name: 'start_date', type: 'date' })
  startDate: string

  @Column({ name: 'end_date', type: 'date' })
  endDate: string

  @Column({
    type: 'text',
    enum: AcademicYearStatus,
    default: AcademicYearStatus.planned,
  })
  status: AcademicYearStatus

  toDomain(): AcademicYear {
    return new AcademicYear({
      id: this.id,
      name: this.name,
      startDate: formatDateOnly(this.startDate),
      endDate: formatDateOnly(this.endDate),
      status: this.status,
    })
  }

  static fromParams(params: CreateAcademicYearParams) {
    return new AcademicYearDBEntity({
      name: params.name,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
      createdBy: params.createdBy,
    })
  }
}
