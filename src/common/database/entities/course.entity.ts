import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import { Course, CourseType } from '../../../course/entities/course.entity.js'
import { ProgramDBEntity } from './program.entity.js'
import type { CreateCourseParams } from '../../../course/use-cases/create-course.use-case.js'

@Entity('courses')
@Index('UQ_courses_program_code_active', ['programId', 'code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class CourseDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<CourseDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  code: string

  @Column()
  name: string

  @Column({ type: 'int' })
  credits: number

  @Column({ type: 'int' })
  semester: number

  @Column({ name: 'course_type', type: 'text', enum: CourseType })
  courseType: CourseType

  @Column({ name: 'program_id' })
  programId: string

  @ManyToOne(() => ProgramDBEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'program_id' })
  program: Relation<ProgramDBEntity>

  toDomain(): Course {
    return new Course({
      id: this.id,
      code: this.code,
      name: this.name,
      credits: this.credits,
      semester: this.semester,
      courseType: this.courseType,
      programId: this.programId,
    })
  }

  static fromParams(params: CreateCourseParams) {
    return new CourseDBEntity({
      code: params.code,
      name: params.name,
      credits: params.credits,
      semester: params.semester,
      courseType: params.courseType,
      programId: params.programId,
      createdBy: params.createdBy,
    })
  }
}
