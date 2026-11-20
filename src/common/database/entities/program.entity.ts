import { Column, Entity, JoinColumn, OneToOne, type Relation } from 'typeorm'
import { AutoIdTimestampCreatedBy } from './common.entity.js'
import {
  Program,
  ProgramDegreeLevel,
} from '../../../organization/entities/program.entity.js'
import { FacultyDBEntity } from './faculty.entity.js'
import { CreateProgramParams } from '../../../organization/user-cases/create-program.use-case.js'

@Entity('programs')
export class ProgramDBEntity extends AutoIdTimestampCreatedBy {
  constructor(partial?: Partial<ProgramDBEntity>) {
    super()
    if (partial) {
      Object.assign(this, partial)
    }
  }

  @Column()
  name: string

  @Column({ name: 'degree_level', type: 'text', enum: ProgramDegreeLevel })
  degreeLevel: ProgramDegreeLevel

  @Column({ name: 'faculty_id' })
  facultyId: string

  @OneToOne(() => FacultyDBEntity)
  @JoinColumn({ name: 'faculty_id' })
  faculty: Relation<FacultyDBEntity>

  toDomain(): Program {
    return new Program({
      id: this.id,
      name: this.name,
      degreeLevel: this.degreeLevel,
      facultyId: this.facultyId,
    })
  }

  static fromParams(params: CreateProgramParams) {
    return new ProgramDBEntity({
      name: params.name,
      degreeLevel: params.degreeLevel,
      facultyId: params.facultyId,
      createdBy: params.createdBy,
    })
  }
}
